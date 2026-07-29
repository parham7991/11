/**
 * ai-client.ts — Shared AI client for all AI operations
 * ──────────────────────────────────────────────────────────────────
 * Supports:
 *   - Streaming OpenAI-compatible
 *   - Non-stream OpenAI-compatible
 *   - Timeout until body completion
 *   - AbortController / client disconnect
 *   - Retry-After for 429
 *   - Sanitized errors (no secrets/keys in messages)
 *   - Request ID for tracing
 *   - Empty response detection
 *   - Exactly one controlled recovery
 *   - No retry storm
 *
 * Concurrency: max 1 concurrent call (Arena Direct account limit)
 */

import { getProxyFetch } from './proxy-fetch';
import { SseParser, extractNonStreamContent } from './sse-parser';
import { AiError, AiErrorCode, createSanitizedError } from './ai-errors';

// ─── Types ───────────────────────────────────────────────────────

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiStreamCallbacks {
  onDelta?: (text: string) => void;
  onMeta?: (meta: AiMeta) => void;
}

export interface AiMeta {
  mode: 'ai' | 'ai-recovery' | 'deterministic-fallback';
  model: string;
  requestId: string;
  latencyMs: number;
  finishReason?: string;
  tokensOut?: number;
}

export interface AiStreamResult {
  text: string;
  meta: AiMeta;
}

export interface AiNonStreamResult {
  text: string;
  meta: AiMeta;
}

export interface AiClientOptions {
  apiKey: string;
  apiBase: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  proxyUrl?: string;
  useProxy?: boolean;
}

// ─── Concurrency Semaphore ───────────────────────────────────────
// Arena Direct account: maxConcurrency = 1

let activeCalls = 0;
const callQueue: Array<() => void> = [];
const MAX_CONCURRENCY = 1;
const QUEUE_TIMEOUT_MS = 35_000;

export async function acquireSlot(abortSignal?: AbortSignal): Promise<() => void> {
  return new Promise<() => void>((resolve, reject) => {
    const tryAcquire = () => {
      if (abortSignal?.aborted) {
        reject(new AiError(AiErrorCode.ABORTED, 'Request aborted while waiting in queue'));
        return;
      }
      if (activeCalls < MAX_CONCURRENCY) {
        activeCalls++;
        const release = () => {
          activeCalls--;
          // Process next in queue
          const next = callQueue.shift();
          if (next) next();
        };
        resolve(release);
      } else {
        callQueue.push(tryAcquire);
      }
    };
    tryAcquire();

    // Queue timeout
    if (activeCalls >= MAX_CONCURRENCY) {
      setTimeout(() => {
        const idx = callQueue.indexOf(tryAcquire);
        if (idx >= 0) {
          callQueue.splice(idx, 1);
          reject(new AiError(AiErrorCode.TIMEOUT, 'Queue timeout exceeded'));
        }
      }, QUEUE_TIMEOUT_MS);
    }
  });
}

// ─── Request ID Generator ────────────────────────────────────────
export function generateRequestId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `ai-${ts}-${rand}`;
}

// ─── Streaming Request ───────────────────────────────────────────

