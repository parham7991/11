/**
 * /api/ai-chat — Resilient AI chat route with streaming + recovery
 * ──────────────────────────────────────────────────────────────────
 * Architecture:
 *   1. Streaming request to offl-ai-elite
 *   2. Full SSE parsing via sse-parser
 *   3. If valid text received → normal stream to client
 *   4. If HTTP 200 + empty content → single non-stream recovery
 *   5. If recovery gives valid content → convert to streaming deltas
 *   6. If recovery also empty + RAG sources → deterministic fallback
 *   7. If no sources → safe actionable error
 *
 * Security:
 *   - API key never exposed to client
 *   - No secrets in logs
 *   - Safe error messages only
 *   - Request ID for tracing
 * ──────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiChatConfig, sanitizePrompt } from '@/lib/ai-chat/config';
import { buildRagContext } from '@/lib/ai-chat/rag';
import { getProxyFetch } from '@/lib/ai-chat/proxy-fetch';
import { SseParser, extractNonStreamContent, type SseEvent } from '@/lib/ai-chat/sse-parser';
import type { ChatMessage, ChatRequestBody, ChatResponse, ChatSource } from '@/lib/ai-chat/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Rate Limiting ───────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const rateMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// ─── Request ID ──────────────────────────────────────────────────
function generateRequestId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `aic-${ts}-${rand}`;
}

// ─── Safe Logging (never logs API key, cookies, full prompts, PII) ───
function safeLog(
  level: 'info' | 'warn' | 'error',
  requestId: string,
  msg: string,
  extra?: Record<string, unknown>
) {
  const safe: Record<string, unknown> = { requestId };
  if (extra) {
    // Strip sensitive fields
    const keys = Object.keys(extra);
    for (const k of keys) {
      if (/key|token|secret|auth|cookie|password|prompt|message|content/i.test(k)) continue;
      safe[k] = extra[k];
    }
  }
  const line = `[ai-chat] [${requestId}] ${msg}`;
  if (level === 'error') console.error(line, safe);
  else if (level === 'warn') console.warn(line, safe);
  else console.log(line, safe);
}

// ─── JSON Error Helper ───────────────────────────────────────────
function jsonError(
  error: string,
  status: number,
  sources: ChatResponse['sources'] = []
): NextResponse<ChatResponse> {
  return NextResponse.json({ reply: '', sources, error }, { status });
}

// ─── Deterministic RAG Fallback ──────────────────────────────────
function buildDeterministicFallback(sources: ChatSource[]): string {
  if (!sources || sources.length === 0) {
    return '';
  }

  const available = sources.filter((s) => s.inStock !== false && s.price);
  const unavailable = sources.filter((s) => s.inStock === false);

  let text = '';

  if (available.length > 0) {
    text += 'بر اساس محصولات موجود در فروشگاه آفلند، گزینه‌های زیر پیشنهاد می‌شوند:\n\n';
    for (const s of available.slice(0, 5)) {
      text += `• **${s.title}**`;
      if (s.brand) text += ` — ${s.brand}`;
      if (s.price) text += ` | ${s.price}`;
      if (s.discountPercent) text += ` (${s.discountPercent}٪ تخفیف)`;
      text += '\n';
    }
    text += '\nبرای مشاهدهٔ جزئیات بیشتر، روی هر محصول کلیک کنید.';
  }

  if (unavailable.length > 0) {
    text += '\n\n⚠️ برخی محصولات مرتبط در حال حاضر ناموجود هستند:';
    for (const s of unavailable.slice(0, 3)) {
      text += `\n• ${s.title}`;
    }
  }

  return text;
}

// ─── NDJSON Stream Helpers ───────────────────────────────────────
function createNdjsonStream(
  sources: ChatSource[],
  onStream: (enqueue: (event: object) => void) => Promise<void>,
  onCancel?: () => void
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const enqueue = (event: object) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        } catch {
          // Controller might be closed
        }
      };

      // Send sources first
      enqueue({ type: 'sources', sources });

      try {
        await onStream(enqueue);
        enqueue({ type: 'done' });
      } catch (err) {
        enqueue({ type: 'error', error: 'ارتباط با سرویس قطع شد.' });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      if (onCancel) onCancel();
    },
  });
}

// ─── Streaming AI Request ────────────────────────────────────────
interface StreamResult {
  gotContent: boolean;
  textChunks: string[];
  finishReason: string;
  tokensOut: number | undefined;
  errorCode?: string;
  retryAfter?: number;
}

async function streamAiRequest(
  doFetch: typeof fetch,
  apiBase: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  config: { temperature: number; maxTokens: number },
  abortSignal: AbortSignal,
  onDelta: (text: string) => void
): Promise<StreamResult> {
  const result: StreamResult = {
    gotContent: false,
    textChunks: [],
    finishReason: '',
    tokensOut: undefined,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  // Combine external abort with our timeout
  const onExternalAbort = () => controller.abort();
  abortSignal.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const aiRes = await doFetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      }),
      signal: controller.signal,
    });

    // Handle error status codes
    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        const retryAfter = aiRes.headers.get('retry-after');
        result.errorCode = 'rate_limited';
        result.retryAfter = retryAfter ? parseInt(retryAfter, 10) : undefined;
        return result;
      }
      if (aiRes.status === 401 || aiRes.status === 403) {
        result.errorCode = 'auth_error';
        return result;
      }
      if (aiRes.status === 404) {
        result.errorCode = 'not_found';
        return result;
      }
      if (aiRes.status >= 500) {
        result.errorCode = 'server_error';
        return result;
      }
      result.errorCode = `http_${aiRes.status}`;
      return result;
    }

    if (!aiRes.body) {
      result.errorCode = 'no_body';
      return result;
    }

    // Parse SSE stream
    const parser = new SseParser();
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        parser.feed(raw);

        const events = parser.drain();
        for (const evt of events) {
          if (evt.type === 'delta' && evt.content) {
            result.gotContent = true;
            result.textChunks.push(evt.content);
            onDelta(evt.content);
          }
          if (evt.type === 'usage' && evt.usage) {
            result.tokensOut = evt.usage.tokens_out;
          }
          if (evt.type === 'finish' && evt.finishReason) {
            result.finishReason = evt.finishReason;
          }
        }
      }

      // Process any remaining buffer
      parser.end();
      const finalEvents = parser.drain();
      for (const evt of finalEvents) {
        if (evt.type === 'delta' && evt.content) {
          result.gotContent = true;
          result.textChunks.push(evt.content);
          onDelta(evt.content);
        }
        if (evt.type === 'usage' && evt.usage) {
          result.tokensOut = evt.usage.tokens_out;
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
    }
  } catch (err) {
    const isAbort =
      err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError');
    if (!isAbort) {
      result.errorCode = 'network_error';
    }
  } finally {
    clearTimeout(timeout);
    abortSignal.removeEventListener('abort', onExternalAbort);
  }

  return result;
}

// ─── Non-Stream Recovery Request ─────────────────────────────────
async function recoveryNonStreamRequest(
  doFetch: typeof fetch,
  apiBase: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  config: { temperature: number; maxTokens: number },
  abortSignal: AbortSignal
): Promise<{ text: string; usage?: SseEvent['usage'] } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  const onExternalAbort = () => controller.abort();
  abortSignal.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const res = await doFetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = await res.json();
    const extracted = extractNonStreamContent(data);

    if (extracted.text && extracted.text.trim().length > 0) {
      return { text: extracted.text.trim(), usage: extracted.usage };
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    abortSignal.removeEventListener('abort', onExternalAbort);
  }
}

// ─── Convert text to streaming deltas ────────────────────────────
function* textToDeltas(text: string): Generator<string> {
  // Split into small chunks for typing effect
  const chunkSize = 3; // Characters per delta
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
  }
}

// ════════════════════════════════════════════════════════════════
// MAIN POST HANDLER
// ════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = generateRequestId();
  const config = getAiChatConfig();

  // ─── Config checks ───────────────────────────────────────
  if (!config.enabled) {
    return jsonError('دستیار هوشمند غیرفعال است.', 403);
  }

  // ─── Fail-safe: no API key ───────────────────────────────
  if (!config.apiKey) {
    safeLog('warn', requestId, 'No API key — fail-safe mode');

    // Build RAG context for fallback
    let sources: ChatSource[] = [];
    let body: ChatRequestBody;
    try {
      body = (await req.json()) as ChatRequestBody;
    } catch {
      return jsonError('درخواست نامعتبر است.', 400);
    }

    const message = sanitizePrompt(String(body?.message || '').trim()).slice(0, 1000);
    if (!message) {
      return jsonError('پیام خالی است.', 400);
    }

    if (config.enableRag) {
      try {
        const rag = await buildRagContext(message, config.ragCount);
        sources = rag.sources;
      } catch {
        /* ignore */
      }
    }

    const fallbackText =
      sources.length > 0
        ? buildDeterministicFallback(sources)
        : 'دستیار هوشمند آفلند در حال حاضر به سرویس AI متصل نیست. لطفاً از متخصص فروشگاه راهنمایی بگیرید یا با تیم پشتیبانی تماس بگیرید. برای سیستم کامل می‌توانید به اسمبل هوشمند مراجعه کنید.';

    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'sources', sources }) + '\n'));
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'delta', text: fallbackText }) + '\n')
          );
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
          controller.close();
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      }
    );
  }

  // ─── Rate limit ──────────────────────────────────────────
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return jsonError('درخواست‌های زیاد. لطفاً کمی بعد دوباره تلاش کنید.', 429);
  }

  // ─── Parse request body ──────────────────────────────────
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return jsonError('درخواست نامعتبر است.', 400);
  }

  const message = sanitizePrompt(String(body?.message || '').trim()).slice(0, 1000);
  if (!message) {
    return jsonError('پیام خالی است.', 400);
  }

  // ─── History (limit to 8 messages) ───────────────────────
  const history: ChatMessage[] = Array.isArray(body?.history)
    ? body.history
        .filter(
          (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
        )
        .slice(-8)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
    : [];

  // ─── RAG context ─────────────────────────────────────────
  let context = '';
  let sources: ChatSource[] = [];
  if (config.enableRag) {
    try {
      const rag = await buildRagContext(message, config.ragCount);
      context = rag.context;
      sources = rag.sources;
    } catch {
      /* RAG failure → continue without context */
    }
  }

  // ─── Build messages ──────────────────────────────────────
  const systemContent = context ? `${config.systemPrompt}\n\n${context}` : config.systemPrompt;
  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: message },
  ];

  // ─── Get proxy fetch ─────────────────────────────────────
  let doFetch: typeof fetch;
  try {
    doFetch = await getProxyFetch(config.proxyUrl, config.useProxy);
  } catch {
    doFetch = fetch;
  }

  safeLog('info', requestId, 'Starting AI chat request', {
    model: config.model,
    ragEnabled: config.enableRag,
    sourceCount: sources.length,
    historyLength: history.length,
  });

  // ═══════ PHASE 1: Streaming request ═══════════════════════
  const clientAbort = new AbortController();

  // Monitor client disconnect
  const onClientClose = () => {
    clientAbort.abort();
  };
  req.signal.addEventListener('abort', onClientClose, { once: true });

  const stream = createNdjsonStream(
    sources,
    async (enqueue) => {
      // Step 1: Try streaming
      let streamResult: StreamResult | null = null;

      try {
        streamResult = await streamAiRequest(
          doFetch,
          config.apiBase,
          config.apiKey,
          config.model,
          messages,
          { temperature: config.temperature, maxTokens: config.maxTokens },
          clientAbort.signal,
          (text) => {
            enqueue({ type: 'delta', text });
          }
        );
      } catch (err) {
        safeLog('error', requestId, 'Stream request exception', {
          error: err instanceof Error ? err.message : 'unknown',
        });
      }

      // Check if client disconnected
      if (clientAbort.signal.aborted) {
        safeLog('info', requestId, 'Client disconnected');
        return;
      }

      // ─── Stream succeeded with content ───────────────
      if (streamResult && streamResult.gotContent) {
        safeLog('info', requestId, 'Stream completed with content', {
          chunks: streamResult.textChunks.length,
          finishReason: streamResult.finishReason,
        });
        return;
      }

      // ─── Handle specific errors ──────────────────────
      if (streamResult?.errorCode === 'rate_limited') {
        safeLog('warn', requestId, 'Rate limited (429)', {
          retryAfter: streamResult.retryAfter,
        });
        // Try RAG fallback if available
        if (sources.length > 0) {
          const fallbackText = buildDeterministicFallback(sources);
          enqueue({ type: 'delta', text: fallbackText });
        } else {
          enqueue({
            type: 'error',
            error: 'محدودیت سرویس هوش مصنوعی. لطفاً کمی بعد دوباره تلاش کنید.',
          });
        }
        return;
      }

      if (streamResult?.errorCode === 'auth_error') {
        safeLog('error', requestId, 'Auth error (401/403)');
        enqueue({ type: 'error', error: 'مشکل اتصال به سرویس. لطفاً بعداً تلاش کنید.' });
        return;
      }

      if (streamResult?.errorCode === 'not_found') {
        safeLog('error', requestId, 'Model/endpoint not found (404)');
        enqueue({ type: 'error', error: 'سرویس هوش مصنوعی در دسترس نیست.' });
        return;
      }

      if (streamResult?.errorCode === 'network_error') {
        safeLog('error', requestId, 'Network error during stream');
        // Fall through to recovery
      }

      // ═══════ PHASE 2: Non-stream recovery ═══════════════
      // HTTP 200 but no content, or network error — try non-stream recovery
      safeLog('info', requestId, 'No content from stream — attempting recovery');

      let recoveryResult: { text: string; usage?: SseEvent['usage'] } | null = null;

      try {
        recoveryResult = await recoveryNonStreamRequest(
          doFetch,
          config.apiBase,
          config.apiKey,
          config.model,
          messages,
          { temperature: config.temperature, maxTokens: config.maxTokens },
          clientAbort.signal
        );
      } catch (err) {
        safeLog('error', requestId, 'Recovery request exception', {
          error: err instanceof Error ? err.message : 'unknown',
        });
      }

      // Check client disconnect again
      if (clientAbort.signal.aborted) return;

      // ─── Recovery succeeded ──────────────────────────
      if (recoveryResult && recoveryResult.text) {
        safeLog('info', requestId, 'Recovery succeeded with content', {
          textLength: recoveryResult.text.length,
        });

        // Convert to streaming deltas for typing experience
        const gen = textToDeltas(recoveryResult.text);
        let step = gen.next();
        while (!step.done) {
          if (clientAbort.signal.aborted) return;
          enqueue({ type: 'delta', text: step.value });
          step = gen.next();
        }
        return;
      }

      // ═══════ PHASE 3: Deterministic RAG fallback ════════
      safeLog('info', requestId, 'Recovery empty — using deterministic fallback', {
        sourceCount: sources.length,
      });

      if (sources.length > 0) {
        const fallbackText = buildDeterministicFallback(sources);
        // Stream it as deltas for UX consistency
        const gen = textToDeltas(fallbackText);
        let step = gen.next();
        while (!step.done) {
          if (clientAbort.signal.aborted) return;
          enqueue({ type: 'delta', text: step.value });
          step = gen.next();
        }
        return;
      }

      // ═══════ PHASE 4: Safe error (no sources, no AI) ════
      enqueue({
        type: 'error',
        error:
          'در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً دوباره تلاش کنید یا مستقیماً از محصولات سایت بازدید کنید.',
      });
    },
    () => {
      // Cancel callback — client disconnected
      clientAbort.abort();
      safeLog('info', requestId, 'Stream cancelled by client');
    }
  );

  // Clean up client disconnect listener
  const cleanupStream = () => {
    req.signal.removeEventListener('abort', onClientClose);
  };

  // Wrap stream to ensure cleanup
  const wrappedStream = new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch {
        // Client disconnect or error
      } finally {
        cleanupStream();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      cleanupStream();
      clientAbort.abort();
    },
  });

  return new Response(wrappedStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Request-Id': requestId,
      Connection: 'keep-alive',
    },
  });
}

