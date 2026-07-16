/**
 * ════════════════════════════════════════════════════════════════
 * 🖥️ /api/assemble — نسخهٔ v4 با Auto-Resolver هوشمند
 * ════════════════════════════════════════════════════════════════
 *
 * قابلیت‌های جدید v4:
 *   - حل خودکار ناسازگاری‌ها (قطعهٔ ناسازگار حذف + جایگزین می‌شه)
 *   - پیشنهاد مدل جایگزین برای قطعات ناموجود
 *   - پیام روشن "موجود نیست، به زودی موجود می‌کنیم"
 *   - اولویت‌بندی هوشمند بر اساس کاربری (gaming: GPU > CPU)
 *
 * ════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  gatherCandidates,
  summarize,
  USE_CASES,
  USE_CASE_BUDGET_WEIGHTS,
  selectPartsForBuild,
  determineTier,
  generateDescription,
  generateSystemRecommendation,
  pickBestCoolerEconomical,
  type AssemblyPart,
  type CategoryCandidates,
} from '@/lib/ai-chat/assembler';
import { isGenuineCpuCooler } from '@/lib/ai-chat/guardrails';
import { checkFullCompatibility } from '@/lib/ai-chat/compatibility-checker';
import { verifyProducts } from '@/lib/ai-chat/api-verify';
import { autoResolve } from '@/lib/ai-chat/auto-resolver';

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

export async function POST(req: NextRequest): Promise<NextResponse> {
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
  const includeOptional = true; // اسمبل کامل همیشه کولر/فن‌های لازم را هم بررسی می‌کند
  const verifyStock = body?.verifyStock !== false;

  console.log('🚀 Assembly Request v4:', {
    useCase: useCaseKey,
    budget,
    includeOptional,
    verifyStock,
  });

  // ═══════ ۱) جمع‌آوری کاندیداها ═══════
  let categories: CategoryCandidates[];
  try {
    categories = await gatherCandidates(useCaseKey, budget, includeOptional, 45);
  } catch (e) {
    console.error('❌ Gather error:', e);
    return NextResponse.json({ error: 'خطا در دریافت قطعات از آفلند.' }, { status: 502 });
  }

  // ذخیره کاندیداها برای auto-resolver
  const candidatesMap = new Map<string, AssemblyPart[]>();
  for (const cat of categories) {
    candidatesMap.set(cat.category, cat.candidates);
  }

  // ═══════ ۲) بررسی real-time موجودی ═══════
  if (verifyStock) {
    const allIds = categories.flatMap((c) => c.candidates.slice(0, 5).map((p) => p.id));
    if (allIds.length > 0) {
      try {
        const verifications = await verifyProducts(allIds);
        const verificationById = new Map(verifications.map((v) => [String(v.id), v]));
        for (const cat of categories) {
          for (const part of cat.candidates) {
            const v = verificationById.get(String(part.id));
            // فقط همان محصولی که واقعاً verify شده را آپدیت کن؛ قبلاً به‌خاطر index اشتباه،
            // وضعیت محصولات دسته‌های دیگر روی هم می‌افتاد و تعداد زیادی ناموجود نشان داده می‌شد.
            if (v && v.exists) {
              part.inStock = v.inStock || part.inStock;
              if (v.price > 0) part.price = v.price;
              if (v.finalPrice > 0) part.finalPrice = v.finalPrice;
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Stock verification failed:', e);
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
        debug: {
          categoriesChecked: categories.length,
          totalCandidates: categories.reduce((sum, c) => sum + c.candidates.length, 0),
        },
      },
      { status: 404 }
    );
  }

  // ═══════ ۳) انتخاب هوشمند با AI (هر دسته جداگانه) ═══════
  console.log('🎯 انتخاب قطعات با AI...');
  const { parts: initialParts } = await selectPartsWithAi(usable, useCaseKey, budget, customDesc);

  if (initialParts.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'امکان ساخت سیستم وجود ندارد. لطفاً بودجه یا کاربری رو تغییر بدید.',
      },
      { status: 404 }
    );
  }

  // ═══════ ۴) Auto-Resolver (v4 — جدید!) ═══════
  console.log('🔧 Running auto-resolver...');
  const resolution = autoResolve(initialParts, candidatesMap, useCaseKey);
  const parts = resolution.parts;

  console.log(`✅ Resolver: ${resolution.actions.length} اقدام`);
  console.log(`   - حذف‌شده: ${resolution.removedParts.length}`);
  console.log(`   - جایگزین‌شده: ${resolution.actions.filter((a) => a.type === 'replace').length}`);
  console.log(`   - پیشنهاد: ${resolution.suggestions.length}`);
  console.log(`   - پیام: ${resolution.messages.length}`);

  // ═══════ ۵) بررسی سازگاری نهایی ═══════
  const compatMatrix = checkFullCompatibility(parts);
  const tier = determineTier(parts, budget);
  const description = generateDescription(parts, useCaseKey, tier);
  const recommendation = generateSystemRecommendation(parts, useCaseKey, tier, budget);
  const summary = summarize(parts);
  const useCase = USE_CASES.find((u) => u.key === useCaseKey) || USE_CASES[0];

  const hasCPU = parts.some((p) => p.category === 'cpu' && p.inStock);
  const gpuOptionalForUseCase = useCaseKey === 'office';
  const hasGPU = gpuOptionalForUseCase || parts.some((p) => p.category === 'gpu' && p.inStock);
  const hasRAM = parts.some((p) => p.category === 'ram' && p.inStock);
  const hasMB = parts.some((p) => p.category === 'motherboard' && p.inStock);

  const unavailableMessages: string[] = [];
  if (!hasCPU) unavailableMessages.push('CPU سازگار الان نداریم، به زودی موجود میشه');
  if (!hasGPU && !gpuOptionalForUseCase)
    unavailableMessages.push('کارت گرافیک سازگار الان نداریم، به زودی موجود میشه');
  if (!hasRAM) unavailableMessages.push('رم سازگار الان نداریم، به زودی موجود میشه');
  if (!hasMB) unavailableMessages.push('مادربرد سازگار الان نداریم، به زودی موجود میشه');

  const clean = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/[✅❌⚠️💡⏳🎮⭐📦🚫ℹ️💾⚡🔌🔥🚀🧠🏷️📐📡🌈💧🌪️🏅🔧🗑️💰❄️✨🌬️🏢🎬📹🎨🏆📌]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v)]));
    }
    return value;
  };

  return NextResponse.json({
    ok: true,
    useCase: customDesc ? 'custom' : useCaseKey,
    useCaseLabel: customDesc || useCase.label,
    budget,
    parts,
    summary,
    tier,
    compatibilityScore: compatMatrix.score,
    compatibilityIssues: compatMatrix.errors.map((e) => ({
      severity: e.severity,
      message: e.message,
      category: e.category,
      reason: e.reason,
      solution: e.solution,
    })),
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
      gpu: gpuOptionalForUseCase ? 'اختیاری' : hasGPU ? '✅' : '⏳',
      ram: hasRAM ? '✅' : '⏳',
      motherboard: hasMB ? '✅' : '⏳',
    },
    unavailableMessages: clean(unavailableMessages),
    // 🆕 Auto-resolver نتایج
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
    debug: {
      totalCandidates: categories.reduce((sum, c) => sum + c.candidates.length, 0),
      mandatoryParts: summary.mandatoryCount,
      optionalParts: summary.optionalCount,
      selectedCategories: parts.map((p) => p.category),
      compatibilityErrors: compatMatrix.errors.length,
      compatibilityWarnings: compatMatrix.warnings.length,
      stockVerified: verifyStock,
      resolverApplied: true,
      aiPickUsed: true,
    },
  });
}

// ════════════════════════════════════════════════════════════════
// 🤖 انتخاب قطعات با AI — هر دسته جداگانه
// ════════════════════════════════════════════════════════════════

function quantile(values: number[], ratio: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)));
  return sorted[index] || 0;
}

function categoryBudgetWindow(
  candidates: AssemblyPart[],
  category: string,
  budget: number,
  remainingBudget: number,
  targetShare: number,
  optional = false
): { min: number; max: number; ideal: number; note: string } {
  const prices = candidates
    .filter((c) => c.inStock && c.finalPrice > 0)
    .map((c) => c.finalPrice)
    .sort((a, b) => a - b);

  if (!prices.length) {
    return {
      min: 0,
      max: Math.max(0, remainingBudget),
      ideal: targetShare,
      note: 'بدون دادهٔ قیمت معتبر',
    };
  }

  const p10 = quantile(prices, 0.1);
  const p25 = quantile(prices, 0.25);
  const p50 = quantile(prices, 0.5);
  const p75 = quantile(prices, 0.75);
  const p90 = quantile(prices, 0.9);
  const categoryImportance: Record<string, number> = {
    gpu: 1.65,
    cpu: 1.45,
    motherboard: 1.3,
    ram: 1.25,
    storage: 1.2,
    psu: 1.15,
    case: 1.1,
    cooler: 1.0,
    case_fan: 0.75,
    case_argb: 0.55,
  };

  const min = Math.max(1, Math.min(p25 || p10 || prices[0], Math.round(targetShare * 0.55)));
  const maxByPercentile = Math.max(
    p50,
    p75 || p50,
    Math.round(targetShare * (categoryImportance[category] || 1.2))
  );
  const maxByRemaining = optional ? remainingBudget * 0.35 : remainingBudget * 0.82;
  const max = Math.max(min, Math.min(p90 || maxByPercentile, maxByPercentile, maxByRemaining));
  const ideal = Math.min(Math.max(targetShare, p25 || min), max);

  return {
    min: Math.round(min),
    max: Math.round(max),
    ideal: Math.round(ideal),
    note: `بازه واقعی ${category}: ${Math.round(min / 1_000_000)} تا ${Math.round(max / 1_000_000)} میلیون بر اساس ${prices.length} کالای موجود`,
  };
}

function isPartCompatibleWithPicked(candidate: AssemblyPart, pickedParts: AssemblyPart[]): boolean {
  const cpu = pickedParts.find((p) => p.category === 'cpu');
  const mb = pickedParts.find((p) => p.category === 'motherboard');
  const ram = pickedParts.find((p) => p.category === 'ram');
  const psu = pickedParts.find((p) => p.category === 'psu');
  const gpu = pickedParts.find((p) => p.category === 'gpu');

  if (candidate.category === 'motherboard' && cpu?.specs?.socket && candidate.specs?.socket) {
    if (candidate.specs.socket !== cpu.specs.socket) return false;
  }
  if (candidate.category === 'cpu' && mb?.specs?.socket && candidate.specs?.socket) {
    if (candidate.specs.socket !== mb.specs.socket) return false;
  }
  if (candidate.category === 'ram' && mb?.specs?.ramType && candidate.specs?.ramType) {
    if (candidate.specs.ramType !== mb.specs.ramType) return false;
  }
  if (candidate.category === 'motherboard' && ram?.specs?.ramType && candidate.specs?.ramType) {
    if (candidate.specs.ramType !== ram.specs.ramType) return false;
  }
  if (candidate.category === 'psu' && candidate.specs?.wattage) {
    const cpuTdp = Number(cpu?.specs?.tdp || 95);
    const gpuTdp = Number(gpu?.specs?.tdp || 150);
    const required = Math.round(((cpuTdp + gpuTdp + 100) * 1.35) / 50) * 50;
    if (Number(candidate.specs.wattage) < required) return false;
  }
  if ((candidate.category === 'gpu' || candidate.category === 'cpu') && psu?.specs?.wattage) {
    const cpuTdp = Number((candidate.category === 'cpu' ? candidate : cpu)?.specs?.tdp || 95);
    const gpuTdp = Number((candidate.category === 'gpu' ? candidate : gpu)?.specs?.tdp || 150);
    const required = Math.round(((cpuTdp + gpuTdp + 100) * 1.35) / 50) * 50;
    if (Number(psu.specs.wattage) < required) return false;
  }
  return true;
}

async function selectPartsWithAi(
  categories: CategoryCandidates[],
  useCase: string,
  budget: number,
  customDesc: string
): Promise<{ parts: AssemblyPart[]; reason: string; details: string[] }> {
  const weights = USE_CASE_BUDGET_WEIGHTS[useCase] || USE_CASE_BUDGET_WEIGHTS.gaming;
  const selectedParts: AssemblyPart[] = [];
  let remainingBudget = budget;
  const details: string[] = [];

  // ═══════ اول قطعات اجباری (GPU, CPU, MB) به ترتیب اهمیت ═══════
  const order: string[] =
    useCase === 'office'
      ? ['cpu', 'motherboard', 'psu', 'ram', 'storage', 'case']
      : ['gpu', 'cpu', 'motherboard', 'psu', 'ram', 'storage', 'case'];

  for (const catKey of order) {
    const cat = categories.find((c) => c.category === catKey);
    if (!cat || cat.candidates.length === 0) continue;

    const rawValidCandidates = cat.candidates.filter((c) => c.inStock && c.price > 0);
    const validCandidates = rawValidCandidates
      .filter((c) => isPartCompatibleWithPicked(c, selectedParts))
      .filter((c) => catKey !== 'case' || isCaseCompatibleWithBuild(c, selectedParts, useCase));
    const candidatesForPick = validCandidates.length
      ? validCandidates
      : rawValidCandidates.filter(
          (c) => catKey !== 'case' || isCaseCompatibleWithBuild(c, selectedParts, useCase)
        );
    if (candidatesForPick.length === 0) continue;

    const targetShare = Math.round((weights[catKey] || 0.1) * budget);
    const budgetWindow = categoryBudgetWindow(
      candidatesForPick,
      catKey,
      budget,
      remainingBudget,
      targetShare,
      false
    );
    const maxPrice = Math.max(budgetWindow.max, budgetWindow.min);
    const rankedCandidates = [...candidatesForPick].sort(
      (a, b) =>
        smartCandidateScore(b, catKey, useCase, budget, budgetWindow) -
        smartCandidateScore(a, catKey, useCase, budget, budgetWindow)
    );

    // ═══════ فراخوانی AI برای انتخاب بهترین قطعه ═══════
    const aiPick = await aiPickBest({
      useCase,
      useCaseLabel: customDesc || useCase,
      budget,
      totalSpent: budget - remainingBudget,
      remainingBudget,
      pickedParts: selectedParts.map((p) => ({
        id: p.id,
        name: p.name,
        shortSpec: p.shortSpec,
        specs: p.specs,
        price: p.price,
        finalPrice: p.finalPrice,
        confidence: p.confidence,
        brand: p.brand,
        category: p.category,
      })),
      category: catKey,
      categoryLabel: cat.label,
      budgetShare: budgetWindow.ideal,
      priceRange: budgetWindow,
      candidates: rankedCandidates.slice(0, 28).map((c) => ({
        id: c.id,
        name: c.name,
        shortSpec: c.shortSpec,
        specs: c.specs,
        price: c.price,
        finalPrice: c.finalPrice,
        confidence: c.confidence,
        brand: c.brand,
        category: c.category,
      })),
      maxPick: 1,
    });

    let best = aiPick[0]
      ? rankedCandidates.find((c) => String(c.id) === String(aiPick[0].id)) || aiPick[0]
      : undefined;

    // اگه AI قطعه‌ای بالاتر از بودجهٔ باقی‌مانده انتخاب کرد، از rule-based fallback استفاده کن
    if (!best || best.finalPrice > maxPrice) {
      const sorted = rankedCandidates
        .filter((c) => c.finalPrice >= budgetWindow.min * 0.7 && c.finalPrice <= maxPrice)
        .sort(
          (a, b) =>
            smartCandidateScore(b, catKey, useCase, budget, budgetWindow) -
            smartCandidateScore(a, catKey, useCase, budget, budgetWindow)
        );
      best =
        sorted[0] ||
        rankedCandidates[0] ||
        candidatesForPick.sort((a, b) => a.finalPrice - b.finalPrice)[0];
    }

    if (best) {
      // ذخیره ۵ جایگزین (نه فقط ۳)
      const alts = rankedCandidates
        .filter(
          (c) => c.id !== best!.id && c.finalPrice <= Math.max(maxPrice, best!.finalPrice * 1.25)
        )
        .slice(0, 6);
      const picked: AssemblyPart = {
        ...best,
        alternatives: alts,
        pickReason: `انتخاب دقیق · ${budgetWindow.note} · امتیاز ${best.confidence}%`,
      };
      if (catKey === 'ram') {
        const mb = selectedParts.find((p) => p.category === 'motherboard');
        const cap = Number(picked.specs?.capacity || 0);
        const targetRam = getTargetRamGb(useCase, budget);
        const baseQty = cap > 0 ? Math.ceil(targetRam / cap) : 1;
        const slotQty = setRamQuantityWithinSlots(picked, baseQty, mb);
        const affordableQty = Math.max(
          1,
          Math.min(slotQty, Math.floor(remainingBudget / Math.max(1, picked.finalPrice)))
        );
        const qty = setRamQuantityWithinSlots(picked, affordableQty, mb);
        if (qty > 1) {
          picked.quantity = qty;
          picked.quantityLabel = `${qty.toLocaleString('fa-IR')} کیت · ${picked.specs.totalModules}/${picked.specs.ramSlots} اسلات رم · مجموع ${cap * qty}GB`;
          picked.pickReason += ` · استفاده هوشمند از اسلات‌های رم مادربرد برای رسیدن به ${cap * qty}GB.`;
        }
      }
      selectedParts.push(picked);
      remainingBudget -= best.finalPrice * partQty(picked);
      details.push(`${cat.label}: ${best.shortSpec || best.name}`);
    }
  }

  // ═══════ ۳.۵) اسمبل حرفه‌ای چندقطعه‌ای: چند SSD / چند فن / ارتقای RAM وقتی مادربرد و بودجه اجازه می‌ده ═══════
  remainingBudget = addSmartExpandableParts(
    selectedParts,
    categories,
    useCase,
    budget,
    remainingBudget,
    details
  );

  // ═══════ قطعات اختیاری ═══════
  const optionalOrder = ['cooler', 'case_fan', 'case_argb'];
  for (const catKey of optionalOrder) {
    const cat = categories.find((c) => c.category === catKey);
    if (!cat || cat.candidates.length === 0) continue;

    const cpuForCooler = selectedParts.find((p) => p.category === 'cpu');

    // ═════════════════════════════════════════════════════════════
    // 🛡️ گاردریل ویژهٔ Cooler: skip هوشمند اگر نیاز واقعی نیست
    //    یا کولرهای موجود با بودجه/TDP متناسب نیستند.
    // ═════════════════════════════════════════════════════════════
    if (catKey === 'cooler') {
      // شرط ۱: اگر پردازنده نیاز به کولر ندارد → skip کامل
      if (!cpuNeedsCooler(cpuForCooler, useCase, budget)) {
        details.push(
          `❄️ ${cat.label}: نادیده گرفته شد (پردازندهٔ ${cpuForCooler?.name || 'انتخابی'} با فن استوک کاملاً کار می‌کند).`
        );
        continue;
      }

      // شرط ۲: اگر ارزان‌ترین کولر موجود گران‌تر از ۱۵٪ کل بودجه
      // یا بیش از ۵۰٪ بودجهٔ باقی‌مانده است → skip
      const inStockCoolers = cat.candidates.filter((c) => c.inStock && c.price > 0);
      if (inStockCoolers.length > 0) {
        const cheapest = Math.min(
          ...inStockCoolers.map((c) => Number(c.finalPrice || c.price || 0))
        );
        const maxCoolerBudget = Math.min(budget * 0.15, remainingBudget * 0.5);
        if (cheapest > maxCoolerBudget) {
          details.push(
            `❄️ ${cat.label}: نادیده گرفته شد (ارزان‌ترین کولر موجود بیشتر از سقف منطقی این بودجه است).`
          );
          continue;
        }
      }
    }

    const validCandidates = cat.candidates
      .filter((c) => c.inStock && c.price > 0)
      .filter((c) => isPartCompatibleWithPicked(c, selectedParts))
      .filter(
        (c) =>
          catKey !== 'cooler' ||
          Number(c.specs?.tdpRating || 180) >= Number(cpuForCooler?.specs?.tdp || 95) * 1.15
      )
      // v6.0: در دستهٔ cooler، پایه لپ‌تاپ و اکسسوری‌ها را کاملاً حذف کن
      .filter((c) => catKey !== 'cooler' || isGenuineCpuCooler(c.name || ''));
    if (validCandidates.length === 0) continue;

    const targetShare = Math.round((weights[catKey] || 0.02) * budget);
    const budgetWindow = categoryBudgetWindow(
      validCandidates,
      catKey,
      budget,
      remainingBudget,
      targetShare,
      true
    );
    const maxPrice = Math.min(
      Math.max(budgetWindow.max, targetShare * (catKey === 'cooler' ? 1.8 : 1.25)),
      remainingBudget * (catKey === 'cooler' ? 0.55 : 0.35)
    );
    if (maxPrice < 1_000_000) {
      if (
        catKey === 'cooler' &&
        cpuNeedsCooler(
          selectedParts.find((p) => p.category === 'cpu'),
          useCase,
          budget
        )
      ) {
        // برای سیستم‌های نیازمند کولر، تلاش را ادامه بده حتی اگر بودجهٔ باقی‌مانده کم باشد.
      } else break;
    }

    const aiPick = await aiPickBest({
      useCase,
      useCaseLabel: customDesc || useCase,
      budget,
      totalSpent: budget - remainingBudget,
      remainingBudget,
      pickedParts: selectedParts.map((p) => ({
        id: p.id,
        name: p.name,
        shortSpec: p.shortSpec,
        specs: p.specs,
        price: p.price,
        finalPrice: p.finalPrice,
        confidence: p.confidence,
        brand: p.brand,
        category: p.category,
      })),
      category: catKey,
      categoryLabel: cat.label,
      budgetShare: budgetWindow.ideal,
      priceRange: budgetWindow,
      candidates: validCandidates.slice(0, 12).map((c) => ({
        id: c.id,
        name: c.name,
        shortSpec: c.shortSpec,
        specs: c.specs,
        price: c.price,
        finalPrice: c.finalPrice,
        confidence: c.confidence,
        brand: c.brand,
        category: c.category,
      })),
      maxPick: 1,
    });

    let best = aiPick[0]
      ? validCandidates.find((c) => String(c.id) === String(aiPick[0].id)) || aiPick[0]
      : undefined;
    if (!best || best.finalPrice > maxPrice) {
      const sorted = validCandidates
        .filter(
          (c) =>
            c.finalPrice <= maxPrice ||
            (catKey === 'cooler' &&
              cpuNeedsCooler(
                selectedParts.find((p) => p.category === 'cpu'),
                useCase,
                budget
              ))
        )
        .sort(
          (a, b) =>
            smartCandidateScore(b, catKey, useCase, budget, budgetWindow) -
            smartCandidateScore(a, catKey, useCase, budget, budgetWindow)
        );
      best = sorted[0];
    }

    if (best) {
      // v5.0: برای cooler همه گزینه‌ها، برای بقیه دسته‌ها تا 50 جایگزین
      const altsLimit = catKey === 'cooler' ? 150 : 50;
      const alts = validCandidates
        .filter((c) => c.id !== best!.id)
        .sort((a, b) => (a.finalPrice || 0) - (b.finalPrice || 0))
        .slice(0, altsLimit);
      selectedParts.push({
        ...best,
        isOptional: catKey === 'cooler' ? true : true,
        alternatives: alts,
        pickReason:
          catKey === 'cooler'
            ? `خنک‌کننده اجباری · ${budgetWindow.note}`
            : `اختیاری دقیق · ${budgetWindow.note}`,
      });
      remainingBudget -= best.finalPrice;
      details.push(`${cat.label}: ${best.shortSpec || best.name} (اختیاری)`);
    }
  }

  remainingBudget = finalizeThermalAndCase(
    selectedParts,
    categories,
    useCase,
    budget,
    remainingBudget,
    details
  );

  const fan = selectedParts.find((p) => p.category === 'case_fan');
  if (fan && ['gaming', 'editing', 'streaming'].includes(useCase) && budget >= 70_000_000) {
    const desiredFans = budget >= 160_000_000 ? 6 : 3;
    if (remainingBudget >= fan.finalPrice * (desiredFans - 1)) {
      fan.quantity = desiredFans;
      fan.quantityLabel = `${desiredFans.toLocaleString('fa-IR')} عدد فن برای Airflow بهتر کیس`;
      fan.pickReason =
        `${fan.pickReason || ''} · اسمبل حرفه‌ای: برای خنک‌کاری قطعات، تعداد فن‌ها به ${desiredFans} عدد افزایش داده شد.`.trim();
      remainingBudget -= fan.finalPrice * (desiredFans - 1);
      details.push(`فن کیس چندتایی: ${desiredFans} عدد برای airflow بهتر`);
    }
  }

  return {
    parts: selectedParts,
    reason: details.slice(0, 4).join(' | '),
    details,
  };
}

// ════════════════════════════════════════════════════════════════
// 🧠 توسعهٔ اسمبل حرفه‌ای: استفاده از قطعات تکرارپذیر تا حد ظرفیت مادربرد/کیس
// ════════════════════════════════════════════════════════════════

const MB_M2_SLOTS_LOCAL: Record<string, number> = {
  Z890: 4,
  B860: 2,
  Z790: 4,
  Z690: 3,
  B760: 2,
  B760M: 2,
  B660: 2,
  H770: 2,
  H670: 2,
  H610: 1,
  H610M: 1,
  X870E: 4,
  X870: 3,
  X670E: 4,
  X670: 3,
  B650E: 3,
  B650: 2,
  X570: 2,
  B550: 2,
  A520: 1,
  X470: 2,
  B450: 1,
  Z590: 2,
  B560: 1,
  H510: 1,
  H570: 1,
};

const MB_SATA_PORTS_LOCAL: Record<string, number> = {
  Z890: 4,
  B860: 4,
  Z790: 6,
  Z690: 6,
  B760: 4,
  B760M: 4,
  B660: 4,
  H770: 4,
  H670: 4,
  H610: 4,
  H610M: 4,
  X870E: 4,
  X870: 4,
  X670E: 6,
  X670: 6,
  B650E: 4,
  B650: 4,
  X570: 8,
  B550: 4,
  A520: 4,
  X470: 6,
  B450: 4,
  Z590: 6,
  B560: 6,
  H510: 4,
  H570: 6,
};

function getDesiredStorageGb(useCase: string, budget: number): number {
  if (useCase === 'editing')
    return budget >= 220_000_000
      ? 12000
      : budget >= 140_000_000
        ? 8000
        : budget >= 80_000_000
          ? 4000
          : 2000;
  if (useCase === 'streaming')
    return budget >= 200_000_000
      ? 10000
      : budget >= 120_000_000
        ? 6000
        : budget >= 70_000_000
          ? 4000
          : 2000;
  if (useCase === 'gaming')
    return budget >= 220_000_000
      ? 10000
      : budget >= 140_000_000
        ? 8000
        : budget >= 80_000_000
          ? 4000
          : budget >= 45_000_000
            ? 2000
            : 1000;
  return budget >= 100_000_000 ? 4000 : budget >= 50_000_000 ? 2000 : 1000;
}

function storageSizeGb(part: AssemblyPart): number {
  return Number(part.specs?.size || 0) || Number(part.specs?.sizeTB || 0) * 1000 || 0;
}

function partQty(part: AssemblyPart): number {
  return Math.max(1, Number(part.quantity || 1));
}

function ramModuleCount(part: AssemblyPart): number {
  return Math.max(
    1,
    Number(
      part.specs?.moduleCount ||
        (String(part.specs?.channel || '').toLowerCase() === 'dual' ? 2 : 1)
    )
  );
}

function getRamSlotCount(mb?: AssemblyPart): number {
  const explicit = Number(mb?.specs?.ramSlots || 0);
  if (explicit > 0) return explicit;
  const ff = String(mb?.specs?.formFactor || '').toLowerCase();
  return ff.includes('mini') ? 2 : 4;
}

function getM2SlotCount(mb?: AssemblyPart): number {
  const explicit = Number(mb?.specs?.m2Slots || 0);
  if (explicit > 0) return explicit;
  const chipset = String(mb?.specs?.chipset || '').toUpperCase();
  return MB_M2_SLOTS_LOCAL[chipset] ?? 2;
}

function getSataPortCount(mb?: AssemblyPart): number {
  const explicit = Number(mb?.specs?.sataPorts || 0);
  if (explicit > 0) return explicit;
  const chipset = String(mb?.specs?.chipset || '').toUpperCase();
  return MB_SATA_PORTS_LOCAL[chipset] ?? 4;
}

function getTargetRamGb(useCase: string, budget: number): number {
  if (useCase === 'editing')
    return budget >= 220_000_000
      ? 128
      : budget >= 140_000_000
        ? 64
        : budget >= 60_000_000
          ? 32
          : 16;
  if (useCase === 'streaming') return budget >= 160_000_000 ? 64 : budget >= 70_000_000 ? 32 : 16;
  if (useCase === 'gaming') return budget >= 160_000_000 ? 64 : budget >= 70_000_000 ? 32 : 16;
  return budget >= 80_000_000 ? 32 : 16;
}

function setRamQuantityWithinSlots(
  ram: AssemblyPart,
  desiredQty: number,
  mb?: AssemblyPart
): number {
  const slots = getRamSlotCount(mb);
  const modulesPerKit = ramModuleCount(ram);
  const maxBySlots = Math.max(1, Math.floor(slots / modulesPerKit));
  const finalQty = Math.max(1, Math.min(desiredQty, maxBySlots));
  ram.specs = {
    ...ram.specs,
    moduleCount: modulesPerKit,
    totalModules: finalQty * modulesPerKit,
    usedRamSlots: finalQty * modulesPerKit,
    ramSlots: slots,
  };
  return finalQty;
}

function requiredGpuLength(gpu?: AssemblyPart): number {
  if (!gpu) return 0;
  const tier = String(gpu.specs?.tier || 'medium');
  const vram = Number(gpu.specs?.vram || 0);
  if (tier === 'ultra' || vram >= 16) return 340;
  if (tier === 'high' || vram >= 12) return 320;
  if (vram >= 8) return 290;
  return 250;
}

function isCaseCompatibleWithBuild(
  candidate: AssemblyPart,
  pickedParts: AssemblyPart[],
  useCase: string
): boolean {
  if (candidate.category !== 'case') return true;
  const mb = pickedParts.find((p) => p.category === 'motherboard');
  const gpu = pickedParts.find((p) => p.category === 'gpu');
  const ffRank: Record<string, number> = { 'Mini-ITX': 0, 'Micro-ATX': 1, ATX: 2, 'E-ATX': 3 };
  const caseRank = ffRank[String(candidate.specs?.formFactor || 'ATX')] ?? 2;
  const mbRank = ffRank[String(mb?.specs?.formFactor || 'ATX')] ?? 2;
  if (caseRank < mbRank) return false;
  const maxGpu = Number(candidate.specs?.gpuMaxLength || (caseRank >= 2 ? 340 : 290));
  if (gpu && maxGpu < requiredGpuLength(gpu)) return false;
  if (
    useCase !== 'office' &&
    candidate.specs?.officeCase &&
    !candidate.specs?.gamingCase &&
    !candidate.specs?.airflow
  )
    return false;
  return true;
}

/**
 * تشخیص هوشمند نیاز به خنک‌کنندهٔ جانبی.
 * اکثر پردازنده‌های اداری/میان‌رده با فن استوک کار می‌کنند و نیازی
 * به تحمیل کولر گران ندارند.
 */