export async function aiStreamRequest(
  options: AiClientOptions,
  messages: AiMessage[],
  callbacks: AiStreamCallbacks,
  abortSignal?: AbortSignal
): Promise<AiStreamResult> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 45_000;

  const release = await acquireSlot(abortSignal);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  abortSignal?.addEventListener('abort', onExternalAbort, { once: true });

  let fullText = '';

  try {
    const doFetch = await getProxyFetch(options.proxyUrl || '', options.useProxy || false);

    const res = await doFetch(`${options.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages,
        temperature: options.temperature ?? 0.35,
        max_tokens: options.maxTokens ?? 1000,
        stream: true,
      }),
      signal: controller.signal,
    });

    // Handle HTTP errors
    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after');
        throw new AiError(AiErrorCode.RATE_LIMITED, 'Rate limited', { context: { retryAfter } });
      }
      if (res.status === 401 || res.status === 403) {
        throw new AiError(AiErrorCode.AUTH_ERROR, `Auth error ${res.status}`);
      }
      if (res.status === 404) {
        throw new AiError(AiErrorCode.NOT_FOUND, `Endpoint not found`);
      }
      if (res.status >= 500) {
        throw new AiError(AiErrorCode.SERVER_ERROR, `Server error ${res.status}`);
      }
      throw createSanitizedError(res.status);
    }

    if (!res.body) {
      throw new AiError(AiErrorCode.EMPTY_RESPONSE, 'No response body');
    }

    // Parse SSE with timeout on body reading
    const parser = new SseParser();
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    // Body read timeout (separate from connection timeout)
    const bodyTimeout = setTimeout(() => {
      try {
        reader.cancel();
      } catch {
        /* ignore */
      }
      controller.abort();
    }, timeoutMs);

    try {
      while (true) {
        if (abortSignal?.aborted) break;

        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        parser.feed(raw);

        const events = parser.drain();
        for (const evt of events) {
          if (evt.type === 'delta' && evt.content) {
            fullText += evt.content;
            callbacks.onDelta?.(evt.content);
          }
        }
      }

      // Process remaining buffer
      parser.end();
      const finalEvents = parser.drain();
      for (const evt of finalEvents) {
        if (evt.type === 'delta' && evt.content) {
          fullText += evt.content;
          callbacks.onDelta?.(evt.content);
        }
      }
    } finally {
      clearTimeout(bodyTimeout);
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
    }

    const latencyMs = Date.now() - startTime;

    if (!fullText.trim()) {
      throw new AiError(AiErrorCode.EMPTY_RESPONSE, 'Stream completed with no content');
    }

    const meta: AiMeta = {
      mode: 'ai',
      model: options.model,
      requestId,
      latencyMs,
      finishReason: parser.finishReason || undefined,
    };

    return { text: fullText, meta };
  } catch (err) {
    const latencyMs = Date.now() - startTime;

    if (err instanceof AiError) {
      err.meta = { mode: 'ai', model: options.model, requestId, latencyMs };
      throw err;
    }

    if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
      throw new AiError(AiErrorCode.TIMEOUT, 'Request timed out', {
        meta: { mode: 'ai', model: options.model, requestId, latencyMs },
      });
    }

    throw new AiError(AiErrorCode.NETWORK_ERROR, 'Network error', {
      context: { cause: err instanceof Error ? err.message : 'unknown' },
      meta: { mode: 'ai', model: options.model, requestId, latencyMs },
    });
  } finally {
    clearTimeout(timeout);
    abortSignal?.removeEventListener('abort', onExternalAbort);
    release();
  }
}

// ─── Non-Stream Request (for recovery and structured output) ────

export async function aiNonStreamRequest(
  options: AiClientOptions,
  messages: AiMessage[],
  abortSignal?: AbortSignal
): Promise<AiNonStreamResult> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 30_000;

  const release = await acquireSlot(abortSignal);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  abortSignal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const doFetch = await getProxyFetch(options.proxyUrl || '', options.useProxy || false);

    const res = await doFetch(`${options.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 2000,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after');
        throw new AiError(AiErrorCode.RATE_LIMITED, 'Rate limited', { context: { retryAfter } });
      }
      throw createSanitizedError(res.status);
    }

    const data = await res.json();
    const extracted = extractNonStreamContent(data);
    const latencyMs = Date.now() - startTime;

    if (!extracted.text || !extracted.text.trim()) {
      throw new AiError(AiErrorCode.EMPTY_RESPONSE, 'Non-stream response has no content');
    }

    return {
      text: extracted.text.trim(),
      meta: {
        mode: 'ai',
        model: options.model,
        requestId,
        latencyMs,
        finishReason: extracted.finishReason || undefined,
        tokensOut: extracted.usage?.tokens_out,
      },
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;

    if (err instanceof AiError) {
      err.meta = { mode: 'ai', model: options.model, requestId, latencyMs };
      throw err;
    }

    if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
      throw new AiError(AiErrorCode.TIMEOUT, 'Request timed out', {
        meta: { mode: 'ai', model: options.model, requestId, latencyMs },
      });
    }

    throw new AiError(AiErrorCode.NETWORK_ERROR, 'Network error', {
      context: { cause: err instanceof Error ? err.message : 'unknown' },
      meta: { mode: 'ai', model: options.model, requestId, latencyMs },
    });
  } finally {
    clearTimeout(timeout);
    abortSignal?.removeEventListener('abort', onExternalAbort);
    release();
  }
}

// ─── Streaming with Recovery ─────────────────────────────────────
// This is the main chat flow: stream → if empty → non-stream recovery → if empty → throw

export async function aiStreamWithRecovery(
  options: AiClientOptions,
  messages: AiMessage[],
  callbacks: AiStreamCallbacks,
  abortSignal?: AbortSignal
): Promise<AiStreamResult> {
  // Step 1: Try streaming
  try {
    const result = await aiStreamRequest(options, messages, callbacks, abortSignal);
    return result;
  } catch (err) {
    // Only recover from EMPTY_RESPONSE, not from auth/rate-limit/abort
    if (!(err instanceof AiError) || err.code !== AiErrorCode.EMPTY_RESPONSE) {
      throw err;
    }

    // Step 2: Non-stream recovery (exactly once)
    console.log(
      `[ai-client] [${err.meta?.requestId}] Stream empty — attempting non-stream recovery`
    );

    try {
      const recoveryResult = await aiNonStreamRequest(options, messages, abortSignal);

      // Convert to deltas for typing experience
      const text = recoveryResult.text;
      for (let i = 0; i < text.length; i += 50) {
        callbacks.onDelta?.(text.slice(i, i + 50));
      }

      return {
        text,
        meta: {
          ...recoveryResult.meta,
          mode: 'ai-recovery',
        },
      };
    } catch (recoveryErr) {
      // Recovery also failed
      console.warn(
        `[ai-client] Recovery failed:`,
        recoveryErr instanceof Error ? recoveryErr.message : 'unknown'
      );
      throw err; // Throw original error
    }
  }
}
