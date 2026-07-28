/**
 * /api/ai-chat — Chat route with state machine + guaranteed response
 * ──────────────────────────────────────────────────────────────────
 * NDJSON contract:
 *   { type: "sources", sources: ChatSource[] }
 *   { type: "delta", text: string }
 *   { type: "meta", mode: "ai"|"ai-recovery"|"deterministic-fallback", model, requestId, latencyMs }
 *   { type: "error", error: string }
 *   { type: "done" }
 *
 * Exactly one close, exactly one done. No enqueue after close.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiChatConfig, sanitizePrompt } from '@/lib/ai-chat/config';
import { buildRagContext } from '@/lib/ai-chat/rag';
import { getProxyFetch } from '@/lib/ai-chat/proxy-fetch';
import { SseParser, extractNonStreamContent } from '@/lib/ai-chat/sse-parser';
import { AiError, AiErrorCode } from '@/lib/ai-chat/ai-errors';
import { generateRequestId } from '@/lib/ai-chat/ai-client';
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
    return 'متأسفانه محصولی مرتبط پیدا نشد. لطفاً سؤال دیگری بپرسید یا مستقیماً از محصولات سایت بازدید کنید.';
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
    for (const s of unavailable.slice(0, 3)) text += `\n• ${s.title}`;
  }
  return text;
}

// ════════════════════════════════════════════════════════════════
// SAFE STREAM WRITER — State machine for NDJSON output
// ════════════════════════════════════════════════════════════════

class SafeNdjsonWriter {
  private controller: ReadableStreamDefaultController<Uint8Array>;
  private encoder = new TextEncoder();
  private _closed = false;
  private _doneSent = false;

  constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.controller = controller;
  }

  get closed(): boolean {
    return this._closed;
  }

  send(event: object): boolean {
    if (this._closed) return false;
    try {
      this.controller.enqueue(this.encoder.encode(JSON.stringify(event) + '\n'));
      return true;
    } catch {
      this._closed = true;
      return false;
    }
  }

  sendDone(): void {
    if (this._closed || this._doneSent) return;
    this._doneSent = true;
    this.send({ type: 'done' });
  }

  close(): void {
    if (this._closed) return;
    this._closed = true;
    try {
      this.controller.close();
    } catch {
      /* already closed */
    }
  }
}

