/**
 * grounded-fallback.ts — پاسخ‌های قطعی بدون AI بر اساس داده‌های RAG
 * ──────────────────────────────────────────────────────────────────
 * وقتی AI در دسترس نیست یا محصولی پیدا شده، پاسخ‌های واقعی بر اساس
 * داده‌های فروشگاه تولید می‌کند.
 * ──────────────────────────────────────────────────────────────────
 */

import type { ChatSource } from './types';

/**
 * ساخت context متنی از محصولات برای ارسال به AI
 */
export function buildGroundedProductContext(sources: ChatSource[]): string {
  if (sources.length === 0) return '';

  const blocks = sources.map((s, idx) => {
    let block = `محصول ${idx + 1}:\n`;
    block += `عنوان: ${s.title}\n`;
    if (s.brand) block += `برند: ${s.brand}\n`;
    if (s.price) block += `قیمت: ${s.price}\n`;
    if (s.oldPrice) {
      block += `قیمت قبل از تخفیف: ${s.oldPrice}`;
      if (s.discountPercent) block += ` (${s.discountPercent}% تخفیف)`;
      block += '\n';
    }
    block += `وضعیت: ${s.inStock ? 'موجود' : 'ناموجود'}\n`;
    if (s.warranty) block += `گارانتی: ${s.warranty}\n`;
    if (s.rating) block += `امتیاز کاربران: ${s.rating} از ۵ (${s.reviewCount} نظر)\n`;
    if (s.specs) block += `مشخصات: ${s.specs}\n`;
    block += `لینک: ${s.url}\n`;
    return block;
  });

  return (
    'اطلاعات محصولات مرتبط از فروشگاه آفلند (فقط بر اساس همین داده‌ها پاسخ بده، ' +
    'قیمت‌ها را دقیق بگو و لینک محصول مناسب را به کاربر بده. اگر محصولِ منطبق با ' +
    'خواستهٔ کاربر نبود، صادقانه بگو و نزدیک‌ترین گزینه‌ها را پیشنهاد بده):\n\n' +
    blocks.join('\n')
  );
}

/**
 * ساخت پاسخ متنی fallback وقتی AI در دسترس نیست
 */
export function buildGroundedProductFallback(sources: readonly ChatSource[]): string | null {
  if (sources.length === 0) return null;

  const available = sources.filter((s) => s.inStock);
  const unavailable = sources.filter((s) => !s.inStock);

  if (available.length === 0 && unavailable.length > 0) {
    return (
      'متأسفانه محصولات مرتبطی که پیدا شدند فعلاً ناموجود هستند:\n\n' +
      unavailable
        .slice(0, 3)
        .map((s) => `• **${s.title}** ${s.brand ? `(${s.brand})` : ''}`)
        .join('\n') +
      '\n\nلطفاً بعداً دوباره بررسی کنید یا با پشتیبانی آفلند تماس بگیرید.'
    );
  }

  if (available.length === 0) return null;

  let text = 'بر اساس جستجو در محصولات آفلند، این گزینه‌ها مرتبط هستند:\n\n';

  text += available
    .slice(0, 3)
    .map((s, idx) => {
      let line = `${idx + 1}. **${s.title}**`;
      if (s.brand) line += ` — ${s.brand}`;
      line += '\n';

      if (s.price) {
        line += `   💰 قیمت: ${s.price}`;
        if (s.oldPrice && s.discountPercent) {
          line += ` ~~${s.oldPrice}~~ (${s.discountPercent}% تخفیف)`;
        }
        line += '\n';
      }

      if (s.warranty) line += `   🛡️ ${s.warranty}\n`;
      if (s.rating) line += `   ⭐ ${s.rating}/۵ (${s.reviewCount} نظر)\n`;
      line += `   🔗 [مشاهده محصول](${s.url})\n`;

      return line;
    })
    .join('\n');

  text += '\nبرای مشاوره تخصصی‌تر، لطفاً سؤال خود را دقیق‌تر بپرسید.';
  text += '\n\n[[دکمه‌ها: مقایسه محصولات | مشاوره خرید | اسمبل سیستم]]';

  return text;
}

/**
 * فرمت قیمت به تومان
 */
export function formatPrice(price?: number | string | null): string | null {
  if (price === undefined || price === null || price === '') return null;
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${n.toLocaleString('fa-IR')} تومان`;
}
