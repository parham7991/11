import React from 'react';
import Image from '@/components/common/Image';
import Link from '../Link';
import TabArticles from './TabArticles';
import ShortNewsSection from './ShortNewsSection';
import Advertising from './Advertising';
import type { BlogPost } from './Blogs';
import type { ShortNews } from '@/types/blogs/ShortNews';
import { sortPostsByDateDesc } from '@/lib/sort-posts';

type Props = {
  top_posts: BlogPost[];
  shortNews?: ShortNews[];
};

const getPostDate = (post: BlogPost) => post.published_at || post.created_at || post.updated_at || '';
const stripHtml = (value?: string) => value?.replace(/<[^>]+>/g, '').trim() || '';

function FeaturedBentoCard({ post }: { post: BlogPost }) {
  const date = getPostDate(post);

  return (
    <Link
      href={`/mag/${post.slug}`}
      className="mag-bento-featured mag-banner-card group relative block overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950 shadow-2xl shadow-black/25 transition-all duration-500 hover:-translate-y-1 hover:border-blue-300/40 hover:shadow-blue-950/35"
    >
      <Image
        src={post.cover || ''}
        alt={post.title}
        className="absolute inset-0 z-0 h-full w-full"
        imgClass="!object-cover !opacity-100 !blur-0 transition-transform duration-[1400ms] ease-out group-hover:scale-105"
        sizes="(min-width: 1024px) 58vw, 100vw"
        priority
        showLoader={false}
      />

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.20)_36%,rgba(2,6,23,0.78)_78%,rgba(2,6,23,0.98)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_80%_18%,rgba(56,107,249,0.28),transparent_32%),radial-gradient(circle_at_12%_10%,rgba(168,85,247,0.20),transparent_28%)] opacity-90" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-3 sm:inset-x-5 sm:top-5">
        {post.category?.name && (
          <span className="rounded-full bg-white/92 px-4 py-2 text-[11px] font-black text-slate-950 shadow-xl backdrop-blur-md">
            {post.category.name}
          </span>
        )}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/14 px-4 py-2 text-[11px] font-black text-white shadow-xl backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(147,197,253,0.85)]" />
          مقاله منتخب
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-5 text-white sm:p-7 lg:p-8">
        <div className="max-w-3xl">
          <p className="mb-2 text-[11px] font-black tracking-[0.16em] text-blue-200 drop-shadow">OFFLAND FEATURED</p>
          <h1 className="text-right text-[30px] font-black leading-relaxed text-white drop-shadow-2xl sm:text-[40px] lg:text-[48px]">
            {post.title}
          </h1>
          {post.short_content && (
            <p className="mt-3 line-clamp-2 max-w-2xl text-justify text-[13px] leading-loose text-white/82 drop-shadow lg:text-[14px]">
              {stripHtml(post.short_content)}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-white/72">
              {date && <span>{new Date(date).toLocaleDateString('fa-IR')}</span>}
              {post.view_count ? <span>{post.view_count.toLocaleString('fa-IR')} بازدید</span> : null}
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] font-black text-slate-950 shadow-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-blue-50">
              ادامه مطلب
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CompactBentoCard({ post, index }: { post: BlogPost; index: number }) {
  const date = getPostDate(post);

  return (
    <Link
      href={`/mag/${post.slug}`}
      className="mag-bento-compact mag-banner-card group relative block overflow-hidden rounded-[1.55rem] border border-white/10 bg-slate-950 shadow-xl shadow-black/20 transition-all duration-500 hover:-translate-y-1 hover:border-blue-300/40 hover:shadow-2xl hover:shadow-blue-950/30"
    >
      <Image
        src={post.cover || ''}
        alt={post.title}
        className="absolute inset-0 z-0 h-full w-full"
        imgClass="!object-cover !opacity-100 !blur-0 transition-transform duration-1000 group-hover:scale-105"
        sizes="(min-width: 1024px) 24vw, 100vw"
        showLoader={false}
      />

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-slate-950/94 via-slate-950/38 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(56,107,249,0.18),transparent_32%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/16 bg-white/16 text-[16px] font-black text-white shadow-lg backdrop-blur-md">
        {(index + 2).toLocaleString('fa-IR')}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 text-white lg:p-5">
        <span className="mb-3 inline-flex w-fit rounded-full border border-white/14 bg-white/13 px-3 py-1 text-[10px] font-bold text-white/88 backdrop-blur-md">
          {post.category?.name || 'مقاله'}
        </span>
        <h3 className="line-clamp-2 text-right text-[17px] font-black leading-relaxed text-white drop-shadow-lg lg:text-[18px]">
          {post.title}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-bold text-white/70">
          {date && <span>{new Date(date).toLocaleDateString('fa-IR')}</span>}
          <span className="inline-flex items-center gap-1 text-white transition-transform duration-300 group-hover:-translate-x-1">
            بخوانید
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HottestArticles({ top_posts, shortNews }: Props) {
  const sortedPosts = sortPostsByDateDesc(top_posts || []);
  const featured = sortedPosts[0];
  const sidePosts = sortedPosts.slice(1, 5);

  return (
    <div className="mag-hottest-section flex flex-col gap-8 py-8 lg:gap-12 lg:py-12">
      {featured && (
        <section className="mag-bento-board relative rounded-[2.25rem] border border-slate-200/10 bg-[radial-gradient(circle_at_12%_0%,rgba(56,107,249,0.12),transparent_24rem),linear-gradient(135deg,rgba(15,23,42,0.55),rgba(2,6,23,0.18))] shadow-2xl shadow-black/20">
          <FeaturedBentoCard post={featured} />
          <div className="mag-bento-side-grid">
            {sidePosts.map((post, index) => (
              <CompactBentoCard key={post.id || post.slug || index} post={post} index={index} />
            ))}
          </div>
        </section>
      )}

      <Advertising />

      {shortNews && shortNews.length > 0 && <ShortNewsSection shortNews={shortNews} />}

      <TabArticles />
    </div>
  );
}
