# گزارش اولیه پروژه آفلند / Next.js

تاریخ بررسی: 2026-06-23

## وضعیت کلی

- پروژه از فایل `11111111.zip.txt` استخراج شد.
- فریم‌ورک: Next.js App Router
- نسخه‌های اصلی:
  - `next`: `16.0.0`
  - `react`: `19.1.1`
  - `typescript`: `^5`
  - `tailwindcss`: `^3.4.17`
  - `@heroui/react`: `^2.8.2`
  - `@tanstack/react-query`: `^5.84.2`
  - `zustand`: `^5.0.7`

## ساختار مهم پروژه

- `src/app`: مسیرها، صفحات و API Route ها
- `src/components`: کامپوننت‌های UI و بخش‌های صفحه‌ها
- `src/hooks`: هوک‌های ارتباط با API و منطق کلاینت
- `src/lib`: ابزارها، کانفیگ، auth/session، AI chat، sitemap و ...
- `src/store`: استورهای Zustand
- `public`: فونت‌ها، آیکن‌ها و تصاویر استاتیک

## مسیرهای مهم

### صفحات کاربر

- صفحه اصلی: `src/app/(user)/(home)/page.tsx`
- مگ/بلاگ: `src/app/(user)/(mags)/mag`
- محصول: `src/app/(user)/product/[...id]/page.tsx`
- دسته‌بندی: `src/app/(user)/category/[...id]/page.tsx`
- برند: `src/app/(user)/brand/[...id]/page.tsx`
- سبد خرید: `src/app/(user)/cart/page.tsx`
- تسویه حساب: `src/app/(user)/checkout/page.tsx`
- پروفایل: `src/app/(user)/profile/...`
- مقایسه: `src/app/(user)/compare/[...id]/page.tsx`
- اسمبل آنلاین: `src/app/(user)/assemble/page.tsx`

### API Route ها

- AI Chat: `src/app/api/ai-chat/route.ts`
- اسمبل آنلاین: `src/app/api/assemble/...`
- session/auth: `src/app/api/check-session`, `src/app/api/token`, `src/app/api/logout`
- sitemap/robots/revalidate: `src/app/api/sitemap`, `src/app/api/robots`, `src/app/api/revalidate`

## کانفیگ env

فایل نمونه: `env.example`

متغیرهای اصلی:

- `NEXT_PUBLIC_BASE_SERVER_API_URL`
- `NEXT_PUBLIC_BASE_URL_SITE`
- `NEXT_PUBLIC_BASE_URL_IMAGE`
- `NEXT_PUBLIC_COCKIES`
- متغیرهای مربوط به AI Chat مثل `AI_CHAT_PROVIDER`, `AI_CHAT_API_KEY`, `AI_CHAT_USE_PROXY`

## نتیجه نصب وابستگی‌ها

دستور معمولی `npm ci` به‌خاطر ناسازگاری peer dependency بین `@heroui/theme` و `tailwindcss@3` خطا می‌دهد.

دستور موفق:

```bash
npm ci --legacy-peer-deps
```

نکته‌ها:

- هشدار امنیتی برای `next@16.0.0` وجود دارد و پیشنهاد ارتقا به نسخه patch شده داده شده است.
- `npm audit` تعداد آسیب‌پذیری‌ها را گزارش کرده است.

## نتیجه بررسی TypeScript

دستور:

```bash
npx tsc --noEmit
```

خطاهای فعلی:

1. `src/app/api/assemble/ai-pick/route.ts`
   - پراپرتی `inStock` روی تایپ `PartCandidate` تعریف نشده است.
2. `src/app/api/assemble/route.ts`
   - متغیر/ثابت `USE_CASE_BUDGET_WEIGHTS` پیدا نمی‌شود.
3. `src/components/assemble/AssembleProductCard.tsx`
   - مقدار `string | null` به جایی پاس داده شده که `string | StaticImageData | undefined` می‌خواهد.
4. `src/components/assemble/AssembleWizard.tsx`
   - `EyeIcon` تعریف/ایمپورت نشده است.
5. `src/components/common/theme/ThemeProvider.tsx`
   - مقایسه تایپی اشتباه بین `light | dark` و `system`.
6. `src/lib/ai-chat/assembler.ts`
   - پراپرتی `link` روی چند تایپ image تعریف نشده است.
7. `src/lib/ai-chat/rag.ts`
   - مقدار `string | undefined` به فیلد `string` پاس داده شده است.

## نتیجه build

دستور:

```bash
npm run build
```

در محیط سندباکس هنگام `Creating an optimized production build` با پیام `Killed` متوقف شد؛ احتمالاً محدودیت حافظه محیط است. قبل از build نهایی بهتر است خطاهای TypeScript بالا رفع شوند و سپس روی سیستم اصلی/سرور تست شود.

## روال پیشنهادی برای آپدیت‌های بعدی

1. کاربر مشکل یا آپدیت را دقیق توضیح می‌دهد.
2. تغییرات روی همین پروژه اعمال می‌شود.
3. TypeScript/build تا حد امکان تست می‌شود.
4. نسخه نهایی به‌صورت zip آماده می‌شود تا کاربر دانلود کند و روی فولدر پروژه خودش جایگزین/ران کند.
