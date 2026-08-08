import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ASSEMBLY_ENGINE_URL = process.env.ASSEMBLY_ENGINE_URL || 'http://147.45.43.25:20143';

// Map engine category to emoji & label fallback
const CATEGORY_EMOJI: Record<string, string> = {
  cpu: '🧠',
  motherboard: '🔲',
  ram: '💾',
  gpu: '🎮',
  storage: '⚡',
  psu: '🔌',
  case: '🗄️',
  cooler: '❄️',
};

function mapEnginePartToFrontend(p: any) {
  return {
    category: p.category,
    categoryLabel: p.categoryLabel || p.category,
    emoji: CATEGORY_EMOJI[p.category] || '📦',
    id: p.id,
    name: p.name,
    url: p.url || `/product/${p.id}`,
    image: p.image || null,
    price: Number(p.price || 0),
    finalPrice: Number(p.finalPrice || p.specialPrice || p.price || 0),
    discountPercent: Number(p.discountPercent || 0),
    inStock: Boolean(p.inStock),
    brand: p.brand || null,
    warranty: p.warranty || null,
    shortSpec: p.shortSpec || '',
    specs: p.specs || {},
    confidence: p.confidence ?? 85,
    isOptional: Boolean(p.isOptional),
    quantity: p.quantity || 1,
    quantityLabel: p.quantityLabel || undefined,
    alternatives: Array.isArray(p.alternatives) ? p.alternatives.map(mapEnginePartToFrontend) : [],
    pickReason: p.pickReason || undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const useCase = String(body.useCase || body.usage || 'gaming').trim() || 'gaming';
    const budget = Number(body.budget) || 50_000_000;
    const customDesc = String(body.customDesc || body.note || '').trim();

    console.log('[Assemble API v2] Request:', {
      useCase,
      budget,
      customDesc: customDesc.slice(0, 80),
    });

    // Call Engine directly — single source of truth
    const engineRes = await fetch(`${ASSEMBLY_ENGINE_URL}/assemble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        useCase,
        usage: useCase,
        budget,
        customDesc,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!engineRes.ok) {
      const txt = await engineRes.text().catch(() => '');
      console.error('[Assemble API] Engine error:', engineRes.status, txt.slice(0, 500));
      throw new Error(`Engine ${engineRes.status}`);
    }

    const data = await engineRes.json();

    // Engine returns: { ok, parts[], totalPrice, totalBefore, savingPercent, tier, compatibilityScore, compatibilityMatrix, description, analysis, summary, recommendation }
    const parts = Array.isArray(data.parts) ? data.parts.map(mapEnginePartToFrontend) : [];

    // Build summary for frontend (makeSummary compatible)
    const summary = {
      totalBefore: Number(data.totalBefore || data.summary?.totalBefore || 0),
      totalAfter: Number(data.totalPrice || data.summary?.totalPrice || 0),
      totalSaving: Number(data.totalSaving || data.totalDiscount || 0),
      savingPercent: Number(data.savingPercent || data.summary?.savingPercent || 0),
      itemCount: parts.length,
      mandatoryCount: parts.filter((p: any) => !p.isOptional).length,
      optionalCount: parts.filter((p: any) => p.isOptional).length,
      totalTdp: Number(data.summary?.totalWattage || 0),
    };

    // Map compatibilityMatrix to frontend expected shape
    const engineMatrix = data.compatibilityMatrix || {};
    const engineIssues = data.compatibilityIssues || [];
    const engineWarnings = data.compatibilityWarnings || [];
    const score = Number(data.compatibilityScore ?? engineMatrix.score ?? 95);
    const buildable = engineMatrix.buildable !== false && engineIssues.length === 0;
    const hasError = engineIssues.length > 0;
    const hasWarn = engineWarnings.length > 0;
    const status = !buildable || hasError ? 'incompatible' : hasWarn ? 'warning' : 'compatible';

    const compatibilityMatrix = {
      buildable,
      score,
      status,
      errors: engineIssues.map((e: any) => ({
        severity: 'error' as const,
        message: e.message || String(e),
        reason: e.reason,
        solution: e.solution,
      })),
      warnings: engineWarnings.map((w: any) => ({
        severity: 'warning' as const,
        message: w.message || String(w),
        reason: w.reason,
        solution: w.solution,
      })),
      info: [],
      blockedPartIds: (engineMatrix.blockedPartIds || []).map(String),
      unavailablePartIds: (engineMatrix.unavailablePartIds || []).map(String),
    };

    // Tier normalization
    const tierMap: Record<string, string> = {
      پرچم‌دار: 'ultra',
      حرفه‌ای: 'high',
      میان‌رده: 'medium',
      اقتصادی: 'entry',
    };
    const rawTier = String(data.tier || 'میان‌رده');
    const tier = tierMap[rawTier] || rawTier || 'medium';

    const response = {
      ok: Boolean(data.ok ?? true),
      useCaseLabel: data.useCaseLabel || data.detectedUseCase || useCase,
      budget: Number(data.budget || budget),
      reason: data.description || '',
      parts,
      summary,
      tier,
      compatibilityScore: score,
      compatibilityIssues: compatibilityMatrix.errors,
      compatibilityWarnings: compatibilityMatrix.warnings,
      compatibilityMatrix,
      compatibilityDetails: data.compatibilityMatrix,
      description: data.description || '',
      recommendation: data.recommendation || {
        overallScore: score,
        compatibilityNotes: [],
        upgradeSuggestions: [],
        performanceEstimates: {},
      },
      analysis: data.analysis || data.recommendation?.analysis || '',
      ai: {
        finalAnalysisUsed: Boolean(data.aiUsed),
        finalAnalysisModel: data.debug?.model || 'offl-assemble-elite',
        planningSucceeded: Boolean(data.aiUsed),
        totalAiCalls: data.aiUsed ? 1 : 0,
      },
      debug: data.debug || {},
    };

    console.log('[Assemble API v2] OK:', {
      parts: parts.length,
      tier,
      score,
      totalPrice: summary.totalAfter,
    });

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Assemble API v2] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'خطا در ارتباط با موتور اسمبل. لطفاً دوباره تلاش کنید.',
        reason: 'engine_error',
        parts: [],
        summary: {
          totalBefore: 0,
          totalAfter: 0,
          totalSaving: 0,
          savingPercent: 0,
          itemCount: 0,
          mandatoryCount: 0,
          optionalCount: 0,
          totalTdp: 0,
        },
        tier: 'medium',
        compatibilityScore: 0,
        compatibilityMatrix: {
          buildable: false,
          score: 0,
          status: 'incompatible' as const,
          errors: [{ severity: 'error' as const, message: 'خطا در ارتباط با سرور اسمبل' }],
          warnings: [],
          info: [],
          blockedPartIds: [],
          unavailablePartIds: [],
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'assemble-proxy-v2',
    engine: ASSEMBLY_ENGINE_URL,
    version: '2.0',
  });
}
