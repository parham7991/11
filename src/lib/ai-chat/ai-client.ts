/**
 * ai-client.ts — کلاینت ارتباط با OmniRouter AI Gateway
 * ──────────────────────────────────────────────────────────────────
 * سرور: 147.45.43.25 | پورت: 20128
 * Combos: offl-chat-elite, offl-assemble-elite
 * ──────────────────────────────────────────────────────────────────
 */

import type { AiClientOptions, ChatMessage, AiMeta } from './types';

// ════════════════════════════════════════════════════════════════
// SEMAPHORE (shared concurrency gate)
// ════════════════════════════════════════════════════════════════

const MAX_CONCURRENT = 4;
let activeSlots = 0;
const waitQueue: Array<() => void> = [];

export async function acquireSlot(signal?: AbortSignal): Promise<() => void> {
  if (activeSlots < MAX_CONCURRENT) {
    activeSlots++;
    return releaseSlot;
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      const idx = waitQueue.indexOf(handler);
      if (idx >= 0) waitQueue.splice(idx, 1);
      reject(new Error('Aborted while waiting for slot'));
    };

    const handler = () => {
      activeSlots++;
      signal?.removeEventListener('abort', onAbort);
      resolve(releaseSlot);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    waitQueue.push(handler);
  });
}

function releaseSlot(): void {
  activeSlots = Math.max(0, activeSlots - 1);
  if (waitQueue.length > 0 && activeSlots < MAX_CONCURRENT) {
    const next = waitQueue.shift();
    if (next) next();
  }
}

// ════════════════════════════════════════════════════════════════
// REQUEST ID GENERATOR
// ════════════════════════════════════════════════════════════════

export function generateRequestId(): string {
  return `offl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ════════════════════════════════════════════════════════════════
// PROXY FETCH
// ════════════════════════════════════════════════════════════════

async function getProxyFetch(proxyUrl: string, useProxy: boolean): Promise<typeof fetch> {
  if (!useProxy || !proxyUrl) return fetch;

  // For server-side proxy, we'd need a proper SOCKS/HTTP proxy agent
  // For now, fallback to native fetch
  console.warn('[ai-client] Proxy not implemented, using native fetch');
  return fetch;
}

// ════════════════════════════════════════════════════════════════
// SSE PARSER
// ════════════════════════════════════════════════════════════════

type SseEvent = {
  type: 'delta';
  content: string;
};

export class SseParser {
  private buffer = '';
  private events: SseEvent[] = [];

  feed(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;

      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            this.events.push({ type: 'delta', content: delta });
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  drain(): SseEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  end(): void {
    if (this.buffer.trim()) {
      this.feed('\n');
    }
  }
}

// ════════════════════════════════════════════════════════════════
// CONTENT EXTRACTOR (non-streaming)
// ════════════════════════════════════════════════════════════════

export function extractNonStreamContent(data: unknown): { text: string } {
  if (!data || typeof data !== 'object') return { text: '' };

  const d = data as Record<string, unknown>;

  // Standard OpenAI format
  const choices = d.choices as Array<{ message?: { content?: string } }> | undefined;
  if (choices?.[0]?.message?.content) {
    return { text: choices[0].message.content };
  }

  // Alternative formats
  if (typeof d.content === 'string') return { text: d.content };
  if (typeof d.text === 'string') return { text: d.text };
  if (typeof d.reply === 'string') return { text: d.reply };

  return { text: '' };
}

// ════════════════════════════════════════════════════════════════
// STREAMING AI REQUEST (with recovery)
// ════════════════════════════════════════════════════════════════

export type StreamCallback = (event: SseEvent) => void;

// Re-export types for compatibility
export type { AiClientOptions, AiMeta } from './types';

export async function streamAiRequest(
  opts: AiClientOptions,
  messages: ChatMessage[],
  onEvent: StreamCallback,
  signal?: AbortSignal
): Promise<AiMeta> {
  const startTime = Date.now();
  const doFetch = await getProxyFetch(opts.proxyUrl, opts.useProxy);
  const releaseSlot = await acquireSlot(signal);

  try {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });

    const connectionTimer = setTimeout(() => controller.abort(), opts.timeoutMs);

    try {
      const res = await doFetch(`${opts.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model: opts.model,
          messages,
          temperature: opts.temperature,
          max_tokens: opts.maxTokens,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(connectionTimer);

      if (!res.ok || !res.body) {
        // Fallback to non-streaming
        return await nonStreamFallback(opts, messages, onEvent, signal);
      }

      const parser = new SseParser();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let gotContent = false;

      const bodyTimer = setTimeout(() => {
        try {
          reader.cancel();
        } catch {}
        controller.abort();
      }, opts.timeoutMs);

      try {
        while (true) {
          if (signal?.aborted || controller.signal.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;

          parser.feed(decoder.decode(value, { stream: true }));
          for (const evt of parser.drain()) {
            gotContent = true;
            onEvent(evt);
          }
        }

        parser.end();
        for (const evt of parser.drain()) {
          gotContent = true;
          onEvent(evt);
        }
      } finally {
        clearTimeout(bodyTimer);
        try {
          reader.releaseLock();
        } catch {}
      }

      signal?.removeEventListener('abort', onAbort);

      if (gotContent) {
        return {
          model: opts.model,
          latencyMs: Date.now() - startTime,
          mode: 'ai',
        };
      }

      // Empty stream → fallback
      return await nonStreamFallback(opts, messages, onEvent, signal);
    } catch (err) {
      clearTimeout(connectionTimer);
      signal?.removeEventListener('abort', onAbort);
      console.warn('[ai-client] Stream failed:', err instanceof Error ? err.message : err);
      return await nonStreamFallback(opts, messages, onEvent, signal);
    }
  } finally {
    releaseSlot();
  }
}

