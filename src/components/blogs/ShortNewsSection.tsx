import React from 'react';
import ShortNewsCard from './ShortNewsCard';
import Link from '../Link';
import type { ShortNews } from '@/types/blogs/ShortNews';

interface ShortNewsSectionProps {
  shortNews: ShortNews[];
}

export default function ShortNewsSection({ shortNews }: ShortNewsSectionProps) {
  if (!shortNews || shortNews.length === 0) {
    return null;
  }

  const filteredNews = shortNews.filter((item) => item.status !== 'draft').slice(0, 4);

  if (filteredNews.length === 0) return null;

  return (
    <section className="short-news-stream rounded-[1.7rem] border border-slate-200 bg-white/70 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/35 dark:shadow-black/10 lg:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold tracking-wide text-slate-400 dark:text-slate-500">LIVE BRIEFING</p>
          <h2 className="text-[20px] font-black leading-relaxed text-slate-900 dark:text-white lg:text-[24px]">
            اخبار کوتاه
          </h2>
          <p className="max-w-2xl text-justify text-[13px] font-normal leading-relaxed text-slate-600 dark:text-slate-400">
            روایت‌های سریع و کم‌حجم از بازار تکنولوژی؛ بدون شلوغی، برای مرور آرام بین مقاله‌ها.
          </p>
        </div>
        <Link
          href="/short-news"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-bold text-slate-700 transition-all duration-300 hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:text-blue-300"
        >
          مشاهده همه اخبار
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredNews.map((item: ShortNews, index: number) => (
          <ShortNewsCard
            key={item.id || index}
            title={item.title}
            date={item.published_at || item.created_at || ''}
            slug={item.slug || `short-news-${item.id}`}
            category={item.category?.name}
            excerpt={item.short_content || item.content}
            isLast={index === filteredNews.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
