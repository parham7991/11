/**
 * ════════════════════════════════════════════════════════════════
 * 🤖 /api/assemble/ai-pick — انتخاب قطعه با AI
 * ════════════════════════════════════════════════════════════════
 *
 * این endpoint از AI می‌خواد از بین کاندیداهای هر دسته، **بهترین قطعه**
 * رو انتخاب کنه. AI با در نظر گرفتن:
 *   - بودجه
 *   - کاربری (gaming/editing/streaming/office)
 *   - سازگاری با قطعات دیگر
 *   - کیفیت/رتبه قطعه
 *
 * ════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAiChatConfig } from '@/lib/ai-chat/config';
import { getProxyFetch } from '@/lib/ai-chat/proxy-fetch';
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
  useCaseLabel?: string;
  budget: number;
  totalSpent: number; // هزینهٔ قطعات انتخاب‌شده قبلی
  remainingBudget: number;
  pickedParts: PartCandidate[]; // قطعاتی که قبلاً انتخاب شدن
  category: string; // مثلاً "cpu", "motherboard"
  categoryLabel: string; // مثلاً "پردازنده (CPU)"
  budgetShare: number; // سهم پیشنهادی بودجه
  priceRange?: { min: number; max: number; ideal: number; note?: string }; // بازه دقیق همین دسته
  candidates: PartCandidate[]; // گزینه‌های ممکن
  maxPick: number; // حداکثر تعداد خروجی (معمولاً ۱)
};

/**
 * پیش‌فیلتر guardrail: کاندیداهایی که کلمهٔ ممنوعه دارند یا زیر
 * حداقل قیمت منطقی هستند از لیست حذف می‌شوند تا AI و rule-based
 * هر دو با یک لیست پاک کار کنند.
 */
