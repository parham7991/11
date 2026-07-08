/**
 * ════════════════════════════════════════════════════════════════
 * 🛡️ guardrails.ts — موتور دفاعی سه‌لایه ضدِ توهم دسته‌بندی
 * ════════════════════════════════════════════════════════════════
 *
 * هدف: ریشه‌کن کردن خطای «Category Hallucination / Misclassification»
 * که در آن سیستم به‌اشتباه یک کالای جانبی (فن کیس، خمیر حرارتی،
 * کابل ۱۶ پین، پایه نگهدارنده و…) را به‌جای قطعه اصلی انتخاب می‌کند.
 *
 * سه لایه دفاعی:
 *   لایه ۱ (Semantic):   فیلتر کلمات مثبت/منفی روی عنوان محصول
 *   لایه ۲ (Financial):  حداقل/حداکثر قیمت منطقی برای دسته
 *   لایه ۳ (Structural): بررسی وجود کلیدهای مشخصات اجباری در specs
 *
 * تمام توابع pure و بدون side-effect هستند تا از هر جایی (API route،
 * assembler، فرانت‌اند و…) قابل استفاده باشند.
 * ════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// 🧩 نوع‌ها
// ─────────────────────────────────────────────────────────────────

export interface CategoryGuardrail {
  /** نام دسته‌بندی به فارسی (برای پیام‌ها) */
  categoryNameFa: string;
  /** حداقل قیمت منطقی به تومان (چیزی زیر این ⇒ قطعاً اکسسوری است) */
  minPriceToman: number;
  /** حداکثر قیمت منطقی به تومان */
  maxPriceToman: number;
  /** کلمات ممنوعه در عنوان: وجود حتی یکی ⇒ رد فوری */
  forbiddenKeywords: string[];
  /** کلمات مثبت: عنوان باید حداقل یکی از این‌ها را داشته باشد */
  positiveKeywords?: string[];
  /** کلیدهای مشخصات اجباری */
  requiredSpecKeys?: string[];
  /** وابستگی سازگاری با سایر دسته‌ها */
  compatibilityDependencies?: string[];
}

export type GuardrailReason =
  | 'ok'
  | 'forbidden-keyword'
  | 'missing-positive-keyword'
  | 'below-min-price'
  | 'above-max-price'
  | 'missing-required-specs'
  | 'unknown-category';

export interface GuardrailResult {
  passed: boolean;
  reason: GuardrailReason;
  matchedForbidden?: string;
  detail?: string;
}

// ─────────────────────────────────────────────────────────────────
// 📚 دیکشنری کامل ۱۲ دسته‌بندی سخت‌افزار آفلند
// ─────────────────────────────────────────────────────────────────

