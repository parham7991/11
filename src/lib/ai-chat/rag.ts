/**
 * rag.ts — ماژول RAG دستیار هوشمند آفلند
 * ──────────────────────────────────────────────────────────────────
 * با استفاده از همان بک‌اند آفلند (endpoint جستجو) محصولات مرتبط با
 * سؤال کاربر را پیدا می‌کند و یک «بافت» متنی می‌سازد تا به مدل داده شود.
 * این‌طور ربات همیشه بر اساس داده‌های واقعی و به‌روزِ سایت پاسخ می‌دهد و
 * نیازی به train/fine-tuning نیست.
 * ──────────────────────────────────────────────────────────────────
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
  'آیا', 'هست', 'هستش', 'داری', 'دارید', 'داره', 'میخوام', 'می‌خوام', 'میخواهم',
  'لطفا', 'لطفاً', 'یک', 'یه', 'برای', 'چنده', 'چقدره', 'هستن', 'هستند',
  'سلام', 'ممنون', 'خوبه', 'چطور', 'کدوم', 'کدام', 'یا', 'و', 'با', 'به', 'از',
  'در', 'که', 'رو', 'را', 'می', 'خرید', 'قیمت', 'بهترین', 'ارزان', 'ارزون',
  // فیلرهای محاوره‌ای رایج در گفتگوی خرید قطعات
  'میخوام', 'بخرم', 'پیشنهاد', 'بده', 'بدید', 'نشونم', 'نشون', 'ببینم', 'تا',
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
  attribiuts?: Array<{ title?: string; value?: string }>;
  attributes?: Array<{ title?: string; value?: string }>;
};

/** استخراج بهترین عکس محصول (ترجیح با base_image) */
function pickImage(p: RawProduct): string | null {
  const imgs = p.images || [];
  // اول عکسی که base_image=1 است
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
  // تلاش برای پیدا کردن آرایهٔ محصولات در شکل‌های رایج پاسخ
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

/** نتیجهٔ RAG: بافت متنی + منابع برای نمایش */
export type RagResult = {
  context: string;
  sources: ChatSource[];
};

/** درخواست جستجو به بک‌اند آفلند */
async function searchAfland(term: string, count: number): Promise<RawProduct[]> {
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
      // کش کوتاه برای کاهش فشار روی بک‌اند
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return extractProducts(data);
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
    // پاسخ معمولاً آرایه‌ای است که محصول در ایندکس ۰ قرار دارد
    const prod = Array.isArray(data) ? data[0] : (data?.product ?? data);
    return prod || null;
  } catch {
    return null;
  }
}

/** آیا این محصول از search اطلاعات کافی (عکس/برند) دارد؟ */
function isRich(p: RawProduct): boolean {
  return Boolean(pickImage(p) && (pickBrand(p) || p.warranty));
}

/**
 * ساخت بافت RAG بر اساس سؤال کاربر.
 * اگر چیزی پیدا نشد، با کلمهٔ اول دوباره تلاش می‌کند.
 */
export async function buildRagContext(query: string, count = 6): Promise<RagResult> {
  const term = cleanQuery(query);

  let products = await searchAfland(term, count);

  // تلاش دوم با کلمهٔ اول
  if (products.length === 0 && term.includes(' ')) {
    const first = term.split(' ')[0];
    if (first && first !== term) {
      products = await searchAfland(first, count);
    }
  }

  if (products.length === 0) {
    return { context: '', sources: [] };
  }

  // غنی‌سازی ۴ محصول اول با جزئیات کامل (عکس/برند/گارانتی) به‌صورت موازی،
  // فقط اگر داده‌ی search ناقص باشد. این باعث کارت‌های کامل‌تر می‌شود.
  const ENRICH = Math.min(4, count, products.length);
  const enrichTargets = products.slice(0, ENRICH);
  const enriched = await Promise.all(
    enrichTargets.map(async (p) => {
      if (isRich(p)) return p;
      const id = p.id ?? p.url_key ?? p.slug;
      if (!id) return p;
      const detail = await fetchProductDetail(id);
      // ادغام: فیلدهای detail روی search می‌نشیند ولی id/قیمت search حفظ می‌شود
      return detail ? { ...p, ...detail } : p;
    })
  );
  products = [...enriched, ...products.slice(ENRICH)];

  const blocks: string[] = [];
  const sources: ChatSource[] = [];

  products.slice(0, count).forEach((p, idx) => {
    const title = String(p.name || p.title || '').trim();
    if (!title) return;

    const id = p.id ?? p.url_key ?? p.slug ?? '';
    const siteBase = BASEURL_SITE || '/';
    const url: string = id ? `${siteBase}/product/${encodeURIComponent(String(id))}` : siteBase;

    // قیمت‌ها و تخفیف
    const hasSpecial =
      p.special_price !== undefined &&
      p.special_price !== null &&
      p.special_price !== '' &&
      Number(p.special_price) > 0 &&
      Number(p.special_price) < Number(p.price);
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

    // بلاک متنی غنی برای مدل
    let block = `محصول ${idx + 1}:\n`;
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
    });
  });

  if (blocks.length === 0) {
    return { context: '', sources: [] };
  }

  const context =
    'اطلاعات محصولات مرتبط از فروشگاه آفلند (فقط بر اساس همین داده‌ها پاسخ بده، ' +
    'قیمت‌ها را دقیق بگو و لینک محصول مناسب را به کاربر بده. اگر محصولِ منطبق با ' +
    'خواستهٔ کاربر نبود، صادقانه بگو و نزدیک‌ترین گزینه‌ها را پیشنهاد بده):\n\n' +
    blocks.join('\n');

  return { context, sources };
}
