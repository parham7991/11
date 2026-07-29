/**
 * ════════════════════════════════════════════════════════════════
 * 🖥️ assembler.ts — اسمبلر هوشمند آفلند (نسخهٔ v7)
 * ════════════════════════════════════════════════════════════════
 *
 * وظیفه: دریافت کاربری + بودجه، برگشت سیستم کامل سازگار.
 *
 *   ↓ gatherCandidates()      → کاندیداها از API آفلند
 *   ↓ createPart()            → با part-detector بررسی می‌شه
 *   ↓ selectPartsForBuild()   → بهترین قطعات با بودجه انتخاب می‌شن
 *   ↓ checkCompatibility()    → سازگاری دقیق بررسی می‌شه
 *   ↓ determineTier()         → ردهٔ سیستم تعیین می‌شه
 *   ↓ generateDescription()   → توضیحات فارسی ساخته می‌شه
 *
 * ════════════════════════════════════════════════════════════════
 */

import { generateToken } from '@/lib/fun';
import { BASEURL, BASEURL_SITE, BASE_URL_IMAGE, AWS_BUCKET } from '@/lib/variable';
import { detectPart, type PartCategory, type PartDetection } from './part-detector';
import {
  CPU_DB,
  GPU_DB,
  MB_CHIPSETS,
  calculateMinPsuWattage,
  recommendPsuWattage,
  isFormFactorCompatible,
  type FormFactor,
} from './parts-db';
import { validatePartCategory, isGenuineCpuCooler } from './guardrails';
import { hasOfflineCatalog, getOfflineCatalogByCategory } from './offline-catalog';

// ════════════════════════════════════════════════════════════════
// 📋 نوع‌ها
// ════════════════════════════════════════════════════════════════

export interface AssemblyPart {
  category: PartCategory;
  categoryLabel: string;
  emoji: string;
  id: number | string;
  name: string;
  url: string;
  image: string | null;
  price: number;
  finalPrice: number;
  discountPercent: number;
  inStock: boolean;
  brand: string | null;
  warranty: string | null;
  shortSpec: string;
  specs: Record<string, any>;
  confidence: number;
  isOptional: boolean;
  /** تعداد از همین محصول در اسمبل (برای SSD/RAM/Fan و قطعات تکرارپذیر) */
  quantity?: number;
  /** توضیح کوتاه تعداد/نقش؛ مثل «SSD دوم» یا «دو کیت رم» */
  quantityLabel?: string;
  alternatives: AssemblyPart[];
  /** دلیل انتخاب (برای دیباگ و نمایش) */
  pickReason?: string;
}

export interface CategoryCandidates {
  category: PartCategory;
  key?: string; // legacy alias for category
  label: string;
  emoji: string;
  /** سهم پیشنهادی از بودجه */
  budgetShare: number;
  isOptional: boolean;
  required?: boolean; // alias for !isOptional
  candidates: AssemblyPart[];
}

export interface BuildSummary {
  totalBefore: number;
  totalAfter: number;
  totalSaving: number;
  savingPercent: number;
  itemCount: number;
  mandatoryCount: number;
  optionalCount: number;
  totalTdp: number;
}

export interface BudgetRange {
  min: number;
  max: number;
  recommended: number;
  perCategory?: Array<{ category: string; min: number; max: number }>;
}

export interface CompatibilityIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  category?: PartCategory;
}

export interface CompatibilityResult {
  compatible: boolean;
  score: number;
  issues: CompatibilityIssue[];
  warnings: CompatibilityIssue[];
  details: {
    socketMatch: boolean;
    ramTypeMatch: boolean;
    psuSufficient: boolean;
    formFactorOk: boolean;
    storageOk: boolean;
    coolerAdequate: boolean;
  };
}

export interface SystemRecommendation {
  overallScore: number;
  tier: string;
  compatibilityScore: number;
  compatibilityIssues: CompatibilityIssue[];
  compatibilityWarnings: CompatibilityIssue[];
  upgradeSuggestions: string[];
  performanceEstimates: Record<string, string>;
  estimatedFps?: Record<string, string>;
  // بر اساس کاربری
  useCaseSpecific?: Record<string, any>;
}

// ════════════════════════════════════════════════════════════════
// 📋 تنظیمات دسته‌بندی‌ها
// ════════════════════════════════════════════════════════════════

export const PART_CATEGORIES_MANDATORY = [
  {
    key: 'cpu' as const,
    label: 'پردازنده (CPU)',
    labelEn: 'Processor',
    emoji: '🧠',
    required: true,
    budgetWeight: 0.22,
    queries: [
      'cpu amd ryzen',
      'cpu intel core',
      'پردازنده amd',
      'پردازنده intel',
      'amd ryzen',
      'intel core',
      'ryzen 9',
      'ryzen 7',
      'ryzen 5',
      'core i9',
      'core i7',
      'core i5',
      'پردازنده کامپیوتر',
      'cpu processor',
      'boxed cpu',
      'پردازنده دسکتاپ',
      'پردازنده core',
    ],
  },
  {
    key: 'gpu' as const,
    label: 'کارت گرافیک (GPU)',
    labelEn: 'Graphics Card',
    emoji: '🎮',
    required: true,
    budgetWeight: 0.35,
    queries: [
      'rtx',
      'geforce rtx',
      'radeon rx',
      'rx 7',
      'rx 6',
      'کارت گرافیک',
      'کارت گرافیک rtx',
      'کارت گرافیک amd',
      'کارت گرافیک انویدیا',
      'graphics card',
      'gpu gaming',
      'کارت گرافیک گیمینگ',
    ],
  },
  {
    key: 'motherboard' as const,
    label: 'مادربرد',
    labelEn: 'Motherboard',
    emoji: '🔲',
    required: true,
    budgetWeight: 0.14,
    queries: [
      'مادربرد',
      'motherboard',
      'mainboard',
      'برد اصلی',
      'مادربرد ddr5',
      'مادربرد ddr4',
      'مادربرد گیمینگ',
      'asus',
      'msi',
      'gigabyte',
      'asrock',
    ],
  },
  {
    key: 'ram' as const,
    label: 'رم (RAM)',
    labelEn: 'Memory',
    emoji: '💾',
    required: true,
    budgetWeight: 0.1,
    queries: [
      'رم',
      'ram',
      'memory',
      'ddr5',
      'ddr4',
      'رم ddr5',
      'رم ddr4',
      'kingston fury',
      'corsair vengeance',
      'gskill trident',
      'teamgroup',
      'رم کامپیوتر',
      'memory kit',
    ],
  },
  {
    key: 'storage' as const,
    label: 'حافظه SSD',
    labelEn: 'Storage',
    emoji: '⚡',
    required: true,
    budgetWeight: 0.08,
    queries: [
      'ssd',
      'nvme',
      'اس اس دی',
      'm2',
      'm.2',
      'samsung 990',
      'wd black',
      'crucial',
      'kingston',
      'ssd nvme',
      'ssd sata',
      'حافظه ssd',
    ],
  },
  {
    key: 'psu' as const,
    label: 'پاور (منبع تغذیه)',
    labelEn: 'Power Supply',
    emoji: '🔌',
    required: true,
    budgetWeight: 0.07,
    queries: [
      'پاور',
      'psu',
      'power supply',
      'منبع تغذیه',
      'corsair',
      'seasonic',
      'be quiet',
      'coolermaster',
      'پاور گیمینگ',
      'پاور ماژولار',
      'پاور 80',
    ],
  },
  {
    key: 'case' as const,
    label: 'کیس',
    labelEn: 'Case',
    emoji: '🗄️',
    required: true,
    budgetWeight: 0.04,
    queries: [
      'کیس گیمینگ',
      'کیس airflow',
      'کیس mesh',
      'کیس argb',
      'کیس atx گیمینگ',
      'کیس',
      'case',
      'gaming case',
      'airflow case',
      'mesh case',
      'کیس کامپیوتر',
      'lian li',
      'fractal',
      'nzxt',
      'corsair case',
      'deepcool case',
      'coolermaster case',
    ],
  },
];

export const PART_CATEGORIES_OPTIONAL = [
  {
    key: 'cooler' as const,
    label: 'خنک‌کننده پردازنده',
    labelEn: 'CPU Cooler',
    emoji: '❄️',
    required: false,
    budgetWeight: 0.05,
    queries: [
      'کولر',
      'خنک کننده',
      'cooler',
      'cpu cooler',
      'noctua',
      'deepcool',
      'arctic',
      'be quiet cooler',
      'corsair h',
      'کولر پردازنده',
      'کولر بادی',
      'کولر آبی',
      'aio',
      'فن پردازنده',
    ],
  },
  {
    key: 'case_fan' as const,
    label: 'فن کیس (RGB)',
    labelEn: 'Case Fan RGB',
    emoji: '🌬️',
    required: false,
    budgetWeight: 0.015,
    queries: [
      'فن کیس',
      'case fan',
      'فن rgb',
      'rgb fan',
      'lian li unifan',
      'corsair ql',
      'corsair af',
      'deepcool fc',
      'fan rgb 120',
      'فن گیمینگ rgb',
      'فن ۱۲۰',
    ],
  },
  {
    key: 'case_argb' as const,
    label: 'نوار RGB',
    labelEn: 'ARGB Strip',
    emoji: '✨',
    required: false,
    budgetWeight: 0.01,
    queries: ['نوار rgb', 'argb strip', 'rgb led strip', 'rgb kit', 'نوار نور rgb', 'استریپ rgb'],
  },
];