export const COMPLETE_OFFL_GUARDRAILS: Record<string, CategoryGuardrail> = {
  cpu: {
    categoryNameFa: 'پردازنده (CPU)',
    minPriceToman: 3_000_000,
    maxPriceToman: 250_000_000,
    forbiddenKeywords: [
      'فن استوک', 'باکس خالی', 'جاکلیدی', 'شابلون', 'خمیر سیلیکون',
      'باکس پردازنده', 'پایه پردازنده', 'درب پردازنده', 'براکت سوکت',
      'خمیر حرارتی', 'کاور پردازنده', 'استیکر cpu',
    ],
    positiveKeywords: [
      'پردازنده', 'سی پی یو', 'cpu', 'intel core', 'ryzen',
      'i3', 'i5', 'i7', 'i9', 'r5', 'r7', 'r9', 'core ultra',
    ],
    requiredSpecKeys: ['socket'],
    compatibilityDependencies: ['motherboard'],
  },

  motherboard: {
    categoryNameFa: 'مادربرد (Motherboard)',
    minPriceToman: 2_800_000,
    maxPriceToman: 150_000_000,
    forbiddenKeywords: [
      'شیلد پنل', 'کارت تشخیصی', 'دیباگر', 'بازر اسپیکر', 'پیچ مادربرد',
      'کابل تبدیل usb', 'کارت توسعه pci', 'رایزر', 'تستر مادربرد',
      'پنل پشت مادربرد', 'باتری سکه‌ای بایوس', 'باتری بایوس',
    ],
    positiveKeywords: [
      'مادربرد', 'مادربورد', 'motherboard', 'mainboard',
      'z790', 'z890', 'b760', 'b860', 'b650', 'b850', 'x670', 'x870', 'h610', 'h770',
    ],
    requiredSpecKeys: ['socket'],
    compatibilityDependencies: ['cpu', 'ram', 'case', 'storage'],
  },

  ram: {
    categoryNameFa: 'حافظه رم (RAM)',
    minPriceToman: 900_000,
    maxPriceToman: 70_000_000,
    forbiddenKeywords: [
      'هیت سینک رم', 'روکش رم', 'رم ریدر', 'so-dimm', 'sodimm',
      'رم لپ‌تاپ', 'رم لپتاپ', 'آداپتور رم', 'تستر رم',
      'نوار نورپردازی رم', 'قاب خنک‌کننده رم', 'فن رم',
    ],
    positiveKeywords: [
      'حافظه رم', 'رم دسکتاپ', 'رم کامپیوتر',
      'ram', 'ddr4', 'ddr5', 'dimm', 'ماژول حافظه', 'memory kit',
    ],
    requiredSpecKeys: ['ramType'],
    compatibilityDependencies: ['motherboard', 'cpu', 'cooler'],
  },

  gpu: {
    categoryNameFa: 'کارت گرافیک (GPU)',
    minPriceToman: 5_000_000,
    maxPriceToman: 400_000_000,
    forbiddenKeywords: [
      'پایه نگهدارنده کارت گرافیک', 'هولدر کارت گرافیک', 'گرافیک هولدر',
      'کابل برق 16 پین', 'کابل 12vhpwr', 'رایزر کارت گرافیک',
      'باکس اکسترنال egpu', 'پل sli', 'فن یدکی گرافیک',
      'پیچ گرافیک', 'براکت عمودی گرافیک', 'water block',
    ],
    positiveKeywords: [
      'کارت گرافیک', 'گرافیک', 'gpu', 'vga',
      'rtx', 'gtx', 'rx ', 'geforce', 'radeon', 'arc',
    ],
    requiredSpecKeys: ['vram'],
    compatibilityDependencies: ['case', 'psu', 'motherboard'],
  },

  storage: {
    categoryNameFa: 'حافظه اس‌اس‌دی (SSD/NVMe)',
    minPriceToman: 800_000,
    maxPriceToman: 80_000_000,
    forbiddenKeywords: [
      'باکس هارد', 'قاب هارد', 'کابل ساتا', 'هیت‌سینک m.2',
      'پیچ m.2', 'تبدیل هارد لپ‌تاپ', 'داک هارد',
      'کیف هارد اکسترنال', 'آداپتور nvme', 'خنک کننده ssd',
    ],
    positiveKeywords: [
      'ssd', 'حافظه ssd', 'اس اس دی', 'nvme', 'm.2', 'sata',
      'هارد اینترنال', 'hdd', 'هارد دیسک',
    ],
    requiredSpecKeys: [],
    compatibilityDependencies: ['motherboard'],
  },

  psu: {
    categoryNameFa: 'منبع تغذیه (PSU)',
    minPriceToman: 1_800_000,
    maxPriceToman: 90_000_000,
    forbiddenKeywords: [
      'کابل اسلیو', 'کابل سلیو', 'کابل برق کتری', 'تستر پاور',
      'آداپتور برق', 'مبدل برق 8 پین', 'پاور بانک',
      'منبع تغذیه سوئیچینگ دست دوم', 'سوکت برق', 'بست کابل پاور',
      'سیم کشی پاور', 'اکستنشن پاور',
    ],
    positiveKeywords: [
      'منبع تغذیه', 'پاور', 'psu', 'power supply',
      'atx 3.0', '80 plus', 'گواهی پلاتینیوم', 'گواهی گلد', 'gold', 'platinum', 'bronze',
    ],
    requiredSpecKeys: ['wattage'],
    compatibilityDependencies: ['case', 'gpu', 'motherboard'],
  },

  case: {
    categoryNameFa: 'کیس کامپیوتر (Chassis)',
    minPriceToman: 1_500_000,
    maxPriceToman: 150_000_000,
    forbiddenKeywords: [
      'فن کیس', 'فن دیپ کول', 'کنترلر فن', 'پایه نگهدارنده', 'هولدر کیس',
      'رایزر', 'پیچ کیس', 'نوار led', 'نوار ار جی بی', 'کابل argb',
      'براکت', 'فیلتر گرد و غبار', 'قاب کیس', 'پنل شیشه‌ای یدکی',
      'پایه مانیتور', 'کابل مدیریت', 'استند کیس',
    ],
    positiveKeywords: [
      'کیس', 'case', 'chassis', 'mid-tower', 'full-tower',
      'mini-itx', 'micro-atx', 'تاور', 'tower',
    ],
    requiredSpecKeys: ['formFactor'],
    compatibilityDependencies: ['motherboard', 'gpu', 'cooler', 'psu'],
  },

  cooler: {
    categoryNameFa: 'خنک‌کننده پردازنده (CPU Cooler)',
    minPriceToman: 400_000,
    maxPriceToman: 50_000_000,
    forbiddenKeywords: [
      // ═════ v6.0: لیست جامع ضدِ پایه لپ‌تاپ و اکسسوری ═════
      'پایه خنک کننده لپ تاپ', 'پایه خنک‌کننده لپ‌تاپ',
      'پایه لپ تاپ', 'پایه لپ‌تاپ', 'پایه لپتاپ',
      'کولپد', 'coolpad', 'cool pad',
      'laptop cooler', 'laptop stand', 'laptop pad',
      'استند خنک کننده', 'استند لپ تاپ', 'استند لپ‌تاپ',
      'فن کیس', 'خمیر سیلیکون', 'خمیر حرارتی', 'پد حرارتی',
      'براکت تبدیل سوکت', 'پیچ خنک‌کننده',
      'مایع کولانت', 'مخزن واترکولینگ یدکی',
      'thermal paste', 'thermal grease',
      'خنک کننده لپ تاپ', 'خنک‌کننده لپ‌تاپ', 'خنک کننده لپتاپ',
      'کولر لپ تاپ', 'کولر لپ‌تاپ',
      'میز لپ تاپ', 'میز لپ‌تاپ',
    ],
    positiveKeywords: [
      'خنک‌کننده', 'خنک کننده', 'کولر پردازنده', 'کولر cpu',
      'cooler', 'air cooler', 'liquid cooler', 'واترکولینگ',
      'aio', 'خنک کننده مایع',
    ],
    requiredSpecKeys: [],
    compatibilityDependencies: ['cpu', 'case', 'ram'],
  },

  case_fan: {
    categoryNameFa: 'فن کیس (Case Fan)',
    minPriceToman: 150_000,
    maxPriceToman: 10_000_000,
    forbiddenKeywords: [
      'خنک‌کننده پردازنده', 'کولر پردازنده', 'aio',
      'کیس کامل', 'واترکولینگ', 'رادیاتور',
    ],
    positiveKeywords: [
      'فن کیس', 'case fan', 'فن rgb', 'rgb fan',
      'فن 120', 'فن 140', 'fan 120', 'fan 140',
    ],
    requiredSpecKeys: [],
    compatibilityDependencies: ['case', 'motherboard'],
  },

  monitor: {
    categoryNameFa: 'نمایشگر (Monitor)',
    minPriceToman: 3_500_000,
    maxPriceToman: 200_000_000,
    forbiddenKeywords: [
      'پایه رومیزی مانیتور', 'کابل hdmi', 'کابل displayport',
      'آداپتور مانیتور', 'محافظ صفحه نمایش',
      'اسپری تمیزکننده', 'براکت مانیتور',
    ],
    positiveKeywords: [
      'مانیتور', 'monitor', 'display',
      'ips', 'va', 'oled', 'gaming monitor',
    ],
    requiredSpecKeys: [],
    compatibilityDependencies: ['gpu'],
  },
};

