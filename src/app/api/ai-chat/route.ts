/**
 * /api/ai-chat — Resilient AI chat with guaranteed grounded response
 * ──────────────────────────────────────────────────────────────────
 * Architecture:
 *   1. Build RAG context FIRST (always)
 *   2. Try streaming AI request
 *   3. If empty → non-stream recovery
 *   4. If still empty → ALWAYS use RAG fallback (never show "no response")
 *
 * Key principle: User ALWAYS gets a response, even if AI fails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiChatConfig, sanitizePrompt } from '@/lib/ai-chat/config';
import { buildRagContext } from '@/lib/ai-chat/rag';
import { getProxyFetch } from '@/lib/ai-chat/proxy-fetch';
import { SseParser, extractNonStreamContent } from '@/lib/ai-chat/sse-parser';
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

// ─── Deterministic RAG Fallback (ALWAYS returns something if sources exist) ───
function buildDeterministicFallback(sources: ChatSource[], userQuery: string): string {
  if (!sources || sources.length === 0) {
    return 'متأسفانه محصولی مرتبط با درخواست شما پیدا نشد. لطفاً کلمات دیگری را امتحان کنید یا مستقیماً از بخش محصولات سایت بازدید کنید.';
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

// ════════════════════════════════════════════════════════════════
// MAIN POST HANDLER
// ════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest): Promise<Response> {
  const config = getAiChatConfig();
  const encoder = new TextEncoder();

  // ─── Config checks ───────────────────────────────────────
  if (!config.enabled) {
    return jsonError('دستیار هوشمند غیرفعال است.', 403);
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

  // ─── Rate limit ──────────────────────────────────────────
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return jsonError('درخواست‌های زیاد. لطفاً کمی بعد دوباره تلاش کنید.', 429);
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

  // ═══════ STEP 1: ALWAYS build RAG context first ═══════════
  let context = '';
  let sources: ChatSource[] = [];
  try {
    const rag = await buildRagContext(message, config.ragCount);
    context = rag.context;
    sources = rag.sources;
    console.log(`[ai-chat] RAG found ${sources.length} products`);
  } catch (err) {
    console.warn('[ai-chat] RAG failed:', err instanceof Error ? err.message : 'unknown');
  }

  // ═══════ STEP 2: If no API key, use RAG fallback immediately ═══════
  if (!config.apiKey) {
    console.warn('[ai-chat] No API key — using RAG fallback');
    const fallbackText =
      sources.length > 0
        ? buildDeterministicFallback(sources, message)
        : 'دستیار هوشمند آفلند در حال حاضر به سرویس AI متصل نیست. لطفاً از متخصص فروشگاه راهنمایی بگیرید.';

    return new Response(
      new ReadableStream({
        async start(controller) {
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

  // ─── Build messages for AI ─────────────────────────────────
  const systemContent = context ? `${config.systemPrompt}\n\n${context}` : config.systemPrompt;
  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: message },
  ];

  // ─── Get fetch function ────────────────────────────────────
  let doFetch: typeof fetch;
  try {
    doFetch = await getProxyFetch(config.proxyUrl, config.useProxy);
  } catch {
    doFetch = fetch;
  }

  // ═══════ STEP 3: Try streaming AI request ═══════════════════
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const aiRes = await doFetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle HTTP errors
    if (!aiRes.ok || !aiRes.body) {
      console.error(`[ai-chat] AI request failed: HTTP ${aiRes.status}`);

      // Use RAG fallback
      if (sources.length > 0) {
        const fallbackText = buildDeterministicFallback(sources, message);
        return new Response(
          new ReadableStream({
            async start(ctrl) {
              ctrl.enqueue(encoder.encode(JSON.stringify({ type: 'sources', sources }) + '\n'));
              ctrl.enqueue(
                encoder.encode(JSON.stringify({ type: 'delta', text: fallbackText }) + '\n')
              );
              ctrl.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
              ctrl.close();
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

      return jsonError(
        'مشکلی در اتصال به سرویس هوش مصنوعی پیش آمد. لطفاً دوباره تلاش کنید.',
        502,
        sources
      );
    }

    // ═══════ STEP 4: Stream SSE to client ═══════════════════
    const parser = new SseParser();
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();
    let gotContent = false;
    let fullText = '';

    const stream = new ReadableStream({
      async start(ctrl) {
        // Send sources first
        ctrl.enqueue(encoder.encode(JSON.stringify({ type: 'sources', sources }) + '\n'));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const raw = decoder.decode(value, { stream: true });
            parser.feed(raw);

            const events = parser.drain();
            for (const evt of events) {
              if (evt.type === 'delta' && evt.content) {
                gotContent = true;
                fullText += evt.content;
                ctrl.enqueue(
                  encoder.encode(JSON.stringify({ type: 'delta', text: evt.content }) + '\n')
                );
              }
            }
          }

          // Process remaining buffer
          parser.end();
          const finalEvents = parser.drain();
          for (const evt of finalEvents) {
            if (evt.type === 'delta' && evt.content) {
              gotContent = true;
              fullText += evt.content;
              ctrl.enqueue(
                encoder.encode(JSON.stringify({ type: 'delta', text: evt.content }) + '\n')
              );
            }
          }

          // ═══════ STEP 5: If no content, try non-stream recovery ═══════
          if (!gotContent) {
            console.warn('[ai-chat] Stream empty — trying non-stream recovery');

            const recoveryController = new AbortController();
            const recoveryTimeout = setTimeout(() => recoveryController.abort(), 30_000);

            try {
              const recoveryRes = await doFetch(`${config.apiBase}/chat/completions`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                  model: config.model,
                  messages,
                  temperature: config.temperature,
                  max_tokens: config.maxTokens,
                  stream: false,
                }),
                signal: recoveryController.signal,
              });

              clearTimeout(recoveryTimeout);

              if (recoveryRes.ok) {
                const data = await recoveryRes.json();
                const extracted = extractNonStreamContent(data);

                if (extracted.text && extracted.text.trim()) {
                  console.log('[ai-chat] Recovery succeeded');
                  // Send as chunks for typing effect
                  const text = extracted.text.trim();
                  for (let i = 0; i < text.length; i += 50) {
                    ctrl.enqueue(
                      encoder.encode(
                        JSON.stringify({ type: 'delta', text: text.slice(i, i + 50) }) + '\n'
                      )
                    );
                  }
                  ctrl.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
                  ctrl.close();
                  return;
                }
              }
            } catch (err) {
              console.warn(
                '[ai-chat] Recovery failed:',
                err instanceof Error ? err.message : 'unknown'
              );
            }

            // ═══════ STEP 6: ALWAYS use RAG fallback (never show "no response") ═══════
            console.warn('[ai-chat] AI empty — using RAG fallback');
            if (sources.length > 0) {
              const fallbackText = buildDeterministicFallback(sources, message);
              for (let i = 0; i < fallbackText.length; i += 50) {
                ctrl.enqueue(
                  encoder.encode(
                    JSON.stringify({ type: 'delta', text: fallbackText.slice(i, i + 50) }) + '\n'
                  )
                );
              }
            } else {
              ctrl.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'error',
                    error:
                      'متأسفانه در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً مستقیماً از محصولات سایت بازدید کنید.',
                  }) + '\n'
                )
              );
            }
          }

          ctrl.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
        } catch (err) {
          console.error('[ai-chat] Stream error:', err);
          // Even on error, send RAG fallback if available
          if (sources.length > 0) {
            const fallbackText = buildDeterministicFallback(sources, message);
            ctrl.enqueue(
              encoder.encode(JSON.stringify({ type: 'delta', text: fallbackText }) + '\n')
            );
          } else {
            ctrl.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'error',
                  error: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.',
                }) + '\n'
              )
            );
          }
        } finally {
          try {
            reader.releaseLock();
          } catch {
            /* ignore */
          }
          ctrl.close();
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    clearTimeout(timeout);
    console.error('[ai-chat] Fatal error:', err);

    // LAST RESORT: RAG fallback
    if (sources.length > 0) {
      const fallbackText = buildDeterministicFallback(sources, message);
      return new Response(
        new ReadableStream({
          async start(ctrl) {
            ctrl.enqueue(encoder.encode(JSON.stringify({ type: 'sources', sources }) + '\n'));
            ctrl.enqueue(
              encoder.encode(JSON.stringify({ type: 'delta', text: fallbackText }) + '\n')
            );
            ctrl.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
            ctrl.close();
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

    return jsonError('خطای غیرمنتظره رخ داد. لطفاً دوباره تلاش کنید.', 500, sources);
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
    model: config.model,
    rag: config.enableRag,
  };

  if (!doTest) {
    return NextResponse.json(status);
  }

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
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const extracted = extractNonStreamContent(data);
      if (extracted.text) {
        return NextResponse.json({ ...status, test: 'ok' });
      }
    }

    return NextResponse.json(
      { ...status, test: 'fail', reason: `HTTP ${res.status}` },
      { status: 502 }
    );
  } catch (e) {
    return NextResponse.json(
      { ...status, test: 'fail', reason: 'اتصال برقرار نشد' },
      { status: 500 }
    );
  }
}
