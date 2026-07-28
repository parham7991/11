/**
 * /api/assemble/ai-pick — Legacy wrapper (kept for backward compatibility)
 * ──────────────────────────────────────────────────────────────────
 * This route is now a thin wrapper. The main assembly flow uses
 * the global planner in assembly-planner.ts directly.
 * This endpoint may still be called by older clients.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiChatConfig } from '@/lib/ai-chat/config';
import { validatePartCategory } from '@/lib/ai-chat/guardrails';
import { pickBestCoolerEconomical } from '@/lib/ai-chat/assembler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PartCandidate = {
  id: number | string;
  name: string;
  shortSpec?: string;
  specs?: Record<string, any>;
  price: number;
  finalPrice: number;
  confidence?: number;
  brand?: string | null;
  category: string;
  inStock?: boolean;
};

type PickRequest = {
  useCase: string;
  budget: number;
  remainingBudget: number;
  pickedParts: PartCandidate[];
  category: string;
  categoryLabel: string;
  budgetShare: number;
  priceRange?: { min: number; max: number; ideal: number; note?: string };
  candidates: PartCandidate[];
  maxPick: number;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as PickRequest;

    // Guardrail filter
    const cleanCandidates = body.candidates.filter((c) => {
      const r = validatePartCategory(body.category, {
        title: c.name,
        name: c.name,
        price: c.price,
        finalPrice: c.finalPrice,
        specs: c.specs || {},
      });
      return r.passed;
    });

    // Cooler economic engine
    if (body.category === 'cooler' && cleanCandidates.length > 0) {
      const selectedCpu = body.pickedParts.find((p) => p.category === 'cpu');
      const economical = pickBestCoolerEconomical(cleanCandidates as any, selectedCpu as any);
      if (economical) {
        return NextResponse.json({
          ok: true,
          aiEnabled: false,
          picks: [economical],
          method: 'cooler-economic-engine',
          reason: (economical as any).pickReason || 'Cooler economical selection',
        });
      }
    }

    // Rule-based pick (AI is now done by global planner)
    return NextResponse.json({
      ok: true,
      aiEnabled: false,
      picks: ruleBasedPick({
        ...body,
        candidates: cleanCandidates.length ? cleanCandidates : body.candidates,
      }),
      method: 'rule-based',
      guardrailFilteredCount: body.candidates.length - cleanCandidates.length,
    });
  } catch (e) {
    console.error('ai-pick error:', e);
    return NextResponse.json({ error: 'خطا در انتخاب AI.' }, { status: 500 });
  }
}

function ruleBasedPick(body: PickRequest): PartCandidate[] {
  const targetPrice = body.priceRange?.ideal || body.budgetShare;
  const minPrice = Math.max(0, (body.priceRange?.min || 0) * 0.75);
  const maxPrice = Math.min(
    body.remainingBudget * 1.05,
    body.priceRange?.max || body.remainingBudget * 1.05
  );

  const valid = body.candidates.filter(
    (c) =>
      c.inStock !== false &&
      c.finalPrice > 0 &&
      c.finalPrice >= minPrice &&
      c.finalPrice <= maxPrice
  );

  if (valid.length === 0) {
    return [
      body.candidates
        .filter(
          (c) => c.inStock !== false && c.finalPrice > 0 && c.finalPrice <= body.remainingBudget
        )
        .sort(
          (a, b) => Math.abs(a.finalPrice - targetPrice) - Math.abs(b.finalPrice - targetPrice)
        )[0],
    ].filter(Boolean);
  }

  const scored = valid.map((c) => ({
    part: c,
    score:
      Number(c.confidence || 50) -
      Math.min(30, (Math.abs(c.finalPrice - targetPrice) / Math.max(1, targetPrice)) * 20),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, body.maxPick).map((s) => s.part);
}
