/**
 * /api/ai-chat — مسیر امن دستیار هوشمند آفلند
 * ──────────────────────────────────────────────────────────────────
 * این route سمت سرور اجرا می‌شود؛ پس:
 *   - کلید API هیچ‌وقت به مرورگر فاش نمی‌شود
 *   - ابتدا با RAG محصولات مرتبط آفلند را پیدا می‌کند
 *   - سپس درخواست را به سرویس سازگار با OpenAI می‌فرستد
 *   - پاسخ + منابع (کارت محصول) را به کلاینت برمی‌گرداند
 * ──────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiChatConfig } from '@/lib/ai-chat/config';
import { buildRagContext } from '@/lib/ai-chat/rag';
import { getProxyFetch } from '@/lib/ai-chat/proxy-fetch';
import type { ChatMessage, ChatRequestBody, ChatResponse } from '@/lib/ai-chat/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** محدودیت ساده‌ی نرخ درخواست در حافظه (برای جلوگیری از سوءاستفاده) */
const RATE_LIMIT_WINDOW_MS = 60_000; // یک دقیقه
const RATE_LIMIT_MAX = 15; // حداکثر ۱۵ درخواست در دقیقه برای هر IP
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

/** پاسخ خطای استاندارد JSON */
function jsonError(
  error: string,
  status: number,
  sources: ChatResponse['sources'] = []
): NextResponse<ChatResponse> {
  return NextResponse.json({ reply: '', sources, error }, { status });
}

export async function POST(req: NextRequest): Promise<Response> {
  const config = getAiChatConfig();

  if (!config.enabled) {
    return jsonError('دستیار هوشمند غیرفعال است.', 403);
  }

  if (!config.apiKey) {
    return jsonError('کلید سرویس هوش مصنوعی تنظیم نشده است.', 500);
  }

  // محدودیت نرخ
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return jsonError('درخواست‌های زیاد. لطفاً کمی بعد دوباره تلاش کنید.', 429);
  }

  // خواندن بدنه
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return jsonError('درخواست نامعتبر است.', 400);
  }

  const message = String(body?.message || '')
    .trim()
    .slice(0, 1000);
  if (!message) {
    return jsonError('پیام خالی است.', 400);
  }

  // تاریخچه (محدود به ۸ پیام آخر برای کنترل هزینه)
  const history: ChatMessage[] = Array.isArray(body?.history)
    ? body.history
        .filter(
          (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
        )
        .slice(-8)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
    : [];

  // ساخت بافت RAG
  let context = '';
  let sources: ChatResponse['sources'] = [];
  if (config.enableRag) {
    try {
      const rag = await buildRagContext(message, config.ragCount);
      context = rag.context;
      sources = rag.sources;
    } catch {
      // در صورت خطای RAG، چت بدون بافت ادامه می‌یابد
    }
  }

  // ساخت پیام‌ها برای مدل
  const systemContent = context ? `${config.systemPrompt}\n\n${context}` : config.systemPrompt;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: message },
  ];

  // فراخوانی سرویس سازگار با OpenAI به‌صورت استریم (تایپ زنده)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    // fetch با پشتیبانی از پروکسی SOCKS5/HTTP (در صورت فعال‌بودن)
    const doFetch = await getProxyFetch(config.proxyUrl, config.useProxy);

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

    if (!aiRes.ok || !aiRes.body) {
      clearTimeout(timeout);
      const errText = await aiRes.text().catch(() => '');
      console.error('AI provider error:', aiRes.status, errText.slice(0, 300));
      // پیام خطای عمومی — جزئیات فنی (مثل نامعتبر بودن API key) به کاربر نشان داده نمی‌شود
      let msg = 'مشکلی پیش آمده. لطفاً دوباره تلاش کنید.';
      if (aiRes.status === 404) {
        msg = 'مدل یا آدرس سرویس یافت نشد. نام مدل/سرویس را بررسی کن.';
      } else if (aiRes.status === 429) {
        msg = 'محدودیت سرویس هوش مصنوعی. کمی بعد دوباره تلاش کن.';
      }
      return jsonError(msg, 502, sources);
    }

    // پاسخ را به‌صورت stream از نوع NDJSON به کلاینت می‌فرستیم:
    //   خط اول:  {"type":"sources","sources":[...]}
    //   خطوط بعد: {"type":"delta","text":"..."}
    //   خط آخر:  {"type":"done"}
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const upstream = aiRes.body.getReader();

    const stream = new ReadableStream({
      async start(streamController) {
        // ابتدا منابع را بفرست
        streamController.enqueue(
          encoder.encode(JSON.stringify({ type: 'sources', sources }) + '\n')
        );

        let buffer = '';
        let gotAny = false;
        try {
          while (true) {
            const { done, value } = await upstream.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // پاسخ OpenAI به‌صورت SSE است: خطوط "data: {...}"
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === '[DONE]') continue;
              try {
                const json = JSON.parse(payload);
                const delta: string = json?.choices?.[0]?.delta?.content || '';
                if (delta) {
                  gotAny = true;
                  streamController.enqueue(
                    encoder.encode(JSON.stringify({ type: 'delta', text: delta }) + '\n')
                  );
                }
              } catch {
                // خطوط ناقص را نادیده بگیر
              }
            }
          }

          if (!gotAny) {
            streamController.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'delta',
                  text: 'متأسفانه نتوانستم پاسخ مناسبی تولید کنم.',
                }) + '\n'
              )
            );
          }
          streamController.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
        } catch (err) {
          streamController.enqueue(
            encoder.encode(
              JSON.stringify({ type: 'error', error: 'ارتباط با سرویس قطع شد.' }) + '\n'
            )
          );
        } finally {
          clearTimeout(timeout);
          streamController.close();
        }
      },
      cancel() {
        upstream.cancel().catch(() => {});
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
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    console.error('AI chat fetch failed:', e);
    return jsonError(
      aborted ? 'زمان پاسخ‌گویی به پایان رسید. دوباره تلاش کنید.' : 'خطای غیرمنتظره رخ داد.',
      500,
      sources
    );
  }
}

/**
 * GET /api/ai-chat — بررسی وضعیت و تست اتصال
 * بدون فاش‌کردن کلید، فقط می‌گوید سرویس فعال است یا نه و کدام مدل/سرویس.
 * با ?test=1 یک درخواست واقعی کوچک به سرویس می‌زند تا اتصال را تأیید کند.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const config = getAiChatConfig();
  const url = new URL(req.url);
  const doTest = url.searchParams.get('test') === '1';

  const status = {
    enabled: config.enabled,
    hasKey: Boolean(config.apiKey),
    provider: config.providerName,
    model: config.model,
    rag: config.enableRag,
  };

  if (!doTest) {
    return NextResponse.json(status);
  }

  // تست واقعی اتصال
  if (!config.apiKey) {
    return NextResponse.json(
      { ...status, test: 'fail', reason: 'کلید تنظیم نشده' },
      { status: 400 }
    );
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const doFetch = await getProxyFetch(config.proxyUrl, config.useProxy);
    const res = await doFetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'سلام' }],
        max_tokens: 5,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      return NextResponse.json({ ...status, test: 'ok' });
    }
    const txt = await res.text().catch(() => '');
    return NextResponse.json(
      { ...status, test: 'fail', reason: `HTTP ${res.status}`, detail: txt.slice(0, 200) },
      { status: 502 }
    );
  } catch (e) {
    return NextResponse.json(
      { ...status, test: 'fail', reason: 'اتصال برقرار نشد' },
      { status: 500 }
    );
  }
}
