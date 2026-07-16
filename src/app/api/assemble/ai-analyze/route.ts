/**
 * ════════════════════════════════════════════════════════════════
 * 🤖 /api/assemble/ai-analyze — تحلیل AI سیستم اسمبل‌شده (v5)
 * ════════════════════════════════════════════════════════════════
 *
 * بعد از اسمبل، با استفاده از AI (groq/gemini/openrouter) یه تحلیل
 * عمیق‌تر می‌ده:
 *   - آیا انتخاب مناسبه؟
 *   - آیا bottleneck داره؟
 *   - پیشنهاد بهبود هوشمند
 *   - ارزیابی عملکرد واقعی
 *
 * ════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiChatConfig } from '@/lib/ai-chat/config';
import { getProxyFetch } from '@/lib/ai-chat/proxy-fetch';
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

    // ═════ محاسبهٔ تله‌متری کامل قبل از هر چیز (همیشه برگردانده می‌شود) ═════
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

    // ═══════ ساخت پرامپت تحلیل ═══════
    const systemPrompt =
      'تو یک کارشناس سخت‌افزار کامپیوتر و اسمبل حرفه‌ای هستی. پاسخ برای سایت عمومی فروشگاهی است: کوتاه، شیک، بدون ایموجی، بدون متن طولانی و بدون تکرار قیمت. فقط تحلیل کاربردی و قابل اعتماد بده.';
    const userPrompt = buildAnalysisPrompt(body);

    // ═══════ فراخوانی AI ═══════
    try {
      const doFetch = await getProxyFetch(config.proxyUrl, config.useProxy);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const requestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.35,
          max_tokens: 900,
          stream: false,
        }),
        signal: controller.signal,
      };

      let aiRes: Response;
      try {
        aiRes = await doFetch(`${config.apiBase}/chat/completions`, requestInit);
      } catch (proxyErr) {
        // اگر پروکسی ست شده ولی در سیستم کاربر بالا نبود، مستقیم هم تست کن تا AI بی‌دلیل fallback نشود.
        if (!config.useProxy) throw proxyErr;
        aiRes = await fetch(`${config.apiBase}/chat/completions`, requestInit);
      }

      clearTimeout(timeout);

      if (!aiRes.ok) {
        const errText = await aiRes.text().catch(() => '');
        console.error('AI analyze error:', aiRes.status, errText.slice(0, 300));
        return NextResponse.json({
          ok: false,
          enabled: true,
          message: `خطا در تحلیل AI (${aiRes.status})`,
          fallback: buildFallbackAnalysis(body),
          telemetry,
        });
      }

      const data = await aiRes.json();
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';

      return NextResponse.json({
        ok: true,
        enabled: true,
        provider: config.providerId,
        model: config.model,
        analysis: text,
        telemetry,
      });
    } catch (aiErr: any) {
      console.error('AI analyze exception:', aiErr);
      return NextResponse.json({
        ok: false,
        enabled: true,
        message: `خطا در تحلیل AI: ${aiErr?.message || 'unknown'}`,
        fallback: buildFallbackAnalysis(body),
        telemetry,
      });
    }
  } catch (e) {
    console.error('ai-analyze error:', e);
    return NextResponse.json({ error: 'خطا در تحلیل AI.' }, { status: 500 });
  }
}

/**
 * ساخت پرامپت تحلیل برای AI
 */
function buildAnalysisPrompt(body: AnalysisRequest): string {
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
        `- ${p.categoryLabel}: ${p.name}` +
        (p.quantity && p.quantity > 1 ? ` × ${p.quantity.toLocaleString('fa-IR')}` : '') +
        (p.shortSpec ? ` (${p.shortSpec})` : '') +
        (p.quantityLabel ? ` | ${p.quantityLabel}` : '') +
        (p.price ? ` | قیمت واحد: ${p.price.toLocaleString('fa-IR')} تومان` : '')
    )
    .join('\n');

  return `یک سیستم کامپیوتر برای "${useCaseFa[body.useCase] || body.useCase}" با بودجهٔ ${body.budget.toLocaleString('fa-IR')} تومان اسمبل شده:

${partsText}

امتیاز سازگاری: ${body.compatibilityScore || '?'}/100

در ۳ تا ۴ خط کوتاه فارسی پاسخ بده.
قواعد مهم:
- ایموجی استفاده نکن.
- قیمت را تکرار نکن.
- متن تبلیغاتی یا طولانی ننویس.
- اگر ارتقا لازم است فقط نام دسته را بگو؛ UI خودش کالای هماهنگ را پیشنهاد می‌دهد.
- برای سایت عمومی و مشتری نهایی، شیک و قابل اعتماد بنویس.

ساختار پیشنهادی:
خط ۱: جمع‌بندی مناسب بودن سیستم.
خط ۲: گلوگاه احتمالی یا نقطه قوت اصلی.
خط ۳: پیشنهاد ارتقای کوتاه، اگر لازم است.
خط ۴: سطح اجرای بازی/کار سنگین.
`;
}

/**
 * تحلیل fallback (بدون AI)
 */