function cpuNeedsCooler(cpu?: AssemblyPart, useCase = 'gaming', budget = 0): boolean {
  if (!cpu) return false;
  const name = String(cpu.name || '').toLowerCase();
  const tdp = Number(cpu.specs?.tdp || 0);

  // پردازنده‌های سری K/X/KF همیشه بدون کولر می‌آیند → نیاز حتمی
  const isUnlocked = /\bk\b|kf\b|\bx\b|x3d/i.test(name);
  if (isUnlocked) return true;

  // پرچم‌داران (i7/i9 و Ryzen 7/9) نیاز به کولر جانبی
  if (/i9|i7|ryzen\s*9|ryzen\s*7|\br9\b|\br7\b/.test(name)) return true;

  // TDP بالای 100W → نیاز
  if (tdp >= 100) return true;

  // برای office/میان‌رده با CPU کم‌مصرف → فن استوک کافی
  if (useCase === 'office') return false;
  if (tdp > 0 && tdp <= 95) return false;
  if (/i3|i5-1[23]4|ryzen\s*3|ryzen\s*5\s*5600(?!x)|\br3\b|\br5\b\s*5[456]00(?!x)/.test(name))
    return false;

  // برای بودجهٔ زیر ۲۵ میلیون هرگز کولر تحمیل نشود
  if (budget > 0 && budget < 25_000_000) return false;

  return false;
}

