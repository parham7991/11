/**
 * /api/assemble/ai-analyze — Final AI analysis for assembled system
 * ──────────────────────────────────────────────────────────────────
 * Uses offl-chat-elite model for final analysis.
 * Falls back to deterministic analysis if AI fails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiChatConfig } from '@/lib/ai-chat/config';
import { aiNonStreamRequest, type AiClientOptions } from '@/lib/ai-chat/ai-client';
import { buildFullTelemetry, type TelemetryPart } from '@/lib/ai-chat/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AnalysisRequest = {
  useCase: string;
  budget: number;
  parts: Array<{
    category: string;
    categoryLabel: string;
    name: string;
    shortSpec?: string;
    specs?: any;
    quantity?: number;
    quantityLabel?: string;
    price: number;
  }>;
  useCaseLabel?: string;
  compatibilityScore?: number;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as AnalysisRequest;
    const config = getAiChatConfig();

    const telemetry = buildFullTelemetry((body.parts || []) as unknown as TelemetryPart[]);

    if (!config.enabled || !config.apiKey) {
      return NextResponse.json({
        ok: false,
        enabled: false,
        message: 'تحلیل آنلاین AI فعال نیست؛ تحلیل تخصصی داخلی نمایش داده شد.',
        fallback: buildFallbackAnalysis(body),
        telemetry,
      });
    }

    const useCaseFa: Record<string, string> = {
      gaming: 'گیمینگ',
      office: 'اداری',
      editing: 'ادیت و رندر',
      streaming: 'استریم',
      custom: 'دلخواه',
    };
    const partsText = body.parts
      .map(
        (p) =>
          `- ${p.categoryLabel}: ${p.name}${p.quantity && p.quantity > 1 ? ` × ${p.quantity.toLocaleString('fa-IR')}` : ''}${p.shortSpec ? ` (${p.shortSpec})` : ''} | ${p.price.toLocaleString('fa-IR')} تومان`
      )
      .join('\n');

    const userPrompt = `سیستم "${useCaseFa[body.useCase] || body.useCase}" با بودجه ${body.budget.toLocaleString('fa-IR')} تومان:

${partsText}

امتیاز سازگاری: ${body.compatibilityScore || '?'}/100

در ۳-۴ خط کوتاه فارسی تحلیل کن. بدون ایموجی، بدون تکرار قیمت، بدون متن تبلیغاتی. گلوگاه و نقطه قوت اصلی، پیشنهاد ارتقا، سطح عملکرد.`;

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

    try {
      const result = await aiNonStreamRequest(
        opts,
        [
          {
            role: 'system',
            content:
              'تو کارشناس سخت‌افزار هستی. کوتاه، شیک، بدون ایموجی و تکرار قیمت تحلیل بده. برای سایت عمومی و مشتری نهایی.',
          },
          { role: 'user', content: userPrompt },
        ],
        req.signal
      );

      if (result.text && result.text.trim()) {
        return NextResponse.json({
          ok: true,
          enabled: true,
          provider: config.providerId,
          model: config.analysisModel,
          analysis: result.text,
          telemetry,
          meta: result.meta,
        });
      }
    } catch (aiErr) {
      console.error('AI analyze error:', aiErr instanceof Error ? aiErr.message : aiErr);
    }

    // Fallback
    return NextResponse.json({
      ok: false,
      enabled: true,
      message: 'تحلیل AI ناموفق — تحلیل داخلی نمایش داده شد.',
      fallback: buildFallbackAnalysis(body),
      telemetry,
    });
  } catch (e) {
    console.error('ai-analyze error:', e);
    return NextResponse.json({ error: 'خطا در تحلیل AI.' }, { status: 500 });
  }
}

function buildFallbackAnalysis(body: AnalysisRequest): string {
  const parts = body.parts || [];
  const cpu = parts.find((p) => p.category === 'cpu');
  const gpu = parts.find((p) => p.category === 'gpu');
  const ram = parts.find((p) => p.category === 'ram');
  const storageParts = parts.filter((p) => p.category === 'storage');
  const psu = parts.find((p) => p.category === 'psu');

  const qty = (p: any) => Math.max(1, Number(p?.quantity || 1));
  const ramGb = ram?.specs?.capacity ? Number(ram.specs.capacity) * qty(ram) : 0;
  const storageGb = storageParts.reduce((s, p: any) => s + Number(p.specs?.size || 0) * qty(p), 0);
  const gpuVram = Number(gpu?.specs?.vram || 0);
  const cpuCores = Number(cpu?.specs?.cores || 0);

  const strengths: string[] = [];
  const bottlenecks: string[] = [];

  if (cpuCores >= 8) strengths.push(`CPU ${cpuCores} هسته‌ای`);
  if (gpuVram >= 8) strengths.push(`GPU ${gpuVram}GB VRAM`);
  if (ramGb >= 32) strengths.push(`رم ${ramGb}GB`);
  else if (ramGb >= 16) strengths.push(`رم ${ramGb}GB`);
  if (storageGb >= 2000) strengths.push(`${Math.round(storageGb / 1000)}TB حافظه`);

  if (ramGb < 16) bottlenecks.push('رم کمتر از 16GB');
  if (body.useCase === 'gaming' && gpuVram < 8) bottlenecks.push('VRAM محدود');
  if (storageGb < 1000) bottlenecks.push('حافظه زیر 1TB');

  const target =
    body.useCase === 'gaming'
      ? gpuVram >= 12 && ramGb >= 32
        ? '1440p High/Ultra'
        : gpuVram >= 8
          ? '1080p High'
          : '1080p Medium'
      : body.useCase === 'editing'
        ? ramGb >= 32 && cpuCores >= 8
          ? 'ادیت حرفه‌ای'
          : 'ادیت سبک'
        : 'استفاده روزمره';

  return `تحلیل سیستم برای ${body.useCaseLabel || body.useCase}

هدف عملکردی: ${target}
${strengths.length ? 'نقاط قوت: ' + strengths.join('، ') : 'ترکیب قطعات کامل'}
${bottlenecks.length ? 'قابل بهبود: ' + bottlenecks.join('، ') : 'سیستم متعادل'}`;
}
