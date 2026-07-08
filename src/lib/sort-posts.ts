/**
 * sort-posts.ts
 * مرتب‌سازی پست‌ها/مقالات بر اساس تاریخ (جدیدترین در ابتدا).
 *
 * منطق انتخاب تاریخ هر پست: ابتدا published_at، اگر نبود created_at،
 * و در نهایت updated_at. تاریخ‌های نامعتبر/خالی به انتهای لیست منتقل
 * می‌شوند تا ترتیب خراب نشود.
 */

type DatedPost = {
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** استخراج timestamp قابل مقایسه از یک پست (بر حسب میلی‌ثانیه). */
function getPostTimestamp(post: DatedPost): number {
  const raw = post?.published_at || post?.created_at || post?.updated_at || '';
  if (!raw) return Number.NEGATIVE_INFINITY; // بدون تاریخ → انتهای لیست
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

/**
 * یک کپی مرتب‌شده از آرایهٔ پست‌ها برمی‌گرداند (نزولی: جدیدترین اول).
 * آرایهٔ ورودی تغییر نمی‌کند (immutable).
 */
export function sortPostsByDateDesc<T extends DatedPost>(posts?: T[]): T[] {
  if (!Array.isArray(posts)) return [];
  return [...posts].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));
}

/** نسخهٔ صعودی (قدیمی‌ترین اول) در صورت نیاز. */
export function sortPostsByDateAsc<T extends DatedPost>(posts?: T[]): T[] {
  if (!Array.isArray(posts)) return [];
  return [...posts].sort((a, b) => getPostTimestamp(a) - getPostTimestamp(b));
}
