/**
 * /api/ai-chat — Proxy ساده به OFFL AI Engine
 * ──────────────────────────────────────────────────────────────────
 * همه processing سمت سرور OmniRouter انجام میشه:
 * - Intent Classification
 * - RAG (جستجو در محصولات)
 * - AI Call
 * - Streaming NDJSON Response
 *
 * Vercel فقط proxy می‌کنه → سرعت خیلی بالا!
 * ──────────────────────────────────────────────────────────────────
 */

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OFFL_AI_ENGINE_URL = process.env.OFFL_AI_ENGINE_URL || 'http://147.45.43.25:20142';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Proxy request به OFFL AI Engine
    const engineUrl = `${OFFL_AI_ENGINE_URL}/chat`;

    const engineRes = await fetch(engineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For':
          req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      },
      body: await req.text(),
      signal: req.signal,
    });

    // Stream response back
    return new Response(engineRes.body, {
      status: engineRes.status,
      headers: {
        'Content-Type':
          engineRes.headers.get('Content-Type') || 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Request-Id': engineRes.headers.get('X-Request-Id') || '',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[ai-chat] Proxy error:', err);
    return new Response(
      JSON.stringify({
        type: 'error',
        error: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(): Promise<Response> {
  return Response.json({
    ok: true,
    service: 'offl-ai-chat-proxy',
    engine: OFFL_AI_ENGINE_URL,
  });
}
