/**
 * event-theme.ts
 * ──────────────────────────────────────────────────────────────────
 * سیستم «تم مناسبتی» سایت آفلند.
 *
 * با این سیستم می‌توانی برای مناسبت‌های خاص (مثل جام جهانی، نوروز، یلدا و...)
 * یک تم کامل روی کل سایت فعال کنی؛ رنگ‌ها، بنر، دکوراسیون، هدر، کارت‌ها و
 * دکمه‌ها همگی با یک کلاس روی <html> تغییر می‌کنند.
 *
 * نحوهٔ کنترل (از طریق متغیر محیطی):
 *   NEXT_PUBLIC_EVENT_THEME=worldcup      → تم جام جهانی فعال می‌شود
 *   NEXT_PUBLIC_EVENT_THEME=off | (خالی)  → سایت در حالت عادی است
 *
 * (اختیاری) محدودکردن تم به یک بازهٔ زمانی:
 *   NEXT_PUBLIC_EVENT_THEME_START=2026-06-01
 *   NEXT_PUBLIC_EVENT_THEME_END=2026-07-20
 *   اگر این دو تنظیم شده باشند، تم فقط داخل این بازه نمایش داده می‌شود.
 * ──────────────────────────────────────────────────────────────────
 */

/** شناسهٔ تم‌های مناسبتی پشتیبانی‌شده */
export type EventThemeId = 'worldcup';

export type EventThemeConfig = {
  /** شناسهٔ تم (همان مقداری که در env می‌گذاری) */
  id: EventThemeId;
  /** کلاسی که روی <html> ست می‌شود تا CSS فعال شود */
  htmlClass: string;
  /** نام نمایشی تم */
  name: string;
  /** متن بنر بالای سایت */
  bannerTitle: string;
  bannerSubtitle: string;
  /** متن دکمهٔ بنر (اختیاری) */
  bannerCtaText?: string;
  /** لینک دکمهٔ بنر (اختیاری) */
  bannerCtaHref?: string;
  /** ایموجی‌هایی که به‌صورت شناور در پس‌زمینه پخش می‌شوند */
  floatingEmojis: string[];
};

/**
 * دیتابیس تم‌های مناسبتی.
 * برای اضافه‌کردن مناسبت جدید کافی است یک ورودی به این آبجکت اضافه کنی
 * و استایلش را در src/styles بنویسی.
 */
export const EVENT_THEMES: Record<EventThemeId, EventThemeConfig> = {
  worldcup: {
    id: 'worldcup',
    htmlClass: 'event-worldcup',
    name: 'جام جهانی',
    bannerTitle: '🏆 ویژه‌نامهٔ جام جهانی',
    bannerSubtitle: 'تخفیف‌های داغ جام جهانی فقط برای مدت محدود!',
    bannerCtaText: 'مشاهدهٔ پیشنهادها',
    bannerCtaHref: '/category-list',
    floatingEmojis: ['⚽', '🏆', '🥇', '🎉', '🔥', '⭐'],
  },
};

/** نام متغیرهای محیطی (برای جلوگیری از تایپ تکراری) */
const ENV_KEY = 'NEXT_PUBLIC_EVENT_THEME';
const ENV_START = 'NEXT_PUBLIC_EVENT_THEME_START';
const ENV_END = 'NEXT_PUBLIC_EVENT_THEME_END';

/** خواندن مقدار خام تم از env (سمت سرور و کلاینت چون NEXT_PUBLIC است) */
function readEnvThemeId(): string {
  const raw = (process.env[ENV_KEY] || '').trim().toLowerCase();
  return raw;
}

/** بررسی این‌که آیا اکنون داخل بازهٔ زمانی مجاز هستیم یا نه */
function isWithinDateRange(): boolean {
  const start = (process.env[ENV_START] || '').trim();
  const end = (process.env[ENV_END] || '').trim();

  // اگر بازه‌ای تعریف نشده، همیشه مجاز است
  if (!start && !end) return true;

  const now = Date.now();

  if (start) {
    const startTime = new Date(start).getTime();
    if (!Number.isNaN(startTime) && now < startTime) return false;
  }
  if (end) {
    const endTime = new Date(end).getTime();
    // شامل کل روز پایان: تا انتهای آن روز معتبر است
    if (!Number.isNaN(endTime) && now > endTime + 24 * 60 * 60 * 1000) return false;
  }
  return true;
}

/**
 * تم مناسبتی فعال را برمی‌گرداند، یا null اگر هیچ تمی فعال نباشد.
 * این تابع هم در سرور و هم در کلاینت قابل استفاده است.
 */
export function getActiveEventTheme(): EventThemeConfig | null {
  const id = readEnvThemeId();

  // حالت‌های خاموش
  if (!id || id === 'off' || id === 'none' || id === 'false' || id === '0') {
    return null;
  }

  const theme = (EVENT_THEMES as Record<string, EventThemeConfig>)[id];
  if (!theme) return null;

  // اگر بازهٔ زمانی تعریف شده و خارج از آن هستیم، تم نمایش داده نمی‌شود
  if (!isWithinDateRange()) return null;

  return theme;
}

/** فقط کلاس html تم فعال (یا رشتهٔ خالی). برای اسکریپت inline استفاده می‌شود. */
export function getActiveEventHtmlClass(): string {
  return getActiveEventTheme()?.htmlClass ?? '';
}