export const PART_CATEGORIES = [...PART_CATEGORIES_MANDATORY, ...PART_CATEGORIES_OPTIONAL];

// ════════════════════════════════════════════════════════════════
// 📋 کاربری‌ها
// ════════════════════════════════════════════════════════════════

export const USE_CASES = [
  { key: 'gaming', label: 'گیمینگ', emoji: '🎮', desc: 'اجرای روان بازی‌های سنگین' },
  { key: 'office', label: 'اداری', emoji: '🏢', desc: 'کارهای روزمره اداری' },
  { key: 'editing', label: 'ادیت و رندر', emoji: '🎬', desc: 'ادیت ویدیو و طراحی' },
  { key: 'streaming', label: 'استریم', emoji: '📹', desc: 'استریم و تولید محتوا' },
];

export const USE_CASE_INFO: Record<string, any> = {
  gaming: {
    title: '🎮 عملکرد گیمینگ',
    description: 'سیستم مناسب برای بازی‌های کامپیوتری',
    tierDescriptions: {
      ultra: {
        label: 'رده‌بالا - 4K',
        res: '4K (2160p)',
        fps: '60-120 FPS',
        settings: 'Ultra / Extreme',
        vram: '12GB+',
        minBudget: 150_000_000,
      },
      high: {
        label: 'قوی - 1440p',
        res: '1440p (2K)',
        fps: '60-144 FPS',
        settings: 'High / Very High',
        vram: '8-12GB',
        minBudget: 80_000_000,
      },
      medium: {
        label: 'متعادل - 1080p',
        res: '1080p (Full HD)',
        fps: '60-100 FPS',
        settings: 'Medium / High',
        vram: '6-8GB',
        minBudget: 45_000_000,
      },
      entry: {
        label: 'ابتدایی - 1080p',
        res: '1080p (Full HD)',
        fps: '30-60 FPS',
        settings: 'Low / Medium',
        vram: '4-6GB',
        minBudget: 25_000_000,
      },
    },
    games: {
      ultra: ['Cyberpunk 2077', 'Elden Ring', 'Hogwarts Legacy', 'Starfield'],
      high: ['GTA V', 'Red Dead 2', 'Apex Legends', 'Fortnite'],
      medium: ['Valorant', 'CS2', 'League of Legends', 'Minecraft'],
      entry: ['Valorant', 'Minecraft', 'GTA V', 'Fortnite'],
    },
  },
  editing: {
    title: '🎬 عملکرد ادیت و رندر',
    description: 'سیستم مناسب برای ادیت ویدیو و طراحی',
    tierDescriptions: {
      ultra: {
        label: 'رده‌بالا - پرو',
        software: ['Premiere Pro', 'DaVinci Resolve', 'After Effects', 'Blender'],
        renderTime: '2-5 دقیقه',
        cores: '16+',
        ram: '64GB+',
        minBudget: 200_000_000,
      },
      high: {
        label: 'قوی - نیمه‌حرفه‌ای',
        software: ['Premiere Pro', 'DaVinci Resolve', 'Photoshop'],
        renderTime: '5-10 دقیقه',
        cores: '12-16',
        ram: '32GB',
        minBudget: 100_000_000,
      },
      medium: {
        label: 'متعادل - مبتدی',
        software: ['DaVinci Resolve', 'Premiere Rush'],
        renderTime: '10-20 دقیقه',
        cores: '8-12',
        ram: '16-32GB',
        minBudget: 50_000_000,
      },
      entry: {
        label: 'ابتدایی',
        software: ['CapCut', 'Canva'],
        renderTime: '15-30 دقیقه',
        cores: '4-6',
        ram: '8-16GB',
        minBudget: 30_000_000,
      },
    },
  },
  streaming: {
    title: '📹 عملکرد استریم',
    description: 'سیستم مناسب برای استریم و تولید محتوا',
    tierDescriptions: {
      ultra: {
        label: 'رده‌بالا - 4K',
        platforms: ['Twitch 4K/60fps', 'YouTube 4K'],
        quality: '4K بدون افت',
        minBudget: 200_000_000,
      },
      high: {
        label: 'قوی - 1080p/60fps',
        platforms: ['Twitch 1080p/60fps', 'YouTube 1080p'],
        quality: '1080p با کیفیت بالا',
        minBudget: 100_000_000,
      },
      medium: {
        label: 'متعادل - 1080p/30fps',
        platforms: ['Twitch 1080p/30fps', 'YouTube 720p'],
        quality: '720p/1080p',
        minBudget: 60_000_000,
      },
      entry: {
        label: 'ابتدایی',
        platforms: ['Twitch 720p', 'Zoom'],
        quality: '720p',
        minBudget: 35_000_000,
      },
    },
  },
  office: {
    title: '🏢 عملکرد اداری',
    description: 'سیستم مناسب برای کارهای اداری',
    tierDescriptions: {
      ultra: {
        label: 'رده‌بالا - حرفه‌ای',
        tasks: ['Excel سنگین', 'ماشین مجازی', 'چند مانیتور'],
        monitors: '2-4',
        minBudget: 80_000_000,
      },
      high: {
        label: 'قوی - متوسط',
        tasks: ['Excel/PowerPoint', 'چت ویدیویی', 'چند مانیتور'],
        monitors: '2',
        minBudget: 45_000_000,
      },
      medium: {
        label: 'متعادل',
        tasks: ['Word/Excel', 'Outlook', 'Chrome'],
        monitors: '1-2',
        minBudget: 25_000_000,
      },
      entry: {
        label: 'ابتدایی',
        tasks: ['مرورگر', 'ایمیل', 'Word'],
        monitors: '1',
        minBudget: 15_000_000,
      },
    },
  },
};

// ════════════════════════════════════════════════════════════════
// 📋 تنظیمات بودجه بر اساس کاربری (وزن هر دسته)
// ════════════════════════════════════════════════════════════════

export const USE_CASE_BUDGET_WEIGHTS: Record<string, Record<string, number>> = {
  gaming: {
    cpu: 0.19,
    gpu: 0.4,
    motherboard: 0.12,
    ram: 0.09,
    storage: 0.07,
    psu: 0.075,
    case: 0.055,
    cooler: 0.045,
    case_fan: 0.015,
    case_argb: 0.005,
  },
  editing: {
    cpu: 0.32,
    gpu: 0.19,
    motherboard: 0.13,
    ram: 0.13,
    storage: 0.09,
    psu: 0.065,
    case: 0.05,
    cooler: 0.055,
    case_fan: 0.01,
    case_argb: 0.005,
  },
  streaming: {
    cpu: 0.28,
    gpu: 0.22,
    motherboard: 0.13,
    ram: 0.12,
    storage: 0.08,
    psu: 0.075,
    case: 0.05,
    cooler: 0.05,
    case_fan: 0.015,
    case_argb: 0.005,
  },
  office: {
    cpu: 0.3,
    gpu: 0.05,
    motherboard: 0.16,
    ram: 0.14,
    storage: 0.13,
    psu: 0.08,
    case: 0.06,
    cooler: 0.025,
    case_fan: 0.005,
    case_argb: 0.002,
  },
};

// ════════════════════════════════════════════════════════════════
// 🔧 توابع کمکی برای پردازش محصول خام
// ════════════════════════════════════════════════════════════════

type RawProduct = {
  id?: number | string;
  name?: string;
  title?: string;
  price?: number | string | Record<string, any>;
  product_price?: number | string | Record<string, any>;
  special_price?: number | string;
  is_in_stock?: number | boolean;
  url_key?: string;
  slug?: string;
  brand?: { title?: string; name?: string } | string;
  warranty?: string;
  image?: string | { path?: string; src?: string; url?: string; link?: string };
  images?: Array<{
    content?: { path?: string; base_image?: number; link?: string };
    path?: string;
    src?: string;
    url?: string;
    link?: string;
  }>;
  thumbnail?: string | { path?: string; src?: string; url?: string; link?: string };
  media_gallery?: Array<{ url?: string; file?: string }>;
};

function buildImageUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  const path = String(src).trim();
  if (!path) return null;

  // اگه URL کامل باشه
  if (/^https?:\/\//i.test(path)) {
    // جایگزینی media.magenfa.ir با media.iwcs.ir
    return path.replace(/media\.magenfa\.ir/gi, 'media.iwcs.ir');
  }

  const cleanPath = path.replace(/^\/+/, '');

  // اگه مسیر قبلاً شامل bucket باشه، تکرار نکن
  if (cleanPath.startsWith(AWS_BUCKET + '/') || cleanPath.startsWith('offl/')) {
    return `${BASE_URL_IMAGE}/${cleanPath}`;
  }

  return `${BASE_URL_IMAGE}/${AWS_BUCKET}/${cleanPath}`;
}

function pickImage(p: RawProduct): string | null {
  if (!p) return null;

  // اولویت ۱: images array با base_image
  if (Array.isArray(p.images) && p.images.length > 0) {
    const baseImg = p.images.find((img: any) => img?.content?.base_image === 1);
    const img = baseImg || p.images[0];
    if (img?.content?.path) return buildImageUrl(img.content.path);
    if (img?.content?.link) return buildImageUrl(img.content.link);
    if (img?.path) return buildImageUrl(img.path);
    if (img?.url) return buildImageUrl(img.url);
  }

  // اولویت ۲: media_gallery
  if (Array.isArray(p.media_gallery) && p.media_gallery.length > 0) {
    const m = p.media_gallery[0];
    if (m?.url) return buildImageUrl(m.url);
    if (m?.file) return buildImageUrl(m.file);
  }

  // اولویت ۳: thumbnail (ممکنه object یا string باشه)
  if (p.thumbnail) {
    const t =
      typeof p.thumbnail === 'string'
        ? p.thumbnail
        : p.thumbnail.path || p.thumbnail.url || p.thumbnail.src;
    if (t) return buildImageUrl(t);
  }

  // اولویت ۴: image (ممکنه object یا string باشه)
  if (p.image) {
    const i =
      typeof p.image === 'string'
        ? p.image
        : p.image.path || p.image.url || p.image.src || p.image.link;
    if (i) return buildImageUrl(i);
  }

  return null;
}

