/**
 * ════════════════════════════════════════════════════════════════
 * 📦 offline-catalog.ts — کش محلی پایگاه دانش کالاهای آفلند (v5.1)
 * ════════════════════════════════════════════════════════════════
 *
 * منبع داده: `offl-ai-compact.json` استخراج‌شده از انبار سایت آفلند
 * توسط اسکریپت `grab_ultimate_ai_v2.js`.
 *
 * ساختار JSON خام:
 * {
 *   "cpu":      [{ id, name, price, inStock, brand, specs }, ...],
 *   "gpu":      [...],
 *   "motherboard": [...],
 *   "ram":      [...],
 *   "storage":  [...],
 *   "psu":      [...],
 *   "case":     [...],
 *   "cooler":   [...],
 *   "case_fan": [...],
 *   "monitor":  [...]
 * }
 *
 * ⚠️ مشکل شناخته‌شدهٔ داده: دسته‌بندی سایت خطای نامگذاری دارد
 *    (مثلاً «خنک‌کننده پردازنده اوست» درون آرایهٔ cpu قرار گرفته
 *    است). این ماژول با تابع `reclassifyByGuardrails` به صورت
 *    خودکار هر کالا را به دستهٔ درست خود منتقل می‌کند و کالاهای
 *    مبهم را کنار می‌گذارد تا در انتخاب هوشمند خطا رخ ندهد.
 * ════════════════════════════════════════════════════════════════
 */

import rawCatalog from './offl-ai-compact.json';
import { normalizeText, isGenuineCpuCooler, validatePartCategory } from './guardrails';
import { BASEURL_SITE } from '@/lib/variable';

// ─────────────────────────────────────────────────────────────────
// 🖼️ تولید URL محصول و placeholder تصویر
// ─────────────────────────────────────────────────────────────────

/**
 * ساخت آدرس صفحهٔ محصول در سایت آفلند.
 * وقتی کاربر روی یک آیتم offline کلیک می‌کند، به این URL می‌رود
 * و در آنجا از API واقعی، تصویر و مشخصات دقیق را می‌گیرد.
 */
function buildOfflineProductUrl(id: string | number): string {
  return `${BASEURL_SITE}/product/${encodeURIComponent(String(id))}`;
}

// ─────────────────────────────────────────────────────────────────
// 🧩 تایپ‌ها
// ─────────────────────────────────────────────────────────────────

export interface OfflineProduct {
  id: number | string;
  name: string;
  title?: string;
  category: string;
  price: number;
  finalPrice: number;
  discountPercent?: number;
  inStock: boolean;
  brand?: string | null;
  warranty?: string | null;
  image?: string | null;
  url?: string;
  shortSpec?: string;
  specs?: Record<string, any>;
}

type RawItem = {
  id: number | string;
  name: string;
  price: number;
  finalPrice?: number;
  inStock: boolean;
  brand?: string | null;
  specs?: Record<string, any>;
};

// ─────────────────────────────────────────────────────────────────
// 🧠 موتور بازدسته‌بندی هوشمند (Auto Re-Categorization Engine)
// ─────────────────────────────────────────────────────────────────

/**
 * الگوهای تشخیص دستهٔ واقعی یک محصول از روی نام آن.
 * ترتیب مهم است: خاص‌تر (فن کیس) قبل از عمومی‌تر (کیس).
 */
