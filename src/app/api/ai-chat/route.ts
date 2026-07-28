/**
 * /api/ai-chat — Chat route with intent routing + progress stream
 * ──────────────────────────────────────────────────────────────────
 * Flow:
 *   1. Return ReadableStream IMMEDIATELY (< 200ms first event)
 *   2. Classify intent (deterministic, no AI call)
 *   3. If product intent → RAG search → stream sources
 *   4. AI call via shared client (streamWithRecovery)
 *   5. Progress events as heartbeat
 *   6. Meta event with mode info
 *   7. Done
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiChatConfig, sanitizePrompt } from '@/lib/ai-chat/config';
import { buildRagContext } from '@/lib/ai-chat/rag';
import { getProxyFetch } from '@/lib/ai-chat/proxy-fetch';
import { SseParser, extractNonStreamContent } from '@/lib/ai-chat/sse-parser';
import { generateRequestId } from '@/lib/ai-chat/ai-client';
import { classifyIntent, ASSEMBLY_REDIRECT_MESSAGE } from '@/lib/ai-chat/chat-intent';
import { buildGroundedProductContext, buildGroundedProductFallback } from '@/lib/ai-chat/grounded-fallback';
import type { ChatMessage, ChatRequestBody, ChatSource } from '@/lib/ai-chat/types';

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

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ reply: '', sources: [], error }, { status });
}

// ─── Safe NDJSON Writer ─────────────────────────────────────────
class NdjsonWriter {
  private ctrl: ReadableStreamDefaultController<Uint8Array>;
  private enc = new TextEncoder();
  private _closed = false;
  private _doneSent = false;

  constructor(ctrl: ReadableStreamDefaultController<Uint8Array>) {
    this.ctrl = ctrl;
  }

  get closed() { return this._closed; }

  send(event: object): boolean {
    if (this._closed) return false;
    try { this.ctrl.enqueue(this.enc.encode(JSON.stringify(event) + '\n')); return true; }
    catch { this._closed = true; return false; }
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
    try { this.ctrl.close(); } catch { /* ignore */ }
  }
}

// ─── RAG with Category Filter ────────────────────────────────────
function buildCategoryFilteredRag(query: string, categoryHint: string | null, ragCount: number) {
  // For now, use standard RAG but we'll filter results by category
  return buildRagContext(query, ragCount);
}

