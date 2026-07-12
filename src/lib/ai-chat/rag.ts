/**
 * rag.ts — ماژول RAG دستیار هوشمند آفلند (v2: retrieval + ranking)
 * ─────────────────────────────────────────────────────────────────
 * بهبود دقت نسبت به نسخهٔ قبل:
 *   ۱) انبساط پرس‌وجو (multi-query): نام‌های فارسی/انگلیسی و
 *      کلیدواژه‌های دسته را به چند جستجوی موازی تبدیل می‌کند.
 *   ۲) حذف تکرار (dedupe) محصولاتی که از چند پرس‌وجو برگشته‌اند.
 *   ۳) رتبه‌بندی بر اساس مرتبط‌بودن (relevance): تطابق قصد دسته،
 *      هم‌پوشانی نشانه‌ها، برند، موجودی و تخفیف.
 *   ۴) کش کوتاه برای کاهش فشار روی بک‌اند و سرعت پاسخ.
 * ─────────────────────────────────────────────────────────────────
 */

import { generateToken } from '@/lib/fun';
import { BASEURL, BASEURL_SITE, BASE_URL_IMAGE, AWS_BUCKET } from '@/lib/variable';
import type { ChatSource } from './types';

/** ساخت آدرس کامل تصویر محصول از مسیر خام */
function buildImageUrl(src?: string | null): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  const clean = String(src).replace(/^\/+/, '');
  return `${BASE_URL_IMAGE}/${AWS_BUCKET}/${clean}`;
}

/** کلمات پرتکرار فارسی که برای جستجو حذف می‌شوند */
const STOPWORDS = new Set([
  'آیا', 'هست', 'هستش', 'داری', 'دارید', 'داره', 'می‌خوام', 'می‌خوام', 'میخواهم',
  'لطفا', 'لطفاً', 'یک', 'یه', 'برای', 'چنده', 'چقدره', 'هستن', 'هستند',
  'سلام', 'ممنون', 'خوبه', 'چطور', 'کدوم', 'کدام', 'یا', 'و', 'با', 'به', 'از',
  'در', 'که', 'رو', 'را', 'می', 'خرید', 'قیمت', 'بهترین', 'ارزان', 'ارزون',
  'می‌خوام', 'بخرم', 'پیشنهاد', 'بده', 'بدید', 'نشونم', 'نشون', 'ببینم', 'تا',
  'حدود', 'بودجه', 'تومن', 'تومان', 'میلیون', 'هزار', 'مناسب', 'خوب', 'عالی',
  'سیستم', 'کامل', 'سازگار', 'معرفی', 'کن', 'کنید', 'چیه', 'چیست', 'داشته',
  'باشه', 'موجود', 'الان', 'فعلا', 'یعنی', 'مثل', 'مثلا', 'حتی', 'هم', 'این',
  'اون', 'آن', 'من', 'تو', 'شما', 'ما', 'گیمینگ', 'اداری',
]);

/** پاکسازی سؤال کاربر برای جستجوی بهتر */
function cleanQuery(query: string): string {
  const stripped = String(query).replace(/<[^>]*>/g, ' ').trim();
  const words = stripped.split(/\s+/u);
  const keep: string[] = [];
  for (const raw of words) {
    const w = raw.trim();
    if (w.length < 2) continue;
    if (STOPWORDS.has(w)) continue;
    keep.push(w);
  }
  return keep.join(' ') || stripped;
}

