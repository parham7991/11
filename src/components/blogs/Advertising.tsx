import React from 'react';
import Link from '../Link';

type AdvertisingProps = {
  variant?: 'full' | 'compact';
};

const storeItems = [
  { title: 'کیس‌های گیمینگ اوست', href: '/result?search=case', badge: 'Airflow / RGB' },
  { title: 'مادربردهای حرفه‌ای', href: '/result?search=motherboard', badge: 'DDR5 Ready' },
  { title: 'پیشنهادهای ویژه آفلند', href: '/result?sort=discount', badge: 'Hot Deals' },
];

export default function Advertising({ variant = 'full' }: AdvertisingProps) {
  const isCompact = variant === 'compact';

  return (
    <section className={`grid grid-cols-1 gap-4 ${isCompact ? '' : 'lg:grid-cols-[1.05fr_.95fr]'}`}>
      <Link
        href="/assemble-online"
        className="group relative overflow-hidden rounded-[2rem] border border-purple-500/40 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 p-5 text-white shadow-xl shadow-purple-500/20 transition-all duration-500 hover:-translate-y-1 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/30 lg:p-6"
      >
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-500/30 blur-3xl transition-transform duration-700 group-hover:scale-125" />
        <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:30px_30px]" />
        <div className="relative flex flex-col gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-300/25 bg-white/10 shadow-inner backdrop-blur-md">
            <svg className="h-7 w-7 text-purple-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6m-8 4h10M7 17h10M9 21h6M5 9v6m14-6v6M8 7h8v10H8V7z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 11h4M10 14h2" />
            </svg>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-black text-purple-200">AI PC BUILDER</p>
            <h2 className="text-[20px] font-black leading-relaxed lg:text-[26px]">
              سیستم رویایی‌ت رو با هوش مصنوعی آفلند اسمبل کن!
            </h2>
            <p className="mt-2 text-justify text-[13px] leading-relaxed text-white/72">
              بودجه و کاربردت را بده؛ اسمبل هوشمند آفلند قطعات سازگار و بهینه را پیشنهاد می‌کند.
            </p>
          </div>
          <span className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] font-black text-slate-950 shadow-xl transition-all duration-300 group-hover:bg-purple-50">
            شروع اسمبل هوشمند
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        </div>
      </Link>

      <div className={`grid grid-cols-1 gap-3 ${isCompact ? '' : 'sm:grid-cols-3 lg:grid-cols-1'}`}>
        {storeItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-[1.4rem] border border-slate-200 bg-white p-4 text-slate-950 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:shadow-black/15 dark:hover:border-blue-500/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{item.badge}</p>
                <h3 className="mt-1 line-clamp-2 text-[14px] font-black leading-relaxed text-slate-950 dark:text-white">
                  {item.title}
                </h3>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-300">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18l-2 13H6L3 3zm5 18a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