// ════════════════════════════════════════════════════════════════
// MAIN POST HANDLER
// ════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = generateRequestId();
  const config = getAiChatConfig();

  if (!config.enabled) return jsonError('دستیار هوشمند غیرفعال است.', 403);

  let body: ChatRequestBody;
  try { body = (await req.json()) as ChatRequestBody; } catch { return jsonError('درخواست نامعتبر است.', 400); }

  const message = sanitizePrompt(String(body?.message || '').trim()).slice(0, 1000);
  if (!message) return jsonError('پیام خالی است.', 400);

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) return jsonError('درخواست‌های زیاد. لطفاً کمی بعد دوباره تلاش کنید.', 429);

  // History
  const history: ChatMessage[] = Array.isArray(body?.history)
    ? body.history.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-8).map(m => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
    : [];

  // ─── Classify intent IMMEDIATELY ────────────────────────────
  const intentResult = classifyIntent(message);

  // ─── Return stream IMMEDIATELY ──────────────────────────────
  const clientAbort = new AbortController();
  req.signal.addEventListener('abort', () => clientAbort.abort(), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const w = new NdjsonWriter(ctrl);
      const startTime = Date.now();
      let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

      // Heartbeat every 5s to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (w.closed) { if (heartbeatInterval) clearInterval(heartbeatInterval); return; }
        w.progress('heartbeat', 'هنوز در حال پردازش…', { elapsedMs: Date.now() - startTime });
      }, 5000);

      try {
        // ─── IMMEDIATE first event (< 200ms) ────────────────
        w.progress('understanding', 'در حال بررسی سوال شما…');

        // ─── Handle intent-specific flows ───────────────────
        if (intentResult.intent === 'greeting') {
          w.send({ type: 'delta', text: 'سلام! من دستیار هوشمند آفلند هستم. برای مشاوره فنی، انتخاب کالای دیجیتال و اسمبل سیستم کنارت هستم.' });
          w.send({ type: 'meta', mode: 'deterministic-fallback', model: 'local', requestId, latencyMs: Date.now() - startTime });
          return;
        }

        if (intentResult.intent === 'identity') {
          w.send({ type: 'delta', text: 'من دستیار هوشمند آفلند، مشاور تخصصی قطعات کامپیوتر و کالای دیجیتال هستم. می‌توانم به سؤال‌های فنی پاسخ بدهم، محصولات موجود را براساس داده واقعی فروشگاه پیدا کنم و برای سیستم کامل شما را به اسمبلر هوشمند هدایت کنم.' });
          w.send({ type: 'meta', mode: 'deterministic-fallback', model: 'local', requestId, latencyMs: Date.now() - startTime });
          return;
        }

        if (intentResult.intent === 'full_build') {
          w.send({ type: 'delta', text: ASSEMBLY_REDIRECT_MESSAGE });
          w.send({ type: 'meta', mode: 'ai', model: config.chatModel, requestId, latencyMs: Date.now() - startTime });
          return;
        }

        if (intentResult.intent === 'off_topic') {
          w.send({ type: 'delta', text: 'من فقط دستیار خرید آفلند هستم و می‌تونم در مورد قطعات کامپیوتر، قیمت، موجودی و اسمبل سیستم کمکتون کنم. 😊' });
          w.send({ type: 'meta', mode: 'ai', model: config.chatModel, requestId, latencyMs: Date.now() - startTime });
          return;
        }

        if (intentResult.intent === 'order_support') {
          w.send({ type: 'delta', text: 'برای پیگیری سفارش، لطفاً به بخش «پروفایل > سفارشات من» مراجعه کنید یا با پشتیبانی آفلند تماس بگیرید.' });
          w.send({ type: 'meta', mode: 'ai', model: config.chatModel, requestId, latencyMs: Date.now() - startTime });
          return;
        }

        // ─── Technical question: AI without RAG ─────────────
        if (intentResult.intent === 'technical_question' && !intentResult.needsRag) {
          w.progress('ai_thinking', 'در حال تحلیل فنی…');
          await callAi(w, config, message, history, startTime, requestId, clientAbort, 'technical');
          return;
        }

        // ─── Product intent: RAG + AI ───────────────────────
        if (intentResult.needsRag) {
          w.progress('searching_catalog', 'جستجو در محصولات آفلند…');

          let sources: ChatSource[] = [];
          let context = '';
          try {
            const rag = await buildCategoryFilteredRag(message, intentResult.categoryHint, config.ragCount);
            sources = rag.sources;

            // Category hard filter: only show relevant products
            if (intentResult.categoryHint) {
              sources = filterSourcesByCategory(sources, intentResult.categoryHint);
            }

            // Never send hidden/unfiltered RAG rows to the model. The prompt context
            // is rebuilt from exactly the sources that are emitted to the client.
            sources = sources.slice(0, 4);
            context = buildGroundedProductContext(sources);

            if (sources.length > 0) {
              w.send({ type: 'sources', sources });
              w.progress('search_complete', 'محصولات مرتبط پیدا شدند', { count: sources.length });
            }
          } catch {
            // RAG failed; do not ask the model to invent product facts.
          }

          if (sources.length === 0 || !context) {
            w.send({ type: 'delta', text: 'فعلاً محصول مرتبط و قابل‌نمایشی پیدا نشد. لطفاً نام مدل، ظرفیت یا بودجه را دقیق‌تر بفرستید.' });
            w.send({ type: 'meta', mode: 'deterministic-fallback', model: 'none', requestId, latencyMs: Date.now() - startTime });
            return;
          }

          w.progress('waiting_for_ai', 'در حال تحلیل تخصصی…');
          await callAi(w, config, message, history, startTime, requestId, clientAbort, 'product', context, sources);
          return;
        }

        // ─── Unknown: AI without RAG ────────────────────────
        w.progress('ai_thinking', 'در حال نوشتن پاسخ…');
        await callAi(w, config, message, history, startTime, requestId, clientAbort, 'unknown');

      } catch (err) {
        console.error(`[ai-chat] [${requestId}] Unexpected:`, err instanceof Error ? err.message : err);
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
// AI CALL WITH RECOVERY
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
  // Build messages
  let systemContent = config.systemPrompt;
  if (ragContext) {
    systemContent += '\n\n═══ اطلاعات محصولات آفلند (untrusted — فقط از این داده‌ها استفاده کن) ═══\n' + ragContext + '\n═══ END ═══';
  }

  // Mode-specific instructions
  if (mode === 'greeting' || mode === 'technical') {
    systemContent += '\n\nمهم: این یک سؤال فنی/معمولی است. محصولی پیشنهاد نده. مستقیم پاسخ بده، مقدمه و معرفی خودت را تکرار نکن، حداکثر ۶ نکته و حدود ۶۰۰ کاراکتر بنویس.';
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: message },
  ];

  // No API key → skip AI, but still return an honest catalog-grounded recovery.
  if (!config.apiKey) {
    if (emitGroundedProductFallback(w, sources, 'none', requestId, startTime)) return;
    w.send({ type: 'delta', text: 'دستیار هوشمند آفلند در حال حاضر به سرویس AI متصل نیست.' });
    w.send({ type: 'meta', mode: 'deterministic-fallback', model: 'none', requestId, latencyMs: Date.now() - startTime });
    return;
  }

  // Get fetch
  let doFetch: typeof fetch;
  try { doFetch = await getProxyFetch(config.proxyUrl, config.useProxy); } catch { doFetch = fetch; }

  // ─── STREAMING REQUEST with proper timeouts ───────────────
  const fetchAbort = new AbortController();
  const onClientAbort = () => fetchAbort.abort();
  clientAbort.signal.addEventListener('abort', onClientAbort, { once: true });

  // Connection timeout: abort fetch if headers don't arrive in time
  const connectionTimer = setTimeout(() => fetchAbort.abort(), 45_000);

  try {
    const aiRes = await doFetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.chatModel,
        messages,
        temperature: mode === 'greeting' ? 0.5 : config.temperature,
        max_tokens: mode === 'greeting' ? 200 : config.maxTokens,
        stream: true,
      }),
      signal: fetchAbort.signal,
    });

    clearTimeout(connectionTimer);

    if (!aiRes.ok || !aiRes.body) {
      await doRecovery(w, doFetch, config, messages, startTime, requestId, clientAbort, mode, sources);
      return;
    }

    // Parse SSE with body timeout
    const parser = new SseParser();
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();
    let gotContent = false;

    // Body timeout: cancel reader if body takes too long
    const bodyTimer = setTimeout(() => {
      try { reader.cancel(); } catch { /* ignore */ }
      fetchAbort.abort();
    }, 45_000);

    try {
      while (true) {
        if (clientAbort.signal.aborted || fetchAbort.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
        for (const evt of parser.drain()) {
          if (evt.type === 'delta' && evt.content) {
            gotContent = true;
            w.send({ type: 'delta', text: evt.content });
          }
        }
      }
      parser.end();
      for (const evt of parser.drain()) {
        if (evt.type === 'delta' && evt.content) {
          gotContent = true;
          w.send({ type: 'delta', text: evt.content });
        }
      }
    } finally {
      clearTimeout(bodyTimer);
      try { reader.releaseLock(); } catch { /* ignore */ }
    }

    if (gotContent) {
      w.send({ type: 'meta', mode: 'ai', model: config.chatModel, requestId, latencyMs: Date.now() - startTime });
      return;
    }

    // Stream empty → recovery
    await doRecovery(w, doFetch, config, messages, startTime, requestId, clientAbort, mode, sources);

  } catch (err) {
    clearTimeout(connectionTimer);
    console.warn(`[ai-chat] [${requestId}] Stream failed:`, err instanceof Error ? err.message : err);
    await doRecovery(w, doFetch, config, messages, startTime, requestId, clientAbort, mode, sources);
  } finally {
    clientAbort.signal.removeEventListener('abort', onClientAbort);
  }
}

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
  w.send({ type: 'meta', mode: 'deterministic-fallback', model, requestId, latencyMs: Date.now() - startTime });
  return true;
}

