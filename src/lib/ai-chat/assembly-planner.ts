/**
 * assembly-planner.ts — Global AI planner for smart assembly
 * ──────────────────────────────────────────────────────────────────
 * Makes ONE AI call to plan the entire build, instead of per-category.
 *
 * Flow:
 *   1. Gather candidates
 *   2. Pre-filter invalid products
 *   3. Build FULL_BUILD_PLAN_V2 request
 *   4. Single AI call → offl-assemble-elite
 *   5. Parse structured output
 *   6. Validate IDs, quantities, compatibility, budget
 *   7. Local repair for invalid selections
 *   8. Max 1 recovery call for unresolved categories
 *
 * Maximum AI calls per assembly: 3 (1 plan + 1 recovery + 1 analysis)
 */

import { aiNonStreamRequest, type AiClientOptions, type AiMeta } from './ai-client';
import { AiError, AiErrorCode } from './ai-errors';
import type { AssemblyPart, CategoryCandidates } from './assembler';

// ─── Types ───────────────────────────────────────────────────────

export interface PlannerCandidate {
  id: string | number;
  name: string;
  shortSpec: string;
  price: number;
  finalPrice: number;
  category: string;
  inStock: boolean;
  confidence: number;
  specs?: Record<string, unknown>;
}

export interface PlannerSelection {
  category: string;
  id: string | number;
  quantity: number;
  reason: string;
}

export interface PlannerResult {
  selections: PlannerSelection[];
  summary: string;
  meta: AiMeta;
}

export interface FullBuildPlanResponse {
  selections: PlannerSelection[];
  summary: string;
}

// ─── Build Prompt ────────────────────────────────────────────────

function buildPlannerPrompt(
  useCase: string,
  useCaseLabel: string,
  budget: number,
  remainingBudget: number,
  candidates: Map<string, PlannerCandidate[]>,
  pickedParts: PlannerSelection[],
  customNote?: string
): string {
  const useCaseFa: Record<string, string> = {
    gaming: 'گیمینگ',
    office: 'اداری',
    editing: 'ادیت و رندر',
    streaming: 'استریم',
    custom: 'دلخواه',
  };

  const pickedText =
    pickedParts.length > 0
      ? pickedParts.map((p) => `- ${p.category}: ID=${p.id} (quantity: ${p.quantity})`).join('\n')
      : '(هنوز قطعه‌ای انتخاب نشده)';

  const candidateTexts: string[] = [];
  for (const [category, items] of candidates.entries()) {
    if (items.length === 0) continue;
    candidateTexts.push(`\n### ${category} (${items.length} گزینه)`);
    for (const c of items.slice(0, 15)) {
      candidateTexts.push(
        `  ID=${c.id} | ${c.name} | ${c.shortSpec || '-'} | ${c.finalPrice.toLocaleString('en')} | stock:${c.inStock}`
      );
    }
  }

  return `Return only raw JSON. No Markdown. No code fence. No explanation outside JSON.

You are planning a PC build for: "${useCaseFa[useCase] || useCaseLabel}"
Total budget: ${budget.toLocaleString('en')} Toman
Remaining budget: ${remainingBudget.toLocaleString('en')} Toman
${customNote ? `User note: ${customNote}` : ''}

Already selected parts:
${pickedText}

Categories to fill: ${Array.from(candidates.keys()).join(', ')}

Available candidates:
${candidateTexts.join('\n')}

Rules:
1. Select exactly ONE candidate per category from the IDs listed above.
2. Each selection must be compatible with previously selected parts.
3. Total cost must not exceed remaining budget.
4. Prioritize: stock availability > compatibility > value for money.
5. For gaming: prioritize GPU/VRAM, then CPU cores, then RAM.
6. For editing: prioritize CPU cores/threads, then RAM, then NVMe storage.
7. For office: prioritize value and low power.
8. CPU socket MUST match motherboard socket.
9. RAM DDR type MUST match motherboard support.
10. PSU must have 30%+ headroom above CPU+GPU TDP.
11. GPU must fit in case (length/thickness).
12. Cooler must match CPU socket and fit in case height.

Return this exact JSON structure:
{
  "selections": [
    {
      "category": "cpu",
      "id": "exact-id-from-candidates",
      "quantity": 1,
      "reason": "short reason"
    }
  ],
  "summary": "short build summary"
}`;
}

// ─── Parse AI Response ───────────────────────────────────────────