function smartCandidateScore(
  part: AssemblyPart,
  category: string,
  useCase: string,
  budget: number,
  priceRange: { min: number; max: number; ideal: number }
): number {
  let score = Number(part.confidence || 50);
  const price = Number(part.finalPrice || 0);
  const target = Math.max(1, priceRange.ideal || price);
  score -= Math.min(28, (Math.abs(price - target) / target) * 18);
  if (price >= priceRange.min && price <= priceRange.max) score += 10;
  if (part.inStock) score += 8;

  if (category === 'ram') {
    const cap = Number(part.specs?.capacity || 0);
    const targetRam = getTargetRamGb(useCase, budget);
    if (cap >= targetRam) score += 22;
    else if (cap >= 32) score += 16;
    else if (cap >= 16) score += 9;
    else score -= 18;
    if (ramModuleCount(part) === 2) score += 7;
    if (part.specs?.ramType === 'DDR5') score += 4;
    if (Number(part.specs?.frequency || 0) >= 5600) score += 4;
  }
  if (category === 'storage') {
    const size = storageSizeGb(part);
    const desired = getDesiredStorageGb(useCase, budget);
    if (part.specs?.isNVMe) score += 14;
    if (size >= desired) score += 16;
    else if (size >= 2000) score += 10;
    else if (size >= 1000) score += 6;
    if (part.specs?.pcie === '5.0') score += 5;
    else if (part.specs?.pcie === '4.0') score += 4;
  }
  if (category === 'motherboard') {
    score += Math.min(12, getRamSlotCount(part) * 2);
    score += Math.min(12, getM2SlotCount(part) * 3);
    if (part.specs?.wifi) score += 3;
  }
  if (category === 'psu') {
    const watt = Number(part.specs?.wattage || 0);
    if (watt >= 850) score += 10;
    else if (watt >= 650) score += 6;
    if (String(part.specs?.rating || '').match(/gold|platinum|titanium/i)) score += 6;
  }
  if (category === 'gpu' && part.specs?.vram) {
    const vram = Number(part.specs.vram);
    if (useCase === 'gaming' && vram >= 12) score += 18;
    else if (vram >= 8) score += 10;
  }
  if (category === 'cpu' && part.specs?.cores) {
    const cores = Number(part.specs.cores);
    if (['editing', 'streaming'].includes(useCase) && cores >= 12) score += 18;
    else if (cores >= 8) score += 10;
    else if (cores >= 6) score += 5;
  }
  if (category === 'case') {
    if (useCase !== 'office') {
      if (part.specs?.gamingCase) score += 22;
      if (part.specs?.airflow) score += 18;
      if (!part.specs?.gamingCase && !part.specs?.airflow) score -= 28;
      if (part.specs?.officeCase && !part.specs?.gamingCase) score -= 45;
      if (Number(part.specs?.gpuMaxLength || 0) >= 340) score += 10;
    } else {
      if (part.specs?.officeCase) score += 10;
      if (part.specs?.gamingCase && part.finalPrice > budget * 0.08) score -= 8;
    }
    const ff = String(part.specs?.formFactor || 'ATX');
    if (ff === 'ATX' || ff === 'E-ATX') score += 8;
  }
  if (category === 'cooler') {
    const tdpRating = Number(part.specs?.tdpRating || 0);
    if (tdpRating >= 220) score += 18;
    else if (tdpRating >= 180) score += 12;
    if (
      part.specs?.type === 'aio' &&
      ['editing', 'streaming', 'gaming'].includes(useCase) &&
      budget >= 90_000_000
    )
      score += 8;
  }
  return score;
}

