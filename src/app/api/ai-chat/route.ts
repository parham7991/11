/**
 * /api/ai-chat — Proxy ساده به OFFL AI Engine (نسخه robust)
 * ──────────────────────────────────────────────────────────────────
 * همه processing سمت سرور OmniRouter انجام میشه
 * Vercel فقط proxy می‌کنه
 * ──────────────────────────────────────────────────────────────────
 */

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

const OFFL_AI_ENGINE_URL = process.env.OFFL_AI_ENGINE_URL || 'http://147.45.43.25:20142';

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = `vercel-${Date.now()}`;
  console.log(`[${requestId}] Proxy request to OFFL AI Engine`);

  try {
    const engineUrl = `${OFFL_AI_ENGINE_URL}/chat`;
    
    // Get request body
    const body = await req.text();
    console.log(`[${requestId}] Body length: ${body.length}`);

    // Forward to OFFL AI Engine
    const engineRes = await fetch(engineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': req.headers.get('x-forwarded-for') || 'unknown',
        'X-Request-Id': requestId,
      },
      body: body,
      signal: AbortSignal.timeout(55_000), // 55s timeout
    });

    console.log(`[${requestId}] Engine response: ${engineRes.status}`);

    if (!engineRes.ok) {
      const errorText = await engineRes.text();
      console.error(`[${requestId}] Engine error: ${errorText}`);
      return new Response(
        JSON.stringify({ 
          type: 'error', 
          error: `خطای سرور: ${engineRes.status}` 
        }),
        { 
          status: engineRes.status, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if response is streaming
    const contentType = engineRes.headers.get('content-type') || '';
    console.log(`[${requestId}] Content-Type: ${contentType}`);

    // Stream response back
    if (!engineRes.body) {
      console.error(`[${requestId}] No response body`);
      return new Response(
        JSON.stringify({ type: 'error', error: 'پاسخ خالی از سرور' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Streaming response`);
    
    return new Response(engineRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-transform',
        'X-Request-Id': engineRes.headers.get('X-Request-Id') || requestId,
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    console.error(`[${requestId}] Proxy error:`, err);
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        type: 'error', 
        error: `خطا در ارتباط با سرور: ${errorMessage}` 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function GET(): Promise<Response> {
  return Response.json({ 
    ok: true, 
    service: 'offl-ai-chat-proxy',
    engine: OFFL_AI_ENGINE_URL,
    timestamp: new Date().toISOString(),
  });
}
