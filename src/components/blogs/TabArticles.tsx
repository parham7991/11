'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Pagination from '../product/Pagination';
import { request } from '@/lib/client';
import Article from './Article';
import SkeletonArticleCard from './SkeletonArticleCard';
import ShortNews from './ShortNews';
import { AWS_BUCKET, BASE_URL_IMAGE } from '@/lib/variable';
import { convertDatePer } from '@/lib/convert';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type CategoryItem = {
  id: number | string;
  name: string;
};

export default function TabArticles() {
  const [select, setSelect] = useState<number>(0);
  const [categories, setCategories] = useState<CategoryItem[] | null>(null);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastFetchRef = useRef<string>(''); // برای track کردن آخرین fetch
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);

  const tabs = useMemo(() => {
    const names = categories?.map((c) => c.name) ?? [];
    return ['همه مقالات', ...names];
  }, [categories]);

  const parsePaginated = (res: any) => {
    const original = res?.original ?? res;
    const dataArray = Array.isArray(original?.data) ? original.data : Array.isArray(res) ? res : [];
    const meta = {
      current_page: Number(original?.current_page ?? original?.meta?.current_page ?? 1),
      last_page: Number(original?.last_page ?? original?.meta?.last_page ?? 1),
      total: Number(original?.total ?? original?.meta?.total ?? dataArray.length),
      per_page: Number(original?.per_page ?? original?.meta?.per_page ?? dataArray.length),
    };
    return { dataArray, meta };
  };

  const fetchPosts = useCallback(async (categoryId?: number | string, page?: number) => {
    const qp = new URLSearchParams();
    qp.set('short_news', '0');
    qp.set('per_page', '16');
    if (categoryId) qp.set('category_id', String(categoryId));
    if (page) qp.set('page', String(page));
    const url = `/mag/posts?${qp.toString()}`;

    const res = await request({ url, method: 'GET', cache: 'no-store' });
    const { dataArray, meta } = parsePaginated(res);
    setPosts(dataArray);
    setCurrentPage(meta.current_page);
    setLastPage(meta.last_page);
  }, []);

  const load = useCallback(async () => {
    if (hasRequested) return;
    setHasRequested(true);
    setLoading(true);
    try {
      const pageFromUrl = Number(searchParams.get('page') || 1);
      const [cats, initialPosts] = await Promise.all([
        request({ url: '/mag/categories', method: 'GET', cache: 'no-store' }),
        request({
          url: `/mag/posts?short_news=0&page=${pageFromUrl}&per_page=16`,
          method: 'GET',
          cache: 'no-store',
        }),
      ]);
      setCategories(cats || []);
      const { dataArray, meta } = parsePaginated(initialPosts);
      setPosts(dataArray);
      setCurrentPage(meta.current_page);
      setLastPage(meta.last_page);

      // ست کردن lastFetchRef برای جلوگیری از fetch مجدد
      lastFetchRef.current = `all-${pageFromUrl}`;
    } catch (e) {
      setCategories([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;
    const el = rootRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          load();
          observer.disconnect();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [load]);

  const onSelectTab = async (idx: number) => {
    setSelect(idx);
    const targetPage = 1;
    const url = new URL(window.location.href);
    const sp = new URLSearchParams(url.search);
    sp.set('page', String(targetPage));
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    // fetchPosts توسط useEffect زیر صدا زده می‌شود، نیازی به صدا زدن مجدد نیست
  };

  useEffect(() => {
    if (!hasRequested || !categories) return;

    const pageFromUrl = Number(searchParams.get('page') || 1);
    const categoryId = select === 0 ? undefined : categories?.[select - 1]?.id;

    // ساخت یک key یکتا برای این fetch
    const fetchKey = `${categoryId || 'all'}-${pageFromUrl}`;

    // اگر این fetch قبلاً انجام شده، skip کن
    if (lastFetchRef.current === fetchKey) {
      return;
    }

    lastFetchRef.current = fetchKey;

    // جلوگیری از fetch مکرر
    let isMounted = true;

    setLoading(true);
    fetchPosts(categoryId as any, pageFromUrl).finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, select]);

  return (
    <div ref={rootRef} className="flex flex-col gap-8">
      {/* Enhanced Tabs */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
        <div className="flex w-full gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((item, index) => {
            return (
              <button
                key={index}
                onClick={() => onSelectTab(index)}
                className={`relative cursor-pointer whitespace-nowrap rounded-lg px-5 py-3 font-medium text-[14px] transition-all duration-300 lg:text-[15px] ${
                  select === index
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item}
                {select === index && (
                  <div className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-white"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? // Show skeleton loading
            Array.from({ length: 8 }).map((_, index) => <SkeletonArticleCard key={index} />)
          : // Show actual articles
            Array.isArray(posts) && posts.length > 0
            ? posts.map((item: any, index: number) => (
                <Article
                  key={index}
                  cardarticle={{
                    slug: item.slug,
                    id: item.id,
                    img: `${item.cover}` || '',
                    title: item.title,
                    type: item.category?.name || 'مقاله',
                    date: item.published_at || item.created_at || '',
                    short_des: item.short_content,
                  }}
                  className="flex flex-col gap-3 rounded-xl border-2 border-gray-100 bg-white p-3 shadow-md transition-all duration-500 hover:border-blue-200 lg:gap-4 lg:p-4"
                  classNameImg="w-full h-[160px] lg:h-[180px] !overflow-hidden object-cover !rounded-xl shadow-md"
                  classNametype="bg-gradient-to-r from-blue-600 to-purple-600 text-white lg:text-[12px] text-[11px] font-medium lg:px-3 px-2.5 py-1.5 !rounded-lg shadow-md"
                  classNamedate="text-gray-500 font-reqular text-[12px] lg:text-[13px]"
                  classNametitle="text-gray-900 font-bold lg:text-[15px] text-[14px] text-justify leading-snug"
                />
              ))
            : null}
      </div>

      {/* Empty State */}
      {Array.isArray(posts) && posts.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">
          <svg
            className="mb-4 h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="font-medium text-[16px] text-gray-600">مقاله‌ای یافت نشد</p>
          <p className="mt-2 font-reqular text-[14px] text-gray-500">
            در این دسته‌بندی مقاله‌ای وجود ندارد
          </p>
        </div>
      )}

      <Pagination total={lastPage} />
    </div>
  );
}