function buildFallbackAnalysis(body: AnalysisRequest): string {
  const parts = body.parts || [];
  const cpu = parts.find((p) => p.category === 'cpu');
  const gpu = parts.find((p) => p.category === 'gpu');
  const ram = parts.find((p) => p.category === 'ram');
  const storageParts = parts.filter((p) => p.category === 'storage');
  const mb = parts.find((p) => p.category === 'motherboard');
  const psu = parts.find((p) => p.category === 'psu');
  const cooler = parts.find((p) => p.category === 'cooler');

  const qty = (p: any) => Math.max(1, Number(p?.quantity || 1));
  const ramGb = ram?.specs?.capacity ? Number(ram.specs.capacity) * qty(ram) : 0;
  const storageGb = storageParts.reduce((s, p: any) => s + Number(p.specs?.size || 0) * qty(p), 0);
  const gpuVram = Number(gpu?.specs?.vram || 0);
  const cpuCores = Number(cpu?.specs?.cores || 0);
  const psuW = Number(psu?.specs?.wattage || 0);

  const strengths: string[] = [];
  const bottlenecks: string[] = [];
  const upgrades: string[] = [];

  if (cpuCores >= 8) strengths.push(`CPU با ${cpuCores} هسته برای پردازش‌های سنگین مناسب است`);
  if (gpuVram >= 8)
    strengths.push(`GPU با ${gpuVram}GB VRAM برای گیمینگ 1080p/1440p انتخاب خوبی است`);
  if (ramGb >= 32)
    strengths.push(`رم مجموعاً ${ramGb}GB است و برای مالتی‌تسکینگ/گیمینگ سنگین عالی‌تر است`);
  else if (ramGb >= 16) strengths.push(`رم ${ramGb}GB حداقل استاندارد گیمینگ امروز را پوشش می‌دهد`);
  if (storageGb >= 2000)
    strengths.push(
      `حافظه مجموعاً حدود ${(storageGb / 1000).toLocaleString('fa-IR')}TB است و برای چند بازی/پروژه مناسب‌تره`
    );
  if (mb?.specs?.chipset) strengths.push(`مادربرد ${mb.specs.chipset} مبنای سازگاری سیستم است`);

  if (ramGb > 0 && ramGb < 16) {
    bottlenecks.push(
      `رم فعلی ${ramGb}GB است؛ برای گیمینگ جدید حداقل 16GB و بهتر 32GB پیشنهاد می‌شود`
    );
    upgrades.push('افزودن یک کیت رم هم‌نوع برای رسیدن به 16/32GB');
  }
  if (body.useCase === 'gaming' && gpuVram > 0 && gpuVram < 8) {
    bottlenecks.push(`VRAM کارت گرافیک ${gpuVram}GB است؛ در بازی‌های جدید ممکن است محدودکننده شود`);
    upgrades.push('ارتقای GPU به مدل 8GB یا بالاتر در اولین فرصت');
  }
  if (storageGb > 0 && storageGb < 1000) {
    bottlenecks.push(`حافظه کمتر از 1TB است؛ برای چند بازی سنگین زود پر می‌شود`);
    upgrades.push('اضافه کردن SSD دوم در صورت داشتن اسلات M.2/SATA آزاد');
  }
  if (body.useCase === 'editing' && cpuCores > 0 && cpuCores < 8) {
    bottlenecks.push(`برای ادیت و رندر، CPU کمتر از 8 هسته ممکن است کند باشد`);
  }
  if (psuW && gpu?.specs?.tdp && cpu?.specs?.tdp) {
    const need =
      Math.ceil(((Number(gpu.specs.tdp) + Number(cpu.specs.tdp) + 100) * 1.35) / 50) * 50;
    if (psuW >= need) strengths.push(`پاور ${psuW}W با حاشیه امن مناسب انتخاب شده`);
    else bottlenecks.push(`پاور ${psuW}W نزدیک به مرز است؛ حدود ${need}W مطمئن‌تر است`);
  }

  const target =
    body.useCase === 'gaming'
      ? gpuVram >= 12 && ramGb >= 32
        ? '1440p High/Ultra'
        : gpuVram >= 8
          ? '1080p High و 1440p Medium'
          : '1080p Medium'
      : body.useCase === 'editing'
        ? ramGb >= 32 && cpuCores >= 8
          ? 'ادیت نیمه‌حرفه‌ای تا حرفه‌ای'
          : 'ادیت سبک تا نیمه‌سنگین'
        : 'استفاده روزمره و کاری پایدار';

  return `تحلیل تخصصی سیستم برای ${body.useCaseLabel || body.useCase}

وضعیت کلی: این اسمبل برای هدف انتخاب‌شده قابل استفاده است و هدف عملکردی آن حدود «${target}» ارزیابی می‌شود.

نقاط قوت:
${strengths.length ? strengths.map((s) => `• ${s}`).join('\n') : '• ترکیب قطعات اصلی کامل است و قابلیت ارتقاء دارد'}

موارد قابل بهبود:
${bottlenecks.length ? bottlenecks.map((s) => `• ${s}`).join('\n') : '• گلوگاه جدی مشخصی دیده نمی‌شود؛ سیستم متعادل است'}

پیشنهاد ارتقاء دقیق:
${upgrades.length ? upgrades.map((s) => `• ${s}`).join('\n') : '• اگر بودجه اضافه داری، SSD دوم یا RAM بیشتر بهترین ارتقاء کم‌ریسک است'}

جمع‌بندی: اگر مادربرد اسلات آزاد داشته باشد، اضافه‌کردن RAM/SSD بیشتر کاملاً منطقی است و اسمبلر تلاش می‌کند از ظرفیت‌های آزاد مادربرد برای ساخت سیستم کامل‌تر استفاده کند.`;
}
