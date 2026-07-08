/**
 * ════════════════════════════════════════════════════════════════
 * 🔌 api-verify.ts — بررسی real-time قطعات از API آفلند
 * ════════════════════════════════════════════════════════════════
 *
 * کار این ماژول: قبل از نمایش به کاربر، هر قطعه رو با API چک می‌کنه
 * تا مطمئن بشه:
 *   - محصول هنوز موجوده
 *   - قیمت معتبره
 *   - قطعه سازگار با بقیهٔ سیستمه (cross-check)
 *
 * ════════════════════════════════════════════════════════════════
 */

import { generateToken } from '@/lib/fun';
import { BASEURL } from '@/lib/variable';

const VERIFY_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60_000; // ۱ دقیقه

function toPriceNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value
      .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[,٬\s]/g, '');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function firstPositivePrice(...values: unknown[]): number {
  for (const value of values) {
    const n = toPriceNumber(value);
    if (n > 0) return n;
  }
  return 0;
}

/**
 * بررسی real-time یک محصول خاص
 */
export async function verifyProduct(productId: string | number): Promise<{
  id: number | string;
  exists: boolean;
  inStock: boolean;
  price: number;
  finalPrice: number;
  attributes: any[];
  shortAttributes: any[];
  category?: string;
  brand?: string;
  warranty?: string;
}> {
  const cacheKey = `product_${productId}`;
  const cached = VERIFY_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const jwt = await generateToken();
    const url = `${BASEURL}/catalog/product/${productId}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const result = {
        id: productId,
        exists: false,
        inStock: false,
        price: 0,
        finalPrice: 0,
        attributes: [],
        shortAttributes: [],
      };
      VERIFY_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }

    const data = await res.json();
    const product = extractProduct(data);

    const price = firstPositivePrice(
      product?.price?.old_price,
      product?.price?.regular_price,
      product?.old_price,
      product?.regular_price,
      product?.price?.price,
      typeof product?.price === 'object' ? undefined : product?.price
    );
    const finalPrice = firstPositivePrice(
      product?.special_price,
      product?.discount_price,
      product?.final_price,
      product?.sale_price,
      product?.price?.special_price,
      product?.price?.discount_price,
      product?.price?.final_price,
      product?.price?.sale_price,
      product?.price?.price,
      typeof product?.price === 'object' ? undefined : product?.price
    ) || price;
    const stockValue = product?.is_in_stock ?? product?.in_stock ?? product?.stock ?? product?.available ?? product?.availability;

    const result = {
      id: productId,
      exists: !!product,
      inStock: !(stockValue === 0 || stockValue === false || stockValue === '0' || (typeof stockValue === 'string' && /ناموجود|out\s*of\s*stock|unavailable/i.test(stockValue))) && finalPrice > 0,
      price: price || finalPrice,
      finalPrice,
      attributes: product?.attributes || [],
      shortAttributes: product?.short_attributes || [],
      category: typeof product?.category === 'object' ? product?.category?.title : product?.category,
      brand: typeof product?.brand === 'object' ? product?.brand?.title : product?.brand,
      warranty: product?.warranty,
    };

    VERIFY_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (e) {
    return {
      id: productId,
      exists: false,
      inStock: false,
      price: 0,
      finalPrice: 0,
      attributes: [],
      shortAttributes: [],
    };
  }
}

/**
 * بررسی real-time چند محصول همزمان
 */
export async function verifyProducts(productIds: (string | number)[]): Promise<Array<{
  id: string | number;
  exists: boolean;
  inStock: boolean;
  price: number;
  finalPrice: number;
  attributes: any[];
  shortAttributes: any[];
  category?: string;
  brand?: string;
}>> {
  // اجرای موازی با محدودیت همزمان
  const concurrency = 4;
  const results: any[] = [];
  for (let i = 0; i < productIds.length; i += concurrency) {
    const chunk = productIds.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(id => verifyProduct(id)));
    results.push(...chunkResults);
  }
  return results;
}

/**
 * استخراج محصول از پاسخ API
 */
function extractProduct(data: any): any {
  if (Array.isArray(data)) return data[0] || null;
  if (data?.data) return extractProduct(data.data);
  if (data?.product) return data.product;
  if (data?.response) return extractProduct(data.response);
  if (data?.result) return extractProduct(data.result);
  return data;
}

/**
 * استخراج مشخصات از attributes
 */
export function extractSpecsFromAttributes(attributes: any[]): Record<string, string> {
  const specs: Record<string, string> = {};
  if (!Array.isArray(attributes)) return specs;
  for (const attr of attributes) {
    const title = String(attr?.title || '').trim();
    const value = String(attr?.value || '').trim();
    if (title && value) specs[title] = value;
  }
  return specs;
}

/**
 * تشخیص socket از attributes
 */
export function detectSocketFromSpecs(specs: Record<string, string>): string | null {
  const socketKeys = ['سوکت', 'Socket', 'socket'];
  for (const key of socketKeys) {
    if (specs[key]) return specs[key];
  }
  // جستجو در کلیدهای مرتبط
  for (const [k, v] of Object.entries(specs)) {
    if (k.toLowerCase().includes('socket') || k.toLowerCase().includes('سوکت')) {
      return v;
    }
  }
  return null;
}

/**
 * تشخیص RAM Type از attributes
 */
export function detectRamTypeFromSpecs(specs: Record<string, string>): 'DDR5' | 'DDR4' | 'DDR3' | null {
  for (const [k, v] of Object.entries(specs)) {
    if (k.toLowerCase().includes('ddr') || k.includes('DDR')) {
      const val = v.toUpperCase();
      if (val.includes('DDR5')) return 'DDR5';
      if (val.includes('DDR4')) return 'DDR4';
      if (val.includes('DDR3')) return 'DDR3';
    }
  }
  return null;
}