/** نرمال‌سازی متن فارسی/انگلیسی برای تطابق نشانه‌ها */
function normalizeFa(s: string): string {
  return String(s)
    .replace(/[يى]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[ةهه]/g, 'ه')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی')
    .replace(/[ًٌٍَُِّْٰٓٔ]/g, '') // اعراب عربی
    .replace(/[‭-‮⁠﻿]/g, '') // کاراکترهای نامرئی
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ═════════ نگاشت قصد دسته‌ها (برای انبساط پرس‌وجو + رتبه‌بندی) ═════════
type IntentKey =
  | 'gpu' | 'cpu' | 'ram' | 'ssd' | 'hdd' | 'motherboard'
  | 'psu' | 'cooler' | 'case' | 'laptop' | 'phone' | 'monitor'
  | 'router' | 'headphone' | 'console' | 'watch';

const SYNONYM_MAP: Record<IntentKey, string[]> = {
  gpu: ['کارت گرافیک', 'گرافیک', 'گرافیکی'],
  cpu: ['پردازنده', 'پردازنده مرکزی'],
  ram: ['رم', 'حافظه رم'],
  ssd: ['اس اس دی', 'حافظه اس اس دی', 'nvme'],
  hdd: ['هارد', 'دیسک سخت'],
  motherboard: ['مادربرد', 'برد اصلی'],
  psu: ['پاور', 'منبع تغذیه', 'منبع'],
  cooler: ['خنک‌کننده', 'کولر', 'فن پردازنده'],
  case: ['کیس'],
  laptop: ['لپ‌تاپ', 'لپتاپ'],
  phone: ['گوشی', 'موبایل', 'تلفن همراه'],
  monitor: ['مانیتور', 'نمایشگر'],
  router: ['مودم', 'روتر', 'مودم روتر'],
  headphone: ['هندزفری', 'هدفون', 'ایربادز'],
  console: ['کنسول', 'پلی‌استیشن', 'ایکس‌باکس'],
  watch: ['ساعت هوشمند', 'ساعت'],
};

const EN_TERMS: Record<IntentKey, string> = {
  gpu: 'GPU', cpu: 'CPU', ram: 'RAM', ssd: 'SSD', hdd: 'HDD',
  motherboard: 'motherboard', psu: 'power supply', cooler: 'cooler',
  case: 'case', laptop: 'laptop', phone: 'phone', monitor: 'monitor',
  router: 'router', headphone: 'headphone', console: 'console', watch: 'smart watch',
};

/** نشانه‌های تشخیص دسته از روی عنوان محصول */
const TITLE_HINTS: Record<IntentKey, string[]> = {
  gpu: ['گرافیک', 'vga', 'rtx', 'gtx', 'radeon', 'rx ', 'arc', 'گرافیکی'],
  cpu: ['پردازنده', 'core i', 'ryzen', 'atom', 'celeron', 'pentium', 'athlon'],
  ram: ['رم', 'ddr', 'کیت حافظه'],
  ssd: ['ssd', 'nvme', 'm.2', 'm2'],
  hdd: ['هارد', 'hdd'],
  motherboard: ['مادربرد', 'برد اصلی', 'motherboard'],
  psu: ['پاور', 'منبع', 'power'],
  cooler: ['کولر', 'خنک', 'cooler', 'فن'],
  case: ['کیس', 'case'],
  laptop: ['لپ‌تاپ', 'لپتاپ', 'notebook'],
  phone: ['گوشی', 'موبایل', 'phone'],
  monitor: ['مانیتور', 'نمایشگر', 'monitor'],
  router: ['مودم', 'روتر', 'router'],
  headphone: ['هندزفری', 'هدفون', 'ایرباد'],
  console: ['کنسول', 'playstation', 'xbox'],
  watch: ['ساعت'],
};

/** برندهای شناخته‌شده (برای تطابق دقیق‌تر) */
const BRANDS = new Set([
  'asus', 'msi', 'gigabyte', 'asrock', 'intel', 'amd', 'nvidia',
  'samsung', 'سامسونگ', 'apple', 'اپل', 'lg', 'xiaomi', 'شیائومی',
  'lenovo', 'dell', 'hp', 'اچ‌پی', 'corsair', 'کورسیر', 'kingston',
  'crucial', 'wd', 'seagate', 'اوس', 'aures', 'اورست',
]);

/** تشخیص قصد(های) کاربر از متن سؤال */
function detectIntent(query: string): Set<IntentKey> {
  const n = normalizeFa(query);
  const intents = new Set<IntentKey>();
  for (const key of Object.keys(SYNONYM_MAP) as IntentKey[]) {
    if (SYNONYM_MAP[key].some((s) => n.includes(normalizeFa(s)))) intents.add(key);
  }
  return intents;
}

/** ساخت چند پرس‌وجو از یک سؤال (انبساط) */
function expandQueries(query: string, intents: Set<IntentKey>): string[] {
  const base = cleanQuery(query);
  const out = new Set<string>();
  if (base) out.add(base);
  for (const intent of intents) {
    const syns = SYNONYM_MAP[intent];
    if (syns?.[0]) out.add(syns[0]);
    const en = EN_TERMS[intent];
    if (en) out.add(en);
  }
  // اگر فقط یک پرس‌وجو داریم، کلمهٔ اول را هم جدا امتحان کن
  if (out.size < 2 && base) {
    const parts = base.split(' ').filter(Boolean);
    if (parts.length > 1) out.add(parts[0]);
  }
  return [...out].filter(Boolean).slice(0, 4);
}

/** امتیاز مرتبط‌بودن یک محصول با سؤال */
function scoreProduct(
  p: RawProduct,
  intents: Set<IntentKey>,
  userTokens: Set<string>,
  userBrands: Set<string>
): number {
  const title = normalizeFa(p.name || p.title || '');
  const brand = normalizeFa(pickBrand(p) || '');
  let score = 0;

  // تطابق قصد دسته با عنوان محصول
  for (const intent of intents) {
    const hints = TITLE_HINTS[intent] || [];
    if (hints.some((h) => title.includes(h))) score += 50;
  }

  // هم‌پوشانی نشانه‌ها با عنوان + برند
  const titleTokens = new Set(title.split(' ').filter(Boolean));
  const brandTokens = new Set(brand.split(' ').filter(Boolean));
  let overlap = 0;
  for (const t of userTokens) {
    if (titleTokens.has(t) || brandTokens.has(t)) overlap++;
  }
  score += overlap * 12;

  // تطابق برند صریح
  for (const b of userBrands) {
    if (brand.includes(b) || title.includes(b)) score += 30;
  }

  // موجودی و تخفیف به‌عنوان سیگنال مکمل
  if (p.is_in_stock !== 0) score += 12;
  const hasSpecial =
    p.special_price !== undefined && p.special_price !== null && p.special_price !== '' &&
    Number(p.special_price) > 0 && Number(p.special_price) < Number(p.price);
  if (hasSpecial) score += 6;

  return score;
}

/** نرمال‌سازی یک آیتم محصول از پاسخ بک‌اند (ساختار ممکن است متفاوت باشد) */
type RawImage = {
  content?: { title?: string; path?: string; base_image?: number };
  title?: string;
  src?: string;
  url?: string;
  path?: string;
};
type RawProduct = {
  id?: number | string;
  name?: string;
  title?: string;
  price?: number | string;
  special_price?: number | string;
  is_in_stock?: number;
  url_key?: string;
  slug?: string;
  warranty?: string;
  images?: RawImage[];
  image?: { src?: string; url?: string; title?: string; path?: string };
  brand?: { title?: string; name?: string } | string;
  comment?: Array<{ vote?: number }>;
  comments?: Array<{ vote?: number }>;
  attributes?: Array<{ title?: string; value?: string }>;
};

/** استخراج بهترین عکس محصول (ترجیح با base_image) */
function pickImage(p: RawProduct): string | null {
  const imgs = p.images || [];
  const base = imgs.find((i) => i.content?.base_image === 1);
  const first = base || imgs[0];
  const raw =
    first?.content?.path ||
    first?.path ||
    first?.src ||
    first?.url ||
    p.image?.path ||
    p.image?.src ||
    p.image?.url ||
    null;
  return buildImageUrl(raw);
}

/** استخراج نام برند */
function pickBrand(p: RawProduct): string | null {
  if (!p.brand) return null;
  if (typeof p.brand === 'string') return p.brand;
  return p.brand.title || p.brand.name || null;
}

/** میانگین امتیاز و تعداد نظرات */
function pickRating(p: RawProduct): { rating: number | null; count: number } {
  const list = p.comment || p.comments || [];
  if (!Array.isArray(list) || list.length === 0) return { rating: null, count: 0 };
  const votes = list.map((c) => Number(c.vote)).filter((v) => Number.isFinite(v) && v > 0);
  if (votes.length === 0) return { rating: null, count: list.length };
  const avg = votes.reduce((a, b) => a + b, 0) / votes.length;
  return { rating: Math.round(avg * 10) / 10, count: list.length };
}

function extractProducts(res: unknown): RawProduct[] {
  if (!res) return [];
  const r = res as Record<string, unknown>;
  const candidates: unknown[] = [
    r.products,
    r.data,
    (r.products as Record<string, unknown>)?.data,
    (r.data as Record<string, unknown>)?.products,
    (r.result as Record<string, unknown>)?.products,
    r.items,
    res,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as RawProduct[];
  }
  return [];
}

function formatPrice(p?: number | string): string | null {
  if (p === undefined || p === null || p === '') return null;
  const n = Number(p);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${n.toLocaleString('fa-IR')} تومان`;
}

/** کلید یکتاسازی برای حذف تکرار */
function dedupeKey(p: RawProduct): string {
  const id = p.id ?? p.url_key ?? p.slug;
  if (id !== undefined && id !== null && id !== '') return `id:${id}`;
  return `t:${normalizeFa(p.name || p.title || '')}`;
}

function isRich(p: RawProduct): boolean {
  return Boolean(pickImage(p) && (pickBrand(p) || p.warranty));
}

// ═════════ کش کوتاه نتایج جستجو (کاهش فشار + سرعت) ═════════
const searchCache = new Map<string, { ts: number; data: RawProduct[] }>();
const SEARCH_CACHE_TTL = 60_000;

/** درخواست جستجو به بک‌اند آفلند (با کش) */
async function searchAfland(term: string, count: number): Promise<RawProduct[]> {
  const key = `${term}|${count}`;
  const hit = searchCache.get(key);
  const now = Date.now();
  if (hit && now - hit.ts < SEARCH_CACHE_TTL) return hit.data;

  try {
    const jwt = await generateToken();
    const q = encodeURIComponent(term);
    const url = `${BASEURL}/search?q=${q}&type=page&per_page=${count}&page=1`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const products = extractProducts(data);
    searchCache.set(key, { ts: now, data: products });
    return products;
  } catch {
    return [];
  }
}

/** گرفتن جزئیات کامل یک محصول (عکس، برند، گارانتی، نظرات) از endpoint محصول */
async function fetchProductDetail(id: string | number): Promise<RawProduct | null> {
  try {
    const jwt = await generateToken();
    const res = await fetch(`${BASEURL}/catalog/product/${encodeURIComponent(String(id))}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const prod = Array.isArray(data) ? data[0] : data?.product ?? data;
    return prod || null;
  } catch {
    return null;
  }
}

