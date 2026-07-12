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
import { getAiChatConfig, getAiIdentity } from '@/lib/ai-chat/config';
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
  category: string;          // مثلاً "cpu", "motherboard"
  categoryLabel: string;     // مثلاً "پردازنده (CPU)"
  budgetShare: number;       // سهم پیشنهادی بودجه
  priceRange?: { min: number; max: number; ideal: number; note?: string }; // بازه دقیق همین دسته
  candidates: PartCandidate[]; // گزینه‌های ممکن
  maxPick: number;           // حداکثر تعداد خروجی (معمولاً ۱)
};

/**
 * پیش‌فیلتر guardrail: کاندیداهایی که کلمهٔ ممنوعه دارند یا زیر
 * حداقل قیمت منطقی هستند از لیست حذف می‌شوند تا AI و rule-based
 * هر دو با یک لیست پاک کار کنند.
 */
function sanitizeCandidates(body: PickRequest): PartCandidate[] {
  if (!body.candidates?.length) return [];
  return body.candidates.filter(c => {
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
      const selectedCpu = workingBody.pickedParts.find(p => p.category === 'cpu');
      const economical = pickBestCoolerEconomical(
        workingBody.candidates as any,
        selectedCpu as any,
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
              content: 'تو «فیری» هستی، کارشناس ارشد اسمبل سخت‌افزار فروشگاه آفلند با سال‌ها تجربهٔ عملی. وظیفهٔ تو انتخاب دقیقاً بهترین قطعه از میان کاندیداهای واقعی است، نه یک انتخاب کلی. قبل از هر انتخاب این مراحل را در ذهن طی کن: (۱) کاربری دقیق و اولویت‌های منحصربه‌فرد آن را بشناس — گیمینگ روی GPU/VRAM، رندر و ادیت روی هسته‌های CPU و رم و NVMe، استریم روی تعادل CPU+GPU، اداری روی iGPU و سکوت و قیمت. هر کاربری باید انتخاب متفاوتی بگیرد. (۲) سازگاری صد‌درصدی با قطعات انتخاب‌شده را بررسی کن (سوکت CPU↔مادربرد، نوع RAM↔مادربرد، توان کافی PSU با حاشیه، فرم‌فکتور و طول GPU در کیس، توان حرارتی کولر≥TDP پردازنده). قطعهٔ ناسازگار هرگز انتخاب نکن. (۳) بودجه و سهم منطقی این دسته را رعایت کن؛ نه ارزانِ ضعیف، نه گرانِ خارج از سهم. (۴) نسبت کارایی به قیمت واقعی را با تکیه بر مشخصات فنی کالاها بسنج. مثل یک متخصص که پول خودش را خرج می‌کند تصمیم بگیر. تمام تحلیل را در ذهن انجام بده و در خروجی فقط دو خط PICK و WHY را برگردان، بدون هیچ متن اضافه.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.05, // خیلی کم — بیشترین ثبات و دقت در انتخاب
          max_tokens: 360, // فضا برای PICK + WHY
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

      // استخراج ID + دلیل از پاسخ AI — فقط از بین کاندیداهای پاک
      const { picks: aiPicks, reason: aiReason } = parseAiPicks(text, workingBody.candidates, workingBody.maxPick);

      // ═════ گاردریل نهایی: حتی اگر AI انتخابی داد، دوباره چک کن ═════
      const validatedPicks = aiPicks.filter(p => {
        const r = validatePartCategory(workingBody.category, {
          title: p.name, name: p.name, price: p.price, finalPrice: p.finalPrice, specs: p.specs || {},
        });
        if (!r.passed) return false;
        // چک سازگاری با قطعات قبلی (مثلاً سوکت/فرم‌فکتور/توان) — حتی
        // اگر AI قطعه‌ای ناسازگار برگرداند، حذف می‌شود و به fallback می‌رود.
        return compatibilityInfo(p as PartCandidate, workingBody).compatible;
      });

      return NextResponse.json({
        ok: true,
        aiEnabled: true,
        picks: validatedPicks.length ? validatedPicks : ruleBasedPick(workingBody),
        method: validatedPicks.length ? 'ai' : 'rule-based',
        reason: aiReason || undefined,
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
 * پروفایل دقیق و «منحصر‌به‌فرد» هر کاربری — انتخاب باید دقیقاً متناسب با
 * همین کاربری باشد، نه یک انتخاب یکسان برای همه. هر کاربری هدف، اولویت،
 * پرهیز و راهنمای اختصاصیِ به‌تفکیک دسته دارد تا دقت انتخاب بالا برود.
 */
const USE_CASE_PROFILE: Record<string, {
  label: string;
  priorities: string[];
  targets: string;
  avoid: string;
  perCategory: Record<string, string>;
}> = {
  gaming: {
    label: 'گیمینگ (بازی‌های سنگین، FPS بالا و روان)',
    priorities: ['قدرت GPU (VRAM ۱۲GB+)', 'تعادل CPU که گلوگاه نشود', 'سرعت RAM (DDR5، ۱۶-۳۲GB)', 'SSD NVMe سریع'],
    targets: 'بیشترین اولویت با کارت گرافیک (۳۵-۴۵٪ بودجه). CPU متناسب انتخاب کن که در بازی‌های جدید گلوگاه نشود (۶-۸ هسته ایده‌آل). رم حداقل ۱۶GB (ترجیحاً ۳۲GB) DDR5. کیس گیمینگ با airflow و کولر متناسب با TDP.',
    avoid: 'کارت گرافیک ضعیف (<۸GB VRAM)، رم کمتر از ۱۶GB، کیس بسته/اداری، پاور کم‌توان، CPU خیلی قوی که بودجهٔ GPU را ببلعد.',
    perCategory: {
      gpu: 'مهم‌ترین قطعه. VRAM بالاتر بهتر (۱۲GB+ ایده‌آل). به tier و توان توجه کن؛ GPU گلوگاه گیمینگ است.',
      cpu: 'تعادل: ۶-۸ هسته کافی؛ نباید گلوگاه شود ولی نباید بودجهٔ GPU را ببلعد.',
      ram: '۱۶GB حداقل، ۳۲GB ایده‌آل، DDR5 ترجیحی، فرکانس ۵۶۰۰MHz+.',
      storage: 'SSD NVMe پرسرعت، حداقل ۱TB؛ چند SSD برای کتابخانهٔ بازی مفید است.',
      motherboard: 'سوکت هم‌راستا با CPU، پشتیبانی DDR5، اسلات M.2 کافی.',
      psu: 'توان کافی برای GPU+CPU با حاشیه ۳۰٪؛ گواهی 80Plus برنز/گلد.',
      case: 'حتماً گیمینگ/airflow، طول کافی برای GPU، فرم‌فکتور منطبق با مادربرد.',
      cooler: 'متناسب با TDP پردازنده؛ برای پردازندهٔ قوی AIO یا دوال‌تاور.',
    },
  },
  office: {
    label: 'اداری / روزمره (سکوت، مصرف کم، قیمت مناسب)',
    priorities: ['پردازنده با iGPU', 'سکوت و حرارت پایین', 'قیمت مناسب', 'رم کافی برای چندبرنامه'],
    targets: 'پردازنده با گرافیک یکپارچه (iGPU) تا نیازی به کارت گرافیک نباشد. رم ۸-۱۶GB. SSD برای سرعت بوت. کیس جمع‌وجور و بی‌صدا. پاور استاندارد. اکثر پردازنده‌ها با فن استوک کار می‌کنند.',
    avoid: 'کارت گرافیک گران‌قیمت، کولر آبی بزرگ، قطعات گیمینگ پرقدرت که بودجه را هدر می‌دهند، کیس گیمینگ پرسروصدا.',
    perCategory: {
      gpu: 'معمولاً نیازی نیست؛ اگر انتخاب شد فقط برای نمایش چندنمایشگر سبک.',
      cpu: 'اولویت با iGPU (اکثر Intel با گرافیک یکپارچه). ۴-۶ هسته کافی. مصرف کم.',
      ram: '۸-۱۶GB کافی؛ DDR4 ارزان‌تر هم قابل قبول.',
      storage: 'SSD ساده ۵۰۰GB-۱TB کافی؛ NVMe سرعت بوت را بهتر می‌کند.',
      motherboard: 'مادربرد جمع‌وجور با iGPU پشتیبانی‌شده؛ رم DDR4 ارزان‌تر.',
      psu: 'پاور استاندارد ۳۰۰-۴۵۰W کافی (بدون GPU سنگین).',
      case: 'کیس اداری/جمع‌وجور، بی‌صدا، ترجیحاً بدون RGB پرنور.',
      cooler: 'معمولاً لازم نیست (فن استوک کافی)؛ فقط برای پردازنده‌های بدون فن.',
    },
  },
  editing: {
    label: 'ادیت / رندر / طراحی (چندهسته‌ای + رم + VRAM)',
    priorities: ['هسته/رشته CPU بالا', 'رم زیاد (۳۲GB+)', 'GPU با VRAM بالا', 'SSD خیلی سریع و پرظرفیت'],
    targets: 'CPU چندهسته‌ای قوی (۱۲+ هسته) برای رندر. رم ۳۲GB یا بیشتر. GPU با ۱۲GB+ VRAM برای پیش‌نمایش/اکسلریت. مادربرد حرفه‌ای با اسلات M.2 فراوان. کولر قوی برای پایداری زیر بار طولانی.',
    avoid: 'رم کمتر از ۱۶GB، SSD کند/کم‌ظرفیت، مادربرد با اسلات کم که ارتقا را ببندد، پاور کم‌توان.',
    perCategory: {
      gpu: 'VRAM بالا (۱۲GB+) برای پیش‌نمایش و اکسلریت رندر حیاتی است.',
      cpu: 'مهم‌ترین برای رندر: ۱۲-۱۶+ هسته و رشتهٔ بالا.',
      ram: '۳۲GB حداقل، ۶۴GB ایده‌آل؛ DDR5 ترجیحی برای پهنای باند.',
      storage: 'SSD NVMe پرسرعت و پرظرفیت (۲TB+)؛ چند SSD برای scratch/cache.',
      motherboard: 'چیپ‌ست حرفه‌ای، اسلات M.2 فراوان (۳-۴)، پشتیبانی رم زیاد.',
      psu: 'توان کافی برای CPU+GPU سنگین با حاشیه ایمن.',
      case: 'کیس با جریان هوای خوب برای بار طولانی رندر؛ فرم‌فکتور بزرگ‌تر راحت‌تر.',
      cooler: 'کولر قوی (AIO ۲۴۰/۳۶۰ یا دوال‌تاور) برای پایداری زیر بار ۱۰۰٪.',
    },
  },
  streaming: {
    label: 'استریم / تولید محتوا (تعادل CPU+GPU)',
    priorities: ['CPU چندهسته برای انکد همزمان', 'GPU برای بازی + انکد', 'رم ۱۶-۳۲GB', 'فضای ذخیرهٔ سریع'],
    targets: 'تعادل CPU قوی چندهسته‌ای + GPU مناسب برای بازی و همزمان انکد. رم ۱۶-۳۲GB. SSD سریع برای ضبط. کولر قوی برای پایداری طولانی‌مدت روی ۱۰۰٪ بار.',
    avoid: 'پردازندهٔ ضعیف تک‌هسته، رم کم، خنک‌سازی ناکافی که باعث افت کلاک و فریم شود.',
    perCategory: {
      gpu: 'هم برای بازی هم برای انکد (NVENC)؛ ۸-۱۲GB VRAM مناسب.',
      cpu: 'تعادل: ۸-۱۲ هسته برای انکد x264/NVENC همزمان با بازی.',
      ram: '۱۶GB حداقل، ۳۲GB برای چندوظیفه‌ای همزمان.',
      storage: 'SSD NVMe سریع، ۱-۲TB برای ضبط ویدیو.',
      motherboard: 'سوکت هم‌راستا با CPU، رم DDR5، اسلات M.2 کافی.',
      psu: 'توان کافی برای CPU+GPU زیر بار طولانی با حاشیه ایمن.',
      case: 'کیس با airflow خوب؛ فرم‌فکتور منطبق با مادربرد.',
      cooler: 'کولر قوی متناسب با TDP پردازنده برای جلوگیری از افت کلاک.',
    },
  },
  custom: {
    label: 'دلخواه (توضیح کاربر ملاک است)',
    priorities: ['تطابق با توضیح کاربر', 'سازگاری قطعات', 'ارزش خرید'],
    targets: 'بر اساس توضیحات کاربر پیش برو؛ در صورت ابهام میانه‌رو و سازگار انتخاب کن.',
    avoid: 'فرض‌های بی‌مورد؛ بدون توضیح کاربر، گزینهٔ متعادل را برگزین.',
    perCategory: {},
  },
};

/** خلاصهٔ مشخصات فنی کامل هر کاندیدا برای پرامپت قوی‌تر (با تمام فیلدهای موجود) */
function specLine(c: PartCandidate): string {
  const s = c.specs || {};
  const p: string[] = [];
  if (c.brand) p.push(`brand:${c.brand}`);
  if (c.confidence) p.push(`conf:${c.confidence}%`);
  if (c.category === 'cpu') p.push(`socket:${s.socket || '?'}`, `cores:${s.cores || '?'}`, `threads:${s.threads || '?'}`, `tdp:${s.tdp || '?'}W`, `boost:${s.frequency || s.boost || '?'}GHz`, `igpu:${s.integratedGraphics ? 'yes' : 'no'}`);
  else if (c.category === 'gpu') p.push(`vram:${s.vram || '?'}GB`, `tdp:${s.tdp || '?'}W`, `tier:${s.tier || '?'}`, `len:${s.length || '?'}mm`);
  else if (c.category === 'ram') p.push(`cap:${s.capacity || '?'}GB`, `type:${s.ramType || '?'}`, `freq:${s.frequency || '?'}MHz`, `mods:${s.moduleCount || '?'}`, `ch:${s.channel || '?'}`, `rgb:${s.rgb ? 'yes' : 'no'}`);
  else if (c.category === 'storage') p.push(`size:${s.size || (s.sizeTB ? s.sizeTB * 1000 : '?')}GB`, `nvme:${s.isNVMe ? 'yes' : 'no'}`, `pcie:${s.pcie || '?'}`, `ff:${s.formFactor || '?'}`, `read:${s.readSpeed || '?'}`);
  else if (c.category === 'motherboard') p.push(`socket:${s.socket || '?'}`, `chipset:${s.chipset || '?'}`, `ram:${s.ramType || '?'}`, `ramSlots:${s.ramSlots || '?'}`, `m2:${s.m2Slots || '?'}`, `wifi:${s.wifi ? 'yes' : 'no'}`, `ff:${s.formFactor || '?'}`);
  else if (c.category === 'psu') p.push(`watt:${s.wattage || '?'}`, `cert:${s.rating || '?'}`, `modular:${s.modular || '?'}`);
  else if (c.category === 'case') p.push(`ff:${s.formFactor || '?'}`, `gpuMax:${s.gpuMaxLength || '?'}mm`, `airflow:${s.airflow ? 'yes' : 'no'}`, `gaming:${s.gamingCase ? 'yes' : 'no'}`, `office:${s.officeCase ? 'yes' : 'no'}`);
  else if (c.category === 'cooler') p.push(`tdp:${s.tdpRating || '?'}W`, `type:${s.type || '?'}`, `rad:${s.radiatorSize || '?'}`, `rgb:${s.rgb ? 'yes' : 'no'}`);
  return p.length ? ` [${p.join(' ')}]` : '';
}

/**
 * استخراج محدودیت‌های سخت‌گیرانهٔ سازگاری از قطعاتِ قبلاً انتخاب‌شده —
 * این بخش دقت انتخاب را به‌شدت بالا می‌برد چون AI دقیقاً می‌فهمد چه
 * قطعه‌ای با انتخاب‌های قبلی سازگار است.
 */
function buildConstraints(body: PickRequest): string {
  const picked = body.pickedParts;
  const cpu = picked.find(p => p.category === 'cpu');
  const mb = picked.find(p => p.category === 'motherboard');
  const ram = picked.find(p => p.category === 'ram');
  const gpu = picked.find(p => p.category === 'gpu');
  const out: string[] = [];

  if (body.category === 'cpu' && mb?.specs?.socket) {
    out.push(`مادربرد انتخاب‌شده سوکت «${mb.specs.socket}» دارد → CPU باید دقیقاً همان سوکت باشد.`);
  }
  if (body.category === 'motherboard') {
    if (cpu?.specs?.socket) out.push(`CPU سوکت «${cpu.specs.socket}» دارد → مادربرد باید همان سوکت باشد.`);
    if (ram?.specs?.ramType) out.push(`رم نوع «${ram.specs.ramType}» است → مادربرد باید همان نوع رم را پشتیبانی کند.`);
  }
  if (body.category === 'ram' && mb?.specs?.ramType) {
    out.push(`مادربرد نوع «${mb.specs.ramType}» پشتیبانی می‌کند → رم باید همان نوع (و ترجیحاً هم‌رده فرکانس) باشد.`);
  }
  if (body.category === 'psu') {
    const cpuTdp = Number(cpu?.specs?.tdp || 95);
    const gpuTdp = Number(gpu?.specs?.tdp || 150);
    const need = Math.round((cpuTdp + gpuTdp + 100) * 1.3);
    out.push(`توان تقریبی موردنیاز: CPU ${cpuTdp}W + GPU ${gpuTdp}W + لوازم ≈ ${need}W → PSU باید حداقل ${need}W (ترجیحاً ۱۰-۲۰٪ بیشتر) باشد.`);
  }
  if (body.category === 'case') {
    if (mb?.specs?.formFactor) out.push(`مادربرد فرم‌فکتور «${mb.specs.formFactor}» است → کیس باید همان یا بزرگ‌تر باشد.`);
    if (gpu?.specs?.length) out.push(`طول کارت گرافیک تقریبی ${gpu.specs.length}mm است → کیس باید جای آن را داشته باشد.`);
  }
  if (body.category === 'cooler' && cpu?.specs?.tdp) {
    out.push(`پردازنده TDP حدود ${cpu.specs.tdp}W دارد → خنک‌کننده باید توان حرارتی ≥ آن (ترجیحاً ۱.۲×) داشته باشد.`);
  }
  return out.length ? 'محدودیت‌های سخت‌گیرانهٔ سازگاری (حتماً رعایت شوند):\n' + out.map(o => `• ${o}`).join('\n') : '';
}

/**
 * بررسی سازگاری یک کاندیدا با قطعات قبلاً انتخاب‌شده.
 * قرینهٔ سمت‌سرور از محدودیت‌هایی است که در پرامپت AI (buildConstraints)
 * می‌روند؛ تفاوت اینجاست که این تابع روی **خروجی نهایی** اجرا می‌شود تا
 * هم انتخاب AI و هم انتخاب rule-based هر دو سازگار بمانند.
 *
 *   compatible = آیا ناسازگاری سخت (مثلاً سوکت متفاوت) وجود دارد؟
 *   bonus      = امتیاز مکمل برای رتبه‌بندیِ fallback
 *                (مثبت = سازگار/حاشیهٔ ایمن، منفی = ریسک/کمبود)
 *
 * هر جا specs خالی باشد، آن بخش نادیده گرفته می‌شود (بی‌خطر).
 */
function compatibilityInfo(
  c: PartCandidate,
  body: PickRequest
): { compatible: boolean; bonus: number } {
  const picked = body.pickedParts || [];
  const cat = body.category;
  const s = c.specs || {};

  if (cat === 'motherboard') {
    const cpu = picked.find(p => p.category === 'cpu');
    if (cpu?.specs?.socket && s.socket && cpu.specs.socket !== s.socket) {
      return { compatible: false, bonus: -1000 };
    }
    const ram = picked.find(p => p.category === 'ram');
    if (ram?.specs?.ramType && s.ramType && ram.specs.ramType !== s.ramType) {
      return { compatible: false, bonus: -1000 };
    }
  }

  if (cat === 'ram') {
    const mb = picked.find(p => p.category === 'motherboard');
    if (mb?.specs?.ramType && s.ramType && mb.specs.ramType !== s.ramType) {
      return { compatible: false, bonus: -1000 };
    }
  }

  if (cat === 'psu') {
    const cpu = picked.find(p => p.category === 'cpu');
    const gpu = picked.find(p => p.category === 'gpu');
    const cpuTdp = Number(cpu?.specs?.tdp || 95);
    const gpuTdp = Number(gpu?.specs?.tdp || 150);
    const need = Math.round((cpuTdp + gpuTdp + 100) * 1.3);
    const w = Number(s.wattage || 0);
    if (w && w < need) {
      return { compatible: false, bonus: -Math.min(1000, need - w) };
    }
    if (w) {
      const headroom = w - need;
      if (headroom > 0) return { compatible: true, bonus: Math.min(20, Math.round(headroom / 50)) };
    }
  }

  if (cat === 'case') {
    const mb = picked.find(p => p.category === 'motherboard');
    if (mb?.specs?.formFactor && s.formFactor) {
      const rank: Record<string, number> = {
        'mini itx': 1, 'miniitx': 1, 'micro atx': 2, 'microatx': 2,
        'atx': 3, 'e-atx': 4, 'eatx': 4,
      };
      const norm = (v: string) => String(v).toLowerCase().replace(/\s+/g, '');
      const mbR = rank[norm(String(mb.specs.formFactor))] || 0;
      const cR = rank[norm(String(s.formFactor))] || 0;
      if (mbR && cR && cR < mbR) return { compatible: false, bonus: -1000 };
      const gpu = picked.find(p => p.category === 'gpu');
      if (gpu?.specs?.length && s.gpuMaxLength && Number(s.gpuMaxLength) < Number(gpu.specs.length)) {
        return { compatible: false, bonus: -1000 };
      }
    }
  }

  if (cat === 'cooler') {
    const cpu = picked.find(p => p.category === 'cpu');
    if (cpu?.specs?.tdp && s.tdpRating) {
      const cpuTdp = Number(cpu.specs.tdp);
      const rated = Number(s.tdpRating);
      if (rated < cpuTdp) return { compatible: false, bonus: -Math.min(500, cpuTdp - rated) };
      const headroom = rated - cpuTdp;
      if (headroom > 0) return { compatible: true, bonus: Math.min(20, Math.round(headroom / 20)) };
    }
  }

  return { compatible: true, bonus: 0 };
}

/**
 * ساخت پرامپت برای AI — با تمرکز بالا روی کاربری، مشخصات واقعی کالاها
 * و محدودیت‌های سخت‌گیرانهٔ سازگاری (برای دقت انتخابِ بالا)
 */
function buildPickPrompt(body: PickRequest): string {
  const profile = USE_CASE_PROFILE[body.useCase] || USE_CASE_PROFILE.custom;
  const catHint = profile.perCategory?.[body.category] || '';

  const pickedText = body.pickedParts.map(p =>
    `- ${p.category}: ${p.name}${specLine(p)} | قیمت: ${p.finalPrice.toLocaleString('fa-IR')}`
  ).join('\n');

  const candidatesText = body.candidates.map((c, idx) =>
    `${idx + 1}. [ID=${c.id}] ${c.name}${specLine(c)} | قیمت: ${c.finalPrice.toLocaleString('fa-IR')} | رتبه: ${c.confidence || 0}%${c.inStock === false ? ' | ناموجود' : ''}`
  ).join('\n');

  const constraints = buildConstraints(body);

  const smartHint = body.category === 'ram'
    ? 'برای RAM فقط ظرفیت خام کافی نیست؛ تعداد ماژول/کیت و استفاده از اسلات‌ها را هم حساب کن. با مادربرد ۴ اسلات می‌توان ۲×۸ یا چند کیت سازگار گذاشت.'
    : body.category === 'storage'
      ? 'برای Storage فقط یک SSD انتخاب نکن اگر بودجه/کاربری حرفه‌ای و اسلات M.2/SATA اجازه می‌دهد؛ SSDهای NVMe پرظرفیت و امکان چند SSD را در نظر بگیر.'
      : body.category === 'motherboard'
        ? 'برای Motherboard مدل‌هایی با RAM slots و M.2 slots بیشتر در بودجه مناسب ارزش بالاتری دارند چون ارتقا و چند SSD/RAM را ممکن می‌کنند.'
        : body.category === 'case'
          ? 'برای Case حتماً فرم‌فکتور مادربرد، طول کارت گرافیک، airflow/mesh و کاربری را حساب کن. کیس گیمینگ airflow یا mesh اولویت دارد.'
          : body.category === 'cooler'
            ? 'برای Cooler حتماً TDP پردازنده، Tray/بدون‌باکس بودن CPU، کاربری سنگین و فضای کیس را حساب کن. اگر CPU قوی است کولر ضعیف انتخاب نکن.'
            : body.category === 'psu'
              ? 'برای PSU توان واقعی CPU+GPU با حاشیه امن، گواهی 80Plus و آینده‌نگری ارتقا را حساب کن.'
              : 'انتخاب را بر اساس کارایی واقعی، سازگاری و ارزش خرید انجام بده.';

  const whyNote = 'در خط دوم، دلیل انتخاب را در یک جملهٔ کوتاه فارسی بعد از «WHY:» بنویس (مثلاً: PICK: 123\\nWHY: بهترین توازن VRAM و قیمت برای گیمینگ).';

  return `کاربری دقیق: "${profile.label}"
اولویت‌های این کاربری: ${profile.priorities.join(' / ')}
هدف از این سیستم: ${profile.targets}
چیزهایی که باید از آن پرهیز کرد: ${profile.avoid}
${catHint ? `راهنمای اختصاصی برای «${body.categoryLabel}»: ${catHint}\n` : ''}
بودجهٔ باقی‌مانده: ${body.remainingBudget.toLocaleString('fa-IR')} تومان (از ${body.budget.toLocaleString('fa-IR')} کل)

قطعات انتخاب‌شده قبلی (با این‌ها باید سازگار باشد):
${pickedText || '(هنوز قطعه‌ای انتخاب نشده)'}

${constraints ? constraints + '\n' : ''}
الان باید "${body.categoryLabel}" انتخاب کنی.
سهم پیشنهادی بودجه: ${body.budgetShare.toLocaleString('fa-IR')} تومان
بازه دقیق همین دسته: ${(body.priceRange?.min || 0).toLocaleString('fa-IR')} تا ${(body.priceRange?.max || body.remainingBudget).toLocaleString('fa-IR')} تومان؛ ایده‌آل: ${(body.priceRange?.ideal || body.budgetShare).toLocaleString('fa-IR')} تومان
${body.priceRange?.note ? `یادداشت بازه: ${body.priceRange.note}` : ''}

قانون مهم: انتخاب باید مثل تصمیم نهایی یک متخصص اسمبل باشد که دقیقاً می‌داند کاربر برای «${profile.label}» می‌خواهد. فقط قطعه‌ای را انتخاب کن که:
۱) داخل بازهٔ دقیق همین دسته باشد،
۲) با قطعات قبلی سازگار باشد (سوکت/رم/فرم‌فکتور/توان — رجوع به محدودیت‌های بالا)،
۳) موجود باشد،
۴) با اولویت‌های همین کاربری هم‌راستا باشد و نسبت کارایی/قیمت بهتری بدهد.
از انتخاب قطعهٔ خیلی ارزانِ ضعیف یا خیلی گرانِ خارج از سهم خودداری کن.
قانون تخصصی همین دسته: ${smartHint}

گزینه‌های موجود (با مشخصات فنی کامل):
${candidatesText}

${whyNote}
فقط ID بهترین گزینه را برگردان (${body.maxPick} عدد). دقیقاً به فرمت:
PICK: id1${body.maxPick > 1 ? ',id2' : ''}
WHY: <یک جملهٔ کوتاه فارسی>`;
}

/**
 * استخراج ID و دلیل (WHY) از پاسخ AI
 */
function parseAiPicks(text: string, candidates: PartCandidate[], maxPick: number): { picks: PartCandidate[]; reason: string } {
  // پترن: PICK: 123,456 یا PICK: 123
  const match = text.match(/PICK\s*:?\s*([\d,\s]+)/i);
  const whyMatch = text.match(/WHY\s*:?\s*(.+)/i);
  const reason = whyMatch ? whyMatch[1].trim() : '';
  if (!match) return { picks: [], reason };

  const ids = match[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  const picks: PartCandidate[] = [];
  for (const id of ids) {
    const found = candidates.find(c => Number(c.id) === id);
    if (found && picks.length < maxPick) {
      picks.push(found);
    }
  }
  return { picks, reason };
}

/**
 * انتخاب rule-based (fallback)
 * بهترین قطعه بر اساس confidence + تطابق با بودجه
 */
function candidateSmartScore(c: PartCandidate, body: PickRequest, targetPrice: number): number {
  let score = Number(c.confidence || 50);
  score -= Math.min(30, Math.abs(c.finalPrice - targetPrice) / Math.max(1, targetPrice) * 20);

  if (body.category === 'ram') {
    const cap = Number(c.specs?.capacity || 0);
    const modules = Number(c.specs?.moduleCount || (String(c.specs?.channel || '').toLowerCase() === 'dual' ? 2 : 1));
    const targetRam = body.useCase === 'editing' ? 32 : ['gaming', 'streaming'].includes(body.useCase) ? 16 : 16;
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

  // سازگاری با قطعات قبلی (سوکت/فرم‌فکتور/توان/طول GPU) — برای دقت
  // بالاترِ مسیر fallback وقتی AI خاموش یا خطا داده است.
  score += compatibilityInfo(c, body).bonus;

  return score;
}

function ruleBasedPick(body: PickRequest): PartCandidate[] {
  const targetPrice = body.priceRange?.ideal || body.budgetShare;
  const minPrice = Math.max(0, (body.priceRange?.min || 0) * 0.75);
  const maxPrice = Math.min(body.remainingBudget * 1.05, body.priceRange?.max || body.remainingBudget * 1.05);

  // فیلتر: قطعات در بازهٔ دقیق همین دسته + سازگار با قطعات قبلی
  const valid = body.candidates.filter(c =>
    c.inStock !== false &&
    c.finalPrice > 0 &&
    c.finalPrice >= minPrice &&
    c.finalPrice <= maxPrice &&
    compatibilityInfo(c, body).compatible
  );

  if (valid.length === 0) {
    // اگه چیزی در بازه نبود، نزدیک‌ترین گزینه به سقف مجاز/ایده‌آل را بردار نه صرفاً ارزان‌ترین
    return [body.candidates
      .filter(c => c.inStock !== false && c.finalPrice > 0 && c.finalPrice <= body.remainingBudget)
      .sort((a, b) => Math.abs(a.finalPrice - targetPrice) - Math.abs(b.finalPrice - targetPrice))[0]
    ].filter(Boolean);
  }

  // امتیازدهی: confidence + نزدیکی به قیمت هدف + قواعد تخصصی RAM/SSD/MB
  const scored = valid.map(c => ({
    part: c,
    score: candidateSmartScore(c, body, targetPrice),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, body.maxPick).map(s => s.part);
}
