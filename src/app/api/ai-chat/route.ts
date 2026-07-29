/**
 * /api/ai-chat — Chat API با Intent Routing + Streaming (نسخه بازنویسی شده)
 * ──────────────────────────────────────────────────────────────────
 * اتصال به OmniRouter AI Gateway (147.45.43.25:20128)
 *
 * Flow:
 *   1. Validate + Rate Limit
 *   2. Classify Intent (بدون AI)
 *   3. Handle Intent (greeting, identity, full_build, off_topic, order_support)
 *   4. Product Intent → RAG Search → Stream Sources
 *   5. AI Call با Streaming
 *   6. Recovery در صورت خطا
 *   7. Meta Event + Done
 * ──────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAiChatConfig,
  sanitizePrompt,
  checkRateLimit,
  getClientIp,
  ASSEMBLY_REDIRECT_MESSAGE,
  OFF_TOPIC_MESSAGE,
  ORDER_SUPPORT_MESSAGE,
  GREETING_MESSAGE,
  IDENTITY_MESSAGE,
} from '@/lib/ai-chat/config';
import { classifyIntent } from '@/lib/ai-chat/chat-intent';
import { buildRagContext } from '@/lib/ai-chat/rag';
import { streamAiRequest, generateRequestId, type StreamCallback } from '@/lib/ai-chat/ai-client';
import {
  buildGroundedProductContext,
  buildGroundedProductFallback,
} from '@/lib/ai-chat/grounded-fallback';
import type { ChatMessage, ChatRequestBody, ChatSource, StreamEvent } from '@/lib/ai-chat/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ════════════════════════════════════════════════════════════════
// NDJSON WRITER
// ════════════════════════════════════════════════════════════════

class NdjsonWriter {
  private ctrl: ReadableStreamDefaultController<Uint8Array>;
  private enc = new TextEncoder();
  private _closed = false;
  private _doneSent = false;

  constructor(ctrl: ReadableStreamDefaultController<Uint8Array>) {
    this.ctrl = ctrl;
  }

  get closed() {
    return this._closed;
  }

  send(event: StreamEvent): boolean {
    if (this._closed) return false;
    try {
      this.ctrl.enqueue(this.enc.encode(JSON.stringify(event) + '\n'));
      return true;
    } catch {
      this._closed = true;
      return false;
    }
  }

  progress(phase: string, message: string, extra?: Record<string, unknown>): void {
    this.send({ type: 'progress', phase, message, elapsedMs: 0, ...extra });
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
      this.ctrl.close();
    } catch {
      // ignore
    }
  }
}

// ════════════════════════════════════════════════════════════════
// ERROR RESPONSE
// ════════════════════════════════════════════════════════════════

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ reply: '', sources: [], error }, { status });
}

// ════════════════════════════════════════════════════════════════
// MAIN POST HANDLER
// ════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = generateRequestId();
  const config = getAiChatConfig();

  // ─── Validation ─────────────────────────────────────────────
  if (!config.enabled) {
    return jsonError('دستیار هوشمند غیرفعال است.', 403);
  }

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

  // ─── Rate Limit ─────────────────────────────────────────────
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return jsonError('درخواست‌های زیاد. لطفاً کمی بعد دوباره تلاش کنید.', 429);
  }

  // ─── History ────────────────────────────────────────────────
  const history: ChatMessage[] = Array.isArray(body?.history)
    ? body.history
        .filter(
          (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
        )
        .slice(-8)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
    : [];

  // ─── Intent Classification ──────────────────────────────────
  const intentResult = classifyIntent(message);

  // ─── Return Stream IMMEDIATELY ──────────────────────────────
  const clientAbort = new AbortController();
  req.signal.addEventListener('abort', () => clientAbort.abort(), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const w = new NdjsonWriter(ctrl);
      const startTime = Date.now();
      let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

      // Heartbeat every 5s
      heartbeatInterval = setInterval(() => {
        if (w.closed) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          return;
        }
        w.progress('heartbeat', 'هنوز در حال پردازش…', { elapsedMs: Date.now() - startTime });
      }, 5000);

      try {
        // ─── IMMEDIATE first event (< 200ms) ────────────────
        w.progress('understanding', 'در حال بررسی سوال شما…');

        // ─── Handle Deterministic Intents ─────────────────────
        if (intentResult.intent === 'greeting') {
          w.send({ type: 'delta', text: GREETING_MESSAGE });
          w.send({
            type: 'meta',
            mode: 'deterministic-fallback',
            model: 'local',
            requestId,
            latencyMs: Date.now() - startTime,
          });
          return;
        }

        if (intentResult.intent === 'identity') {
          w.send({ type: 'delta', text: IDENTITY_MESSAGE });
          w.send({
            type: 'meta',
            mode: 'deterministic-fallback',
            model: 'local',
            requestId,
            latencyMs: Date.now() - startTime,
          });
          return;
        }

        if (intentResult.intent === 'full_build') {
          w.send({ type: 'delta', text: ASSEMBLY_REDIRECT_MESSAGE });
          w.send({
            type: 'meta',
            mode: 'ai',
            model: config.chatModel,
            requestId,
            latencyMs: Date.now() - startTime,
          });
          return;
        }

        if (intentResult.intent === 'off_topic') {
          w.send({ type: 'delta', text: OFF_TOPIC_MESSAGE });
          w.send({
            type: 'meta',
            mode: 'ai',
            model: config.chatModel,
            requestId,
            latencyMs: Date.now() - startTime,
          });
          return;
        }

        if (intentResult.intent === 'order_support') {
          w.send({ type: 'delta', text: ORDER_SUPPORT_MESSAGE });
          w.send({
            type: 'meta',
            mode: 'ai',
            model: config.chatModel,
            requestId,
            latencyMs: Date.now() - startTime,
          });
          return;
        }

        // ─── Technical Question (no RAG) ─────────────────────
        if (intentResult.intent === 'technical_question' && !intentResult.needsRag) {
          w.progress('ai_thinking', 'در حال تحلیل فنی…');
          await callAi(w, config, message, history, startTime, requestId, clientAbort, 'technical');
          return;
        }

        // ─── Product Intent (RAG + AI) ───────────────────────
        if (intentResult.needsRag) {
          w.progress('searching_catalog', 'جستجو در محصولات آفلند…');

          let sources: ChatSource[] = [];
          let context = '';

          try {
            const rag = await buildRagContext(message, config.ragCount);
            sources = rag.sources;

            // Category filter
            if (intentResult.categoryHint) {
              sources = filterSourcesByCategory(sources, intentResult.categoryHint);
            }

            // Limit to top 4
            sources = sources.slice(0, 4);
            context = buildGroundedProductContext(sources);

            if (sources.length > 0) {
              w.send({ type: 'sources', sources });
              w.progress('search_complete', 'محصولات مرتبط پیدا شدند', { count: sources.length });
            }
          } catch (err) {
            console.warn('[ai-chat] RAG failed:', err instanceof Error ? err.message : err);
          }

          // No products found
          if (sources.length === 0 || !context) {
            w.send({
              type: 'delta',
              text: 'فعلاً محصول مرتبط و قابل‌نمایشی پیدا نشد. لطفاً نام مدل، ظرفیت یا بودجه را دقیق‌تر بفرستید.',
            });
            w.send({
              type: 'meta',
              mode: 'deterministic-fallback',
              model: 'none',
              requestId,
              latencyMs: Date.now() - startTime,
            });
            return;
          }

          // All out of stock
          if (sources.every((s) => s.inStock === false)) {
            const fallback = buildGroundedProductFallback(sources);
            if (fallback) w.send({ type: 'delta', text: fallback });
            w.send({
              type: 'meta',
              mode: 'deterministic-fallback',
              model: 'none',
              requestId,
              latencyMs: Date.now() - startTime,
            });
            return;
          }

          w.progress('waiting_for_ai', 'در حال تحلیل تخصصی…');
          await callAi(
            w,
            config,
            message,
            history,
            startTime,
            requestId,
            clientAbort,
            'product',
            context,
            sources
          );
          return;
        }

        // ─── Unknown (AI without RAG) ────────────────────────
        w.progress('ai_thinking', 'در حال نوشتن پاسخ…');
        await callAi(w, config, message, history, startTime, requestId, clientAbort, 'unknown');
      } catch (err) {
        console.error(
          `[ai-chat] [${requestId}] Unexpected:`,
          err instanceof Error ? err.message : err
        );
        if (!w.closed) {
          w.send({ type: 'error', error: 'خطای غیرمنتظره. لطفاً دوباره تلاش کنید.' });
        }
      } finally {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        w.sendDone();
        w.close();
      }
    },

    cancel() {
      clientAbort.abort();
    },
  });

  return new Response(stream, {
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
// AI CALL HELPER
// ════════════════════════════════════════════════════════════════

async function callAi(
  w: NdjsonWriter,
  config: ReturnType<typeof getAiChatConfig>,
  message: string,
  history: ChatMessage[],
  startTime: number,
  requestId: string,
  clientAbort: AbortController,
  mode: 'greeting' | 'technical' | 'product' | 'unknown',
  ragContext?: string,
  sources: readonly ChatSource[] = []
): Promise<void> {
  // Build system prompt
  let systemContent = config.systemPrompt;
  if (ragContext) {
    systemContent +=
      '\n\n═══ اطلاعات محصولات آفلند (untrusted — فقط از این داده‌ها استفاده کن) ═══\n' +
      ragContext +
      '\n═══ END ═══';
  }

  // Mode-specific instructions
  if (mode === 'greeting' || mode === 'technical') {
    systemContent +=
      '\n\nمهم: این یک سؤال فنی/معمولی است. محصولی پیشنهاد نده. مستقیم پاسخ بده، ' +
      'مقدمه و معرفی خودت را تکرار نکن، حداکثر ۶ نکته و حدود ۶۰۰ کاراکتر بنویس.';
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: message },
  ];

  // No API key → fallback
  if (!config.apiKey) {
    if (emitGroundedProductFallback(w, sources, 'none', requestId, startTime)) return;
    w.send({ type: 'delta', text: 'دستیار هوشمند آفلند در حال حاضر به سرویس AI متصل نیست.' });
    w.send({
      type: 'meta',
      mode: 'deterministic-fallback',
      model: 'none',
      requestId,
      latencyMs: Date.now() - startTime,
    });
    return;
  }

  // Stream AI request
  const onEvent: StreamCallback = (evt) => {
    if (!w.closed && evt.type === 'delta' && evt.content) {
      w.send({ type: 'delta', text: evt.content });
    }
  };

  try {
    const meta = await streamAiRequest(
      {
        apiKey: config.apiKey,
        apiBase: config.apiBase,
        model: config.chatModel,
        temperature: mode === 'greeting' ? 0.5 : config.temperature,
        maxTokens: mode === 'greeting' ? 200 : config.maxTokens,
        timeoutMs: 60_000, // 60 seconds (increased from 45s for better quality)
        proxyUrl: config.proxyUrl,
        useProxy: config.useProxy,
      },
      messages,
      onEvent,
      clientAbort.signal
    );

    w.send({
      type: 'meta',
      mode: meta.mode,
      model: meta.model,
      requestId,
      latencyMs: meta.latencyMs,
    });
  } catch (err) {
    console.warn('[ai-chat] AI call failed:', err instanceof Error ? err.message : err);

    if (!w.closed) {
      if (emitGroundedProductFallback(w, sources, config.chatModel, requestId, startTime)) return;
      w.send({
        type: 'error',
        error: 'در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً دوباره تلاش کنید.',
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
}

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function emitGroundedProductFallback(
  w: NdjsonWriter,
  sources: readonly ChatSource[],
  model: string,
  requestId: string,
  startTime: number
): boolean {
  const text = buildGroundedProductFallback(sources);
  if (!text) return false;

  w.send({ type: 'delta', text });
  w.send({
    type: 'meta',
    mode: 'deterministic-fallback',
    model,
    requestId,
    latencyMs: Date.now() - startTime,
  });
  return true;
}

const CATEGORY_SYNONYMS_MAP: Record<string, string[]> = {
  cpu: ['پردازنده', 'cpu', 'اینتل', 'intel', 'ryzen', 'core', 'i5', 'i7', 'i9'],
  gpu: ['گرافیک', 'gpu', 'rtx', 'rx', 'geforce', 'radeon'],
  ram: ['رم', 'ram', 'ddr4', 'ddr5'],
  motherboard: ['مادربرد', 'motherboard', 'mainboard'],
  ssd: ['ssd', 'nvme', 'm.2', 'حافظه', 'هارد'],
  psu: ['پاور', 'psu', 'منبع تغذیه'],
  case: ['کیس', 'case'],
  cooler: ['خنک', 'cooler', 'aio', 'فن'],
};

function filterSourcesByCategory(sources: ChatSource[], categoryHint: string): ChatSource[] {
  const synonyms = CATEGORY_SYNONYMS_MAP[categoryHint];
  if (!synonyms) return sources;

  const filtered = sources.filter((s) => {
    const title = (s.title || '').toLowerCase();
    return synonyms.some((syn) => title.includes(syn));
  });

  return filtered;
}

// ════════════════════════════════════════════════════════════════
// GET — Health Check
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

  if (!config.apiKey) {
    return NextResponse.json(
      { ...status, test: 'fail', reason: 'کلید تنظیم نشده' },
      { status: 400 }
    );
  }

  return NextResponse.json({ ...status, test: 'ok' });
}