// ════════════════════════════════════════════════════════════════
// NON-STREAMING FALLBACK
// ════════════════════════════════════════════════════════════════

async function nonStreamFallback(
  opts: AiClientOptions,
  messages: ChatMessage[],
  onEvent: StreamCallback,
  signal?: AbortSignal
): Promise<AiMeta> {
  const startTime = Date.now();
  const doFetch = await getProxyFetch(opts.proxyUrl, opts.useProxy);

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await doFetch(`${opts.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);

    if (res.ok) {
      const data = await res.json();
      const extracted = extractNonStreamContent(data);

      if (extracted.text?.trim()) {
        // Simulate streaming by chunking
        const text = extracted.text.trim();
        for (let i = 0; i < text.length; i += 50) {
          if (signal?.aborted) break;
          onEvent({ type: 'delta', content: text.slice(i, i + 50) });
        }

        return {
          model: opts.model,
          latencyMs: Date.now() - startTime,
          mode: 'ai-recovery',
        };
      }
    }

    return {
      model: opts.model,
      latencyMs: Date.now() - startTime,
      mode: 'deterministic-fallback',
    };
  } catch (err) {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    console.warn(
      '[ai-client] Non-stream fallback failed:',
      err instanceof Error ? err.message : err
    );

    return {
      model: opts.model,
      latencyMs: Date.now() - startTime,
      mode: 'deterministic-fallback',
    };
  }
}

// ════════════════════════════════════════════════════════════════
// NON-STREAMING REQUEST (for assembly)
// ════════════════════════════════════════════════════════════════

export async function aiNonStreamRequest(
  opts: AiClientOptions,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<{ text: string; meta: AiMeta }> {
  const startTime = Date.now();
  const doFetch = await getProxyFetch(opts.proxyUrl, opts.useProxy);
  const releaseSlot = await acquireSlot(signal);

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await doFetch(`${opts.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);

    if (res.ok) {
      const data = await res.json();
      const extracted = extractNonStreamContent(data);

      return {
        text: extracted.text,
        meta: {
          model: opts.model,
          latencyMs: Date.now() - startTime,
          mode: 'ai',
        },
      };
    }

    throw new Error(`HTTP ${res.status}`);
  } finally {
    releaseSlot();
  }
}
