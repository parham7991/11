import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'اپلیکیشن PWA آفلند | نصب فروشگاه و اسمبل هوشمند',
  description:
    'راهنمای نصب نسخه PWA آفلند برای دسترسی سریع به فروشگاه، اسمبل آنلاین هوشمند، سبد خرید، جستجو و مجله.',
};

const features = [
  ['نصب مثل اپ', 'آفلند را روی موبایل و دسکتاپ مثل اپلیکیشن اجرا کن؛ بدون نیاز به مارکت.'],
  ['اسمبل سریع', 'میانبر مستقیم به اسمبل آنلاین هوشمند با بررسی بودجه، موجودی و سازگاری قطعات.'],
  [
    'کش هوشمند',
    'صفحات و تصاویر عمومی با استراتژی امن کش می‌شوند، اما سبد خرید و اطلاعات کاربر همیشه تازه می‌ماند.',
  ],
  ['حالت آفلاین', 'اگر اینترنت قطع شد، صفحه آفلاین شیک با مسیرهای اصلی نمایش داده می‌شود.'],
  [
    'به‌روزرسانی نرم',
    'وقتی نسخه جدید آماده باشد، کاربر پیام به‌روزرسانی می‌بیند و با یک کلیک نسخه تازه را می‌گیرد.',
  ],
  [
    'سازگار با iOS/Android',
    'آیکون‌ها، maskable icons، Apple Web App و splash screenهای اصلی تنظیم شده‌اند.',
  ],
];

export default function PWAPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fc] px-4 py-10 text-[#172033]">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(20,35,80,.10)]">
        <div className="bg-gradient-to-br from-[#386bf9] via-[#6f3cf5] to-[#ec4899] px-6 py-12 text-white md:px-12">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none">
              <rect
                x="7"
                y="7"
                width="10"
                height="10"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <rect
                x="10"
                y="10"
                width="4"
                height="4"
                rx=".5"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M9 4v3M12 4v3M15 4v3M9 17v3M12 17v3M15 17v3M4 9h3M4 12h3M4 15h3M17 9h3M17 12h3M17 15h3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="mb-4 font-black text-3xl md:text-5xl">نسخه PWA آفلند</h1>
          <p className="max-w-3xl text-sm leading-8 text-white/90 md:text-base">
            فروشگاه، اسمبل آنلاین هوشمند، سبد خرید، جستجو، مجله و صفحات اصلی آفلند حالا با تجربه
            نصب‌شونده، سریع و اپ‌مانند آماده‌اند.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/assemble-online"
              className="rounded-2xl bg-white px-5 py-3 font-bold text-sm text-[#386bf9]"
            >
              شروع اسمبل هوشمند
            </Link>
            <Link
              href="/"
              className="rounded-2xl bg-white/15 px-5 py-3 font-bold text-sm text-white ring-1 ring-white/25"
            >
              رفتن به فروشگاه
            </Link>
          </div>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2 md:p-10 lg:grid-cols-3">
          {features.map(([title, desc]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="mb-2 font-black text-base text-slate-900">{title}</h2>
              <p className="text-sm leading-7 text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
        <div className="border-t border-slate-200 bg-white p-6 md:p-10">
          <h2 className="mb-3 font-black text-xl">راهنمای نصب</h2>
          <ol className="list-inside list-decimal space-y-2 text-sm leading-7 text-slate-700">
            <li>در Chrome/Edge دکمه نصب داخل سایت یا آیکون نصب کنار آدرس مرورگر را بزن.</li>
            <li>در iPhone Safari، گزینه Share سپس Add to Home Screen را انتخاب کن.</li>
            <li>بعد از نصب، اپ آفلند با آیکون اختصاصی از صفحه اصلی موبایل یا دسکتاپ باز می‌شود.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