function addSmartExpandableParts(
  selectedParts: AssemblyPart[],
  categories: CategoryCandidates[],
  useCase: string,
  budget: number,
  remainingBudget: number,
  details: string[]
): number {
  const mb = selectedParts.find((p) => p.category === 'motherboard');
  const storageCat = categories.find((c) => c.category === 'storage');
  const ram = selectedParts.find((p) => p.category === 'ram');

  // ───── چند SSD / HDD بر اساس اسلات‌های مادربرد ─────
  if (mb && storageCat?.candidates?.length) {
    const m2Slots = getM2SlotCount(mb);
    const sataPorts = getSataPortCount(mb);
    const desiredGb = getDesiredStorageGb(useCase, budget);

    let currentM2 = selectedParts
      .filter((p) => p.category === 'storage' && p.specs?.formFactor === 'M.2')
      .reduce((s, p) => s + partQty(p), 0);
    let currentSata = selectedParts
      .filter((p) => p.category === 'storage' && p.specs?.formFactor !== 'M.2')
      .reduce((s, p) => s + partQty(p), 0);
    let currentGb = selectedParts
      .filter((p) => p.category === 'storage')
      .reduce((s, p) => s + storageSizeGb(p) * partQty(p), 0);

    const usedIds = new Set(selectedParts.map((p) => String(p.id)));
    const storages = storageCat.candidates
      .filter((p) => p.inStock && p.finalPrice > 0 && !usedIds.has(String(p.id)))
      .sort((a, b) => {
        const aNvme = a.specs?.formFactor === 'M.2' || a.specs?.isNVMe ? 1 : 0;
        const bNvme = b.specs?.formFactor === 'M.2' || b.specs?.isNVMe ? 1 : 0;
        const aValue = storageSizeGb(a) / Math.max(1, a.finalPrice);
        const bValue = storageSizeGb(b) / Math.max(1, b.finalPrice);
        return bNvme - aNvme || bValue - aValue || b.confidence - a.confidence;
      });

    const maxExtraStorageItems =
      useCase === 'office'
        ? 1
        : budget >= 220_000_000
          ? 5
          : budget >= 140_000_000
            ? 4
            : budget >= 70_000_000
              ? 3
              : 1;
    let added = 0;

    for (const candidate of storages) {
      if (added >= maxExtraStorageItems) break;
      if (currentGb >= desiredGb) break;
      if (candidate.finalPrice > remainingBudget * 0.55) continue;

      const isM2 = candidate.specs?.formFactor === 'M.2' || candidate.specs?.isNVMe;
      if (isM2 && currentM2 >= m2Slots) continue;
      if (!isM2 && currentSata >= sataPorts) continue;

      const slotText = isM2
        ? `اسلات M.2 ${currentM2 + 1} از ${m2Slots}`
        : `پورت SATA ${currentSata + 1} از ${sataPorts}`;

      selectedParts.push({
        ...candidate,
        alternatives: storages.filter((s) => s.id !== candidate.id).slice(0, 50),
        quantity: 1,
        quantityLabel: `حافظه اضافه · ${slotText}`,
        pickReason: `اسمبل حرفه‌ای: برای رسیدن به حدود ${Math.round(desiredGb / 1000)}TB حافظه، این SSD هم اضافه شد (${slotText}).`,
      });

      usedIds.add(String(candidate.id));
      remainingBudget -= candidate.finalPrice;
      currentGb += storageSizeGb(candidate);
      if (isM2) currentM2 += 1;
      else currentSata += 1;
      added += 1;
      details.push(`حافظه اضافه: ${candidate.shortSpec || candidate.name} (${slotText})`);
    }

    // اگر مدل مناسب دیگری پیدا نشد ولی همان SSD منتخب موجود است، از quantity برای پر کردن اسلات‌های آزاد استفاده کن.
    const primaryStorage = selectedParts.find(
      (p) => p.category === 'storage' && p.inStock && p.finalPrice > 0
    );
    if (primaryStorage) {
      const isM2 = primaryStorage.specs?.formFactor === 'M.2' || primaryStorage.specs?.isNVMe;
      while (
        currentGb < desiredGb &&
        remainingBudget >= primaryStorage.finalPrice &&
        ((isM2 && currentM2 < m2Slots) || (!isM2 && currentSata < sataPorts))
      ) {
        primaryStorage.quantity = partQty(primaryStorage) + 1;
        const nextSlot = isM2 ? currentM2 + 1 : currentSata + 1;
        primaryStorage.quantityLabel = `${primaryStorage.quantity.toLocaleString('fa-IR')} عدد برای حافظه بیشتر · ${isM2 ? `M.2 ${nextSlot}/${m2Slots}` : `SATA ${nextSlot}/${sataPorts}`}`;
        primaryStorage.pickReason =
          `${primaryStorage.pickReason || ''} · اسمبل حرفه‌ای: از اسلات آزاد مادربرد برای افزایش حافظه استفاده شد.`.trim();
        remainingBudget -= primaryStorage.finalPrice;
        currentGb += storageSizeGb(primaryStorage);
        if (isM2) currentM2 += 1;
        else currentSata += 1;
        details.push(`افزایش تعداد SSD: ${primaryStorage.name} × ${primaryStorage.quantity}`);
      }
    }
  }

  // ───── فن کیس چندتایی برای گردش هوای حرفه‌ای ─────
  const fan = selectedParts.find((p) => p.category === 'case_fan');
  if (fan && ['gaming', 'editing', 'streaming'].includes(useCase) && budget >= 70_000_000) {
    const desiredFans = budget >= 160_000_000 ? 6 : 3;
    if (remainingBudget >= fan.finalPrice * (desiredFans - 1)) {
      fan.quantity = desiredFans;
      fan.quantityLabel = `${desiredFans.toLocaleString('fa-IR')} عدد فن برای Airflow بهتر کیس`;
      fan.pickReason =
        `${fan.pickReason || ''} · اسمبل حرفه‌ای: برای خنک‌کاری قطعات، تعداد فن‌ها به ${desiredFans} عدد افزایش داده شد.`.trim();
      remainingBudget -= fan.finalPrice * (desiredFans - 1);
      details.push(`🌬️ فن کیس چندتایی: ${desiredFans} عدد برای airflow بهتر`);
    }
  }

  // ───── RAM چندکیتی دقیق بر اساس اسلات‌های مادربرد ─────
  if (ram) {
    const cap = Number(ram.specs?.capacity || 0);
    const targetRam = getTargetRamGb(useCase, budget);
    const slots = getRamSlotCount(mb);
    const modulesPerKit = ramModuleCount(ram);
    const currentQty = partQty(ram);
    const desiredQty = cap > 0 ? Math.ceil(targetRam / cap) : currentQty;
    const finalQty = setRamQuantityWithinSlots(ram, desiredQty, mb);
    const extraQty = finalQty - currentQty;
    if (extraQty > 0 && remainingBudget >= ram.finalPrice * extraQty) {
      ram.quantity = finalQty;
      ram.quantityLabel = `${finalQty.toLocaleString('fa-IR')} کیت · ${ram.specs.totalModules}/${slots} اسلات رم · مجموع ${cap * finalQty}GB`;
      ram.pickReason =
        `${ram.pickReason || ''} · اسمبل حرفه‌ای: با توجه به مادربرد، ${ram.specs.totalModules} اسلات RAM استفاده شد و ظرفیت به ${cap * finalQty}GB رسید.`.trim();
      remainingBudget -= ram.finalPrice * extraQty;
      details.push(
        `رم چندکیتی دقیق: ${cap}GB × ${finalQty} = ${cap * finalQty}GB (${ram.specs.totalModules}/${slots} اسلات)`
      );
    } else if (cap > 0) {
      ram.quantityLabel =
        ram.quantityLabel ||
        `${currentQty.toLocaleString('fa-IR')} کیت · ${ram.specs.totalModules || modulesPerKit}/${slots} اسلات رم · مجموع ${cap * currentQty}GB`;
    }
  }

  return remainingBudget;
}

