/**
 * grounded-fallback.ts — Deterministic, catalog-grounded product recovery
 *
 * This module intentionally works only from the ChatSource records emitted to
 * the client. It must never invent a product name, price, stock state, or URL.
 */

import type { ChatSource } from './types';

const MAX_SOURCES = 3;
const MAX_TITLE_LENGTH = 180;
const MAX_PRICE_LENGTH = 80;

type GroundedSource = Pick<ChatSource, 'title' | 'url' | 'price' | 'inStock' | 'brand' | 'warranty'>;

function cleanText(value: unknown, limit: number): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit)
    : '';
}

/**
 * Keep only sources safe enough to cite. URL validation is defense in depth:
 * RAG already sanitizes URLs, but recovery must not trust an arbitrary source.
 */
function normalizeSources(sources: readonly ChatSource[]): GroundedSource[] {
  const seen = new Set<string>();
  const result: GroundedSource[] = [];

  for (const source of sources) {
    const title = cleanText(source?.title, MAX_TITLE_LENGTH);
    const url = cleanText(source?.url, 2_000);
    if (!title || !/^(https?:\/\/|\/)/i.test(url)) continue;

    const key = `${title}\n${url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      title,
      url,
      price: cleanText(source.price, MAX_PRICE_LENGTH) || null,
      inStock: source.inStock,
      brand: cleanText(source.brand, 100) || null,
      warranty: cleanText(source.warranty, 160) || null,
    });

    if (result.length >= MAX_SOURCES) break;
  }

  return result;
}

/**
 * Serialize exactly the emitted product sources for the AI prompt. Rebuilding
 * context after category filtering prevents hidden, unrelated RAG rows from
 * reaching the model.
 */
export function buildGroundedProductContext(sources: readonly ChatSource[]): string {
  const records = normalizeSources(sources);
  if (records.length === 0) return '';

  const blocks = records.map((source, index) => {
    const lines = [
      `محصول ${index + 1}:`,
      `عنوان: ${source.title}`,
      `لینک: ${source.url}`,
      `وضعیت: ${source.inStock === true ? 'موجود' : source.inStock === false ? 'ناموجود' : 'نامشخص'}`,
    ];
    if (source.brand) lines.push(`برند: ${source.brand}`);
    if (source.price) lines.push(`قیمت: ${source.price}`);
    if (source.warranty) lines.push(`گارانتی: ${source.warranty}`);
    return lines.join('\n');
  });

  return blocks.join('\n\n');
}

/**
 * Return a useful response only when there are currently available, valid
 * catalog sources. Out-of-stock and malformed rows are never presented as a
 * recovery recommendation.
 */
export function buildGroundedProductFallback(sources: readonly ChatSource[]): string | null {
  const available = normalizeSources(sources).filter(source => source.inStock === true);
  if (available.length === 0) return null;

  const items = available.map(source => {
    const details = [source.title];
    if (source.price) details.push(source.price);
    return `• ${details.join(' — ')} (موجود)`;
  });

  return [
    'پاسخ هوشمند فعلاً در دسترس نیست؛ اما این گزینه‌ها بر اساس داده‌های واقعی آفلند پیدا شده‌اند:',
    ...items,
    'برای مشخصات و بررسی نهایی قیمت و موجودی، کارت هر محصول را باز کنید.',
  ].join('\n');
}
