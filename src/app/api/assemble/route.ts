/**
 * /api/assemble — Proxy به OFFL Assembly Engine
 * ──────────────────────────────────────────────────────────────────
 * این route فقط proxy می‌کنه به Assembly Engine روی سرور OmniRouter
 * همه processing سمت سرور انجام میشه
 * ──────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLY_ENGINE_URL = process.env.ASSEMBLY_ENGINE_URL || 'http://147.45.43.25:20143';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    
    const response = await fetch(`${ASSEMBLY_ENGINE_URL}/assemble`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': req.headers.get('x-forwarded-for') || 'unknown'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000)
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { ok: false, error: `Assembly Engine error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[assemble] Proxy error:', err);
    return NextResponse.json(
      { ok: false, error: 'خطا در ارتباط با سرور اسمبل' },
      { status: 500 }
    );
  }
}