/** نتیجهٔ RAG: بافت متنی + منابع برای نمایش */
export type RagResult = {
  context: string;
  sources: ChatSource[];
};

/**
 * ساخت بافت RAG بر اساس سؤال کاربر — با انبساط پرس‌وجو، حذف تکرار
 * و رتبه‌بندی بر اساس مرتبط‌بودن.
 */
export async function buildRagContext(query: string, count = 6): Promise<RagResult> {
  const intents = detectIntent(query);
  const queries = expandQueries(query, intents);

  const perCount = Math.max(4, Math.ceil(count / 2));
  const results = await Promise.all(
    queries.map((q) => searchAfland(q, perCount).catch(() => [] as RawProduct[]))
  );

  // ادغام + حذف تکرار
  const products: RawProduct[] = [];
  const seen = new Set<string>();
  for (const list of results) {
    for (const p of list) {
      const k = dedupeKey(p);
      if (seen.has(k)) continue;
      seen.add(k);
      products.push(p);
    }
  }

  // تلاش آخر با کلمهٔ اول (رفتار قبلی را حفظ می‌کنیم)
  if (products.length === 0) {
    const base = cleanQuery(query);
    if (base.includes(' ')) {
      const first = base.split(' ')[0];
      if (first && first !== base) {
        products.push(...(await searchAfland(first, perCount).catch(() => [] as RawProduct[])));
      }
    }
  }

  if (products.length === 0) {
    return { context: '', sources: [] };
  }

  // امتیازدهی + رتبه‌بندی
  const userTokens = new Set(cleanQuery(query).split(' ').filter(Boolean));
  const userBrands = new Set([...userTokens].filter((t) => BRANDS.has(t)));
  const scoreMap = new Map<string, number>();
  const scored = products.map((p) => {
    const s = scoreProduct(p, intents, userTokens, userBrands);
    scoreMap.set(dedupeKey(p), s);
    return { p, s };
  });
  scored.sort((a, b) => b.s - a.s);

  let ranked = scored.slice(0, count).map((x) => x.p);

  // غنی‌سازی ۴ محصول اول با جزئیات کامل
  const ENRICH = Math.min(4, ranked.length);
  const enriched = await Promise.all(
    ranked.slice(0, ENRICH).map(async (p) => {
      if (isRich(p)) return p;
      const id = p.id ?? p.url_key ?? p.slug;
      if (id === undefined || id === null || id === '') return p;
      const detail = await fetchProductDetail(id);
      return detail ? { ...p, ...detail } : p;
    })
  );
  ranked = [...enriched, ...ranked.slice(ENRICH)];

  const blocks: string[] = [];
  const sources: ChatSource[] = [];

  ranked.slice(0, count).forEach((p) => {
    const title = String(p.name || p.title || '').trim();
    if (!title) return;

    const id = p.id ?? p.url_key ?? p.slug ?? '';
    const siteBase = BASEURL_SITE || '/';
    const url: string = id ? `${siteBase}/product/${encodeURIComponent(String(id))}` : siteBase;

    const hasSpecial =
      p.special_price !== undefined && p.special_price !== null && p.special_price !== '' &&
      Number(p.special_price) > 0 && Number(p.special_price) < Number(p.price);
    const finalPriceNum = hasSpecial ? Number(p.special_price) : Number(p.price);
    const finalPrice = formatPrice(finalPriceNum);
    const oldPrice = hasSpecial ? formatPrice(p.price) : null;
    const discountPercent = hasSpecial
      ? Math.round(((Number(p.price) - Number(p.special_price)) / Number(p.price)) * 100)
      : null;

    const inStock = p.is_in_stock !== 0;
    const image = pickImage(p);
    const brand = pickBrand(p);
    const warranty = p.warranty ? String(p.warranty).trim() : null;
    const { rating, count: reviewCount } = pickRating(p);

    let block = `محصول ${blocks.length + 1}:\n`;
    block += `عنوان: ${title}\n`;
    if (brand) block += `برند: ${brand}\n`;
    if (finalPrice) block += `قیمت: ${finalPrice}\n`;
    if (oldPrice) block += `قیمت قبل از تخفیف: ${oldPrice} (${discountPercent}% تخفیف)\n`;
    block += `وضعیت: ${inStock ? 'موجود' : 'ناموجود'}\n`;
    if (warranty) block += `گارانتی: ${warranty}\n`;
    if (rating) block += `امتیاز کاربران: ${rating} از ۵ (${reviewCount} نظر)\n`;
    block += `لینک: ${url}\n`;

    blocks.push(block);
    sources.push({
      title,
      url,
      price: finalPrice,
      oldPrice,
      discountPercent,
      image,
      inStock,
      brand,
      warranty,
      rating,
      reviewCount: reviewCount || null,
      relevance: scoreMap.get(dedupeKey(p)) ?? null,
    });
  });

  if (blocks.length === 0) {
    return { context: '', sources: [] };
  }

  const context = buildContextText(sources);

  return { context, sources };
}

