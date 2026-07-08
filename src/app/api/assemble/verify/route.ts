/**
 * ════════════════════════════════════════════════════════════════
 * 🔌 /api/assemble/verify — بررسی real-time قطعات قبل از نمایش
 * ════════════════════════════════════════════════════════════════
 *
 * استفاده:
 *   POST { partIds: [1, 2, 3] }
 *   Response: { results: [{ id, exists, inStock, price, ... }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyProducts } from '@/lib/ai-chat/api-verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const partIds: (string | number)[] = Array.isArray(body?.partIds) ? body.partIds : [];

    if (partIds.length === 0) {
      return NextResponse.json({ ok: true, results: [] });
    }

    if (partIds.length > 30) {
      return NextResponse.json({ error: 'حداکثر ۳۰ محصول در هر درخواست.' }, { status: 400 });
    }

    const results = await verifyProducts(partIds);

    return NextResponse.json(
      {
        ok: true,
        count: results.length,
        results,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (e) {
    console.error('verify error:', e);
    return NextResponse.json({ error: 'خطا در بررسی محصولات.' }, { status: 500 });
  }
}
