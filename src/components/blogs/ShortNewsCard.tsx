'use client';

import Link from '../Link';
import { replaceEmbeddedObjects } from '@/seo/common';

export interface ShortNewsCardProps {
  title: string;
  date: string;
  slug: string;
  category?: string | null;
  excerpt?: string | null;
  isLast?: boolean;
}

export default function ShortNewsCard({
  title,
  date,
  slug,
  category,
  excerpt,
  isLast = false,
}: ShortNewsCardProps) {
  return (
    <article className="short-news-card group relative grid grid-cols-[26px_minmax(0,1fr)] gap-3">
      <div className="relative flex justify-center">
        <span className="relative z-10 mt-2 flex h-3 w-3 items-center justify-center rounded-full bg-white ring-4 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
        </span>
        {!isLast && <span className="absolute bottom-[-1rem] top-6 w-px border-r border-slate-200 dark:border-slate-800" />}
      </div>

      <Link
        href={`/short-news?id=${slug}`}
        className="block rounded-2xl border border-slate-200/80 bg-white/70 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:shadow-black/20"
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {category || 'خبر کوتاه'}
            </span>
            {date && (
              <time className="text-[11px] font-normal text-slate-400 dark:text-slate-500" dateTime={date}>
                {new Date(date).toLocaleDateString('fa-IR')}
              </time>
            )}
          </div>

          <h4 className="line-clamp-2 text-right text-[14px] font-bold leading-relaxed text-slate-800 transition-colors duration-300 group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-300 lg:text-[15px]">
            {title}
          </h4>

          {excerpt && (
            <div
              dangerouslySetInnerHTML={{ __html: replaceEmbeddedObjects(excerpt) }}
              className="line-clamp-2 text-justify text-[12px] font-normal leading-relaxed text-slate-600 dark:text-slate-400 [&_*]:!m-0 [&_*]:!inline [&_*]:!text-[12px] [&_*]:!font-normal [&_*]:!leading-relaxed [&_a]:relative [&_a]:z-10 [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-300"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'A' || target.closest('a')) {
                  e.stopPropagation();
                }
              }}
            />
          )}
        </div>
      </Link>
    </article>
  );
}