const CATEGORY_PATTERNS: Array<{ category: string; regex: RegExp; negative?: RegExp }> = [
  // خنک‌کننده پردازنده (دقیق‌ترین)
  {
    category: 'cooler',
    regex: /خنک\s*کننده\s*پردازنده|cpu\s*cooler|water\s*cool|aio|فن\s*پردازنده|کولر\s*پردازنده/i,
    negative: /پایه\s*خنک\s*کننده|کولپد|لپ[\s‌]*تاپ|خمیر|پد\s*حرارتی/i,
  },
  // فن کیس
  {
    category: 'case_fan',
    regex: /^\s*فن\s*کیس|case\s*fan|فن\s*rgb|rgb\s*fan|فن\s*کامپیوتر/i,
  },
  // پردازنده
  {
    category: 'cpu',
    regex: /پردازنده\s*(?:اینتل|amd|ای\s*ام\s*دی|مرکزی|core|ryzen)|intel\s*core|ryzen|core\s*i[3579]|core2/i,
    negative: /خنک\s*کننده|کولر|فن\s*استوک|جاکلیدی|شابلون/i,
  },
  // کارت گرافیک
  {
    category: 'gpu',
    regex: /کارت\s*گرافیک|graphics\s*card|geforce|radeon|\brtx\b|\bgtx\b|\brx\s*[567]/i,
    negative: /پایه|هولدر|رایزر|کابل\s*(?:16|12vhpwr)/i,
  },
  // مادربرد
  {
    category: 'motherboard',
    regex: /مادر\s*برد|مادربورد|motherboard|mainboard|\bz[6-9]\d0|\bb[6-9]\d0|\bh[6-9]\d0|\bx[67]\d0/i,
  },
  // رم دسکتاپ (نه لپ‌تاپ)
  {
    category: 'ram',
    regex: /رم\s*(?:دسکتاپ|کامپیوتر|desktop)?|\bddr[45]\b|\bdimm\b/i,
    negative: /so\s*[-‌]?dimm|رم\s*لپ|هیت\s*سینک\s*رم|روکش/i,
  },
  // حافظه SSD/HDD
  {
    category: 'storage',
    regex: /\bssd\b|اس\s*اس\s*دی|nvme|m\.?2|\bhdd\b|هارد\s*(?:دیسک|اینترنال|داخلی)|حافظه\s*(?:جامد|داخلی)/i,
    negative: /باکس|قاب|کیف\s*هارد|داک\s*هارد/i,
  },
  // منبع تغذیه
  {
    category: 'psu',
    regex: /منبع\s*تغذیه|پاور|\bpsu\b|power\s*supply|80\s*plus/i,
    negative: /پاور\s*بانک|آداپتور|کابل|تستر/i,
  },
  // کیس
  {
    category: 'case',
    regex: /کیس\s*کامپیوتر|کیس\s*گیمینگ|\bcase\b|chassis|mid[\s-]*tower|full[\s-]*tower|mini[\s-]*itx/i,
    negative: /فن\s*کیس|فیلتر\s*(?:گرد|کیس)|پایه|رایزر|قاب\s*کیس/i,
  },
  // نمایشگر
  {
    category: 'monitor',
    regex: /مانیتور|monitor|\bips\b|\boled\b|display/i,
    negative: /پایه\s*مانیتور|براکت|کابل\s*(?:hdmi|display)/i,
  },
];

/**
 * تشخیص دستهٔ واقعی یک محصول از روی نام.
 * برمی‌گرداند: دستهٔ صحیح، یا null اگر مشخص نشد.
 */
function detectRealCategory(name: string): string | null {
  const n = normalizeText(name || '');
  for (const pattern of CATEGORY_PATTERNS) {
    if (pattern.negative && pattern.negative.test(n)) continue;
    if (pattern.regex.test(n)) return pattern.category;
  }
  return null;
}

/**
 * تبدیل یک آیتم خام به OfflineProduct استاندارد.
 * فیلد url برای انتقال به صفحهٔ محصول (که تصویر واقعی را دارد)
 * پر می‌شود.
 */
function toOfflineProduct(item: RawItem, defaultCategory: string): OfflineProduct {
  const price = Number(item.price || 0);
  const finalPrice = Number(item.finalPrice || item.price || 0);
  return {
    id: item.id,
    name: item.name || '',
    title: item.name || '',
    category: defaultCategory,
    price,
    finalPrice,
    discountPercent: 0,
    inStock: Boolean(item.inStock),
    brand: item.brand && item.brand !== 'نامشخص' ? item.brand : null,
    warranty: null,
    image: null, // تصویر با کلیک روی محصول از API واقعی fetch می‌شود
    url: buildOfflineProductUrl(item.id),
    shortSpec: '',
    specs: item.specs || {},
  };
}

// ─────────────────────────────────────────────────────────────────
// 🚀 ساخت کاتالوگ نهایی با بازدسته‌بندی خودکار
// ─────────────────────────────────────────────────────────────────

const rawGrouped = rawCatalog as unknown as Record<string, RawItem[]>;

/**
 * کاتالوگ کامل، بازدسته‌بندی‌شده. هر آیتم در دستهٔ واقعی خود
 * قرار می‌گیرد؛ آیتم‌هایی که مشخص نیستند در دستهٔ اصلی سایت باقی
 * می‌مانند.
 */