function sanitizeCandidates(body: PickRequest): PartCandidate[] {
  if (!body.candidates?.length) return [];
  return body.candidates.filter((c) => {
    const r = validatePartCategory(body.category, {
      title: c.name,
      name: c.name,
      price: c.price,
      finalPrice: c.finalPrice,
      specs: c.specs || {},
    });
    return r.passed;
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as PickRequest;
    const config = getAiChatConfig();

    // ═════ لایهٔ گاردریل: پاک‌سازی اولیهٔ کاندیداها ═════
    const cleanCandidates = sanitizeCandidates(body);
    const workingBody: PickRequest = {
      ...body,
      candidates: cleanCandidates.length ? cleanCandidates : body.candidates,
    };

    // ═════ موتور اقتصادی خنک‌کننده (Air/Liquid Tier-Based) ═════
    // برای دستهٔ cooler، به‌جای الگوریتم عمومی، از موتور اختصاصی
    // pickBestCoolerEconomical استفاده می‌کنیم که از کف قیمت شروع
    // می‌کند و متناسب با TDP پردازندهٔ انتخابی، ساده‌ترین گزینهٔ
    // کافی را برمی‌گرداند.
    if (workingBody.category === 'cooler' && workingBody.candidates.length > 0) {
      const selectedCpu = workingBody.pickedParts.find((p) => p.category === 'cpu');
      const economical = pickBestCoolerEconomical(
        workingBody.candidates as any,
        selectedCpu as any
      );
      if (economical) {
        return NextResponse.json({
          ok: true,
          aiEnabled: false,
          picks: [economical],
          method: 'cooler-economic-engine',
          reason: (economical as any).pickReason || 'Cooler tier-based economical selection',
        });
      }
    }

    if (!config.enabled || !config.apiKey) {
      // AI غیرفعال — از rule-based استفاده کن
      return NextResponse.json({
        ok: true,
        aiEnabled: false,
        picks: ruleBasedPick(workingBody),
        method: 'rule-based',
        guardrailFilteredCount: body.candidates.length - cleanCandidates.length,
      });
    }

    const prompt = buildPickPrompt(workingBody);

    try {
      const doFetch = await getProxyFetch(config.proxyUrl, config.useProxy);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const requestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content:
                'تو یک کارشناس سخت‌افزار کامپیوتر و اسمبل حرفه‌ای هستی. قبل از انتخاب، سازگاری، بودجه، ارزش خرید، اسلات‌های RAM/M.2/SATA، توان پاور و نیاز کاربری را دقیق تحلیل کن؛ اما در خروجی فقط ID قطعه را برگردان.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1, // کم — برای ثبات
          max_tokens: 200,
          stream: false,
        }),
        signal: controller.signal,
      };

      let aiRes: Response;
      try {
        aiRes = await doFetch(`${config.apiBase}/chat/completions`, requestInit);
      } catch (proxyErr) {
        if (!config.useProxy) throw proxyErr;
        aiRes = await fetch(`${config.apiBase}/chat/completions`, requestInit);
      }

      clearTimeout(timeout);

      if (!aiRes.ok) {
        return NextResponse.json({
          ok: true,
          aiEnabled: true,
          picks: ruleBasedPick(workingBody),
          method: 'rule-based-fallback',
          reason: `AI error ${aiRes.status}`,
        });
      }

      const data = await aiRes.json();
      const text = String(data?.choices?.[0]?.message?.content || '').trim();

      // استخراج ID از پاسخ AI — فقط از بین کاندیداهای پاک
      const aiPicks = parseAiPicks(text, workingBody.candidates, workingBody.maxPick);

      // ═════ گاردریل نهایی: حتی اگر AI انتخابی داد، دوباره چک کن ═════
      const validatedPicks = aiPicks.filter((p) => {
        const r = validatePartCategory(workingBody.category, {
          title: p.name,
          name: p.name,
          price: p.price,
          finalPrice: p.finalPrice,
          specs: p.specs || {},
        });
        return r.passed;
      });

      return NextResponse.json({
        ok: true,
        aiEnabled: true,
        picks: validatedPicks.length ? validatedPicks : ruleBasedPick(workingBody),
        method: validatedPicks.length ? 'ai' : 'rule-based',
        aiRaw: text,
        guardrailFilteredCount: body.candidates.length - cleanCandidates.length,
      });
    } catch (aiErr: any) {
      return NextResponse.json({
        ok: true,
        aiEnabled: true,
        picks: ruleBasedPick(workingBody),
        method: 'rule-based-fallback',
        reason: aiErr?.message,
      });
    }
  } catch (e) {
    console.error('ai-pick error:', e);
    return NextResponse.json({ error: 'خطا در انتخاب AI.' }, { status: 500 });
  }
}

/**
 * ساخت پرامپت برای AI
 */