/**
 * ساخت متن بافت RAG از روی منابع نهایی (ChatSource[]).
 * از خودِ فیلدهای منبع بازسازی می‌شود تا route بتواند زیرمجموعهٔ
 * رتبه‌بندی‌شده (top-N) را جداگانه به مدل بدهد بدون نیاز به دادهٔ خام.
 */
export function buildContextText(sources: ChatSource[]): string {
  if (!sources.length) return '';
  const blocks = sources.map((s, i) => {
    let b = `محصول ${i + 1}:\n`;
    b += `عنوان: ${s.title}\n`;
    if (s.brand) b += `برند: ${s.brand}\n`;
    if (s.price) b += `قیمت: ${s.price}\n`;
    if (s.oldPrice) b += `قیمت قبل از تخفیف: ${s.oldPrice} (${s.discountPercent}% تخفیف)\n`;
    b += `وضعیت: ${s.inStock ? 'موجود' : 'ناموجود'}\n`;
    if (s.warranty) b += `گارانتی: ${s.warranty}\n`;
    if (s.rating) b += `امتیاز کاربران: ${s.rating} از ۵ (${s.reviewCount} نظر)\n`;
    b += `لینک: ${s.url}\n`;
    return b;
  }).join('\n');

  return (
    'اطلاعات محصولات مرتبط از فروشگاه آفلند (فقط بر اساس همین داده‌ها پاسخ بده، ' +
    'قیمت‌ها را دقیق بگو و لینک محصول مناسب را به کاربر بده. اگر محصولِ منطبق با ' +
    'خواستهٔ کاربر نبود، صادقانه بگو و نزدیک‌ترین گزینه‌ها را پیشنهاد بده):\n\n' +
    'محصولات به ترتیب مرتبط‌بودن با سؤال مرتب شده‌اند (اولی مرتبط‌ترین است):\n\n' +
    blocks
  );
}