function finalizeThermalAndCase(
  selectedParts: AssemblyPart[],
  categories: CategoryCandidates[],
  useCase: string,
  budget: number,
  remainingBudget: number,
  details: string[]
): number {
  const cpu = selectedParts.find((p) => p.category === 'cpu');
  const gpu = selectedParts.find((p) => p.category === 'gpu');
  let cs = selectedParts.find((p) => p.category === 'case');
  const cooler = selectedParts.find((p) => p.category === 'cooler');

  const caseCat = categories.find((c) => c.category === 'case');
  if (caseCat?.candidates?.length) {
    const currentOk = cs
      ? isCaseCompatibleWithBuild(
          cs,
          selectedParts.filter((p) => p.id !== cs!.id),
          useCase
        )
      : false;
    const gpuStrong = requiredGpuLength(gpu) >= 290;
    const currentOfficeForGaming =
      cs &&
      useCase !== 'office' &&
      (cs.specs?.officeCase || (!cs.specs?.gamingCase && !cs.specs?.airflow && gpuStrong));
    if (!currentOk || currentOfficeForGaming) {
      const replacement = caseCat.candidates
        .filter((c) => c.inStock && c.finalPrice > 0)
        .filter((c) =>
          isCaseCompatibleWithBuild(
            c,
            selectedParts.filter((p) => p.category !== 'case'),
            useCase
          )
        )
        .sort(
          (a, b) =>
            smartCandidateScore(b, 'case', useCase, budget, {
              min: 0,
              max: budget,
              ideal: Math.max(1, budget * 0.055),
            }) -
            smartCandidateScore(a, 'case', useCase, budget, {
              min: 0,
              max: budget,
              ideal: Math.max(1, budget * 0.055),
            })
        )[0];
      if (replacement && (!cs || replacement.id !== cs.id)) {
        selectedParts.splice(
          selectedParts.findIndex((p) => p.category === 'case'),
          1,
          {
            ...replacement,
            alternatives: caseCat.candidates.filter((c) => c.id !== replacement.id).slice(0, 50),
            pickReason: 'کیس با توجه به فرم‌فکتور، طول کارت گرافیک و airflow اصلاح شد.',
          }
        );
        if (cs) remainingBudget += cs.finalPrice;
        remainingBudget -= replacement.finalPrice;
        cs = replacement;
        details.push(`کیس اصلاح شد: ${replacement.shortSpec || replacement.name}`);
      }
    }
  }

  if (!cooler && cpuNeedsCooler(cpu, useCase, budget)) {
    const coolerCat = categories.find((c) => c.category === 'cooler');
    if (coolerCat?.candidates?.length) {
      const affordable = coolerCat.candidates
        .filter((c) => c.inStock && c.finalPrice > 0)
        // سقف قیمت منطقی: ۱۲٪ بودجه کل یا ۴۰٪ باقی‌مانده — هرکدام کمتر
        .filter(
          (c) => c.finalPrice <= Math.min(budget * 0.12, Math.max(remainingBudget * 0.4, 3_000_000))
        );

      // استفاده از موتور Tier-based اقتصادی (Air/Liquid smart pick از کف قیمت)
      const bestCooler = pickBestCoolerEconomical(affordable, cpu || null);

      if (bestCooler) {
        // v6.0: فیلتر قطعی پایه لپ‌تاپ + مرتب‌سازی صعودی قیمت
        const allOtherCoolers = coolerCat.candidates
          .filter((c) => c.id !== bestCooler.id && c.inStock && (c.finalPrice || c.price || 0) > 0)
          .filter((c) => isGenuineCpuCooler(c.name || '')) // ← ضد پایه لپ‌تاپ
          .sort((a, b) => (a.finalPrice || 0) - (b.finalPrice || 0));
        selectedParts.push({
          ...bestCooler,
          isOptional: true,
          alternatives: allOtherCoolers.slice(0, 150),
          pickReason:
            bestCooler.pickReason || 'خنک‌کننده متناسب با TDP پردازنده از کف قیمت انتخاب شد.',
        });
        remainingBudget -= bestCooler.finalPrice;
        details.push(
          `❄️ خنک‌کننده اضافه شد: ${bestCooler.shortSpec || bestCooler.name} (${allOtherCoolers.length} جایگزین معتبر در دسترس)`
        );
      } else {
        details.push(`❄️ خنک‌کننده اضافه نشد: هیچ کولر واقعی پردازنده با قیمت متناسب یافت نشد.`);
      }
    }
  }

  return remainingBudget;
}

/**
 * فراخوانی endpoint هوش مصنوعی برای انتخاب بهترین قطعه
 */
async function aiPickBest(body: any): Promise<AssemblyPart[]> {
  try {
    // فراخوانی داخلی به endpoint ai-pick (همون سرور Next.js)
    const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL_SITE || 'http://localhost:3000';
    const res = await fetch(`${SITE_URL}/api/assemble/ai-pick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    if (!res || !res.ok) return [];

    const data = await res.json();
    return data.picks || [];
  } catch {
    return [];
  }
}
