'use client';

import React, { useEffect, useMemo, useState } from 'react';
import MagCategoriesInline from '@/components/blogs/MagCategoriesInline';
import Link from 'next/link';
import Image from 'next/image';
import SiteLogo from '@/../public/images/logo-white.png';
import HeaderTop from '../common/header/HeaderTop';
import HeaderThemeToggle from '@/components/common/theme/HeaderThemeToggle';
import { useGetShortNews } from '@/hooks/blogs/useGetShortNews';
import type { ShortNews } from '@/types/blogs/ShortNews';

export default function MagHeader() {
  const { data, isLoading } = useGetShortNews();
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  const shortNews = useMemo(() => ((data?.data ?? []) as ShortNews[]).slice(0, 6), [data?.data]);

  useEffect(() => {
    setCurrentNewsIndex(0);
  }, [shortNews.length]);

  useEffect(() => {
    if (shortNews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % shortNews.length);
    }, 4200);

    return () => clearInterval(interval);
  }, [shortNews.length]);

  const currentNews = shortNews[currentNewsIndex];

  return (
    <header
      className="mag-header-shell sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/92 text-white shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/86 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white"
      style={{ fontFamily: 'IRANYekanX, IranYekanX, iranyekan, Tahoma, sans-serif' }}
    >
      <HeaderTop />

      <div className="border-b border-white/10 bg-gradient-to-l from-blue-600 via-indigo-600 to-fuchsia-600 dark:border-slate-800 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
        <div className="container_page flex min-h-[42px] items-center gap-3 py-2">
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-[11px] font-bold shadow-inner ring-1 ring-white/15 md:text-[12px]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
            </span>
            اخبار فوری
          </div>

          <Link href="/short-news" className="group min-w-0 flex-1 overflow-hidden">
            {!isLoading && currentNews ? (
              <div key={currentNews.id} className="flex items-center gap-3 [animation:magTickerFade_.45s_ease_both]">
                <p className="min-w-0 truncate text-right text-[12px] font-medium leading-relaxed text-white md:text-[13px] lg:text-[14px]">
                  {currentNews.title}
                </p>
                <span className="hidden rounded-full bg-white/15 px-2 py-0.5 text-[10px] text-white/90 ring-1 ring-white/15 sm:inline-flex">
                  {currentNews.published_at || currentNews.created_at
                    ? new Date(currentNews.published_at || currentNews.created_at || '').toLocaleDateString('fa-IR')
                    : 'هم‌اکنون'}
                </span>
              </div>
            ) : (
              <p className="truncate text-[12px] text-white/85 md:text-[13px]">در حال دریافت تیترهای تازه آفلند...</p>
            )}
          </Link>

          {shortNews.length > 1 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {shortNews.slice(0, 4).map((item, index) => (
                <button
                  key={item.id || index}
                  type="button"
                  onClick={() => setCurrentNewsIndex(index)}
                  aria-label={`نمایش خبر ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentNewsIndex % 4 ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mag-header-mainbar bg-[linear-gradient(135deg,#061025_0%,#102863_54%,#111827_100%)] dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_55%,#020617_100%)]">
        <div className="container_page flex items-center justify-between gap-3 py-3 lg:gap-6 lg:py-3.5">
          <Link prefetch={false} href="/mag" className="group flex shrink-0 items-center gap-3">
            <span className="relative overflow-hidden rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/15 transition-all duration-300 group-hover:bg-white/15 group-hover:ring-white/30">
              <Image
                src={SiteLogo}
                alt="لوگوی مجله آفلند"
                width={178}
                height={52}
                priority
                className="h-[42px] w-auto md:h-[54px]"
              />
            </span>
            <span className="hidden flex-col leading-none xl:flex">
              <span className="text-[11px] font-medium text-blue-100">OFFLAND MAG</span>
              <span className="mt-1 text-[13px] font-bold text-white">تکنولوژی، گیمینگ، راهنمای خرید</span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="max-w-full rounded-2xl border border-white/10 bg-white/7 px-2 py-2 shadow-inner backdrop-blur-md">
              <MagCategoriesInline />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 p-1 shadow-2xl shadow-blue-950/20 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-950/35">
            <div className="hidden sm:block">
              <HeaderThemeToggle />
            </div>
            <Link
              prefetch={false}
              href="/"
              className="group inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-bold text-white/80 transition-all duration-300 hover:bg-white hover:text-blue-700 md:px-4 md:text-[13px]"
            >
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h8v-2h-8l1.1-2h5.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.3.12-.48 0-.55-.45-1-1-1h-14zm-1 16c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
              </svg>
              <span className="hidden sm:inline">فروشگاه آفلند</span>
              <span className="sm:hidden">فروشگاه</span>
            </Link>
            <Link
              prefetch={false}
              href="/mag"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[12px] font-black text-slate-950 shadow-lg shadow-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl md:px-4 md:text-[13px]"
            >
              <span className="h-2 w-2 rounded-full bg-gradient-to-l from-blue-500 to-fuchsia-500" />
              مجله آفلند
            </Link>
          </div>
        </div>

        <div className="container_page flex items-center justify-end pb-2 sm:hidden">
          <HeaderThemeToggle />
        </div>

        <div className="container_page pb-3 lg:hidden">
          <div className="rounded-2xl border border-white/10 bg-white/8 px-2 py-2 backdrop-blur-md">
            <MagCategoriesInline />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes magTickerFade {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </header>
  );
}
