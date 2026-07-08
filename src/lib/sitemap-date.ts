/**
 * sitemap-date.ts
 * ------------------------------------------------------------------
 * ابزار تبدیل امن تاریخ برای استفاده در تگ <lastmod> نقشه‌های سایت.
 *
 * چرا این فایل لازم است؟
 * گوگل سرچ کنسول خطای "Invalid date" می‌داد چون بک‌اند تاریخ را به‌صورت
 * "YYYY-MM-DD HH:mm:ss" (با فاصله و بدون timezone) برمی‌گرداند که طبق
 * استاندارد W3C Datetime / ISO 8601 برای sitemap نامعتبر است.
 *
 * استاندارد معتبر:  2026-06-13T03:52:32+00:00  یا  2026-06-13T03:52:32.000Z
 * مرجع: https://www.sitemaps.org/protocol.html#xmlTagDefinitions
 *
 * این تابع هر ورودی‌ای (string | number | Date | undefined | null) را
 * می‌گیرد و یک تاریخ ISO 8601 معتبر برمی‌گرداند. اگر ورودی قابل پارس نباشد،
 * به‌جای تولید تاریخ نامعتبر، زمان فعلی (now) را برمی‌گرداند تا هیچ‌وقت
 * یک <lastmod> خراب وارد sitemap نشود.
 * ------------------------------------------------------------------
 */

/**
 * تبدیل ورودی تاریخ به رشته ISO 8601 معتبر برای <lastmod>.
 *
 * @param input  تاریخ خام (مثلاً product.updated_at)
 * @param fallback تاریخ جایگزین در صورت نامعتبر بودن ورودی (پیش‌فرض: اکنون)
 * @returns رشته‌ی ISO 8601 معتبر، مثل "2026-06-13T03:52:32.000Z"
 */
export function toSitemapDate(
  input?: string | number | Date | null,
  fallback: Date = new Date()
): string {
  const parsed = parseToDate(input);
  if (parsed) {
    return parsed.toISOString();
  }
  return fallback.toISOString();
}

/**
 * تلاش برای تبدیل ورودی به یک شیء Date معتبر.
 * اگر موفق نشود null برمی‌گرداند.
 */
function parseToDate(input?: string | number | Date | null): Date | null {
  if (input === undefined || input === null || input === '') {
    return null;
  }

  // اگر از قبل Date باشد
  if (input instanceof Date) {
    return isValidDate(input) ? input : null;
  }

  // اگر عدد باشد (timestamp بر حسب میلی‌ثانیه یا ثانیه)
  if (typeof input === 'number') {
    // اگر مثل timestamp ثانیه‌ای باشد (۱۰ رقمی) به میلی‌ثانیه تبدیل می‌کنیم
    const ms = input < 1e12 ? input * 1000 : input;
    const d = new Date(ms);
    return isValidDate(d) ? d : null;
  }

  // در این مرحله input یک رشته است
  const raw = String(input).trim();
  if (!raw) return null;

  // 1) تلاش مستقیم با سازنده‌ی Date (برای ISO و فرمت‌های استاندارد)
  let d = new Date(raw);
  if (isValidDate(d)) return d;

  // 2) فرمت رایج بک‌اند: "YYYY-MM-DD HH:mm:ss" (با فاصله، بدون timezone)
  //    آن را به فرمت ISO با T و Z تبدیل می‌کنیم و دوباره پارس می‌کنیم.
  //    فرض بر این است که زمان روی UTC است (بک‌اند معمولاً UTC ذخیره می‌کند).
  const m = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/
  );
  if (m) {
    const [, year, month, day, hour, minute, second, frac] = m;
    const millis = frac ? `.${frac.padEnd(3, '0').slice(0, 3)}` : '.000';
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${millis}Z`;
    d = new Date(iso);
    if (isValidDate(d)) return d;
  }

  // 3) فقط تاریخ بدون زمان: "YYYY-MM-DD"
  const dOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dOnly) {
    d = new Date(`${raw}T00:00:00.000Z`);
    if (isValidDate(d)) return d;
  }

  return null;
}

/** بررسی معتبر بودن یک شیء Date */
function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/**
 * escape کردن کاراکترهای خاص XML در مقادیر متنی (مثل <loc>).
 * این کار از خراب شدن sitemap به‌خاطر کاراکترهایی مثل & < > " '
 * در URLها (مثلاً URLهای دارای query string) جلوگیری می‌کند.
 *
 * مرجع: https://www.sitemaps.org/protocol.html#escaping
 */
export function xmlEscape(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
