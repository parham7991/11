/**
 * /api/assemble/budget-range — بازهٔ بودجهٔ پیشنهادی برای یک کاربری
 * با توجه به قطعات واقعیِ موجود در فروشگاه، حداقل/حداکثر و مقدار پیشنهادی
 * بودجه را برمی‌گرداند تا اسلایدر بودجه پویا و واقعی باشد.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBudgetRange } from '@/lib/ai-chat/assembler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const useCase = (req.nextUrl.searchParams.get('useCase') || 'gaming').trim();
  const includeCooler = true;
  try {
    const range = await getBudgetRange(useCase, includeCooler);
    // اگر داده‌ای نبود، یک بازهٔ پیش‌فرض منطقی بده
    if (!range.max || range.max <= range.min) {
      return NextResponse.json({
        ok: true,
        min: 10_000_000,
        max: 200_000_000,
        recommended: 35_000_000,
        perCategory: range.perCategory ?? [],
        fallback: true,
      });
    }
    return NextResponse.json(
      { ok: true, ...range },
      {
        headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' },
      }
    );
  } catch (e) {
    console.error('budget-range error:', e);
    return NextResponse.json({
      ok: false,
      min: 10_000_000,
      max: 200_000_000,
      recommended: 35_000_000,
      perCategory: [],
      fallback: true,
    });
  }
}