// ─── Recovery (one non-stream attempt) ───────────────────────────
async function doRecovery(
  w: NdjsonWriter,
  doFetch: typeof fetch,
  config: ReturnType<typeof getAiChatConfig>,
  messages: ChatMessage[],
  startTime: number,
  requestId: string,
  clientAbort: AbortController,
  mode: string,
  sources: readonly ChatSource[]
): Promise<void> {
  if (w.closed || clientAbort.signal.aborted) return;

  w.progress('recovering', 'بازیابی پاسخ…');

  const recoveryAbort = new AbortController();
  const onClientAbort = () => recoveryAbort.abort();
  clientAbort.signal.addEventListener('abort', onClientAbort, { once: true });
  const recoveryTimer = setTimeout(() => recoveryAbort.abort(), 30_000);

  try {
    const res = await doFetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.chatModel,
        messages,
        temperature: mode === 'greeting' ? 0.5 : config.temperature,
        max_tokens: mode === 'greeting' ? 200 : config.maxTokens,
        stream: false,
      }),
      signal: recoveryAbort.signal,
    });

    if (w.closed || clientAbort.signal.aborted) return;

    if (res.ok) {
      const data = await res.json();
      const extracted = extractNonStreamContent(data);
      if (extracted.text?.trim()) {
        const text = extracted.text.trim();
        for (let i = 0; i < text.length; i += 50) {
          if (w.closed || clientAbort.signal.aborted) return;
          w.send({ type: 'delta', text: text.slice(i, i + 50) });
        }
        w.send({ type: 'meta', mode: 'ai-recovery', model: config.chatModel, requestId, latencyMs: Date.now() - startTime });
        return;
      }
    }
  } catch {
    // Recovery failed
  } finally {
    clearTimeout(recoveryTimer);
    clientAbort.signal.removeEventListener('abort', onClientAbort);
  }

  // Final fallback: catalog sources win over a generic error. This path never
  // invents product facts; it only formats currently available emitted sources.
  if (w.closed || clientAbort.signal.aborted) return;
  if (emitGroundedProductFallback(w, sources, config.chatModel, requestId, startTime)) return;
  w.send({ type: 'error', error: 'در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً دوباره تلاش کنید.' });
  w.send({ type: 'meta', mode: 'deterministic-fallback', model: config.chatModel, requestId, latencyMs: Date.now() - startTime });
}

// ─── Category Filter for Sources ─────────────────────────────────
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

  const filtered = sources.filter(s => {
    const title = (s.title || '').toLowerCase();
    return synonyms.some(syn => title.includes(syn));
  });

  // NEVER return original unrelated sources — return empty if nothing matches
  return filtered;
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
  if (!config.apiKey) return NextResponse.json({ ...status, test: 'fail', reason: 'کلید تنظیم نشده' }, { status: 400 });

  try {
    let doFetch: typeof fetch;
    try { doFetch = await getProxyFetch(config.proxyUrl, config.useProxy); } catch { doFetch = fetch; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await doFetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.chatModel, messages: [{ role: 'user', content: 'سلام' }], max_tokens: 10, stream: false }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const extracted = extractNonStreamContent(data);
      if (extracted.text) return NextResponse.json({ ...status, test: 'ok' });
    }
    return NextResponse.json({ ...status, test: 'fail', reason: `HTTP ${res.status}` }, { status: 502 });
  } catch {
    return NextResponse.json({ ...status, test: 'fail', reason: 'اتصال برقرار نشد' }, { status: 500 });
  }
}