const RECLASSIFIED: Record<string, OfflineProduct[]> = {
  cpu: [], gpu: [], motherboard: [], ram: [], storage: [],
  psu: [], case: [], cooler: [], case_fan: [], monitor: [],
};

const _stats = { total: 0, moved: 0, kept: 0 };

const _dropped: Array<{ name: string; from: string; reason: string }> = [];

for (const [siteCategory, items] of Object.entries(rawGrouped)) {
  if (!Array.isArray(items)) continue;
  for (const item of items) {
    _stats.total++;
    const detected = detectRealCategory(item.name || '');
    const targetCategory = detected || siteCategory;

    // آمار بازدسته‌بندی
    if (detected && detected !== siteCategory) _stats.moved++;
    else _stats.kept++;

    // اگر دستهٔ هدف در RECLASSIFIED وجود ندارد، skip
    if (!RECLASSIFIED[targetCategory]) continue;

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ v6.1: لایهٔ دفاعی نهایی — قبل از افزودن به هر دسته، گاردریل
    //          اجرا می‌شود. برای cooler به‌طور خاص isGenuineCpuCooler
    //          چک می‌شود تا هرگز پایه لپ‌تاپ به cooler اضافه نشود.
    // ═══════════════════════════════════════════════════════════════
    const name = item.name || '';
    if (targetCategory === 'cooler' && !isGenuineCpuCooler(name)) {
      _dropped.push({ name, from: siteCategory, reason: 'not-genuine-cooler' });
      continue;
    }

    // گاردریل عمومی برای هر دسته (کلمات ممنوعه + قیمت منطقی)
    const g = validatePartCategory(targetCategory, {
      title: name,
      name,
      price: item.price,
      finalPrice: item.finalPrice || item.price,
      specs: item.specs || {},
    });
    if (!g.passed) {
      _dropped.push({ name, from: siteCategory, reason: g.reason });
      continue;
    }

    RECLASSIFIED[targetCategory].push(toOfflineProduct(item, targetCategory));
  }
}

// مرتب‌سازی صعودی قیمت درون هر دسته
for (const cat of Object.keys(RECLASSIFIED)) {
  RECLASSIFIED[cat].sort((a, b) => (a.finalPrice || 0) - (b.finalPrice || 0));
}

/**
 * کاتالوگ نهایی به‌صورت آرایهٔ تخت (flat) با category درست‌شده.
 */
export const OFFLINE_CATALOG: OfflineProduct[] = Object.values(RECLASSIFIED).flat();

/** آمار بازدسته‌بندی (برای debug) */
export const OFFLINE_CATALOG_STATS = {
  totalItems: _stats.total,
  reclassifiedCount: _stats.moved,
  keptOriginal: _stats.kept,
  droppedCount: _dropped.length,
  droppedSamples: _dropped.slice(0, 20), // نمونهٔ ۲۰ آیتم رد‌شده برای debug
  byCategory: Object.fromEntries(
    Object.entries(RECLASSIFIED).map(([k, v]) => [k, v.length])
  ),
};

// ─────────────────────────────────────────────────────────────────
// 🎯 توابع عمومی
// ─────────────────────────────────────────────────────────────────

/** آیا کش محلی فعال است؟ */
export function hasOfflineCatalog(): boolean {
  return OFFLINE_CATALOG.length > 0;
}

/** دریافت کالاهای یک دسته */
export function getOfflineCatalogByCategory(category: string): OfflineProduct[] {
  return RECLASSIFIED[category] || [];
}

/** دریافت آمار کش (برای نمایش در UI یا لاگ) */
export function getOfflineCatalogStats() {
  return OFFLINE_CATALOG_STATS;
}

/**
 * ادغام کاندیداهای API با کش محلی. اگر API چیزی برنگرداند یا کم
 * داد و کش پر باشد، از کش تکمیل می‌کند. کالاهایی که در API هستند
 * حفظ می‌شوند و کالاهای offline بدون تکرار id اضافه می‌شوند.
 */
export function mergeWithOfflineCatalog<T extends { id: string | number }>(
  category: string,
  apiResults: T[]
): T[] {
  const offline = getOfflineCatalogByCategory(category);
  if (offline.length === 0) return apiResults;
  if (apiResults.length === 0) return offline as unknown as T[];
  const seenIds = new Set(apiResults.map(p => String(p.id)));
  const supplemental = (offline as unknown as T[]).filter(p => !seenIds.has(String(p.id)));
  return [...apiResults, ...supplemental];
}
