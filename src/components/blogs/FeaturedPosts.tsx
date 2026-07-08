'use client';

import { useEffect, useState } from 'react';
import { request } from '@/lib/client';
import Link from 'next/link';
import Image from '@/components/common/Image';

interface Post {
  id: number;
  title: string;
  slug: string;
  cover?: string;
  view_count?: number;
  created_at?: string;
  published_at?: string;
  category?: { name?: string };
}

export default function FeaturedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        const data = await request({
          url: '/mag/posts/top',
          method: 'GET',
        });
        setPosts(data?.slice(0, 5) || []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPosts();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-4 rounded-[1.8rem] border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70 p-4 shadow-xl">
        <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) return null;

  const mainPost = posts[0];
  const sidePosts = posts.slice(1, 5);

  return (
    <aside className="mag-featured-sidebar w-full overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white p-4 shadow-2xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/25">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <p className="text-[11px] font-black text-blue-600">EDITOR PICKS</p>
          <h2 className="text-[18px] font-black leading-relaxed text-slate-950 dark:text-white">مقالات ویژه</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>

      {mainPost && (
        <Link href={`/mag/${mainPost.slug}`} className="group relative mb-4 block min-h-[220px] overflow-hidden rounded-[1.4rem] bg-slate-950">
          <Image
            src={mainPost.cover || ''}
            alt={mainPost.title}
            className="absolute inset-0 h-full w-full"
            imgClass="!object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="360px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
          <div className="absolute bottom-0 right-0 z-10 p-4 text-white">
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold ring-1 ring-white/15 backdrop-blur-md">
              {mainPost.category?.name || 'ویژه'}
            </span>
            <h3 className="mt-3 line-clamp-2 text-[17px] font-black leading-relaxed">{mainPost.title}</h3>
          </div>
        </Link>
      )}

      <div className="space-y-3">
        {sidePosts.map((post, index) => (
          <Link
            key={post.id}
            href={`/mag/${post.slug}`}
            className="group grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/35 p-2.5 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-lg dark:hover:bg-slate-900"
          >
            <div className="relative overflow-hidden rounded-xl">
              <Image
                src={post.cover || ''}
                alt={post.title}
                className="h-[72px] w-[72px]"
                imgClass="!object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="72px"
              />
              <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[12px] font-black text-blue-600 shadow">
                {index + 1}
              </span>
            </div>
            <div className="flex min-w-0 flex-col justify-between py-1">
              <h4 className="line-clamp-2 text-right text-[13px] font-bold leading-relaxed text-slate-900 dark:text-slate-100 transition-colors group-hover:text-blue-600">
                {post.title}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                {post.view_count ? <span>{post.view_count.toLocaleString('fa-IR')} بازدید</span> : null}
                {(post.published_at || post.created_at) && (
                  <span>{new Date(post.published_at || post.created_at || '').toLocaleDateString('fa-IR')}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/mag"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-[13px] font-black text-white dark:bg-white dark:text-slate-950 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 dark:hover:bg-blue-100"
      >
        مشاهده همه مقالات
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </aside>
  );
}
