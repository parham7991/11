# بهبود تعویض حالت تاریک/روشن (بدون لگ + انیمیشن جذاب)

## علت لگ (Root Cause)
قبلاً با هر بار زدن دکمه، کلاس `dark` روی تگ `<html>` عوض می‌شد. چون در `globals.css` ده‌ها قانون `!important` برای رنگ/بک‌گراند (مثل `html.dark .bg-white { ... }`) وجود دارد، مرورگر مجبور بود **کل صفحه را دوباره رنگ‌آمیزی (repaint) کند** — آن هم روی صفحه‌های سنگین با `backdrop-blur` و سایه‌های زیاد. این repaint همگام و سنگین بود و حس لگ می‌داد. هیچ انتقالی روی کارت گرافیک (GPU) هم برای این تغییر وجود نداشت.

## راه حل: View Transitions API
از ویژگی استاندارد مرورگر `document.startViewTransition()` استفاده کردیم:
1. مرورگر از وضعیت **قبل** از تغییر یک عکس (snapshot) می‌گیرد.
2. کلاس `dark` را عوض می‌کند و از وضعیت **بعد** عکس می‌گیرد.
3. بین دو عکس را با کارت گرافیک **cross-fade** می‌کند → بدون repaint سنگین، بدون لگ.

روی این cross-fade یک **افکت حلقه‌ای (circular reveal)** گذاشتیم: تمِ جدید دقیقاً از **نقطه‌ای که روی دکمه کلیک کرده‌اید** مثل یک دایره باز می‌شود و کل صفحه را می‌پوشاند (شبیه انیمیشن تم اندروید / Material You).

## فایل‌های تغییر یافته
- **`src/app/globals.css`**
  - انتقال ۲۴۰ms روی `html` فقط برای مرورگرهای **بدون** View Transitions باقی ماند (`@supports not`).
  - بلوک جدید `::view-transition-*` با keyframe `theme-circle-reveal` که نقطه شروع را از متغیرهای `--theme-toggle-x/y` می‌گیرد.
  - داخل `@media (prefers-reduced-motion: no-preference)` → برای کاربرانی که انیمیشن را خاموش کرده‌اند تعویض بدون حرکت انجام می‌شود (دسترس‌پذیری).
- **`src/components/common/theme/ThemeProvider.tsx`**
  - تابع `runThemeUpdate` کل تغییر تم را در `startViewTransition` می‌پیچد (با fallback برای مرورگر قدیمی).
  - `setMode` و `toggleTheme` آرگومان اختیاری `origin: {x, y}` گرفتند.
  - برای جلوگیری از stale closure، آخرین تم در `resolvedThemeRef` نگه داشته می‌شود.
- **دکمه‌ها** (`HeaderThemeToggle`, `ThemeToggle` شناور، `MagThemeToggle`):
  - مختصات `event.clientX/Y` هنگام کلیک فرستاده می‌شود تا دایره از جای دکمه باز شود.

## تست دستی
دکمه تم (هدر یا ویجت شناور) را بزنید؛ صفحه باید با یک حلقه نرم از محل دکمه تعویض شود، بدون گیر‌کردن.
