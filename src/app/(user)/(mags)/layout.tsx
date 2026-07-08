import React from 'react';
import MagHeader from '@/components/blogs/MagHeader';
import MagFooter from '@/components/common/footer/MagFooter';
import Link from 'next/link';

export default function MagsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MagHeader />
      <div className="min-h-screen bg-[#f6f8fc] pb-20 dark:bg-slate-950 lg:pb-0">{children}</div>
      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-white/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 px-3 py-2 shadow-2xl shadow-slate-900/18 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-4 gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
          <Link href="/mag" className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
            </svg>
            مجله
          </Link>
          <Link href="/short-news" className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            اخبار
          </Link>
          <Link href="/result" className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
            </svg>
            جستجو
          </Link>
          <Link href="/" className="flex flex-col items-center gap-1 rounded-2xl bg-slate-950 px-2 py-2 text-white dark:bg-white dark:text-slate-950 shadow-lg transition-colors hover:bg-blue-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18l-2 13H6L3 3zm5 18a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            فروشگاه
          </Link>
        </div>
      </nav>
      <MagFooter />
    </>
  );
}