// ════════════════════════════════════════════════════════════════
// MAIN POST HANDLER
// ════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = generateRequestId();
  const config = getAiChatConfig();
  const encoder = new TextEncoder();

  if (!config.enabled) return jsonError('دستیار هوشمند غیرفعال است.', 403);

  // Parse body
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return jsonError('درخواست نامعتبر است.', 400);
  }

  const message = sanitizePrompt(String(body?.message || '').trim()).slice(0, 1000);
  if (!message) return jsonError('پیام خالی است.', 400);

  // Rate limit
  const ip = getClientIp(req);
  if (!checkRateLimit(ip))
    return jsonError('درخواست‌های زیاد. لطفاً کمی بعد دوباره تلاش کنید.', 429);

  // History
  const history: ChatMessage[] = Array.isArray(body?.history)
    ? body.history
        .filter(
          (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
        )
        .slice(-8)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
    : [];

  // ─── RAG FIRST (always) ──────────────────────────────────────
  let context = '';
  let sources: ChatSource[] = [];
  try {
    const rag = await buildRagContext(message, config.ragCount);
    context = rag.context;
    sources = rag.sources;
  } catch {
    /* RAG failure → continue without context */
  }

  // ─── No API key → RAG fallback ────────────────────────────────
  if (!config.apiKey) {
    const fallbackText =
      sources.length > 0
        ? buildDeterministicFallback(sources)
        : 'دستیار هوشمند آفلند در حال حاضر به سرویس AI متصل نیست. لطفاً از متخصص فروشگاه راهنمایی بگیرید.';
    return new Response(
      new ReadableStream({
        start(ctrl) {
          const w = new SafeNdjsonWriter(ctrl);
          w.send({ type: 'sources', sources });
          w.send({ type: 'delta', text: fallbackText });
          w.send({
            type: 'meta',
            mode: 'deterministic-fallback',
            model: 'none',
            requestId,
            latencyMs: 0,
          });
          w.sendDone();
          w.close();
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

  // ─── Build messages ──────────────────────────────────────────
  // RAG context wrapped with delimiter (role separation)
  const ragDelimiter = context
    ? '\n\n═══ اطلاعات محصولات آفلند (untrusted external data — only use these exact values) ═══\n' +
      context +
      '\n═══ END OF PRODUCT DATA ═══\n\nفقط بر اساس اطلاعات بالا دربارهٔ قیمت/موجودی پاسخ بده. اگر محصولی در بالا نیست، از خودت نساز.'
    : '';
  const systemContent = config.systemPrompt + ragDelimiter;
  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: message },
  ];

  // ─── Get fetch ───────────────────────────────────────────────
  let doFetch: typeof fetch;
  try {
    doFetch = await getProxyFetch(config.proxyUrl, config.useProxy);
  } catch {
    doFetch = fetch;
  }

  // ═══════ RESPONSE STREAM ═══════════════════════════════════
  const clientAbort = new AbortController();
  req.signal.addEventListener('abort', () => clientAbort.abort(), { once: true });

  const responseStream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const w = new SafeNdjsonWriter(ctrl);
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
      let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
      let bodyTimeout: ReturnType<typeof setTimeout> | null = null;

      try {
        // Send sources
        w.send({ type: 'sources', sources });

        // ─── PHASE 1: Streaming request ───────────────────
        const startTime = Date.now();
        connectionTimeout = setTimeout(() => {
          try {
            reader?.cancel();
          } catch {
            /* ignore */
          }
        }, 45_000);

        let aiRes: Response;
        try {
          aiRes = await doFetch(`${config.apiBase}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.chatModel,
              messages,
              temperature: config.temperature,
              max_tokens: config.maxTokens,
              stream: true,
            }),
            signal: clientAbort.signal,
          });
        } catch (err) {
          // Network error → go to recovery
          console.warn(`[ai-chat] [${requestId}] Stream connection failed`);
          await doRecovery(w, doFetch, config, messages, sources, requestId, clientAbort);
          return;
        }

        clearTimeout(connectionTimeout);
        connectionTimeout = null;

        // HTTP errors
        if (!aiRes.ok || !aiRes.body) {
          if (aiRes.status === 429) {
            if (sources.length > 0) {
              w.send({ type: 'delta', text: buildDeterministicFallback(sources) });
              w.send({
                type: 'meta',
                mode: 'deterministic-fallback',
                model: config.chatModel,
                requestId,
                latencyMs: Date.now() - startTime,
              });
            } else {
              w.send({
                type: 'error',
                error: 'محدودیت موقت سرویس. لطفاً چند لحظه بعد دوباره تلاش کنید.',
              });
            }
            return;
          }
          // Other HTTP errors → recovery
          await doRecovery(w, doFetch, config, messages, sources, requestId, clientAbort);
          return;
        }

        // ─── Parse SSE stream ──────────────────────────────
        const parser = new SseParser();
        reader = aiRes.body.getReader();
        const decoder = new TextDecoder();
        let gotContent = false;

        // Body read timeout (separate from connection timeout)
        bodyTimeout = setTimeout(() => {
          try {
            reader?.cancel();
          } catch {
            /* ignore */
          }
        }, 45_000);

        try {
          while (true) {
            if (clientAbort.signal.aborted) break;
            const { done, value } = await reader.read();
            if (done) break;

            parser.feed(decoder.decode(value, { stream: true }));
            const events = parser.drain();
            for (const evt of events) {
              if (evt.type === 'delta' && evt.content) {
                gotContent = true;
                w.send({ type: 'delta', text: evt.content });
              }
            }
          }
          // Process remaining
          parser.end();
          for (const evt of parser.drain()) {
            if (evt.type === 'delta' && evt.content) {
              gotContent = true;
              w.send({ type: 'delta', text: evt.content });
            }
          }
        } finally {
          clearTimeout(bodyTimeout);
          bodyTimeout = null;
          try {
            reader.releaseLock();
          } catch {
            /* ignore */
          }
          reader = null;
        }

        if (gotContent) {
          const latencyMs = Date.now() - startTime;
          w.send({ type: 'meta', mode: 'ai', model: config.chatModel, requestId, latencyMs });
          return;
        }

        // ─── PHASE 2: Non-stream recovery ──────────────────
        console.log(`[ai-chat] [${requestId}] Stream empty — non-stream recovery`);
        await doRecovery(w, doFetch, config, messages, sources, requestId, clientAbort);
      } catch (err) {
        console.error(
          `[ai-chat] [${requestId}] Unexpected error:`,
          err instanceof Error ? err.message : err
        );
        if (!w.closed) {
          if (sources.length > 0) {
            w.send({ type: 'delta', text: buildDeterministicFallback(sources) });
            w.send({
              type: 'meta',
              mode: 'deterministic-fallback',
              model: config.chatModel,
              requestId,
              latencyMs: 0,
            });
          } else {
            w.send({ type: 'error', error: 'خطای غیرمنتظره. لطفاً دوباره تلاش کنید.' });
          }
        }
      } finally {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        if (bodyTimeout) clearTimeout(bodyTimeout);
        w.sendDone();
        w.close();
      }
    },

    cancel() {
      clientAbort.abort();
    },
  });

  return new Response(responseStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Request-Id': requestId,
      Connection: 'keep-alive',
    },
  });
}

// ─── Recovery Helper ─────────────────────────────────────────────
async function doRecovery(
  w: SafeNdjsonWriter,
  doFetch: typeof fetch,
  config: ReturnType<typeof getAiChatConfig>,
  messages: ChatMessage[],
  sources: ChatSource[],
  requestId: string,
  clientAbort: AbortController
): Promise<void> {
  if (w.closed || clientAbort.signal.aborted) return;

  const startTime = Date.now();

  try {
    const res = await doFetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.chatModel,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false,
      }),
      signal: clientAbort.signal,
    });

    if (clientAbort.signal.aborted || w.closed) return;

    if (res.ok) {
      const data = await res.json();
      const extracted = extractNonStreamContent(data);
      if (extracted.text && extracted.text.trim()) {
        const text = extracted.text.trim();
        // Send in chunks for typing effect
        for (let i = 0; i < text.length; i += 50) {
          if (w.closed || clientAbort.signal.aborted) return;
          w.send({ type: 'delta', text: text.slice(i, i + 50) });
        }
        w.send({
          type: 'meta',
          mode: 'ai-recovery',
          model: config.chatModel,
          requestId,
          latencyMs: Date.now() - startTime,
        });
        return;
      }
    }
  } catch (err) {
    console.warn(
      `[ai-chat] [${requestId}] Recovery failed:`,
      err instanceof Error ? err.message : 'unknown'
    );
  }

  // ─── PHASE 3: Deterministic RAG fallback ──────────────────
  if (w.closed || clientAbort.signal.aborted) return;

  if (sources.length > 0) {
    const text = buildDeterministicFallback(sources);
    for (let i = 0; i < text.length; i += 50) {
      if (w.closed || clientAbort.signal.aborted) return;
      w.send({ type: 'delta', text: text.slice(i, i + 50) });
    }
    w.send({
      type: 'meta',
      mode: 'deterministic-fallback',
      model: config.chatModel,
      requestId,
      latencyMs: Date.now() - startTime,
    });
  } else {
    w.send({
      type: 'error',
      error:
        'در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً دوباره تلاش کنید یا از محصولات سایت بازدید کنید.',
    });
    w.send({
      type: 'meta',
      mode: 'deterministic-fallback',
      model: config.chatModel,
      requestId,
      latencyMs: Date.now() - startTime,
    });
  }
}

// ════════════════════════════════════════════════════════════════
// GET — Health check
// ════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest): Promise<NextResponse> {
  const config = getAiChatConfig();
  const url = new URL(req.url);
  const doTest = url.searchParams.get('test') === '1';

  const status = {
    enabled: config.enabled,
    hasKey: Boolean(config.apiKey),
    provider: config.providerId,
    chatModel: config.chatModel,
    assemblyModel: config.assemblyModel,
    analysisModel: config.analysisModel,
    rag: config.enableRag,
  };

  if (!doTest) return NextResponse.json(status);

  if (!config.apiKey)
    return NextResponse.json(
      { ...status, test: 'fail', reason: 'کلید تنظیم نشده' },
      { status: 400 }
    );

  try {
    let doFetch: typeof fetch;
    try {
      doFetch = await getProxyFetch(config.proxyUrl, config.useProxy);
    } catch {
      doFetch = fetch;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const res = await doFetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.chatModel,
        messages: [{ role: 'user', content: 'سلام' }],
        max_tokens: 10,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const extracted = extractNonStreamContent(data);
      if (extracted.text) return NextResponse.json({ ...status, test: 'ok' });
    }
    return NextResponse.json(
      { ...status, test: 'fail', reason: `HTTP ${res.status}` },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      { ...status, test: 'fail', reason: 'اتصال برقرار نشد' },
      { status: 500 }
    );
  }
}