// ════════════════════════════════════════════════════════════════
// GET — Health check / status
// ════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest): Promise<NextResponse> {
  const config = getAiChatConfig();
  const url = new URL(req.url);
  const doTest = url.searchParams.get('test') === '1';

  const status = {
    enabled: config.enabled,
    hasKey: Boolean(config.apiKey),
    provider: config.providerId,
    model: config.model,
    rag: config.enableRag,
  };

  if (!doTest) {
    return NextResponse.json(status);
  }

  // Real test — non-stream small request
  if (!config.apiKey) {
    return NextResponse.json(
      { ...status, test: 'fail', reason: 'کلید تنظیم نشده' },
      { status: 400 }
    );
  }

  try {
    let doFetch: typeof fetch;
    try {
      doFetch = await getProxyFetch(config.proxyUrl, config.useProxy);
    } catch {
      doFetch = fetch;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    // Try streaming first (the primary path)
    const res = await doFetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'سلام' }],
        max_tokens: 10,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok || !res.body) {
      return NextResponse.json(
        { ...status, test: 'fail', reason: `HTTP ${res.status}` },
        { status: 502 }
      );
    }

    // Read the stream and check for content
    const parser = new SseParser();
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let gotContent = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
        const events = parser.drain();
        for (const evt of events) {
          if (evt.type === 'delta' && evt.content) {
            gotContent = true;
          }
        }
        if (gotContent || parser.done) break;
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
    }

    if (gotContent) {
      return NextResponse.json({ ...status, test: 'ok' });
    }

    // Stream returned no content — try non-stream fallback
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 10_000);

    const res2 = await doFetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'سلام' }],
        max_tokens: 10,
        stream: false,
      }),
      signal: controller2.signal,
    });

    clearTimeout(timeout2);

    if (res2.ok) {
      const data = await res2.json();
      const extracted = extractNonStreamContent(data);
      if (extracted.text) {
        return NextResponse.json({ ...status, test: 'ok' });
      }
    }

    return NextResponse.json(
      { ...status, test: 'fail', reason: 'Empty response from both stream and non-stream' },
      { status: 502 }
    );
  } catch (e) {
    return NextResponse.json(
      { ...status, test: 'fail', reason: 'اتصال برقرار نشد' },
      { status: 500 }
    );
  }
}