function pickBrand(p: RawProduct): string | null {
  if (!p.brand) return null;
  if (typeof p.brand === 'string') return p.brand;
  return p.brand?.title || p.brand?.name || null;
}

function extractProducts(res: unknown): RawProduct[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;
  const candidates: unknown[] = [
    r.products,
    r.data,
    r.items,
    r.result,
    r.hits,
    r.results,
    (r.products as any)?.items,
    (r.data as any)?.products,
    (r.data as any)?.items,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c as RawProduct[];
  return [];
}

async function searchCategory(query: string, perPage: number): Promise<RawProduct[]> {
  try {
    const jwt = await generateToken();
    const url = `${BASEURL}/search?q=${encodeURIComponent(query)}&type=page&per_page=${perPage}&page=1`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return extractProducts(await res.json());
  } catch {
    return [];
  }
}

function toNumberPrice(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[,٬\s]/g, '');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function firstPositive(...values: unknown[]): number {
  for (const v of values) {
    const n = toNumberPrice(v);
    if (n > 0) return n;
  }
  return 0;
}

function priceObj(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function extractProductPrices(p: RawProduct): {
  price: number;
  finalPrice: number;
  discountPercent: number;
} {
  const price = priceObj(p.price);
  const productPrice = priceObj((p as any).product_price);
  const original = firstPositive(
    (p as any).old_price,
    (p as any).original_price,
    (p as any).regular_price,
    price.old_price,
    price.original_price,
    price.regular_price,
    productPrice.old_price,
    productPrice.original_price,
    productPrice.regular_price,
    typeof p.price === 'object' ? undefined : p.price,
    typeof (p as any).product_price === 'object' ? undefined : (p as any).product_price,
    price.price,
    productPrice.price
  );
  const finalPrice =
    firstPositive(
      p.special_price,
      (p as any).discount_price,
      (p as any).final_price,
      (p as any).sale_price,
      price.special_price,
      price.discount_price,
      price.final_price,
      price.sale_price,
      price.price,
      productPrice.special_price,
      productPrice.discount_price,
      productPrice.final_price,
      productPrice.sale_price,
      productPrice.price,
      typeof p.price === 'object' ? undefined : p.price,
      typeof (p as any).product_price === 'object' ? undefined : (p as any).product_price
    ) || original;
  const base = original || finalPrice;
  const discountPercent =
    base > 0 && finalPrice > 0 && finalPrice < base
      ? Math.round(((base - finalPrice) / base) * 100)
      : 0;
  return { price: base, finalPrice, discountPercent };
}

function isProductInStock(p: RawProduct, finalPrice: number): boolean {
  const stockValue =
    (p as any).is_in_stock ??
    (p as any).in_stock ??
    (p as any).stock ??
    (p as any).available ??
    (p as any).availability;
  if (stockValue === 0 || stockValue === false || stockValue === '0') return false;
  if (typeof stockValue === 'string' && /ناموجود|out\s*of\s*stock|unavailable/i.test(stockValue))
    return false;
  // اگر بک‌اند وضعیت موجودی را نداده ولی قیمت معتبر داریم، محصول را قابل انتخاب فرض کن؛
  // این باعث می‌شود اسمبلر بی‌جهت اکثر کالاها را ناموجود نکند.
  return finalPrice > 0;
}

/**
 * ساخت AssemblyPart از محصول خام با استفاده از part-detector
 */
function createPart(
  p: RawProduct,
  targetCategory: PartCategory,
  isOptional: boolean
): AssemblyPart | null {
  const name = String(p.name || p.title || '').trim();
  const id = p.id ?? p.url_key ?? p.slug;
  if (!name || !id) return null;

  const { price: basePrice, finalPrice, discountPercent } = extractProductPrices(p);

  const catDef = PART_CATEGORIES.find((c) => c.key === targetCategory);

  // استفاده از part-detector جدید
  const detection = detectPart(targetCategory, name);

  if (!detection.isMatch || detection.confidence < 50) {
    return null;
  }

  // ═════ گاردریل سه‌لایه ضدِ توهم دسته‌بندی ═════
  // مانع می‌شود که مثلاً «فن کیس» به‌جای «کیس» یا «خمیر حرارتی»
  // به‌جای «خنک‌کننده» انتخاب شود.
  const guardCheck = validatePartCategory(targetCategory, {
    title: name,
    name,
    price: basePrice,
    finalPrice,
    specs: detection.specs || {},
  });
  if (!guardCheck.passed) {
    return null;
  }

  return {
    category: targetCategory,
    categoryLabel: catDef?.label || targetCategory,
    emoji: catDef?.emoji || '📦',
    id,
    name,
    url: `${BASEURL_SITE}/product/${encodeURIComponent(String(id))}`,
    image: pickImage(p),
    price: basePrice,
    finalPrice,
    discountPercent,
    inStock: isProductInStock(p, finalPrice),
    brand: pickBrand(p),
    warranty: p.warranty ? String(p.warranty).trim() : null,
    shortSpec: detection.shortSpec,
    specs: detection.specs || {},
    confidence: detection.confidence,
    isOptional,
    alternatives: [],
  };
}

// ════════════════════════════════════════════════════════════════
// 📦 جمع‌آوری کاندیداها از API
// ════════════════════════════════════════════════════════════════

export async function gatherCandidates(
  useCaseKey: string,
  totalBudget: number,
  includeOptional = true,
  perCategory = 150 // v5.0: از 30 به 150 → دریافت کل ~۱۳۶ خنک‌کننده و سایر دسته‌ها
): Promise<CategoryCandidates[]> {
  const mandatoryCats = PART_CATEGORIES_MANDATORY;
  const optionalCats = includeOptional ? PART_CATEGORIES_OPTIONAL : [];
  const allCats = [...mandatoryCats, ...optionalCats];

  const weights = USE_CASE_BUDGET_WEIGHTS[useCaseKey] || USE_CASE_BUDGET_WEIGHTS.gaming;

  return Promise.all(
    allCats.map(async (cat) => {
      const weight = weights[cat.key] ?? cat.budgetWeight;
      const budgetShare = Math.round(weight * totalBudget);

      const all: RawProduct[] = [];
      const seen = new Set<string>();

      // جستجو با کوئری‌های متنوع
      for (const q of cat.queries) {
        try {
          const found = await searchCategory(
            q,
            Math.max(8, Math.ceil(perCategory / cat.queries.length))
          );
          for (const item of found) {
            const key = String(item.id ?? item.url_key ?? item.slug);
            if (seen.has(key)) continue;
            seen.add(key);
            all.push(item);
          }
          if (all.length >= perCategory * 3) break;
        } catch (e) {
          // ignore individual query errors
        }
      }

      // تبدیل به Parts با part-detector
      const parts: AssemblyPart[] = [];
      for (const raw of all) {
        const part = createPart(raw, cat.key, cat.required === false);
        if (part && part.inStock && part.finalPrice > 0) {
          parts.push(part);
        }
      }

      // v5.1: ادغام همیشگی با پایگاه دانش محلی (Reclassified Catalog)
      // برای دستهٔ cooler و case_fan که API خیلی کم برمی‌گرداند، حیاتی است.
      // برای بقیه هم گزینه‌های بیشتری در اختیار کاربر می‌گذارد.
      if (hasOfflineCatalog()) {
        const offlineItems = getOfflineCatalogByCategory(cat.key);
        const seenIds = new Set(parts.map((p) => String(p.id)));
        for (const item of offlineItems) {
          if (seenIds.has(String(item.id))) continue;
          // اعمال گاردریل روی داده‌های offline هم (dual-check)
          const guardCheck = validatePartCategory(cat.key, {
            title: item.name,
            name: item.name,
            price: item.price,
            finalPrice: item.finalPrice,
            specs: item.specs || {},
          });
          if (!guardCheck.passed) continue;

          const supp: AssemblyPart = {
            category: cat.key,
            categoryLabel: cat.label,
            emoji: cat.emoji,
            id: item.id,
            name: item.name,
            url: item.url || `${BASEURL_SITE}/product/${encodeURIComponent(String(item.id))}`,
            image: item.image || null,
            price: Number(item.price || 0),
            finalPrice: Number(item.finalPrice || item.price || 0),
            discountPercent: Number(item.discountPercent || 0),
            inStock: Boolean(item.inStock),
            brand: item.brand || null,
            warranty: item.warranty || null,
            shortSpec: item.shortSpec || '',
            specs: item.specs || {},
            confidence: 70, // offline data has medium confidence
            isOptional: cat.required === false,
            alternatives: [],
          };
          if (supp.finalPrice > 0 && supp.inStock) parts.push(supp);
        }
      }

      // مرتب‌سازی: confidence + تطابق با بودجهٔ هدف
      parts.sort((a, b) => {
        // اولویت ۱: confidence بالاتر
        const confDiff = b.confidence - a.confidence;
        if (Math.abs(confDiff) > 5) return confDiff;
        // اولویت ۲: نزدیکی به بودجهٔ هدف
        const aDist = Math.abs(a.finalPrice - budgetShare);
        const bDist = Math.abs(b.finalPrice - budgetShare);
        return aDist - bDist;
      });

      return {
        category: cat.key,
        label: cat.label,
        emoji: cat.emoji,
        budgetShare,
        isOptional: cat.required === false,
        required: cat.required !== false,
        key: cat.key,
        candidates: parts.slice(0, perCategory),
      };
    })
  );
}

// ════════════════════════════════════════════════════════════════
// 💰 محاسبهٔ بازهٔ بودجه
// ════════════════════════════════════════════════════════════════

export async function getBudgetRange(
  useCaseKey: string,
  includeOptional = true
): Promise<BudgetRange> {
  const weights = USE_CASE_BUDGET_WEIGHTS[useCaseKey] || USE_CASE_BUDGET_WEIGHTS.gaming;

  const baseCategoriesToCheck = includeOptional ? PART_CATEGORIES : PART_CATEGORIES_MANDATORY;
  const categoriesToCheck =
    useCaseKey === 'office'
      ? baseCategoriesToCheck.filter((cat) => cat.key !== 'gpu')
      : baseCategoriesToCheck;

  // Use the same normalized candidate pipeline as the real assembler. The old
  // duplicate search path could report GPU=0 while /api/assemble found GPUs.
  const gathered = await gatherCandidates(useCaseKey, 450_000_000, includeOptional, 20);
  const byCategory = new Map(gathered.map((entry) => [entry.category, entry.candidates]));

  const results = categoriesToCheck.map((cat) => {
    const isOptional = cat.required === false;
    const prices = (byCategory.get(cat.key) || [])
      .filter((part) => part.inStock && part.finalPrice > 0)
      .map((part) => part.finalPrice)
      .sort((a, b) => a - b);
    const pick = (ratio: number) =>
      prices.length
        ? prices[
            Math.min(prices.length - 1, Math.max(0, Math.floor((prices.length - 1) * ratio)))
          ]
        : 0;
    const catMin = pick(0.15);
    const catTypical = pick(0.45);
    const catMax = pick(0.85) || prices[prices.length - 1] || 0;
    const weight = weights[cat.key] ?? cat.budgetWeight;
    return {
      category: cat.key,
      min: catMin,
      typical: catTypical,
      max: catMax,
      isOptional,
      weight,
    };
  });

  // محاسبهٔ min/max کل
  const mandatoryResults = results.filter((r) => !r.isOptional);
  const optionalResults = results.filter((r) => r.isOptional);

  const hardMin = mandatoryResults.reduce((s, c) => s + c.min, 0);
  const typical =
    mandatoryResults.reduce((s, c) => s + (c.typical || c.min), 0) +
    optionalResults.reduce((s, c) => s + (c.typical || 0) * 0.55, 0);
  const realisticMax =
    mandatoryResults.reduce((s, c) => s + c.max, 0) +
    optionalResults.reduce((s, c) => s + c.max * 0.75, 0);

  const fallbackByUseCase: Record<string, { min: number; recommended: number; max: number }> = {
    office: { min: 18_000_000, recommended: 30_000_000, max: 120_000_000 },
    gaming: { min: 30_000_000, recommended: 75_000_000, max: 350_000_000 },
    editing: { min: 40_000_000, recommended: 110_000_000, max: 450_000_000 },
    streaming: { min: 45_000_000, recommended: 120_000_000, max: 450_000_000 },
  };
  const fallback = fallbackByUseCase[useCaseKey] || fallbackByUseCase.gaming;
  const useCaseFloor: Record<string, number> = {
    office: 15_000_000,
    gaming: 45_000_000,
    editing: 55_000_000,
    streaming: 60_000_000,
  };
  const useCaseCeil: Record<string, number> = {
    office: 160_000_000,
    gaming: 450_000_000,
    editing: 550_000_000,
    streaming: 550_000_000,
  };
  const min =
    hardMin > 0
      ? Math.max(
          useCaseFloor[useCaseKey] || 25_000_000,
          Math.round(hardMin * (useCaseKey === 'office' ? 0.95 : 1.08))
        )
      : fallback.min;
  const recommended =
    typical > 0
      ? Math.max(min, Math.round(typical * (useCaseKey === 'office' ? 1.0 : 1.12)))
      : fallback.recommended;
  const maxRaw =
    realisticMax > min
      ? Math.round(realisticMax * (useCaseKey === 'office' ? 1.0 : 1.18))
      : fallback.max;
  const max = Math.max(maxRaw, useCaseCeil[useCaseKey] || fallback.max);

  return {
    min,
    max: Math.max(max, recommended, min + (useCaseKey === 'office' ? 40_000_000 : 120_000_000)),
    recommended: Math.min(Math.max(recommended, min), Math.max(max, recommended)),
    perCategory: results.map((r) => ({ category: r.category, min: r.min, max: r.max })),
  };
}

// ════════════════════════════════════════════════════════════════
// 🧮 امتیازدهی به قطعه بر اساس کاربری
// ════════════════════════════════════════════════════════════════

function scorePartForUseCase(
  part: AssemblyPart,
  useCase: string,
  remainingBudget: number,
  totalBudget: number,
  targetShare: number
): number {
  let score = 50 + part.confidence * 0.4;
  const ratio = part.finalPrice / totalBudget;
  const targetRatio = targetShare / totalBudget;

  // جریمهٔ انحراف شدید از بودجهٔ هدف
  const deviation = Math.abs(ratio - targetRatio);
  if (deviation > 0.4) score -= 30;
  else if (deviation > 0.25) score -= 15;
  else if (deviation < 0.1) score += 10;

  // جریمهٔ گرانی بیش از حد
  if (part.finalPrice > remainingBudget * 0.6) score -= 20;

  // پاداش قطعات اجباری
  if (!part.isOptional) score += 8;

  switch (useCase) {
    case 'gaming': {
      // GPU بسیار مهم
      if (part.category === 'gpu' && part.specs.vram) {
        if (part.specs.vram >= 16) score += 55;
        else if (part.specs.vram >= 12) score += 45;
        else if (part.specs.vram >= 8) score += 28;
        else score -= 18;
      }
      // CPU باید هسته کافی داشته باشه (ولی در گیمینگ GPU مهم‌تره)
      if (part.category === 'cpu' && part.specs.cores) {
        if (part.specs.cores >= 12) score += 30;
        else if (part.specs.cores >= 8) score += 22;
        else if (part.specs.cores >= 6) score += 10;
      }
      // RAM حداقل ۱۶GB
      if (part.category === 'ram' && part.specs.capacity) {
        if (part.specs.capacity >= 32) score += 25;
        else if (part.specs.capacity >= 16) score += 15;
        else if (part.specs.capacity < 8) score -= 10;
      }
      break;
    }
    case 'editing': {
      // CPU بسیار مهم
      if (part.category === 'cpu' && part.specs.cores) {
        if (part.specs.cores >= 16) score += 55;
        else if (part.specs.cores >= 12) score += 45;
        else if (part.specs.cores >= 8) score += 25;
        else score -= 5;
      }
      // RAM زیاد مهم
      if (part.category === 'ram' && part.specs.capacity) {
        if (part.specs.capacity >= 64) score += 50;
        else if (part.specs.capacity >= 32) score += 35;
        else if (part.specs.capacity >= 16) score += 15;
        else score -= 5;
      }
      // NVMe SSD مهم
      if (part.category === 'storage' && part.specs.isNVMe) score += 18;
      break;
    }
    case 'streaming': {
      if (part.category === 'cpu' && part.specs.cores) {
        if (part.specs.cores >= 12) score += 45;
        else if (part.specs.cores >= 8) score += 30;
        else if (part.specs.cores >= 6) score += 10;
      }
      if (part.category === 'ram' && part.specs.capacity) {
        if (part.specs.capacity >= 32) score += 30;
        else if (part.specs.capacity >= 16) score += 15;
      }
      break;
    }
    case 'office': {
      if (part.category === 'cpu' && part.specs.cores) {
        if (part.specs.cores >= 6) score += 25;
        else if (part.specs.cores >= 4) score += 12;
      }
      if (part.category === 'ram' && part.specs.capacity) {
        if (part.specs.capacity >= 16) score += 25;
        else if (part.specs.capacity >= 8) score += 12;
      }
      // GPU ضعیف‌تر هم کافیه
      if (part.category === 'gpu' && part.specs.tier && part.specs.tier !== 'ultra') {
        score -= 5;
      }
      break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// ════════════════════════════════════════════════════════════════
// 🎯 انتخاب قطعات با الگوریتم Greedy + Constraint-aware
// ════════════════════════════════════════════════════════════════

export function selectPartsForBuild(
  categories: CategoryCandidates[],
  useCase: string,
  budget: number
): { parts: AssemblyPart[]; reason: string; details: string[] } {
  const selected: AssemblyPart[] = [];
  let currentTotal = 0;
  const details: string[] = [];
  const weights = USE_CASE_BUDGET_WEIGHTS[useCase] || USE_CASE_BUDGET_WEIGHTS.gaming;

  // ۱) ابتدا قطعات اجباری (mandatory)
  const mandatoryCategories = categories.filter((c) => !c.isOptional);
  const optionalCategories = categories.filter((c) => c.isOptional);

  for (const cat of mandatoryCategories) {
    if (cat.candidates.length === 0) continue;

    const remaining = budget - currentTotal;
    const targetShare = Math.round((weights[cat.category] || 0.1) * budget);
    // حداکثر قیمت قابل‌قبول: ۱.۵ برابر سهم هدف یا ۵۵٪ باقی‌مانده
    const maxForThis = Math.min(targetShare * 1.5, remaining * 0.6);

    // امتیازدهی همهٔ کاندیداها
    const scored = cat.candidates
      .filter((c) => c.finalPrice <= maxForThis)
      .map((c) => ({
        part: c,
        score: scorePartForUseCase(c, useCase, remaining, budget, targetShare),
      }))
      .sort((a, b) => b.score - a.score);

    let best: AssemblyPart | null = null;
    if (scored.length > 0) {
      best = scored[0].part;
    } else {
      // اگه هیچ‌کدوم توی maxForThis جا نشدن، ارزون‌ترین رو بردار
      best = cat.candidates.sort((a, b) => a.finalPrice - b.finalPrice)[0];
    }

    if (best) {
      // v5.0: جایگزین‌های فراوان — تا 50 برای هر دستهٔ اجباری
      const alts = cat.candidates
        .filter((c) => c.id !== best!.id && !c.isOptional)
        .sort((a, b) => (a.finalPrice || 0) - (b.finalPrice || 0))
        .slice(0, 50);

      const picked: AssemblyPart = {
        ...best,
        alternatives: alts,
        pickReason: `سهم هدف: ${shortToman(targetShare)} | امتیاز: ${scored[0]?.score?.toFixed(0) || '?'}`,
      };
      selected.push(picked);
      currentTotal += best.finalPrice;
      details.push(`${cat.emoji} ${cat.label}: ${best.shortSpec || best.name}`);
    }
  }

  // ۲) قطعات اختیاری (با هوش: اگه بودجهٔ مناسب داریم و کاربری نیاز داره)
  const includeOptionals =
    ['gaming', 'streaming', 'editing'].includes(useCase) || currentTotal < budget * 0.92;
  const remainingForOptional = budget - currentTotal;

  for (const cat of optionalCategories) {
    if (cat.candidates.length === 0) continue;

    // ═════════════════════════════════════════════════════════════
    // 🛡️ گاردریل ویژهٔ Cooler: جلوگیری از تحمیل AIO گران به سیستم ضعیف
    // ═════════════════════════════════════════════════════════════
    if (cat.category === 'cooler') {
      const cpuPart = selected.find((p) => p.category === 'cpu');
      const cpuTdp = estimateCpuTdpFromName(cpuPart);
      const remaining = budget - currentTotal;

      // v6.0: فیلتر قاطع پایه لپ‌تاپ قبل از هر محاسبه
      const genuineCoolers = cat.candidates.filter((c) => isGenuineCpuCooler(c.name || ''));
      const cheapestCoolerPrice = genuineCoolers.length
        ? Math.min(
            ...genuineCoolers.map((c) => Number(c.finalPrice || c.price || 0)).filter((n) => n > 0)
          )
        : Infinity;

      // شرط ۱: کاربری اداری با CPU کم‌مصرف → کاملاً بی‌نیاز
      if (useCase === 'office' && cpuTdp <= 95) {
        details.push(
          `❄️ ${cat.label}: صرف‌نظر شد (پردازندهٔ اداری ${cpuTdp}W نیاز به کولر جانبی ندارد؛ فن استوک کافی است).`
        );
        continue;
      }

      // شرط ۲: اگر ارزان‌ترین cooler معتبر بیش از حد گران بود → skip
      if (cheapestCoolerPrice > budget * 0.15 || cheapestCoolerPrice > remaining * 0.4) {
        details.push(
          `❄️ ${cat.label}: صرف‌نظر شد (ارزان‌ترین کولر معتبر ${shortToman(cheapestCoolerPrice)} با بودجه متناسب نیست).`
        );
        continue;
      }

      // شرط ۳: انتخاب اقتصادی از میان کولرهای معتبر (نه پایه لپ‌تاپ)
      const economical = pickBestCoolerEconomical(genuineCoolers, cpuPart || null);
      if (economical && Number(economical.finalPrice || 0) <= remaining * 0.5) {
        // ارسال کل ~74 کولر معتبر (پس از فیلتر) به فرانت
        const alts = genuineCoolers
          .filter((c) => c.id !== economical.id)
          .sort((a, b) => (a.finalPrice || 0) - (b.finalPrice || 0))
          .slice(0, 150);
        selected.push({ ...economical, alternatives: alts });
        currentTotal += Number(economical.finalPrice || 0);
        details.push(
          `❄️ ${cat.label}: ${economical.shortSpec || economical.name} ${economical.pickReason ? '— ' + economical.pickReason : ''}`
        );
        continue;
      }
      // اگر Tier engine چیزی نداد یا خیلی گران بود، ادامه به منطق عادی
    }

    // اگه بودجه کمه، کولر و RGB نیار
    if (currentTotal + cat.budgetShare > budget * 0.97) continue;
    if (!includeOptionals && remainingForOptional < cat.budgetShare * 0.7) continue;

    // برای gaming/streaming، خنک‌کننده و RGB خوبه
    // برای office، اختیاری‌ها کم‌اهمیت‌ترن
    const targetShare = Math.round((weights[cat.category] || 0.02) * budget);
    const remaining = budget - currentTotal;
    const maxForThis = Math.min(targetShare * 1.4, remaining * 0.15);

    const scored = cat.candidates
      .filter((c) => c.finalPrice <= maxForThis)
      .map((c) => ({
        part: c,
        score: scorePartForUseCase(c, useCase, remaining, budget, targetShare),
      }))
      .sort((a, b) => b.score - a.score);

    let best: AssemblyPart | null = null;
    if (scored.length > 0) best = scored[0].part;
    if (!best && cat.candidates.length > 0) {
      best = cat.candidates.sort((a, b) => a.finalPrice - b.finalPrice)[0];
    }

    if (best) {
      // v5.0: برای cooler تا 150، برای بقیه اختیاری‌ها تا 40
      const altsLimit = cat.category === 'cooler' ? 150 : 40;
      const alts = cat.candidates
        .filter((c) => c.id !== best!.id)
        .sort((a, b) => (a.finalPrice || 0) - (b.finalPrice || 0))
        .slice(0, altsLimit);
      selected.push({
        ...best,
        alternatives: alts,
        pickReason: `${cat.required === false ? 'اختیاری' : 'اجباری'} | امتیاز: ${scored[0]?.score?.toFixed(0) || '?'}`,
      });
      currentTotal += best.finalPrice;
      details.push(`${cat.emoji} ${cat.label}: ${best.shortSpec || best.name} (اختیاری)`);
    }
  }

  return {
    parts: selected,
    reason: details.slice(0, 4).join(' | '),
    details,
  };
}

// ════════════════════════════════════════════════════════════════
// 🔍 بررسی سازگاری دقیق و حرفه‌ای
// ════════════════════════════════════════════════════════════════

export function checkCompatibility(parts: AssemblyPart[]): CompatibilityResult {
  const issues: CompatibilityIssue[] = [];
  const warnings: CompatibilityIssue[] = [];
  let score = 100;

  const cpu = parts.find((p) => p.category === 'cpu');
  const gpu = parts.find((p) => p.category === 'gpu');
  const mb = parts.find((p) => p.category === 'motherboard');
  const ram = parts.find((p) => p.category === 'ram');
  const psu = parts.find((p) => p.category === 'psu');
  const cs = parts.find((p) => p.category === 'case');
  const storage = parts.find((p) => p.category === 'storage');
  const cooler = parts.find((p) => p.category === 'cooler');

  // ═══════ بررسی ۱: سوکت CPU با مادربرد ═══════
  let socketMatch = true;
  if (cpu?.specs?.socket && mb?.specs?.socket) {
    if (cpu.specs.socket !== mb.specs.socket) {
      issues.push({
        severity: 'error',
        category: 'cpu',
        message: `⚠️ ناسازگاری سوکت: CPU با سوکت ${cpu.specs.socket} به مادربرد با سوکت ${mb.specs.socket} نصب نمی‌شود`,
      });
      score -= 35;
      socketMatch = false;
    }
  } else if (cpu?.specs?.socket === 'AM5' && mb?.specs?.ramType && mb.specs.ramType !== 'DDR5') {
    issues.push({
      severity: 'error',
      category: 'motherboard',
      message: `⚠️ سوکت AM5 فقط با رم DDR5 سازگار است`,
    });
    score -= 25;
  } else if (
    cpu?.specs?.socket === 'LGA1700' &&
    mb?.specs?.socket &&
    mb.specs.socket !== 'LGA1700'
  ) {
    issues.push({
      severity: 'error',
      category: 'motherboard',
      message: `⚠️ CPU با سوکت LGA1700 به مادربرد با سوکت ${mb.specs.socket} نصب نمی‌شود`,
    });
    score -= 35;
    socketMatch = false;
  }

  // ═══════ بررسی ۲: نوع RAM با مادربرد ═══════
  let ramTypeMatch = true;
  if (mb?.specs?.ramType && ram?.specs?.ramType && mb.specs.ramType !== ram.specs.ramType) {
    issues.push({
      severity: 'error',
      category: 'ram',
      message: `⚠️ ناسازگاری DDR: مادربرد ${mb.specs.ramType} فقط با رم ${mb.specs.ramType} کار می‌کند`,
    });
    score -= 25;
    ramTypeMatch = false;
  }

  // ═══════ بررسی ۳: توان PSU بر اساس GPU + CPU ═══════
  const cpuTdp = (cpu?.specs?.tdp as number) || 95;
  const gpuTdp = gpu ? (gpu.specs?.tdp as number) || 150 : 0;
  const requiredPsu = calculateMinPsuWattage(cpuTdp, gpuTdp);
  const recommendedPsu = recommendPsuWattage(cpuTdp, gpuTdp);
  let psuSufficient = true;

  if (psu?.specs?.wattage) {
    const w = psu.specs.wattage;
    if (w < requiredPsu) {
      issues.push({
        severity: 'error',
        category: 'psu',
        message: `⚠️ PSU ناکافی: ${w}W برای این سیستم کافی نیست. حداقل ${requiredPsu}W لازم است (GPU: ${gpuTdp}W + CPU: ${cpuTdp}W + بقیه)`,
      });
      score -= 25;
      psuSufficient = false;
    } else if (w < recommendedPsu) {
      warnings.push({
        severity: 'warning',
        category: 'psu',
        message: `⚡ PSU در حداقل: ${w}W نزدیک به مرز است. ${recommendedPsu}W پیشنهاد می‌شود برای پایداری بیشتر`,
      });
      score -= 5;
    }
  } else if (psu) {
    // PSU پیدا شده ولی واتش مشخص نیست - با احتیاط
    warnings.push({
      severity: 'info',
      category: 'psu',
      message: `⚠️ توان PSU مشخص نیست. مطمئن شو حداقل ${recommendedPsu}W باشد`,
    });
    score -= 3;
  } else {
    // اصلاً PSU نیست
    issues.push({
      severity: 'error',
      category: 'psu',
      message: `⚠️ پاور (PSU) انتخاب نشده!`,
    });
    score -= 10;
  }

  // ═══════ بررسی ۴: فرم‌فکتور کیس با مادربرد ═══════
  let formFactorOk = true;
  const caseFF = cs?.specs?.formFactor as FormFactor | undefined;
  const mbFF = mb?.specs?.formFactor as FormFactor | undefined;
  if (caseFF && mbFF && !isFormFactorCompatible(caseFF, mbFF)) {
    issues.push({
      severity: 'error',
      category: 'case',
      message: `⚠️ کیس ${caseFF} نمی‌تواند مادربرد ${mbFF} را در خود جا دهد`,
    });
    score -= 20;
    formFactorOk = false;
  }

  // ═══════ بررسی ۵: ظرفیت RAM ═══════
  if (ram?.specs?.capacity) {
    const cap = ram.specs.capacity;
    if (cap < 8) {
      issues.push({
        severity: 'warning',
        category: 'ram',
        message: `⚠️ رم ${cap}GB برای استفادهٔ مدرن کافی نیست. حداقل ۱۶GB پیشنهاد می‌شود`,
      });
      score -= 10;
    } else if (cap < 16) {
      warnings.push({
        severity: 'info',
        category: 'ram',
        message: `💡 رم ${cap}GB کار می‌کند ولی برای گیمینگ و ادیت، ۱۶GB+ راحت‌تر است`,
      });
      score -= 3;
    }
  }

  // ═══════ بررسی ۶: Storage (NVMe vs SATA) ═══════
  let storageOk = true;
  if (storage?.specs?.size && storage.specs.size < 240) {
    warnings.push({
      severity: 'warning',
      category: 'storage',
      message: `⚠️ SSD ${storage.specs.size}GB برای نصب بازی‌های مدرن کم است. حداقل ۵۰۰GB پیشنهاد می‌شود`,
    });
    score -= 5;
  }
  if (mb?.specs?.formFactor === 'Mini-ITX' && storage?.specs?.formFactor === '3.5"') {
    warnings.push({
      severity: 'info',
      category: 'storage',
      message: `💡 در کیس Mini-ITX، جا برای HDD 3.5" کم است. SSD M.2 بهتر است`,
    });
    score -= 2;
  }

  // ═══════ بررسی ۷: Cooler (TDP rating) ═══════
  let coolerAdequate = true;
  if (cooler?.specs?.tdpRating && cpu?.specs?.tdp) {
    if (cooler.specs.tdpRating < cpu.specs.tdp) {
      issues.push({
        severity: 'error',
        category: 'cooler',
        message: `⚠️ خنک‌کننده (${cooler.specs.tdpRating}W) برای CPU (${cpu.specs.tdp}W TDP) کافی نیست`,
      });
      score -= 15;
      coolerAdequate = false;
    } else if (cooler.specs.tdpRating < cpu.specs.tdp * 1.3) {
      warnings.push({
        severity: 'info',
        category: 'cooler',
        message: `💡 خنک‌کننده در حد مرز است. برای اورکلاک، قوی‌تر بگیر`,
      });
      score -= 3;
    }
  }

  // ═══════ بررسی ۸: GPU TDP با PSU (اضافی، برای ultra GPU) ═══════
  if (
    gpu?.specs?.tier === 'ultra' &&
    (!psu?.specs?.wattage || psu.specs.wattage < recommendedPsu)
  ) {
    warnings.push({
      severity: 'warning',
      category: 'gpu',
      message: `⚡ GPU رده‌بالا نیاز به PSU قوی دارد. ${recommendedPsu}W پیشنهاد می‌شود`,
    });
    score -= 4;
  }

  return {
    compatible: score >= 70,
    score: Math.max(0, score),
    issues,
    warnings,
    details: {
      socketMatch,
      ramTypeMatch,
      psuSufficient,
      formFactorOk,
      storageOk,
      coolerAdequate,
    },
  };
}

// ════════════════════════════════════════════════════════════════
// 🏆 تعیین رتبهٔ سیستم
// ════════════════════════════════════════════════════════════════

export function determineTier(parts: AssemblyPart[], budget: number): string {
  let score = 0;

  const cpu = parts.find((p) => p.category === 'cpu');
  const gpu = parts.find((p) => p.category === 'gpu');
  const ram = parts.find((p) => p.category === 'ram');

  if (cpu?.specs?.cores) {
    score += cpu.specs.cores * 2.5;
    if (cpu.specs.tier === 'ultra') score += 30;
    else if (cpu.specs.tier === 'high') score += 15;
  }

  if (gpu?.specs?.vram) {
    score += gpu.specs.vram * 3;
    if (gpu.specs.tier === 'ultra') score += 30;
    else if (gpu.specs.tier === 'high') score += 15;
  }

  if (ram?.specs?.capacity) {
    score += ram.specs.capacity * 0.15;
  }

  if (budget >= 200_000_000) score += 40;
  else if (budget >= 150_000_000) score += 32;
  else if (budget >= 100_000_000) score += 25;
  else if (budget >= 80_000_000) score += 20;
  else if (budget >= 50_000_000) score += 12;
  else if (budget >= 30_000_000) score += 6;

  if (score >= 100) return 'ultra';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'entry';
}

// ════════════════════════════════════════════════════════════════
// 📝 تولید توضیحات فارسی
// ════════════════════════════════════════════════════════════════

export function generateDescription(parts: AssemblyPart[], useCase: string, tier: string): string {
  const info = USE_CASE_INFO[useCase];
  if (!info) return '';
  const tierInfo = info.tierDescriptions[tier];
  if (!tierInfo) return '';

  const cpu = parts.find((p) => p.category === 'cpu');
  const gpu = parts.find((p) => p.category === 'gpu');
  const ram = parts.find((p) => p.category === 'ram');
  const storage = parts.find((p) => p.category === 'storage');
  const psu = parts.find((p) => p.category === 'psu');
  const mb = parts.find((p) => p.category === 'motherboard');
  const casePart = parts.find((p) => p.category === 'case');
  const cooler = parts.find((p) => p.category === 'cooler');

  let desc = `${info.title}\n`;
  desc += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  desc += `🎯 رده: ${tierInfo.label}\n\n`;

  if (useCase === 'gaming' && tierInfo) {
    desc += `📺 رزولوشن: ${tierInfo.res}\n`;
    desc += `🎬 فریم‌ریت: ${tierInfo.fps}\n`;
    desc += `⚙️ تنظیمات: ${tierInfo.settings}\n`;
    if (tierInfo.vram) desc += `🧠 VRAM هدف: ${tierInfo.vram}\n`;
    const games = info.games?.[tier];
    if (games?.length) {
      desc += `\n🎮 بازی‌های قابل اجرا:\n`;
      games.forEach((g: string) => {
        desc += `   ▪ ${g}\n`;
      });
    }
  }

  if (useCase === 'editing' && tierInfo) {
    desc += `🖥️ نرم‌افزارها:\n`;
    tierInfo.software?.forEach((s: string) => {
      desc += `   ▪ ${s}\n`;
    });
    desc += `\n⏱️ زمان رندر (۴K): ${tierInfo.renderTime}\n`;
    desc += `🔧 هسته‌های CPU: ${tierInfo.cores}\n`;
    if (tierInfo.ram) desc += `💾 رم: ${tierInfo.ram}\n`;
  }

  if (useCase === 'streaming' && tierInfo) {
    desc += `📡 پلتفرم‌ها:\n`;
    tierInfo.platforms?.forEach((p: string) => {
      desc += `   ▪ ${p}\n`;
    });
    desc += `\n🎬 کیفیت: ${tierInfo.quality}\n`;
  }

  if (useCase === 'office' && tierInfo) {
    desc += `📋 وظایف:\n`;
    if (typeof tierInfo.tasks === 'string') desc += `   ▪ ${tierInfo.tasks}\n`;
    else
      tierInfo.tasks?.forEach((t: string) => {
        desc += `   ▪ ${t}\n`;
      });
    desc += `🖥️ تعداد مانیتور: ${tierInfo.monitors}\n`;
  }

  desc += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  desc += `📦 قطعات انتخاب‌شده:\n`;
  if (cpu) desc += `   🧠 CPU: ${cpu.shortSpec || cpu.name}\n`;
  if (mb) desc += `   🔲 مادربرد: ${mb.shortSpec || mb.name}\n`;
  if (gpu) desc += `   🎮 GPU: ${gpu.shortSpec || gpu.name}\n`;
  if (ram) desc += `   💾 رم: ${ram.shortSpec || ram.name}\n`;
  if (storage) desc += `   ⚡ حافظه: ${storage.shortSpec || storage.name}\n`;
  if (psu) desc += `   🔌 پاور: ${psu.shortSpec || psu.name}\n`;
  if (casePart) desc += `   🗄️ کیس: ${casePart.shortSpec || casePart.name}\n`;
  if (cooler) desc += `   ❄️ خنک‌کننده: ${cooler.shortSpec || cooler.name}\n`;

  return desc;
}

// ════════════════════════════════════════════════════════════════
// 💡 پیشنهادات ارتقاء
// ════════════════════════════════════════════════════════════════

export function generateUpgrades(parts: AssemblyPart[], useCase: string): string[] {
  const suggestions: string[] = [];

  const gpu = parts.find((p) => p.category === 'gpu');
  const ram = parts.find((p) => p.category === 'ram');
  const psu = parts.find((p) => p.category === 'psu');
  const storage = parts.find((p) => p.category === 'storage');
  const cpu = parts.find((p) => p.category === 'cpu');

  if (useCase === 'gaming') {
    if (gpu?.specs?.vram && gpu.specs.vram < 12) {
      suggestions.push(`🎮 ارتقاء GPU به 12GB+ VRAM (${gpu.specs.vram}GB → 12GB+)`);
    }
    if (ram?.specs?.capacity && ram.specs.capacity < 32) {
      suggestions.push(`💾 ارتقاء رم به 32GB (${ram.specs.capacity}GB → 32GB)`);
    }
    if (gpu?.specs?.tier === 'entry') {
      suggestions.push(`🎮 ارتقاء GPU به رده high برای فریم‌ریت بالاتر`);
    }
    if (psu?.specs?.wattage && psu.specs.wattage < 650 && gpu?.specs?.tier !== 'entry') {
      suggestions.push(`🔌 ارتقاء PSU به 750W+ (${psu.specs.wattage}W → 750W+)`);
    }
  }

  if (useCase === 'editing') {
    if (cpu?.specs?.cores && cpu.specs.cores < 12) {
      suggestions.push(`🧠 ارتقاء CPU به 12+ هسته (${cpu.specs.cores} → 12+)`);
    }
    if (ram?.specs?.capacity && ram.specs.capacity < 64) {
      suggestions.push(`💾 ارتقاء رم به 64GB (${ram.specs.capacity}GB → 64GB)`);
    }
    if (storage?.specs?.size && storage.specs.size < 2000) {
      suggestions.push(`💾 ارتقاء SSD به 2TB+ (${storage.specs.size}GB → 2TB)`);
    }
    if (storage && !storage.specs?.isNVMe) {
      suggestions.push(`⚡ تعویض به NVMe SSD برای سرعت بیشتر`);
    }
  }

  if (useCase === 'streaming') {
    if (cpu?.specs?.cores && cpu.specs.cores < 8) {
      suggestions.push(`🧠 ارتقاء CPU به 8+ هسته`);
    }
    if (ram?.specs?.capacity && ram.specs.capacity < 32) {
      suggestions.push(`💾 ارتقاء رم به 32GB+`);
    }
    if (gpu?.specs?.vram && gpu.specs.vram < 8) {
      suggestions.push(`🎮 GPU با VRAM بالاتر برای NVENC`);
    }
  }

  if (useCase === 'office') {
    if (ram?.specs?.capacity && ram.specs.capacity < 16) {
      suggestions.push(`💾 ارتقاء رم به حداقل 16GB`);
    }
    if (storage?.specs?.isNVMe === false) {
      suggestions.push(`⚡ ارتقاء به SSD NVMe برای سرعت بالاتر`);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push(`✅ سیستم بهینه است و نیاز به ارتقاء فوری ندارد!`);
  }

  return suggestions;
}

// ════════════════════════════════════════════════════════════════
// 🎯 تخمین FPS برای گیمینگ
// ════════════════════════════════════════════════════════════════

export function estimateGamingFps(
  parts: AssemblyPart[],
  resolution: '720p' | '1080p' | '1440p' | '4K'
): Record<string, string> {
  const gpu = parts.find((p) => p.category === 'gpu');
  const cpu = parts.find((p) => p.category === 'cpu');
  const ram = parts.find((p) => p.category === 'ram');

  // ضریب توان GPU بر اساس VRAM و tier
  let gpuScore = 0;
  if (gpu?.specs?.vram) {
    gpuScore = gpu.specs.vram * 5;
    if (gpu.specs.tier === 'ultra') gpuScore += 50;
    else if (gpu.specs.tier === 'high') gpuScore += 30;
  }

  let cpuScore = 0;
  if (cpu?.specs?.cores) {
    cpuScore = cpu.specs.cores * 2;
  }

  let ramPenalty = 0;
  if (ram?.specs?.capacity && ram.specs.capacity < 16) ramPenalty = -20;

  const totalScore = gpuScore + cpuScore + ramPenalty;

  // ضریب رزولوشن
  const resMult =
    resolution === '4K'
      ? 0.55
      : resolution === '1440p'
        ? 0.78
        : resolution === '1080p'
          ? 1.0
          : 1.25;

  const estimates: Record<string, string> = {};
  const games = ['Cyberpunk 2077', 'Elden Ring', 'GTA V', 'Valorant', 'CS2'];
  for (const game of games) {
    // بازی‌های مختلف intensity متفاوتی دارن
    const intensity = game.includes('Cyberpunk')
      ? 1.0
      : game.includes('Elden')
        ? 0.95
        : game.includes('GTA')
          ? 0.85
          : 1.4; // Valorant/CS2 سبک‌ترن
    const baseFps = Math.round(totalScore * intensity * resMult);
    estimates[game] = `${Math.max(30, baseFps)} FPS`;
  }

  return estimates;
}

// ════════════════════════════════════════════════════════════════
// 📊 تولید توصیه نهایی
// ════════════════════════════════════════════════════════════════

export function generateSystemRecommendation(
  parts: AssemblyPart[],
  useCase: string,
  tier: string,
  budget: number
): SystemRecommendation {
  const compat = checkCompatibility(parts);

  const recommendation: SystemRecommendation = {
    overallScore: compat.score,
    tier,
    compatibilityScore: compat.score,
    compatibilityIssues: compat.issues,
    compatibilityWarnings: compat.warnings,
    upgradeSuggestions: generateUpgrades(parts, useCase),
    performanceEstimates: {},
  };

  // تخمین FPS فقط برای gaming
  if (useCase === 'gaming') {
    recommendation.estimatedFps = {
      '1080p': '60-120 FPS',
      '1440p': '45-80 FPS',
      '4K': '30-60 FPS',
    };
    recommendation.performanceEstimates = {
      fps_estimate: '60+ FPS در 1080p',
      resolution_target: tier === 'ultra' ? '4K' : tier === 'high' ? '1440p' : '1080p',
    };
  }

  if (useCase === 'editing') {
    recommendation.performanceEstimates = {
      render_time: tier === 'ultra' ? '2-5 دقیقه' : tier === 'high' ? '5-10 دقیقه' : '10-20 دقیقه',
      software_support: 'Premiere Pro, DaVinci Resolve, After Effects',
    };
  }

  if (useCase === 'streaming') {
    recommendation.performanceEstimates = {
      quality: tier === 'ultra' ? '4K' : tier === 'high' ? '1080p/60fps' : '1080p/30fps',
      encoder: 'NVENC (GPU) + x264 (CPU)',
    };
  }

  if (useCase === 'office') {
    recommendation.performanceEstimates = {
      monitors: tier === 'ultra' ? '2-4 مانیتور' : '1-2 مانیتور',
      multitasking: 'بدون افت کارایی',
    };
  }

  return recommendation;
}

// ════════════════════════════════════════════════════════════════
// 📊 خلاصهٔ ساخت
// ════════════════════════════════════════════════════════════════

export function summarize(parts: AssemblyPart[]): BuildSummary {
  const mandatory = parts.filter((p) => !p.isOptional);
  const optional = parts.filter((p) => p.isOptional);

  const qty = (p: AssemblyPart) => Math.max(1, Number(p.quantity || 1));
  const totalBefore = parts.reduce((s, p) => s + (p.price || 0) * qty(p), 0);
  const totalAfter = parts.reduce((s, p) => s + (p.finalPrice || 0) * qty(p), 0);
  const totalSaving = Math.max(0, totalBefore - totalAfter);
  const savingPercent = totalBefore > 0 ? Math.round((totalSaving / totalBefore) * 100) : 0;

  const totalTdp = parts.reduce((sum, p) => {
    const q = qty(p);
    if (p.category === 'cpu' && p.specs?.tdp) return sum + p.specs.tdp * q;
    if (p.category === 'gpu' && p.specs?.tdp) return sum + p.specs.tdp * q;
    return sum;
  }, 0);

  return {
    totalBefore,
    totalAfter,
    totalSaving,
    savingPercent,
    itemCount: parts.reduce((s, p) => s + qty(p), 0),
    mandatoryCount: mandatory.reduce((s, p) => s + qty(p), 0),
    optionalCount: optional.reduce((s, p) => s + qty(p), 0),
    totalTdp,
  };
}

// ════════════════════════════════════════════════════════════════
// 💰 کمک‌کنندهٔ قالب اعداد
// ════════════════════════════════════════════════════════════════

function shortToman(n: number): string {
  // گرد کردن به نزدیک‌ترین عدد خوانا
  const rounded = Math.round(n / 1000) * 1000;
  if (rounded >= 1_000_000_000)
    return `${(rounded / 1_000_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
  if (rounded >= 1_000_000)
    return `${Math.round(rounded / 1_000_000).toLocaleString('fa-IR')} میلیون`;
  return `${rounded.toLocaleString('fa-IR')}`;
}

/**
 * قالب‌بندی قیمت به تومان (با رند کردن)
 */
function formatToman(n: number): string {
  const rounded = Math.round(n / 1000) * 1000;
  return `${rounded.toLocaleString('fa-IR')} تومان`;
}

// ════════════════════════════════════════════════════════════════
// ❄️ موتور اقتصادی انتخاب خنک‌کننده از کف قیمت (Air vs Liquid)
// ════════════════════════════════════════════════════════════════

/**
 * ۴ سطح حرارتی پردازنده و پیشنهاد خنک‌کنندهٔ اقتصادی متناسب.
 * فلسفه: از کف قیمت انبار آفلند شروع کن و به بالا برو تا اولین
 * خنک‌کنندهٔ «کافی» را برای TDP فعلی پیدا کنی — نه گران‌ترین آن.
 */
export type CoolerTdpTier = 'ECONOMY' | 'MIDRANGE' | 'PERFORMANCE' | 'FLAGSHIP';

export interface CoolerTierRule {
  tier: CoolerTdpTier;
  maxCpuTdp: number;
  minPriceToman: number;
  maxPriceToman: number;
  allowLiquid: boolean;
  requireLiquid: boolean;
  requireRadiatorSize?: 240 | 360;
  reasonTemplate: string;
}

export const COOLER_TIER_RULES: CoolerTierRule[] = [
  {
    tier: 'ECONOMY',
    maxCpuTdp: 65,
    minPriceToman: 450_000,
    maxPriceToman: 2_500_000,
    allowLiquid: false,
    requireLiquid: false,
    reasonTemplate:
      'انتخاب خنک‌کنندهٔ بادی اقتصادی از کف قیمت انبار متناسب با پردازندهٔ کم‌مصرف ({tdp}W)؛ صرفه‌جویی چند میلیون تومانی در بودجه.',
  },
  {
    tier: 'MIDRANGE',
    maxCpuTdp: 130,
    minPriceToman: 1_200_000,
    maxPriceToman: 4_000_000,
    allowLiquid: false,
    requireLiquid: false,
    reasonTemplate:
      'انتخاب خنک‌کنندهٔ بادی حرفه‌ای ۴-۶ هیت‌پایپ متناسب با پردازندهٔ میان‌رده ({tdp}W)؛ کاملاً کافی برای گیمینگ سنگین.',
  },
  {
    tier: 'PERFORMANCE',
    maxCpuTdp: 180,
    minPriceToman: 2_800_000,
    maxPriceToman: 12_000_000,
    allowLiquid: true,
    requireLiquid: false,
    requireRadiatorSize: 240,
    reasonTemplate:
      'انتخاب خنک‌کنندهٔ مایع ۲۴۰ میلی‌متری یا بادی دوبرجه جهت حفظ دمای زیر ۷۰ درجه در رندرینگ و گیمینگ طولانی‌مدت پردازندهٔ پرقدرت ({tdp}W).',
  },
  {
    tier: 'FLAGSHIP',
    maxCpuTdp: 400,
    minPriceToman: 5_000_000,
    maxPriceToman: 60_000_000,
    allowLiquid: true,
    requireLiquid: true,
    requireRadiatorSize: 360,
    reasonTemplate:
      'انتخاب حیاتی خنک‌کنندهٔ مایع ۳۶۰ میلی‌متری جهت مهار توان حرارتی فوق‌العادهٔ پردازندهٔ پرچم‌دار ({tdp}W) و جلوگیری از افت فرکانس حرارتی.',
  },
];

/**
 * تخمین TDP پردازنده بر اساس نام یا specs (نسخهٔ کامل با پشتیبانی از KF/F).
 */
export function estimateCpuTdpFromName(cpu: AssemblyPart | undefined | null): number {
  if (!cpu) return 65;
  const spec = Number(cpu.specs?.tdp || 0);
  if (spec > 0) return spec;
  const n = String(cpu.name || '').toLowerCase();
  // پرچم‌دار
  if (/i9-1[4-5]900k|14900k|13900k|ryzen\s*9\s*79\d{2}x|7950x/.test(n)) return 250;
  if (/i7-1[4-5]700k|14700k|13700k/.test(n)) return 220;
  if (/ryzen\s*9\s*/.test(n) || /\br9\b/.test(n)) return 210;
  if (/i9\b|core\s*ultra\s*9/.test(n)) return 180;
  if (/i7\b|ryzen\s*7\b|\br7\b|core\s*ultra\s*7/.test(n)) return 180;
  if (/13600k|14600k/.test(n)) return 150;
  if (/i5\b|ryzen\s*5\b|\br5\b|core\s*ultra\s*5/.test(n)) return 95;
  if (/i3\b|ryzen\s*3\b|\br3\b/.test(n)) return 60;
  if (/pentium|celeron|athlon/.test(n)) return 45;
  return 65;
}

/**
 * تشخیص Tier خنک‌کننده متناسب با TDP پردازنده.
 */
export function determineCoolerTier(cpuTdp: number): CoolerTierRule {
  for (const rule of COOLER_TIER_RULES) {
    if (cpuTdp <= rule.maxCpuTdp) return rule;
  }
  return COOLER_TIER_RULES[COOLER_TIER_RULES.length - 1];
}

/**
 * تشخیص نوع خنک‌کننده از روی نام محصول.
 */
function detectCoolerType(name: string): {
  isLiquid: boolean;
  isAIO: boolean;
  radiatorSize: 120 | 240 | 280 | 360 | null;
  isDualTower: boolean;
} {
  const n = String(name || '').toLowerCase();
  const isLiquid = /liquid|aio|واتر|مایع|water\s*cool/.test(n);
  const isAIO = isLiquid;
  let radiatorSize: 120 | 240 | 280 | 360 | null = null;
  if (/360/.test(n)) radiatorSize = 360;
  else if (/280/.test(n)) radiatorSize = 280;
  else if (/240/.test(n)) radiatorSize = 240;
  else if (/120/.test(n) && isLiquid) radiatorSize = 120;
  const isDualTower = /d15|nh-d15|ak620|dark rock pro|assassin\s*iii|fuma|dual\s*tower/.test(n);
  return { isLiquid, isAIO, radiatorSize, isDualTower };
}

/**
 * انتخاب بهترین خنک‌کننده از کف قیمت متناسب با پردازنده.
 * منطق: مرتب‌سازی صعودی قیمت → عبور از لیست → اولین خنک‌کنندهٔ
 * مطابق با Tier را برگردان.
 */
export function pickBestCoolerEconomical(
  coolersInStock: AssemblyPart[],
  selectedCpu?: AssemblyPart | null
): AssemblyPart | null {
  if (!coolersInStock || coolersInStock.length === 0) return null;

  const cpuTdp = estimateCpuTdpFromName(selectedCpu || null);
  const rule = determineCoolerTier(cpuTdp);

  // v6.0: فیلتر قاطع پایه لپ‌تاپ + مرتب‌سازی صعودی قیمت (از کف قیمت)
  const sorted = [...coolersInStock]
    .filter((c) => c.inStock !== false && (c.finalPrice > 0 || c.price > 0))
    .filter((c) => isGenuineCpuCooler(c.name || (c as any).title || '')) // ← لایهٔ ضد پایه لپ‌تاپ
    .sort((a, b) => Number(a.finalPrice || a.price || 0) - Number(b.finalPrice || b.price || 0));

  for (const cooler of sorted) {
    const price = Number(cooler.finalPrice || cooler.price || 0);
    const info = detectCoolerType(cooler.name || '');

    // فیلترهای منطبق با Tier
    if (price < rule.minPriceToman || price > rule.maxPriceToman) continue;
    if (rule.requireLiquid && !info.isLiquid) continue;
    if (!rule.allowLiquid && info.isLiquid) continue;
    if (
      rule.requireRadiatorSize &&
      info.radiatorSize &&
      info.radiatorSize < rule.requireRadiatorSize
    )
      continue;
    // برای Flagship اگر radiator size شناسایی نشد، رد کن (احتمالاً بادی است)
    if (rule.tier === 'FLAGSHIP' && !info.isLiquid) continue;

    const reason = rule.reasonTemplate.replace('{tdp}', String(cpuTdp));
    return {
      ...cooler,
      pickReason: `[${rule.tier}] ${reason} | قیمت: ${shortToman(price)}`,
    };
  }

  // اگر هیچ‌کدام مطابق نبود، ارزان‌ترین گزینه با هشدار
  const cheapest = sorted[0];
  if (cheapest) {
    return {
      ...cheapest,
      pickReason: `[${rule.tier} / Fallback] هیچ خنک‌کنندهٔ کاملاً منطبق پیدا نشد؛ ارزان‌ترین گزینهٔ موجود انتخاب شد.`,
    };
  }
  return null;
}
