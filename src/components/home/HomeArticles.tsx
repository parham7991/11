'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import Link from 'next/link';
import { request } from '@/lib/client';
import Article from '../blogs/Article';
import SkeletonArticleCard from '../blogs/SkeletonArticleCard';

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  cover?: string;
  short_content?: string;
  created_at?: string;
  published_at?: string;
  category?: {
    id: number;
    name: string;
  };
};

type PostsResponse = {
  posts?: {
    data?: BlogPost[];
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
  };
  data?: BlogPost[];
  original?: {
    data?: BlogPost[];
    current_page?: number;
    last_page?: number;
    total?: number;
  };
  current_page?: number;
  last_page?: number;
  total?: number;
};

export default function HomeArticles() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasRequested, setHasRequested] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const postsLength = useMemo(() => posts?.length ?? 0, [posts?.length]);

  const [sliderRef, instanceRef] = useKeenSlider({
    rtl: true,
    loop: false,
    slides: {
      perView: 1.2,
      spacing: 16,
    },
    breakpoints: {
      '(min-width: 768px)': {
        slides: {
          perView: 2,
          spacing: 20,
        },
      },
      '(min-width: 1024px)': {
        slides: {
          perView: 4.5,
          spacing: 24,
        },
      },
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  const handlePrevSlide = useCallback(() => {
    instanceRef.current?.prev();
  }, [instanceRef]);

  const handleNextSlide = useCallback(() => {
    instanceRef.current?.next();
  }, [instanceRef]);

  const parsePaginated = (res: PostsResponse) => {
    console.log('🔍 parsePaginated - Input:', res);

    // بررسی ساختار جدید: res.posts.data
    if (res?.posts?.data && Array.isArray(res.posts.data)) {
      console.log('🔍 parsePaginated - Using posts structure');
      const dataArray = res.posts.data;
      const perPage = Number((res.posts as any)?.per_page ?? 10);
      const total = Number(res.posts?.total ?? dataArray.length);
      const currentPage = Number(res.posts?.current_page ?? 1);

      // محاسبه last_page در صورت عدم وجود
      const lastPage = res.posts?.last_page
        ? Number(res.posts.last_page)
        : Math.max(1, Math.ceil(total / perPage));

      const meta = {
        current_page: currentPage,
        last_page: lastPage,
        total: total,
      };
      console.log('🔍 parsePaginated - Data Array:', dataArray);
      console.log('🔍 parsePaginated - Meta:', meta);
      return { dataArray, meta };
    }

    // بررسی ساختار قدیمی
    const original = res?.original ?? res;
    console.log('🔍 parsePaginated - Original:', original);
    const dataArray = Array.isArray(original?.data) ? original.data : Array.isArray(res) ? res : [];
    console.log('🔍 parsePaginated - Data Array:', dataArray);
    const meta = {
      current_page: Number(original?.current_page ?? 1),
      last_page: Number(original?.last_page ?? 1),
      total: Number(original?.total ?? dataArray.length),
    };
    console.log('🔍 parsePaginated - Meta:', meta);
    return { dataArray, meta };
  };

  const fetchPosts = async (page: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const requestUrl = `/mag/posts/with-category?category_name=دیجیتال&page=${page}&per_page=10`;
      console.log('📡 Request URL:', requestUrl);
      console.log('📄 Request Page:', page);

      const res = (await request({
        url: requestUrl,
        method: 'GET',
        cache: 'no-store',
      })) as PostsResponse;

      const { dataArray, meta } = parsePaginated(res);

      if (page === 1) {
        setPosts(dataArray);
      } else {
        setPosts((prev) => [...prev, ...dataArray]);
      }

      setCurrentPage(meta.current_page);

      // اگر صفحه فعلی برابر آخرین صفحه باشد، دیگر مقاله‌ای وجود ندارد
      if (meta.current_page >= meta.last_page) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // بعد از لود شدن مقالات، اسلایدر را update کن
      setTimeout(() => {
        instanceRef.current?.update();
      }, 100);
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      console.error('❌ Error Details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error,
      });
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // IntersectionObserver برای trigger کردن اولین درخواست
  useEffect(() => {
    if (!loadMoreRef.current || hasRequested) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingRef.current) {
          setHasRequested(true);
          fetchPosts(1);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver برای لود کردن صفحات بعدی وقتی به آخر اسلایدر می‌رسیم
  useEffect(() => {
    if (!loadMoreRef.current || !hasRequested || !hasMore || loadingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingRef.current && hasMore) {
          fetchPosts(currentPage + 1);
        }
      },
      { root: null, rootMargin: '300px', threshold: 0 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRequested, currentPage, hasMore, postsLength]);

  if (!hasRequested) {
    return <div ref={loadMoreRef} className="h-20" />;
  }

  if (posts.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="container_page relative flex flex-col overflow-visible">
      {/* Header */}
      <div className="home-articles-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg lg:h-12 lg:w-12">
            <svg
              className="h-5 w-5 text-white lg:h-6 lg:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="font-bold text-[20px] text-gray-900 lg:text-[24px]">مقالات</h2>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          {loaded && instanceRef.current && posts.length > 3 && (
            <>
              <button
                onClick={handleNextSlide}
                disabled={
                  instanceRef.current &&
                  currentSlide >= instanceRef.current.track.details.slides.length - 1
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700 lg:h-12 lg:w-12"
                aria-label="مقاله بعدی"
              >
                <svg
                  className="h-5 w-5 lg:h-6 lg:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700 lg:h-12 lg:w-12"
                aria-label="مقاله قبلی"
              >
                <svg
                  className="h-5 w-5 lg:h-6 lg:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* مشاهده همه Button */}
          {posts.length > 0 && (
            <Link
              href="/mag"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 font-medium text-[14px] text-gray-700 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 lg:px-5 lg:py-2.5 lg:text-[15px]"
            >
              <span>مشاهده همه</span>
              <svg
                className="h-4 w-4 lg:h-5 lg:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Loading Skeleton - قبل از لود شدن مقالات */}
      {loading && posts.length === 0 && (
        <div className="keen-slider !py-2">
          {new Array(10).fill(10).map((_, idx) => (
            <div key={idx} className="keen-slider__slide">
              <SkeletonArticleCard />
            </div>
          ))}
        </div>
      )}

      {/* Articles Slider */}
      {posts.length > 0 && (
        <div className="mt-3 lg:mt-5">
          <div ref={sliderRef} dir="rtl" className="keen-slider !py-2 lg:!py-10">
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  .keen-slider__slide {
                    overflow: visible !important;
                  }
                `,
              }}
            />
            {posts.map((post) => (
              <div
                key={post.id}
                className={`keen-slider__slide flex ${!loaded ? 'mx-2 min-w-[280px]' : ''}`}
              >
                <Article
                  cardarticle={{
                    id: post.id,
                    slug: post.slug,
                    img: post.cover || '',
                    title: post.title,
                    type: post.category?.name || 'مقاله',
                    date: post.created_at || post.published_at || '',
                    short_des: post.short_content,
                  }}
                  className="flex h-full w-full flex-col gap-3 rounded-xl border-2 border-gray-100 bg-white p-4 shadow-md transition-all duration-500 hover:border-blue-200 lg:gap-4 lg:p-2"
                  classNameImg="w-full h-[180px] lg:h-[220px] !overflow-hidden object-cover !rounded-xl shadow-md flex-shrink-0"
                  classNametype="bg-gradient-to-r from-blue-600 to-purple-600 text-white lg:text-[12px] text-[11px] font-medium lg:px-3 px-2.5 py-1.5 !rounded-lg shadow-md"
                  classNamedate="text-gray-500 font-reqular text-[12px] lg:text-[13px]"
                  classNametitle="text-gray-900 font-bold lg:text-[15px] text-[14px] text-justify leading-snug"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
