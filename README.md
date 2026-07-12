# 🛒 آفلند (OffLand) — فروشگاه اینترنتی قطعات کامپیوتر و کالای دیجیتال

> **سرزمینِ تخفیف** — فروشگاه اینترنتی مدرن فارسی (RTL) برای فروش قطعات سخت‌افزاری،
> لپ‌تاپ، موبایل، گیمینگ و کالای دیجیتال، مجهز به **دستیار هوشمند مبتنی بر LLM** و
> **جادوگر اسمبل هوشمند کامپیوتر**.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-000000)](https://github.com/pmndrs/zustand)
[![RTL](https://img.shields.io/badge/Direction-RTL-green)](#)
[![License](https://img.shields.io/badge/License-Proprietary-blue)](#مجوز)

---

## 📌 فهرست مطالب

- [معرفی](#معرفی)
- [ویژگی‌های کلیدی](#ویژگیهای-کلیدی)
- [تکنولوژی‌ها و پشته فنی](#تکنولوژیها-و-پشته-فنی)
- [پیش‌نیازها](#پیشنیازها)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [متغیرهای محیطی](#متغیرهای-محیطی)
- [اسکریپت‌های پروژه](#اسکریپتهای-پروژه)
- [ساختار پروژه](#ساختار-پروژه)
- [معماری](#معماری)
  - [لایه ناوبری (App Router)](#لایه-ناوبری-app-router)
  - [مدیریت وضعیت (State)](#مدیریت-وضعیت-state)
  - [میان‌افزار (Middleware)](#میانافزار-middleware)
  - [احراز هویت](#احراز-هویت)
- [دستیار هوشمند آفلند (AI Chat)](#دستیار-هوشمند-آفلند-ai-chat)
- [جادوگر اسمبل هوشمند (Assemble)](#جادوگر-اسمبل-هوشمند-assemble)
- [بهینه‌سازی موتور جستجو (SEO)](#بهینهسازی-موتور-جستجو-seo)
- [تم تاریک/روشن](#تم-تاریکروشن)
- [اجرا در محیط تولید](#اجرا-در-محیط-تولید)
- [راهنمای مشارکت](#راهنمای-مشارکت)
- [نقشه راه](#نقشه-راه)
- [مجوز](#مجوز)
- [منابع و لینک‌ها](#منابع-و-لینکها)

---

## معرفی

**آفلند** یک پلتفرم فروشگاهی تمام‌عیار به زبان فارسی و با پشتیبانی کامل از جهت‌بندی
راست‌به‌چپ (RTL) است. این پروژه با هدف تجربه‌ای حرفه‌ای برای خرید اینترنتی قطعات
کامپیوتر (مادربرد، پردازنده، کارت گرافیک، رم، حافظه، پاور، کیس، خنک‌کننده)،
لپ‌تاپ، موبایل، ساعت هوشمند، هندزفری و لوازم جانبی گیمینگ طراحی شده است.

نکته متمایز آفلند، یکپارچگی با **هوش مصنوعی** است:

1. **دستیار خرید هوشمند** — چت‌باتی مبتنی بر LLM که با هر ارائه‌دهنده سازگار با
   OpenAI (Groq، Gemini، OpenRouter، AvalAI، Liara، OpenAI، DeepSeek و…) کار می‌کند
   و با قابلیت **RAG** روی کاتالوگ محصولات، به کاربر مشاورهٔ خرید می‌دهد.
2. **جادوگر اسمبل کامپیوتر** — موتوری هوشمند که بر اساس کاربری (گیمینگ، اداری،
   رندر، استریم) و بودجه، قطعات سازگار را انتخاب، سازگاری را بررسی و فاکتور نهایی
   را می‌سازد.

---

## ویژگی‌های کلیدی

- ✅ **معماری مدرن Next.js (App Router)** با ترجیح Server Components و تعاملی‌سازی در
  گره‌های انتهایی (Leaf Nodes).
- ✅ **رابط کاربری فارسی RTL** بهینه‌شده برای فروشگاه‌های ایرانی.
- ✅ **صفحات محصول غنی** — گالری تصاویر (زوم داخلی)، مشخصات فنی، نظرات، امتیازها،
  پرسش‌وپاسخ، مقایسه و لیست علاقه‌مندی.
- ✅ **فیلتر و مرتب‌سازی پیشرفته** در دسته‌بندی‌ها (برند، قیمت، ویژگی‌ها).
- ✅ **سبد خرید و تسویه حساب** — آدرس‌دهی، روش ارسال، روش پرداخت و صفحات موفقیت/خطا.
- ✅ **حساب کاربری** — مدیریت آدرس‌ها، سفارش‌ها، لیست علاقه‌مندی، نظرات و اطلاعات
  شخصی.
- ✅ **مقایسه محصولات** با نمایش واکنش‌گرا (دسکتاپ/موبایل).
- ✅ **مجله و اخبار کوتاه** (مَگ‌ها و شورت‌نیوز) با سیستم دسته‌بندی و جستجو.
- ✅ **دستیار هوشمند (AI Chat)** با پشتیبانی از ده‌ها ارائه‌دهنده و RAG.
- ✅ **جادوگر اسمبل هوشمند** با بررسی سازگاری قطعات و Auto-Resolver.
- ✅ **تم تاریک/روشن** با ذخیرهٔ ترجیح کاربر.
- ✅ **بهینه‌سازی تصاویر** (Next Image، WebP/AVIF، کش یک‌ساله).
- ✅ **سئو کامل** — متادیتا، JSON-LD، `sitemap.xml`، `robots.txt`، Open Graph.
- ✅ **اسکلت‌بندی (Skeleton) در تمام صفحات** برای تجربهٔ بارگذاری روان.
- ✅ **PWA** — قابلیت نصب و اشتراک‌گذاری.
- ✅ **آمادگی Docker** با خروجی `standalone`.

---

## تکنولوژی‌ها و پشته فنی

| حوزه | تکنولوژی |
|------|----------|
| فریم‌ورک | **Next.js 16** (App Router، Turbopack در dev) |
| زبان | **TypeScript** (حالت `strict`) |
| رابط کاربری | **React 19** |
| استایل‌دهی | **Tailwind CSS 3.4** + **HeroUI** |
| انیمیشن | **Framer Motion** |
| مدیریت وضعیت | **Zustand 5** (با `immer` و `devtools`) |
| دریافت داده | **@tanstack/react-query 5** |
| فرم‌ها | **Formik** + **Yup** |
| اسلایدرها | **Swiper** + **Keen Slider** |
| اعلان‌ها | **Sonner** |
| نمودار/رادار | نمودارهای سفارشی در جادوگر اسمبل (SVG) |
| کش/Redis | **ioredis** |
| احراز هویت | **jsonwebtoken**، **js-cookie** |
| تاریخ | **react-multi-date-picker**، **react-date-object** |
| خروجی تولید | `standalone` (Docker-ready) |

---

## پیش‌نیازها

- **Node.js** نسخه ۱۸.۱۸+ (توصیه‌شده ۲۰+)
- یکی از مدیران بسته: **pnpm** (توصیه‌شده) / **npm** / **yarn**
- دسترسی به API بک‌اند فروشگاه (مقادیر `BASE_SERVER_API_URL` و غیره)
- (اختیاری) کلید یکی از ارائه‌دهندگان هوش مصنوعی برای فعال‌سازی دستیار

---

## نصب و راه‌اندازی

پروژه از **pnpm** به عنوان مدیر بستهٔ اصلی استفاده می‌کند (به دلیل وجود
`pnpm-workspace.yaml` و تنظیمات hoist در `.npmrc`). با این حال `package-lock.json`
و `yarn.lock` نیز نگه‌داری شده‌اند.

```bash
# ۱) کلون پروژه
git clone <repo-url> offland
cd offland

# ۲) نصب وابستگی‌ها (pnpm توصیه می‌شود)
pnpm install
# یا: npm install / yarn install

# ۳) تنظیم متغیرهای محیطی
cp .env.example .env.local
#  مقادیر را در .env.local ویرایش کنید (بخش بعد را ببینید)

# ۴) اجرای محیط توسعه
pnpm dev
#  سایت روی http://localhost:3000 در دسترس است
```

> 💡 در فایل `next.config.ts` آدرس `allowedDevOrigins` روی یک IP شبکه محلی
> (`192.168.1.166`) تنظیم شده تا دسترسی از دستگاه‌های شبکه ممکن باشد. در صورت نیاز
> آن را تغییر دهید.

---

## متغیرهای محیطی

فایل `.env.example` نمونهٔ کاملی از تنظیمات را دارد. متغیرها در دو دسته قرار
می‌گیرند:

### الف) تنظیمات عمومی (Client / Server)

| متغیر | توضیح |
|-------|-------|
| `NEXT_PUBLIC_SECRET_KEY` | کلید رمزنگاری سمت کلاینت |
| `NEXT_PUBLIC_PAYLOAD_KEY` | کلید بارِ داده‌های رمز شده |
| `NEXT_PUBLIC_COCKIES` | نام کوکی نشست (session) |
| `NEXT_PUBLIC_BASE_URL_SITE` | آدرس پایهٔ سایت |
| `NEXT_PUBLIC_BASE_URL_IMAGE` | آدرس پایهٔ تصاویر (پیش‌فرض `media.iwcs.ir`) |
| `NEXT_PUBLIC_BASE_URL_AWS_BUCKET` | نام باکت (پیش‌فرض `offl`) |
| `NEXT_PUBLIC_BASE_SERVER_API_URL` | آدرس پایهٔ API بک‌اند |

### ب) تنظیمات دستیار هوشمند (فقط Server — توکن فاش نمی‌شود)

فقط **۲ خط** کافی است: یک سرویس را انتخاب کنید + توکنش را بدهید؛ بقیه خودکار ست
می‌شود (آدرس API و مدل پیش‌فرض از کاتالوگ `src/lib/ai-chat/providers.ts` خوانده
می‌شوند).

| متغیر | پیش‌فرض | توضیح |
|-------|---------|-------|
| `AI_CHAT_PROVIDER` | `groq` | سرویس: `groq`, `gemini`, `openrouter`, `avalai`, `liara`, `openai`, `mistral`, `deepseek`, `together`, `cerebras` |
| `AI_CHAT_API_KEY` | — | توکن سرویس (محرمانه) |
| `AI_CHAT_MODEL` | مدل پیش‌فرض سرویس | مدل خاص (اختیاری) |
| `AI_CHAT_API_BASE` | از روی سرویس | آدرس API دستی (اختیاری) |
| `AI_CHAT_ENABLED` | `1` | فعال/غیرفعال |
| `AI_CHAT_TEMPERATURE` | `0.4` | دمای پاسخ |
| `AI_CHAT_MAX_TOKENS` | `800` | سقف توکن خروجی |
| `AI_CHAT_ENABLE_RAG` | `1` | جستجو در کاتالوگ محصولات |
| `AI_CHAT_RAG_COUNT` | `8` | تعداد محصول در بافت (۱ تا ۱۲) |
| `AI_CHAT_PROXY_URL` | — | پروکسی کامل (مثل `socks5://user:pass@host:port`) |
| `AI_CHAT_USE_PROXY` | `0` | استفاده از پروکسی SOCKS5 |

> سرویس‌های رایگان: `groq`, `gemini`, `openrouter`, `mistral`, `cerebras`
> سرویس‌های ایرانی: `avalai`, `liara`

### ج) محیط سرور (ایندکس موتورهای جستجو)

| متغیر | توضیح |
|-------|-------|
| `SERVER_MOD` / `SERVER_MODE` | `production` → `index, follow` / `development|staging|test` → `noindex, nofollow` |

---

## اسکریپت‌های پروژه

| دستور | توضیح |
|-------|-------|
| `pnpm dev` | اجرای سرور توسعه با Turbopack |
| `pnpm build` | ساخت تولید (Webpack) — خروجی `standalone` |
| `pnpm start` | اجرای نسخهٔ ساخته‌شده |
| `pnpm lint` | اجرای ESLint |
| `pnpm format` | فرمت‌دهی فایل‌های تغییریافته با Prettier |
| `pnpm format:all` | فرمت‌دهی کل پروژه با Prettier |
| `pnpm prepare` | نصب Husky (Git hooks) |

> پروژه از **Husky** + **lint-staged** برای اعمال خودکار Prettier روی فایل‌های
> Stage‌شده استفاده می‌کند.

---

## ساختار پروژه

```
src/
├── app/                      # مسیرهای App Router (صفحات و Route Handlers)
│   ├── (user)/               # گروه مسیرهای کاربری
│   │   ├── (home)/           # صفحهٔ اصلی + سرویس دریافت داده
│   │   ├── product/          # جزئیات محصول + sitemap/loading
│   │   ├── category/         # لیست دسته‌بندی + فیلتر + sitemap
│   │   ├── cart/             # سبد خرید
│   │   ├── checkout/         # تسویه حساب + verify (Success/Faild)
│   │   ├── compare/          # مقایسه محصولات
│   │   ├── profile/          # حساب کاربری (آدرس، سفارش، علاقه‌مندی…)
│   │   ├── assemble/         # جادوگر اسمبل کامپیوتر
│   │   ├── mags/             # مجله / بلاگ
│   │   ├── short-news/       # اخبار کوتاه
│   │   ├── tags/ , brand/    # صفحات برچسب و برند
│   │   ├── result/           # نتایج جستجو
│   │   └── auth/             # ورود، بازیابی رمز، تایید
│   ├── api/                  # Route Handlers (AI، assemble، auth، seo…)
│   ├── pwa/                  # صفحهٔ PWA
│   ├── layout.tsx            # لایهٔ ریشه (RTL، تم، GTM، AI Chat)
│   ├── globals.css           # استایل‌های سراسری
│   └── robots.txt/, sitemap.xml/, static-sitemap.xml/  # routeهای SEO
│
├── components/               # کامپوننت‌های قابل استفاده مجدد
│   ├── common/               # هدر، فوتر، دکمه، اسکلتون، تم، رویدادها، فرم‌ها
│   ├── home/                 # اسلایدرها، بخش‌های ویژه، برندها، دسته‌ها
│   ├── product/              # جزئیات محصول، نظرات، سوالات، امتیازها
│   ├── cart/ , checkout/     # اجزای سبد و تسویه
│   ├── category/             # فیلتر، مرتب‌سازی، رنج قیمت
│   ├── compare/              # مقایسه (دسکتاپ/موبایل)
│   ├── profile/              # بخش حساب کاربری
│   ├── blogs/                # مجله و اخبار کوتاه
│   ├── assemble/             # ویجت‌های جادوگر اسمبل (رادار، گیج، فاکتور…)
│   ├── ai-chat/              # ویجت و لایهٔ نصب دستیار هوشمند
│   └── pwa/                  # کلاینت PWA
│
├── hooks/                    # هوک‌های سفارشی (auth, cart, checkout, product, profile, blogs, common)
├── lib/                      # منطق بیزینس و کمکی
│   ├── ai-chat/              # موتور دستیار (providers, rag, assembler, compatibility…)
│   ├── auth/                 # نشست، میان‌افزار، Fetcher، session
│   ├── assembly-pricing.ts   # محاسبات قیمت اسمبل
│   ├── cities.ts, provinces.ts, cookie-options.ts, token.ts, variable.ts …
├── store/                    # استورهای Zustand
│   ├── cart-store.ts         # سبد خرید (persist در sessionStorage)
│   ├── checkout-store.ts     # مرحلهٔ تسویه
│   ├── global-store.ts       # وضعیت عمومی (دسته‌ها، حذف، logout…)
│   ├── singleProduct.ts      # محصول تکی
│   └── static-block.ts       # بلوک‌های استاتیک
├── seo/                      # تولید متادیتا برای هر صفحه (product, category, mag, tag…)
├── styles/                   # CSS اختصاصی (مثل event-worldcup)
└── types/                    # تایپ‌های TypeScript (Home, blogs)
```

---

## معماری

### لایه ناوبری (App Router)

- مسیرها با استفاده از **Route Groups** سازماندهی شده‌اند (`(user)` برای تمام
  صفحات مشتری، `api` برای Route Handlers).
- ترجیح اولیه بر **Server Components** است؛ تعاملی‌سازی فقط در گره‌های انتهایی
  (مثل فرم‌ها، اسلایدرها، modals) با `'use client'` انجام می‌شود.
- هر بخش دارای فایل‌های `loading.tsx`، `error.tsx`، `not-found.tsx` و `sitemap.ts`
  مختص خود است تا تجربهٔ بارگذاری و خطا بهینه باشد.

### مدیریت وضعیت (State)

پروژه از **Zustand** با استفاده از selectorهای هدفمند برای جلوگیری از رندرهای
غیرضروری استفاده می‌کند:

```ts
// انتخاب هدفمند (الگوی صحیح)
const items = useCartStore((s) => s.items);
```

- `cart-store` — سبد خرید با `persist` روی `sessionStorage` (نام: `cart-storage`).
- `global-store` — وضعیت عمومی با `immer` + `devtools` (دسته‌ها، دیالوگ حذف،
  logout، حالت Coming Soon).
- `checkout-store`, `singleProduct`, `static-block` — وضعیت اختصاصی هر بخش.

داده‌های سروری عمدتاً با **React Query** مدیریت و کش می‌شوند.

### میان‌افزار (Middleware)

فایل ریشهٔ `middleware.ts` خط لوله‌ای از ماژول‌های مستقل را اجرا می‌کند
(`src/lib/auth/middleware/`):

| ماژول | وظیفه |
|-------|-------|
| `middleware.noindex` | جلوگیری از ایندکس شدن در محیط تست |
| `middleware.auth` | محافظت از مسیرهای محافظت‌شده (`protectedRoute`) و ریدایرکت به ورود |
| `middleware.validpage` | ریدایرکت صفحات نامعتبر |
| `middleware.fingerprint` | مدیریت اثر انگشت کاربر (finger/viewport) |
| `middleware.gone` / `lib` / `constants` | ابزارها و ثابت‌ها |

همچنین در محیط‌های `development/staging/test` هدر `X-Robots-Tag: noindex,
nofollow` به‌طور خودکار تنظیم می‌شود.

### احراز هویت

- `getSession()` در سمت سرور کوکی نشست را می‌خواند، توکن را بررسی و اطلاعات کاربر
  را از بک‌اند دریافت می‌کند.
- `SessionProvider` وضعیت نشست را در سطح ریشه در دسترس قرار می‌دهد.
- خروج (`logout`) از طریق Route Handler مربوطه انجام می‌شود.

---

## دستیار هوشمند آفلند (AI Chat)

یک چت‌بات شناور که با **هر ارائه‌دهندهٔ سازگار با OpenAI** کار می‌کند. طراحی آن
برای حداکثر سادگی است:

- کافی است `AI_CHAT_PROVIDER` و `AI_CHAT_API_KEY` را ست کنید؛ آدرس API و مدل
  پیش‌فرض از کاتالوگ `src/lib/ai-chat/providers.ts` به‌طور خودکار انتخاب می‌شوند.
- توکن **فقط در سمت سرور** خوانده می‌شود (بدون پیشوند `NEXT_PUBLIC`) تا هرگز به
  مرورگر فاش نشود.
- قابلیت **RAG**: با فعال بودن `AI_CHAT_ENABLE_RAG`، دستیار روی کاتالوگ محصولات
  آفلند جستجو کرده و پاسخ‌های مبتنی بر قیمت/موجودی واقعی می‌دهد.
- هر سرویس هویت نمایشی متفاوتی دارد (مثلاً OpenRouter → «فیری»، Groq → «گروک‌یار»).
- پشتیبانی از **پروکسی SOCKS5** برای عبور از محدودیت‌های شبکه.
- فایل‌های کلیدی:
  - `src/lib/ai-chat/config.ts` — خواندن تنظیمات
  - `src/lib/ai-chat/providers.ts` — کاتالوگ سرویس‌ها
  - `src/lib/ai-chat/rag.ts` — جستجوی محصولات
  - `src/lib/ai-chat/guardrails.ts` — قوانین ایمنی (جلوگیری از ساخت قیمت خودسرانه)
  - `src/components/ai-chat/` — ویجت و لایهٔ نصب

---

## جادوگر اسمبل هوشمند (Assemble)

در مسیر `/assemble` کاربر کاربری (گیمینگ/اداری/رندر/استریم/سفارشی) و بودجه را
وارد می‌کند و موتور هوشمند آفلند:

1. **کاندیداها** را از بک‌اند جمع‌آوری می‌کند.
2. **موجودی را real-time** بررسی می‌کند.
3. با استفاده از **هوش مصنوعی** (`/api/assemble/ai-pick`) بهترین قطعه را برای هر
   دسته انتخاب می‌کند.
4. **سازگاری** را چک می‌کند (سوکت CPU/مادربرد، نوع رم DDR4/DDR5، توان پاور،
   فرم‌فکتور کیس، طول کارت گرافیک).
5. **Auto-Resolver** قطعات ناسازگار را حذف یا جایگزین می‌کند و پیام «موجود نیست»
   می‌دهد.
6. **فاکتور نهایی** همراه با نمودار رادار مشخصات، گیج سازگاری و تحلیل قیمت می‌سازد.

Endpointهای مرتبط در `src/app/api/assemble/`:

| مسیر | کاربرد |
|------|--------|
| `/api/assemble` | ساخت کامل سیستم (موتور اصلی) |
| `/api/assemble/ai-pick` | انتخاب هوشمند یک قطعه |
| `/api/assemble/ai-analyze` | تحلیل درخواست کاربر |
| `/api/assemble/budget-range` | محاسبه بازهٔ بودجهٔ هر دسته |
| `/api/assemble/compatibility` | بررسی سازگاری قطعات |
| `/api/assemble/verify` | تایید نهایی سفارش اسمبل |

ماژول‌های پشتیبان: `assembler.ts` (موتور انتخاب)، `compatibility-checker.ts`،
`auto-resolver.ts`، `part-detector.ts`، `parts-db.ts`، `benchmark-library.ts`،
`telemetry.ts`.

---

## بهینه‌سازی موتور جستجو (SEO)

پروژه برای سئو فروشگاهی بهینه شده:

- **متادیتا در سطح هر صفحه** از طریق ماژول‌های `src/seo/` (محصول، دسته‌بندی، مگ،
  برچسب، نتیجه، برند، صفحهٔ اصلی).
- **JSON-LD** ساختاریافته (`src/lib/jsonld.ts`) برای محصولات و سازمان.
- **`sitemap.xml`** پویا (مسیرهای `sitemap.ts` در هر بخش + routeهای
  `sitemap.xml`/`static-sitemap.xml`).
- **`robots.txt`** پویا با کنترل `noindex` در محیط تست.
- **Open Graph** و `lang="fa" dir="rtl"` در لایهٔ ریشه.
- **تاییدیهٔ Google Search Console** در متادیتا.

---

## تم تاریک/روشن

- تم بر پایه کلاس (`darkMode: 'class'`) در Tailwind پیاده‌سازی شده است.
- یک اسکریپت `beforeInteractive` در `layout.tsx` ترجیح کاربر را از
  `localStorage` می‌خواند و قبل از هیچ رندری کلاس `dark` را روی `<html>` اعمال
  می‌کند (جلوگیری از Flash of Wrong Theme).
- کامپوننت‌های `ThemeProvider` / `ThemeToggle` در `src/components/common/theme/`
  امکان تغییر تم را فراهم می‌کنند.

---

## اجرا در محیط تولید

پروژه برای اجرای **Docker/standalone** آماده است:

```bash
# ساخت
pnpm build
#  خروجی در .next/standalone قرار می‌گیرد (به دلیل output: 'standalone')

# اجرا
pnpm start
```

- در `next.config.ts` تنظیمات کش تصاویر (یک سال، `immutable`)، هدرهای CORS برای
  `/api` و `allowedDevOrigins` قرار دارد.
- در تولید، `removeConsole` فعال است تا لاگ‌ها حذف شوند.
- خروجی `standalone` به همراه `public` و `static` برای ساخت Image قابل استفاده
  است.

---

## راهنمای مشارکت

1. مخزن را Fork کنید.
2. شاخهٔ جدید بسازید: `git checkout -b feature/name`.
3. تغییرات را اعمال و commit کنید (Husky lint-staged را اجرا می‌کند).
4. حتماً `pnpm lint` و `pnpm format` را قبل از Push اجرا کنید.
5. Pull Request باز کنید و تغییرات را توضیح دهید.

> لطفاً برای کدنویسی از قراردادهای پروژه (TypeScript strict، RTL-friendly،
> Server/Client Component صحیح) پیروی کنید. کدهای جدید باید با زبان فارسی در
> بخش‌های مورد نیازِ UI سازگار باشند.

---

## نقشه راه

- [x] هستهٔ فروشگاه (محصول، دسته، سبد، تسویه)
- [x] دستیار هوشمند چندارائه‌دهنده‌ای با RAG
- [x] جادوگر اسمبل هوشمند (Auto-Resolver)
- [x] حساب کاربری و مقایسه محصولات
- [x] مجله و اخبار کوتاه
- [x] تم تاریک/روشن و PWA
- [ ] پنل ادمین
- [ ] تست‌های خودکار (Unit / E2E)
- [ ] بهینه‌سازی بیشتر باندل و Lighthouse

---

## مجوز

این پروژه با مجوز اختصاصی منتشر شده است. استفاده، کپی یا توزیع بدون مجوز کتبی
صاحبان پروژه (آفلند) مجاز نیست.

---

## منابع و لینک‌ها

- سایت: [offl.ir](https://www.offl.ir)
- مستندات Next.js: https://nextjs.org/docs
- HeroUI: https://www.heroui.com
- Zustand: https://github.com/pmndrs/zustand

---

<p align="center">
  ساخته شده با ❤️ برای تجربهٔ خرید هوشمند در آفلند — «سرزمینِ تخفیف»
</p>