function buildPickPrompt(body: PickRequest): string {
  const useCaseFa: Record<string, string> = {
    gaming: 'گیمینگ',
    office: 'اداری',
    editing: 'ادیت و رندر',
    streaming: 'استریم',
    custom: 'دلخواه',
  };

  const pickedText = body.pickedParts
    .map(
      (p) =>
        `- ${p.category}: ${p.name} (${p.shortSpec || '—'}) | قیمت: ${p.finalPrice.toLocaleString('fa-IR')}`
    )
    .join('\n');

  const candidatesText = body.candidates
    .map(
      (c, idx) =>
        `${idx + 1}. [ID=${c.id}] ${c.name} | ${c.shortSpec || '—'} | قیمت: ${c.finalPrice.toLocaleString('fa-IR')} | رتبه: ${c.confidence || 0}%`
    )
    .join('\n');

  const smartHint =
    body.category === 'ram'
      ? 'برای RAM فقط ظرفیت خام کافی نیست؛ تعداد ماژول/کیت و استفاده از اسلات‌ها را هم حساب کن. اگر ۴GB کم است، ۱۶GB حداقل خوب است و با مادربرد ۴ اسلات می‌توان ۲×۸ یا چند کیت سازگار گذاشت، به شرط بودجه و DDR یکسان.'
      : body.category === 'storage'
        ? 'برای Storage فقط یک SSD انتخاب نکن اگر بودجه/کاربری حرفه‌ای و اسلات M.2/SATA اجازه می‌دهد؛ SSDهای NVMe پرظرفیت و امکان چند SSD را در نظر بگیر.'
        : body.category === 'motherboard'
          ? 'برای Motherboard مدل‌هایی با RAM slots و M.2 slots بیشتر در بودجه مناسب ارزش بالاتری دارند چون ارتقا و چند SSD/RAM را ممکن می‌کنند.'
          : body.category === 'case'
            ? 'برای Case حتماً فرم‌فکتور مادربرد، طول کارت گرافیک، airflow/mesh و کاربری را حساب کن. برای گیمینگ کیس اداری/بسته انتخاب نکن؛ کیس گیمینگ airflow یا mesh اولویت دارد.'
            : body.category === 'cooler'
              ? 'برای Cooler حتماً TDP پردازنده، Tray/بدون‌باکس بودن CPU، کاربری سنگین و فضای کیس را حساب کن. اگر CPU قوی است کولر ضعیف انتخاب نکن.'
              : body.category === 'psu'
                ? 'برای PSU توان واقعی CPU+GPU با حاشیه امن، گواهی 80Plus و آینده‌نگری ارتقا را حساب کن.'
                : 'انتخاب را بر اساس کارایی واقعی، سازگاری و ارزش خرید انجام بده.';

  return `کاربری: "${useCaseFa[body.useCase] || body.useCase}" | بودجهٔ باقی‌مانده: ${body.remainingBudget.toLocaleString('fa-IR')} تومان (از ${body.budget.toLocaleString('fa-IR')} کل)

قطعات انتخاب‌شده قبلی:
${pickedText || '(هنوز قطعه‌ای انتخاب نشده)'}

الان باید "${body.categoryLabel}" انتخاب کنی.
سهم پیشنهادی بودجه: ${body.budgetShare.toLocaleString('fa-IR')} تومان
بازه دقیق همین دسته: ${(body.priceRange?.min || 0).toLocaleString('fa-IR')} تا ${(body.priceRange?.max || body.remainingBudget).toLocaleString('fa-IR')} تومان؛ ایده‌آل: ${(body.priceRange?.ideal || body.budgetShare).toLocaleString('fa-IR')} تومان
${body.priceRange?.note ? `یادداشت بازه: ${body.priceRange.note}` : ''}

قانون مهم: انتخاب باید مثل تصمیم نهایی یک متخصص AI باشد. فقط قطعه‌ای را انتخاب کن که داخل بازه دقیق باشد، با قطعات قبلی سازگار باشد، موجود باشد، و نسبت کارایی/قیمت بهتری بدهد. از انتخاب قطعه خیلی ارزانِ ضعیف یا خیلی گرانِ خارج از سهم خودداری کن.
قانون تخصصی همین دسته: ${smartHint}

گزینه‌های موجود:
${candidatesText}

فقط ID بهترین گزینه را برگردان (${body.maxPick} عدد). فقط در یک خط، به فرمت دقیق:
PICK: id1${body.maxPick > 1 ? ',id2' : ''}`;
}

/**
 * استخراج ID از پاسخ AI
 */
function parseAiPicks(text: string, candidates: PartCandidate[], maxPick: number): PartCandidate[] {
  // پترن: PICK: 123,456 یا PICK: 123
  const match = text.match(/PICK\s*:?\s*([\d,\s]+)/i);
  if (!match) return [];

  const ids = match[1]
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));
  const picks: PartCandidate[] = [];
  for (const id of ids) {
    const found = candidates.find((c) => Number(c.id) === id);
    if (found && picks.length < maxPick) {
      picks.push(found);
    }
  }
  return picks;
}