export function parsePlannerResponse(
  raw: string,
  validCandidates: Map<string, PlannerCandidate[]>
): FullBuildPlanResponse {
  let json: Record<string, unknown>;

  // Try direct parse
  try {
    json = JSON.parse(raw);
  } catch {
    // Try to extract JSON from code fence
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        json = JSON.parse(fenceMatch[1].trim());
      } catch {
        throw new AiError(AiErrorCode.INVALID_RESPONSE, 'Failed to parse planner response JSON');
      }
    } else {
      // Try to find JSON object in text
      const objMatch = raw.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          json = JSON.parse(objMatch[0]);
        } catch {
          throw new AiError(AiErrorCode.INVALID_RESPONSE, 'Failed to parse planner response JSON');
        }
      } else {
        throw new AiError(AiErrorCode.INVALID_RESPONSE, 'No JSON found in planner response');
      }
    }
  }

  // Handle selectedParts format (Arena Agent may use this)
  let rawSelections: unknown[] = [];
  if (Array.isArray(json.selections)) {
    rawSelections = json.selections;
  } else if (json.selectedParts && typeof json.selectedParts === 'object') {
    // Convert selectedParts object to selections array
    const sp = json.selectedParts as Record<string, unknown>;
    rawSelections = Object.entries(sp).map(([category, value]) => {
      if (typeof value === 'object' && value !== null) {
        const v = value as Record<string, unknown>;
        return { category, id: v.id, quantity: v.quantity || 1, reason: v.reason || '' };
      }
      return { category, id: value, quantity: 1, reason: '' };
    });
  }

  if (!Array.isArray(rawSelections)) {
    throw new AiError(AiErrorCode.INVALID_RESPONSE, 'No selections array in planner response');
  }

  // Normalize and validate selections
  const selections: PlannerSelection[] = [];
  const seenCategories = new Set<string>();

  for (const raw of rawSelections) {
    if (!raw || typeof raw !== 'object') continue;
    const sel = raw as Record<string, unknown>;

    const category = String(sel.category || '')
      .trim()
      .toLowerCase();
    if (!category) continue;

    // Skip duplicate categories (keep first)
    if (seenCategories.has(category)) continue;
    seenCategories.add(category);

    // Get candidate pool for this category
    const pool = validCandidates.get(category) || [];

    // ID can be string or number — compare exactly
    const rawId = sel.id;
    let matchedId: string | number | null = null;

    if (typeof rawId === 'string') {
      // Try exact string match first
      const found = pool.find((c) => String(c.id) === rawId);
      if (found) matchedId = found.id;
    } else if (typeof rawId === 'number') {
      // Try exact number match
      const found = pool.find((c) => c.id === rawId);
      if (found) matchedId = found.id;
    }

    // Unknown ID → skip (will be repaired locally)
    if (matchedId === null) continue;

    const quantity = Math.max(1, Math.min(10, Number(sel.quantity) || 1));
    const reason = String(sel.reason || '').slice(0, 200);

    selections.push({ category, id: matchedId, quantity, reason });
  }

  const summary = String(json.summary || '').slice(0, 500);

  return { selections, summary };
}

// ─── Main Planner Function ───────────────────────────────────────

export async function planFullBuild(
  clientOptions: AiClientOptions,
  useCase: string,
  useCaseLabel: string,
  budget: number,
  remainingBudget: number,
  categories: CategoryCandidates[],
  pickedParts: PlannerSelection[],
  customNote?: string,
  abortSignal?: AbortSignal
): Promise<PlannerResult> {
  // Build candidate map
  const candidateMap = new Map<string, PlannerCandidate[]>();
  for (const cat of categories) {
    const candidates = cat.candidates
      .filter((c) => c.inStock && c.finalPrice > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        shortSpec: c.shortSpec || '',
        price: c.price,
        finalPrice: c.finalPrice,
        category: cat.category,
        inStock: c.inStock,
        confidence: c.confidence || 0,
        specs: c.specs,
      }));
    if (candidates.length > 0) {
      candidateMap.set(cat.category, candidates);
    }
  }

  // Skip categories that already have picked parts
  for (const picked of pickedParts) {
    candidateMap.delete(picked.category);
  }

  if (candidateMap.size === 0) {
    return { selections: [], summary: 'All categories already selected', meta: {} as AiMeta };
  }

  // Build prompt
  const userPrompt = buildPlannerPrompt(
    useCase,
    useCaseLabel,
    budget,
    remainingBudget,
    candidateMap,
    pickedParts,
    customNote
  );

  const messages = [
    {
      role: 'system' as const,
      content:
        'You are a PC hardware expert. Return ONLY valid JSON matching the exact schema requested. No markdown, no explanation.',
    },
    { role: 'user' as const, content: userPrompt },
  ];

  // Single AI call with timeout
  const opts: AiClientOptions = {
    ...clientOptions,
    temperature: 0.1,
    maxTokens: 2000,
    timeoutMs: 35_000,
  };

  const result = await aiNonStreamRequest(opts, messages, abortSignal);

  // Parse and validate
  const parsed = parsePlannerResponse(result.text, candidateMap);

  return {
    selections: parsed.selections,
    summary: parsed.summary,
    meta: result.meta,
  };
}
