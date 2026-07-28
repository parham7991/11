/**
 * /api/assemble — Smart Assembly v5 with Global AI Planner
 * ──────────────────────────────────────────────────────────────────
 * Architecture:
 *   1. Gather candidates from API
 *   2. Verify stock/price
 *   3. Global AI planner (ONE call to offl-assemble-elite)
 *   4. Parse + validate IDs against candidates
 *   5. Local repair for invalid/incompatible selections
 *   6. Auto-resolve remaining issues
 *   7. Final compatibility check
 *   8. Final AI analysis (ONE call to offl-chat-elite)
 *
 * Maximum AI calls: 3 (1 plan + 1 recovery + 1 analysis)
 * No per-category AI calls. No self HTTP calls.
 * ──────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  gatherCandidates,
  summarize,
  USE_CASES,
  selectPartsForBuild,
  determineTier,
  generateDescription,
  generateSystemRecommendation,
  pickBestCoolerEconomical,
  type AssemblyPart,
  type CategoryCandidates,
} from '@/lib/ai-chat/assembler';
import { isGenuineCpuCooler, validatePartCategory } from '@/lib/ai-chat/guardrails';
import { checkFullCompatibility } from '@/lib/ai-chat/compatibility-checker';
import { verifyProducts } from '@/lib/ai-chat/api-verify';
import { autoResolve } from '@/lib/ai-chat/auto-resolver';
import { getAiChatConfig } from '@/lib/ai-chat/config';
import {
  aiNonStreamRequest,
  generateRequestId,
  type AiClientOptions,
  type AiMeta,
} from '@/lib/ai-chat/ai-client';
import {
  planFullBuild,
  parsePlannerResponse,
  type PlannerCandidate,
  type PlannerSelection,
} from '@/lib/ai-chat/assembly-planner';
import { AiError, AiErrorCode } from '@/lib/ai-chat/ai-errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  useCase?: string;
  budget?: number;
  note?: string;
  customDesc?: string;
  includeOptional?: boolean;
  verifyStock?: boolean;
};

// ─── AI Metadata (real, not hardcoded) ───────────────────────────
interface AssemblyAiMeta {
  requested: boolean;
  planningSucceeded: boolean;
  planningModel: string | null;
  planningCombo: string;
  planningLatencyMs: number;
  recoveryUsed: boolean;
  finalAnalysisUsed: boolean;
  finalAnalysisModel: string | null;
  fallbackReason: string | null;
  selectedByAi: string[];
  repairedLocally: string[];
  totalAiCalls: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const config = getAiChatConfig();

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'درخواست نامعتبر.' }, { status: 400 });
  }

  const rawUseCase = String(body?.useCase || 'gaming');
  const customDesc = String(body?.customDesc || '')
    .slice(0, 300)
    .trim();
  const useCaseKey = rawUseCase === 'custom' ? 'gaming' : rawUseCase;
  const budget = Math.max(5_000_000, Math.min(2_000_000_000, Number(body?.budget) || 30_000_000));
  const note = String(body?.note || '').slice(0, 400);
  const verifyStock = body?.verifyStock !== false;

  // AI metadata
  const aiMeta: AssemblyAiMeta = {
    requested: Boolean(config.apiKey),
    planningSucceeded: false,
    planningModel: null,
    planningCombo: 'offl-assemble-elite',
    planningLatencyMs: 0,
    recoveryUsed: false,
    finalAnalysisUsed: false,
    finalAnalysisModel: null,
    fallbackReason: null,
    selectedByAi: [],
    repairedLocally: [],
    totalAiCalls: 0,
  };

  console.log(`[assembly] [${requestId}] Start: useCase=${useCaseKey} budget=${budget}`);

  // ═══════ 1) Gather candidates ═══════════════════════════
  let categories: CategoryCandidates[];
  try {
    categories = await gatherCandidates(useCaseKey, budget, true, 45);
  } catch (e) {
    console.error(`[assembly] [${requestId}] Gather error:`, e);
    return NextResponse.json({ error: 'خطا در دریافت قطعات از آفلند.' }, { status: 502 });
  }

  const candidatesMap = new Map<string, AssemblyPart[]>();
  for (const cat of categories) candidatesMap.set(cat.category, cat.candidates);

  // ═══════ 2) Verify stock ═══════════════════════════════
  if (verifyStock) {
    const allIds = categories.flatMap((c) => c.candidates.slice(0, 5).map((p) => p.id));
    if (allIds.length > 0) {
      try {
        const verifications = await verifyProducts(allIds);
        const verMap = new Map(verifications.map((v) => [String(v.id), v]));
        for (const cat of categories) {
          for (const part of cat.candidates) {
            const v = verMap.get(String(part.id));
            if (v && v.exists) {
              part.inStock = v.inStock || part.inStock;
              if (v.price > 0) part.price = v.price;
              if (v.finalPrice > 0) part.finalPrice = v.finalPrice;
            }
          }
        }
      } catch (e) {
        console.warn(`[assembly] [${requestId}] Stock verification failed:`, e);
      }
    }
  }

  const usable = categories.filter(
    (c) => c.candidates.filter((p) => p.inStock && p.price > 0).length > 0
  );
  if (usable.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'هیچ قطعهٔ موجودی پیدا نشد. لطفاً بعداً دوباره تلاش کنید.',
        ai: aiMeta,
      },
      { status: 404 }
    );
  }

  // ═══════ 3) Global AI Planner ══════════════════════════
  let parts: AssemblyPart[] = [];

  if (config.apiKey) {
    try {
      const clientOpts: AiClientOptions = {
        apiKey: config.apiKey,
        apiBase: config.apiBase,
        model: config.assemblyModel,
        temperature: 0.1,
        maxTokens: 2000,
        timeoutMs: 35_000,
        proxyUrl: config.proxyUrl,
        useProxy: config.useProxy,
      };

      const startTime = Date.now();
      aiMeta.totalAiCalls++; // Increment BEFORE attempt (truthful tracking)
      const plannerResult = await planFullBuild(
        clientOpts,
        useCaseKey,
        customDesc || useCaseKey,
        budget,
        budget,
        usable,
        [], // No pre-picked parts
        note,
        req.signal
      );

      aiMeta.planningSucceeded = true;
      aiMeta.planningModel = config.assemblyModel;
      aiMeta.planningLatencyMs = Date.now() - startTime;

      // ─── Map AI selections to actual parts ────────────
      const selectedParts: AssemblyPart[] = [];
      const usedIds = new Set<string>();

      for (const sel of plannerResult.selections) {
        const cat = usable.find((c) => c.category === sel.category);
        if (!cat) continue;

        const part = cat.candidates.find((c) => String(c.id) === String(sel.id));
        if (!part || usedIds.has(String(part.id))) continue;

        // Validate with guardrails
        const guardResult = validatePartCategory(sel.category, {
          title: part.name,
          name: part.name,
          price: part.price,
          finalPrice: part.finalPrice,
          specs: part.specs || {},
        });

        if (!guardResult.passed) {
          aiMeta.repairedLocally.push(sel.category);
          continue;
        }

        usedIds.add(String(part.id));
        aiMeta.selectedByAi.push(sel.category);

        selectedParts.push({
          ...part,
          quantity: sel.quantity,
          pickReason: sel.reason || 'انتخاب AI',
          alternatives: cat.candidates.filter((c) => c.id !== part.id).slice(0, 15),
        });
      }

      // ─── Fill missing categories with rule-based ──────
      const missingCategories = usable.filter(
        (c) => !selectedParts.find((p) => p.category === c.category)
      );
      for (const cat of missingCategories) {
        const valid = cat.candidates.filter((c) => c.inStock && c.finalPrice > 0);
        if (valid.length === 0) continue;

        // Rule-based pick: best confidence within budget
        const sorted = valid.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
        const picked = sorted[0];
        if (picked) {
          aiMeta.repairedLocally.push(cat.category);
          selectedParts.push({
            ...picked,
            quantity: 1,
            pickReason: 'rule-based-fallback',
            alternatives: valid.filter((c) => c.id !== picked.id).slice(0, 15),
          });
        }
      }

      parts = selectedParts;

      // ─── Cooler: AI-first, local validated ────────────
      const hasCooler = parts.find((p) => p.category === 'cooler');
      const cpu = parts.find((p) => p.category === 'cpu');
      if (!hasCooler && cpu) {
        const coolerCat = usable.find((c) => c.category === 'cooler');
        if (coolerCat) {
          const validCoolers = coolerCat.candidates
            .filter((c) => c.inStock && c.finalPrice > 0)
            .filter((c) => isGenuineCpuCooler(c.name || ''));

          if (validCoolers.length > 0) {
            const economical = pickBestCoolerEconomical(validCoolers, cpu);
            if (economical) {
              parts.push({
                ...economical,
                isOptional: true,
                alternatives: validCoolers.filter((c) => c.id !== economical.id).slice(0, 50),
                pickReason: economical.pickReason || 'خنک‌کننده متناسب با TDP پردازنده',
              });
            }
          }
        }
      }

      aiMeta.fallbackReason =
        aiMeta.repairedLocally.length > 0
          ? `Local repair: ${aiMeta.repairedLocally.join(', ')}`
          : null;

      console.log(
        `[assembly] [${requestId}] AI plan: ${aiMeta.selectedByAi.length} selected, ${aiMeta.repairedLocally.length} repaired`
      );
    } catch (err) {
      console.warn(
        `[assembly] [${requestId}] AI planner failed:`,
        err instanceof Error ? err.message : err
      );
      aiMeta.planningSucceeded = false;
      aiMeta.fallbackReason = err instanceof Error ? err.message : 'unknown';
    }
  }

  // ═══════ 4) Fallback: Rule-based if AI failed ══════════
  if (parts.length === 0) {
    console.log(`[assembly] [${requestId}] Using rule-based selection`);
    const { parts: ruleParts } = selectPartsForBuild(usable, useCaseKey, budget);
    parts = ruleParts;
    aiMeta.fallbackReason = aiMeta.fallbackReason || 'AI not available or failed — rule-based';
  }

  // ═══════ 5) Auto-resolve ═══════════════════════════════
  const resolution = autoResolve(parts, candidatesMap, useCaseKey);
  parts = resolution.parts;

  // ═══════ 6) Compatibility check ════════════════════════
  const compatMatrix = checkFullCompatibility(parts);

  // ─── Mandatory category gate ──────────────────────────────
  const mandatoryByUseCase: Record<string, string[]> = {
    gaming: ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case'],
    editing: ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case'],
    streaming: ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case'],
    office: ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'case'],
  };
  const mandatory = mandatoryByUseCase[useCaseKey] || mandatoryByUseCase.gaming;
  const presentCategories = new Set(parts.filter(p => p.inStock && p.finalPrice > 0).map(p => p.category));
  const missingMandatory = mandatory.filter(cat => !presentCategories.has(cat));

  // Cap compatibility score for incomplete builds
  let effectiveScore = compatMatrix.score;
  if (missingMandatory.length > 0) {
    // Missing mandatory → max score 40
    effectiveScore = Math.min(40, compatMatrix.score);
    // CPU without motherboard or vice versa → max 20
    if ((!hasCPU && hasMB) || (hasCPU && !hasMB)) effectiveScore = Math.min(20, effectiveScore);
    // No motherboard at all → max 15
    if (!hasMB) effectiveScore = Math.min(15, effectiveScore);
  }

  // Determine if build is valid
  const buildComplete = missingMandatory.length === 0;
  const isOk = buildComplete && effectiveScore >= 50;

  const tier = determineTier(parts, budget);
  const description = generateDescription(parts, useCaseKey, tier);
  const recommendation = generateSystemRecommendation(parts, useCaseKey, tier, budget);
  const summary = summarize(parts);
  const useCase = USE_CASES.find((u) => u.key === useCaseKey) || USE_CASES[0];

  const hasCPU = parts.some((p) => p.category === 'cpu' && p.inStock);
  const gpuOptional = useCaseKey === 'office';
  const hasGPU = gpuOptional || parts.some((p) => p.category === 'gpu' && p.inStock);
  const hasRAM = parts.some((p) => p.category === 'ram' && p.inStock);
  const hasMB = parts.some((p) => p.category === 'motherboard' && p.inStock);

  const unavailableMessages: string[] = [];
  if (!hasCPU) unavailableMessages.push('CPU سازگار الان نداریم، به زودی موجود میشه');
  if (!hasGPU && !gpuOptional)
    unavailableMessages.push('کارت گرافیک سازگار الان نداریم، به زودی موجود میشه');
  if (!hasRAM) unavailableMessages.push('رم سازگار الان نداریم، به زودی موجود میشه');
  if (!hasMB) unavailableMessages.push('مادربرد سازگار الان نداریم، به زودی موجود میشه');

  // ═══════ 7) Final AI Analysis ══════════════════════════
  let analysisText = '';
  if (config.apiKey && parts.length >= 4) {
    try {
      aiMeta.totalAiCalls++; // Increment BEFORE attempt
      const analysisResult = await doFinalAnalysis(
        config,
        parts,
        useCaseKey,
        budget,
        compatMatrix.score,
        req.signal
      );
      if (analysisResult) {
        analysisText = analysisResult.text;
        aiMeta.finalAnalysisUsed = true;
        aiMeta.finalAnalysisModel = config.analysisModel;
      }
    } catch (err) {
      console.warn(
        `[assembly] [${requestId}] Final analysis failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  const clean = (value: any): any => {
    if (typeof value === 'string')
      return value
        .replace(/[✅❌⚠️💡⏳🎮⭐📦🚫ℹ️💾⚡🔌🔥🚀🧠🏷️📐📡🌈💧🌪️🏅🔧🗑️💰❄️✨🌬️🏢🎬📹🎨🏆📌]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v)]));
    return value;
  };

  return NextResponse.json({
    ok: isOk,
    partial: !buildComplete,
    useCase: customDesc ? 'custom' : useCaseKey,
    useCaseLabel: customDesc || useCase.label,
    budget,
    parts,
    summary,
    tier,
    compatibilityScore: effectiveScore,
    compatibilityIssues: [
      ...compatMatrix.errors.map((e) => ({
        severity: e.severity,
        message: e.message,
        category: e.category,
        reason: e.reason,
        solution: e.solution,
      })),
      ...missingMandatory.map((cat) => ({
        severity: 'error' as const,
        message: `قطعهٔ اجباری «${cat}» انتخاب نشده`,
        category: cat,
        reason: 'mandatory_missing',
        solution: 'قطعهٔ سازگار انتخاب یا اضافه شود',
      })),
    ],
    compatibilityWarnings: compatMatrix.warnings.map((w) => ({
      severity: w.severity,
      message: w.message,
      category: w.category,
      reason: w.reason,
      solution: w.solution,
    })),
    compatibilityMatrix: {
      ...compatMatrix,
      blockedPartIds: Array.from(compatMatrix.blockedPartIds),
      unavailablePartIds: Array.from(compatMatrix.unavailablePartIds),
    },
    description,
    recommendation,
    partsStatus: {
      cpu: hasCPU ? '✅' : '⏳',
      gpu: gpuOptional ? 'اختیاری' : hasGPU ? '✅' : '⏳',
      ram: hasRAM ? '✅' : '⏳',
      motherboard: hasMB ? '✅' : '⏳',
    },
    unavailableMessages: clean(unavailableMessages),
    resolution: {
      resolved: resolution.resolved,
      actionsCount: resolution.actions.length,
      removedCount: resolution.removedParts.length,
      suggestionCount: resolution.suggestions.length,
      actions: clean(resolution.actions),
      removedParts: resolution.removedParts.map((r) => ({
        id: r.part.id,
        name: r.part.name,
        category: r.part.category,
        categoryLabel: r.part.categoryLabel,
        reason: r.reason,
      })),
      suggestions: clean(resolution.suggestions),
      messages: clean(resolution.messages),
    },
    // Real AI metadata (not hardcoded)
    ai: aiMeta,
    // Final analysis
    analysis: analysisText || buildFallbackAnalysis(parts, useCaseKey, budget),
    debug: {
      totalCandidates: categories.reduce((sum, c) => sum + c.candidates.length, 0),
      mandatoryParts: summary.mandatoryCount,
      optionalParts: summary.optionalCount,
      selectedCategories: parts.map((p) => p.category),
      compatibilityErrors: compatMatrix.errors.length,
      compatibilityWarnings: compatMatrix.warnings.length,
      stockVerified: verifyStock,
      resolverApplied: true,
      requestId,
    },
  });
}

// ─── Final Analysis ──────────────────────────────────────────────
async function doFinalAnalysis(
  config: ReturnType<typeof getAiChatConfig>,
  parts: AssemblyPart[],
  useCase: string,
  budget: number,
  compatScore: number,
  signal: AbortSignal
): Promise<{ text: string } | null> {
  const useCaseFa: Record<string, string> = {
    gaming: 'گیمینگ',
    office: 'اداری',
    editing: 'ادیت و رندر',
    streaming: 'استریم',
    custom: 'دلخواه',
  };
  const partsText = parts
    .map(
      (p) =>
        `- ${p.categoryLabel}: ${p.name}${(p.quantity ?? 1) > 1 ? ` × ${p.quantity}` : ''}${p.shortSpec ? ` (${p.shortSpec})` : ''} | ${p.finalPrice.toLocaleString('fa-IR')} تومان`
    )
    .join('\n');

  const userPrompt = `سیستم "${useCaseFa[useCase] || useCase}" با بودجه ${budget.toLocaleString('fa-IR')} تومان:

${partsText}

امتیاز سازگاری: ${compatScore}/100

در ۳-۴ خط کوتاه فارسی تحلیل کن. بدون ایموجی، بدون تکرار قیمت. گلوگاه، نقطه قوت، پیشنهاد ارتقا.`;

  const opts: AiClientOptions = {
    apiKey: config.apiKey,
    apiBase: config.apiBase,
    model: config.analysisModel,
    temperature: 0.35,
    maxTokens: 900,
    timeoutMs: 35_000,
    proxyUrl: config.proxyUrl,
    useProxy: config.useProxy,
  };

  const messages = [
    {
      role: 'system' as const,
      content: 'تو کارشناس سخت‌افزار هستی. کوتاه، شیک، بدون ایموجی و تکرار قیمت تحلیل بده.',
    },
    { role: 'user' as const, content: userPrompt },
  ];

  try {
    const result = await aiNonStreamRequest(opts, messages, signal);
    return { text: result.text };
  } catch {
    return null;
  }
}

// ─── Fallback Analysis (no AI) ───────────────────────────────────
function buildFallbackAnalysis(parts: AssemblyPart[], useCase: string, budget: number): string {
  const cpu = parts.find((p) => p.category === 'cpu');
  const gpu = parts.find((p) => p.category === 'gpu');
  const ram = parts.find((p) => p.category === 'ram');
  const storage = parts.filter((p) => p.category === 'storage');
  const psu = parts.find((p) => p.category === 'psu');
  const mb = parts.find((p) => p.category === 'motherboard');

  const qty = (p?: AssemblyPart) => Math.max(1, Number(p?.quantity || 1));
  const ramGb = ram?.specs?.capacity ? Number(ram.specs.capacity) * qty(ram) : 0;
  const storageGb = storage.reduce((s, p) => s + Number(p.specs?.size || 0) * qty(p), 0);
  const gpuVram = Number(gpu?.specs?.vram || 0);
  const cpuCores = Number(cpu?.specs?.cores || 0);

  const strengths: string[] = [];
  const bottlenecks: string[] = [];
  const upgrades: string[] = [];

  if (cpuCores >= 8) strengths.push(`CPU با ${cpuCores} هسته`);
  if (gpuVram >= 8) strengths.push(`GPU با ${gpuVram}GB VRAM`);
  if (ramGb >= 32) strengths.push(`رم ${ramGb}GB`);
  else if (ramGb >= 16) strengths.push(`رم ${ramGb}GB`);
  if (storageGb >= 2000) strengths.push(`حافظه ${Math.round(storageGb / 1000)}TB`);
  if (mb?.specs?.chipset) strengths.push(`مادربرد ${mb.specs.chipset}`);

  if (ramGb > 0 && ramGb < 16) {
    bottlenecks.push(`رم ${ramGb}GB کم است`);
    upgrades.push('ارتقا به 16/32GB');
  }
  if (useCase === 'gaming' && gpuVram > 0 && gpuVram < 8) {
    bottlenecks.push(`VRAM ${gpuVram}GB`);
    upgrades.push('GPU قوی‌تر');
  }
  if (storageGb > 0 && storageGb < 1000) {
    bottlenecks.push('حافظه کمتر از 1TB');
    upgrades.push('SSD اضافه');
  }

  const target =
    useCase === 'gaming'
      ? gpuVram >= 12 && ramGb >= 32
        ? '1440p High/Ultra'
        : gpuVram >= 8
          ? '1080p High'
          : '1080p Medium'
      : useCase === 'editing'
        ? ramGb >= 32 && cpuCores >= 8
          ? 'ادیت حرفه‌ای'
          : 'ادیت سبک'
        : 'استفاده روزمره';

  return `تحلیل سیستم برای ${useCase}

هدف عملکردی: ${target}
${strengths.length ? 'نقاط قوت: ' + strengths.join('، ') : 'ترکیب قطعات کامل است'}
${bottlenecks.length ? 'قابل بهبود: ' + bottlenecks.join('، ') : 'گلوگاه جدی نیست'}
${upgrades.length ? 'ارتقا: ' + upgrades.join('، ') : 'سیستم متعادل است'}`;
}