/**
 * انتخاب rule-based (fallback)
 * بهترین قطعه بر اساس confidence + تطابق با بودجه
 */
function candidateSmartScore(c: PartCandidate, body: PickRequest, targetPrice: number): number {
  let score = Number(c.confidence || 50);
  score -= Math.min(30, (Math.abs(c.finalPrice - targetPrice) / Math.max(1, targetPrice)) * 20);

  if (body.category === 'ram') {
    const cap = Number(c.specs?.capacity || 0);
    const modules = Number(
      c.specs?.moduleCount || (String(c.specs?.channel || '').toLowerCase() === 'dual' ? 2 : 1)
    );
    const targetRam =
      body.useCase === 'editing' ? 32 : ['gaming', 'streaming'].includes(body.useCase) ? 16 : 16;
    if (cap >= 32) score += 20;
    else if (cap >= targetRam) score += 12;
    else score -= 18;
    if (modules === 2) score += 8;
    if (c.specs?.ramType === 'DDR5') score += 4;
    if (Number(c.specs?.frequency || 0) >= 5600) score += 4;
  }

  if (body.category === 'storage') {
    const size = Number(c.specs?.size || 0);
    if (c.specs?.isNVMe) score += 14;
    if (size >= 2000) score += 14;
    else if (size >= 1000) score += 8;
    if (c.specs?.pcie === '5.0') score += 5;
    else if (c.specs?.pcie === '4.0') score += 4;
  }

  if (body.category === 'motherboard') {
    score += Math.min(12, Number(c.specs?.ramSlots || 4) * 2);
    score += Math.min(12, Number(c.specs?.m2Slots || 2) * 3);
    if (c.specs?.wifi) score += 3;
  }

  if (body.category === 'gpu' && c.specs?.vram) score += Math.min(22, Number(c.specs.vram) * 1.8);
  if (body.category === 'cpu' && c.specs?.cores) score += Math.min(20, Number(c.specs.cores) * 1.6);
  if (body.category === 'case') {
    if (body.useCase !== 'office') {
      if (c.specs?.gamingCase) score += 22;
      if (c.specs?.airflow) score += 18;
      if (!c.specs?.gamingCase && !c.specs?.airflow) score -= 28;
      if (c.specs?.officeCase && !c.specs?.gamingCase) score -= 45;
      if (Number(c.specs?.gpuMaxLength || 0) >= 340) score += 10;
    } else if (c.specs?.officeCase) score += 8;
  }
  if (body.category === 'cooler') {
    const tdp = Number(c.specs?.tdpRating || 0);
    if (tdp >= 220) score += 18;
    else if (tdp >= 180) score += 12;
    if (c.specs?.type === 'aio' && body.useCase !== 'office') score += 6;
  }

  return score;
}

function ruleBasedPick(body: PickRequest): PartCandidate[] {
  const targetPrice = body.priceRange?.ideal || body.budgetShare;
  const minPrice = Math.max(0, (body.priceRange?.min || 0) * 0.75);
  const maxPrice = Math.min(
    body.remainingBudget * 1.05,
    body.priceRange?.max || body.remainingBudget * 1.05
  );

  // فیلتر: قطعات در بازهٔ دقیق همین دسته
  const valid = body.candidates.filter(
    (c) =>
      c.inStock !== false &&
      c.finalPrice > 0 &&
      c.finalPrice >= minPrice &&
      c.finalPrice <= maxPrice
  );

  if (valid.length === 0) {
    // اگه چیزی در بازه نبود، نزدیک‌ترین گزینه به سقف مجاز/ایده‌آل را بردار نه صرفاً ارزان‌ترین
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

  // امتیازدهی: confidence + نزدیکی به قیمت هدف + قواعد تخصصی RAM/SSD/MB
  const scored = valid.map((c) => ({
    part: c,
    score: candidateSmartScore(c, body, targetPrice),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, body.maxPick).map((s) => s.part);
}
