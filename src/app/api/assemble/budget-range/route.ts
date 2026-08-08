import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ASSEMBLY_ENGINE_URL = process.env.ASSEMBLY_ENGINE_URL || 'http://147.45.43.25:20143';

/**
 * Proxy مستقیم به engine — single source of truth
 * GET /api/assemble/budget-range?useCase=gaming
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const useCase = (req.nextUrl.searchParams.get('useCase') || 'gaming').trim() || 'gaming';

  try {
    const res = await fetch(
      `${ASSEMBLY_ENGINE_URL}/budget-range?useCase=${encodeURIComponent(useCase)}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      }
    );

    if (!res.ok) throw new Error(`engine ${res.status}`);

    const data = await res.json();

    // Engine returns: { ok, budget: {min,recommended,max}, presets, min,max,recommended }
    const min = Number(data.min ?? data.budget?.min ?? 15_000_000);
    const max = Number(data.max ?? data.budget?.max ?? 200_000_000);
    const recommended = Number(data.recommended ?? data.budget?.recommended ?? 50_000_000);

    return NextResponse.json(
      {
        ok: true,
        min,
        max,
        recommended,
        presets: data.presets || [],
        perCategory: data.perCategory || [],
        label: data.label || useCase,
        source: 'engine',
      },
      {
        headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=300' },
      }
    );
  } catch (e) {
    console.error('[budget-range proxy] engine failed, fallback:', e);
    // Fallback بر اساس useCase (هماهنگ با PROFILES engine)
    const fallbacks: Record<
      string,
      { min: number; recommended: number; max: number; presets: number[] }
    > = {
      gaming: {
        min: 32_000_000,
        recommended: 75_000_000,
        max: 180_000_000,
        presets: [32_000_000, 45_000_000, 65_000_000, 85_000_000, 120_000_000, 160_000_000],
      },
      office: {
        min: 18_000_000,
        recommended: 28_000_000,
        max: 55_000_000,
        presets: [18_000_000, 22_000_000, 28_000_000, 35_000_000, 45_000_000, 55_000_000],
      },
      editing: {
        min: 38_000_000,
        recommended: 85_000_000,
        max: 220_000_000,
        presets: [38_000_000, 55_000_000, 85_000_000, 120_000_000, 160_000_000, 200_000_000],
      },
      rendering: {
        min: 45_000_000,
        recommended: 110_000_000,
        max: 280_000_000,
        presets: [45_000_000, 70_000_000, 110_000_000, 160_000_000, 220_000_000, 280_000_000],
      },
      streaming: {
        min: 38_000_000,
        recommended: 90_000_000,
        max: 200_000_000,
        presets: [38_000_000, 55_000_000, 90_000_000, 130_000_000, 165_000_000, 200_000_000],
      },
      programming: {
        min: 25_000_000,
        recommended: 55_000_000,
        max: 130_000_000,
        presets: [25_000_000, 38_000_000, 55_000_000, 75_000_000, 100_000_000, 130_000_000],
      },
      server: {
        min: 24_000_000,
        recommended: 60_000_000,
        max: 150_000_000,
        presets: [24_000_000, 40_000_000, 60_000_000, 85_000_000, 115_000_000, 150_000_000],
      },
      home: {
        min: 18_000_000,
        recommended: 32_000_000,
        max: 70_000_000,
        presets: [18_000_000, 25_000_000, 32_000_000, 45_000_000, 58_000_000, 70_000_000],
      },
    };
    const fb = fallbacks[useCase] || fallbacks.gaming;
    return NextResponse.json({
      ok: true,
      ...fb,
      perCategory: [],
      fallback: true,
      source: 'fallback',
    });
  }
}