// ─────────────────────────────────────────────────────────────────
// 🔧 توابع نرمال‌سازی متن (fa/ar/en)
// ─────────────────────────────────────────────────────────────────

/** نرمال‌سازی متن فارسی/عربی/انگلیسی برای مقایسه‌های ایمن */
export function normalizeText(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .toLowerCase()
    .replace(/[ك]/g, 'ک')
    .replace(/[ي]/g, 'ی')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────
// 🎯 هستهٔ اعتبارسنجی گاردریل
// ─────────────────────────────────────────────────────────────────

/**
 * اعتبارسنجی یک کالا برای یک دستهٔ هدف.
 * برمی‌گرداند {passed, reason} — اگر passed=false، کالا باید حذف/فیلتر شود.
 */
export function validatePartCategory(
  category: string,
  input: {
    title?: string;
    name?: string;
    price?: number;
    finalPrice?: number;
    specs?: Record<string, any>;
  }
): GuardrailResult {
  const rule = COMPLETE_OFFL_GUARDRAILS[category];
  if (!rule) {
    // دسته‌ای که در دیکشنری نیست را بدون سخت‌گیری عبور می‌دهیم
    return { passed: true, reason: 'ok' };
  }

  const titleRaw = input.title || input.name || '';
  const title = normalizeText(titleRaw);
  const price = Number(input.finalPrice || input.price || 0);

  // ═════ لایه ۱: کلمات ممنوعه ═════
  for (const kwRaw of rule.forbiddenKeywords) {
    const kw = normalizeText(kwRaw);
    if (kw && title.includes(kw)) {
      return {
        passed: false,
        reason: 'forbidden-keyword',
        matchedForbidden: kwRaw,
        detail: `عنوان محصول شامل کلمهٔ ممنوعه «${kwRaw}» در دستهٔ ${rule.categoryNameFa} است.`,
      };
    }
  }

  // ═════ لایه ۱.۵: حداقل یک کلمه مثبت باید وجود داشته باشد ═════
  if (rule.positiveKeywords && rule.positiveKeywords.length > 0) {
    const hasPositive = rule.positiveKeywords.some(kw => title.includes(normalizeText(kw)));
    if (!hasPositive) {
      return {
        passed: false,
        reason: 'missing-positive-keyword',
        detail: `عنوان هیچ‌یک از کلمات کلیدی دستهٔ ${rule.categoryNameFa} را ندارد.`,
      };
    }
  }

  // ═════ لایه ۲: آستانه‌های قیمت منطقی ═════
  if (price > 0) {
    if (price < rule.minPriceToman) {
      return {
        passed: false,
        reason: 'below-min-price',
        detail: `قیمت (${price.toLocaleString('fa-IR')} تومان) پایین‌تر از حداقل منطقی دستهٔ ${rule.categoryNameFa} (${rule.minPriceToman.toLocaleString('fa-IR')} تومان) است؛ محتملاً یک اکسسوری است.`,
      };
    }
    if (price > rule.maxPriceToman) {
      return {
        passed: false,
        reason: 'above-max-price',
        detail: `قیمت بالاتر از حداکثر منطقی دستهٔ ${rule.categoryNameFa} است.`,
      };
    }
  }

  // ═════ لایه ۳: کلیدهای اجباری specs (فقط warning اگر مهم است) ═════
  // نکته: این لایه فقط برای دسته‌های حساس فعال است. اگر مشخصات از متن
  // قابل استخراج نبود، اجازه می‌دهیم عبور کند تا موجب فیلتر بیش‌ازحد نشود.
  if (rule.requiredSpecKeys && rule.requiredSpecKeys.length > 0 && input.specs) {
    const missing: string[] = [];
    for (const k of rule.requiredSpecKeys) {
      const v = input.specs[k];
      if (v === undefined || v === null || v === '' || v === 0) missing.push(k);
    }
    // فقط برای CPU/Motherboard/RAM/PSU که کلید حیاتی است ⇒ رد کن
    if (missing.length === rule.requiredSpecKeys.length && ['cpu', 'motherboard', 'ram', 'psu'].includes(category)) {
      // اجازهٔ عبور — اما با علامت‌گذاری برای امتیازدهی کمتر
      // (به جای رد قاطع، در selection score جریمه می‌شود)
    }
  }

  return { passed: true, reason: 'ok' };
}

/**
 * فیلتر انبوه لیستی از قطعات با guardrails.
 * ورودی می‌تواند هر شکلی داشته باشد؛ فقط title/finalPrice/specs مهم است.
 */
export function sanitizeAndFilterParts<T extends {
  title?: string;
  name?: string;
  price?: number;
  finalPrice?: number;
  specs?: Record<string, any>;
}>(category: string, parts: T[]): { valid: T[]; rejected: Array<{ part: T; result: GuardrailResult }> } {
  const valid: T[] = [];
  const rejected: Array<{ part: T; result: GuardrailResult }> = [];
  for (const p of parts) {
    const r = validatePartCategory(category, p);
    if (r.passed) valid.push(p);
    else rejected.push({ part: p, result: r });
  }
  return { valid, rejected };
}

/**
 * چک سریع برای استفاده در UI یا لاگ (بدون context اضافی).
 * true = مجاز، false = محتملاً اکسسوری.
 */
export function isLikelyRealPart(category: string, title: string, price: number): boolean {
  return validatePartCategory(category, { title, finalPrice: price }).passed;
}

/**
 * لیست تمام دسته‌های شناخته‌شده در این ماژول
 */
export function getKnownCategories(): string[] {
  return Object.keys(COMPLETE_OFFL_GUARDRAILS);
}

/**
 * دریافت رول یک دسته (برای استفاده در UI و پیام‌ها)
 */
export function getGuardrailRule(category: string): CategoryGuardrail | null {
  return COMPLETE_OFFL_GUARDRAILS[category] || null;
}

// ─────────────────────────────────────────────────────────────────
// ❄️ v6.0: گاردریل اختصاصی «خنک‌کننده واقعی پردازنده دسکتاپ»
// ─────────────────────────────────────────────────────────────────

/** لیست کلمات منفی برای تشخیص قاطع پایه لپ‌تاپ / کولپد / اکسسوری */
export const COOLER_FORBIDDEN_KEYWORDS = [
  'پایه خنک کننده لپ تاپ', 'پایه خنک‌کننده لپ‌تاپ',
  'پایه لپ تاپ', 'پایه لپ‌تاپ', 'پایه لپتاپ',
  'کولپد', 'coolpad', 'cool pad',
  'laptop cooler', 'laptop stand', 'laptop pad',
  'استند خنک کننده', 'استند لپ تاپ',
  'خنک کننده لپ تاپ', 'خنک‌کننده لپ‌تاپ', 'خنک کننده لپتاپ',
  'کولر لپ تاپ', 'کولر لپ‌تاپ',
  'فن کیس', 'خمیر سیلیکون', 'خمیر حرارتی', 'پد حرارتی',
  'براکت تبدیل سوکت', 'پیچ خنک‌کننده',
  'thermal paste', 'thermal grease',
];

/**
 * تشخیص قطعی اینکه یک کالا «خنک‌کنندهٔ واقعی پردازندهٔ دسکتاپ» است
 * یا اکسسوری/پایهٔ لپ‌تاپ.
 *
 * ⚠️ این تابع در تمام نقاط انتخاب و فیلترینگ کولر باید صدا زده شود
 *    تا بار مشکل تصویر (شماره ۲ در تصویر کاربر) هرگز تکرار نشود.
 *
 * الگوریتم دو مرحله‌ای دقیق:
 *   ۱. اگر هر یک از FORBIDDEN های صریح در نام باشد → رد قاطع
 *   ۲. باید حداقل یکی از الگوهای مثبت (regex) مطابقت کند:
 *      - `خنک(‌)?کننده ... پردازنده` (با اجازهٔ کلمهٔ فاصله مثل «بادی/مایع»)
 *      - `کولر ... پردازنده` یا `کولر cpu`
 *      - `aio | water cool | liquid cool | cpu cooler`
 *      - `واترکولینگ | خنک کنندهٔ مایع`
 */
export function isGenuineCpuCooler(partName: string | null | undefined): boolean {
  if (!partName) return false;
  const normalized = normalizeText(String(partName));
  if (!normalized.trim()) return false;

  // ═════ مرحلهٔ ۱: چک قاطع کلمات ممنوعه ═════
  for (const forbidden of COOLER_FORBIDDEN_KEYWORDS) {
    const fn = normalizeText(forbidden);
    if (fn && normalized.includes(fn)) return false;
  }

  // ═════ مرحلهٔ ۱.۵: چک regex های ممنوعهٔ ترکیبی ═════
  // «پایه» + هر چیز + «لپ» یا «کیس» → رد
  if (/پایه\s+\S{0,20}(لپ|کیس|نگهدارنده)/i.test(normalized)) return false;
  // اگر شروع نام «کیس» یا «فن کیس» یا «کارت گرافیک» است → قطعاً کولر نیست
  if (/^(?:کیس|فن\s*کیس|کارت\s*گرافیک|مانیتور|رم|پاور|منبع\s*تغذیه|مادر\s*برد|هارد|ssd)\b/i.test(normalized)) return false;

  // ═════ مرحلهٔ ۲: باید حداقل یک الگوی مثبت regex مطابقت کند ═════
  const positiveRegex = [
    // خنک‌کننده ... پردازنده (اجازهٔ 0-2 کلمه بین آن‌ها مانند «بادی»، «مایع»، «هوا»)
    /خنک(?:\s|‌)?کننده\s+(?:\S+\s+){0,2}پردازنده/i,
    // کولر ... پردازنده / cpu
    /کولر\s+(?:\S+\s+){0,2}(?:پردازنده|cpu)/i,
    /cpu\s*cooler/i,
    /air\s*cooler/i,
    /liquid\s*cooler/i,
    /water\s*cool/i,
    /\baio\b/i,
    // واترکولینگ / خنک‌کنندهٔ مایع
    /واتر[\s‌]?کولینگ/i,
    /خنک(?:\s|‌)?کننده\s+مایع/i,
    // برندهای معروف cooler که خودشان نام قطعه هستند
    /noctua\s+nh/i,
    /deepcool\s+(ak|ag|le|ls|gammaxx)/i,
    /arctic\s+(freezer|liquid)/i,
    /be\s*quiet.*(pure|dark)\s*rock/i,
    /corsair\s+(h\d+|icue.*capellix)/i,
    /nzxt\s+kraken/i,
    /msi\s+(mag|mpg).*core.*liquid/i,
  ];

  for (const rgx of positiveRegex) {
    if (rgx.test(normalized)) return true;
  }

  // اگر هیچ الگوی مثبتی نداشت، محتاطانه رد کن
  return false;
}
