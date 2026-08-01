'use client';
import EmptyCategory from '@/components/category/EmptyCategory';
import Filters from '@/components/category/Filters';
import Sort from '@/components/category/Sort';
import BackPrevPage from '@/components/common/BackPrevPage';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import CardProduct from '@/components/common/CardProduct';
import Loading from '@/components/common/Loading';
import { FilterCategory, Product } from '@/types/Home';
import useGlobalStore from '@/store/global-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from './Image';
import Logo from '@/../public/images/no-image.png';
import { discountCalculation, addCommas } from '@/lib/fun';
import Banners from './Banners';
import CategoryDescription from './CategoryDescription';
import Slider from './Slider';
import Template1 from '../home/Template1';
import Pagination from '@/components/product/Pagination';

type Props = {
  id: string;
  resultProucts: FilterCategory;
  redirect?: string;
  searchParams: {
    attribiutes?: string;
    available?: string;
    discounted?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    search?: string;
    page?: string;
  };
};
const CategoryComponent = ({ resultProucts, searchParams, redirect, id }: Props) => {
  const router = useRouter();
  const { isPendingCategory } = useGlobalStore();
  useEffect(() => {
    if (redirect) return router.push(redirect);
  }, [redirect]);

  // ── Infinite scroll (batch = 600, matches server-side pre_page) ──
  const BATCH = 600;
  const totalCount = Number(resultProucts?.total) || 0;
  const [products, setProducts] = useState<Product[]>(resultProucts?.products ?? []);
  const [page, setPage] = useState(Number(searchParams?.page) || 1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hasMore, setHasMore] = useState(
    (resultProucts?.products?.length ?? 0) < (totalCount || 0)
  );
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Reset on category / filter / page change (server reloads new resultProucts).
  // `page` resumes from the URL so the infinite-scroll counter never duplicates
  // a batch that the server already rendered (e.g. after clicking the pager).
  const filterKey = JSON.stringify({ id, searchParams });
  useEffect(() => {
    setProducts(resultProucts?.products ?? []);
    setPage(Number(searchParams?.page) || 1);
    setLoadingMore(false);
    setLoadError(false);
    loadingRef.current = false;
    setHasMore((resultProucts?.products?.length ?? 0) < (totalCount || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || loadingMore || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);
    setLoadError(false);
    try {
      const q = new URLSearchParams();
      q.set('id', id);
      Object.entries(searchParams).forEach(([k, v]) => {
        if (v) q.set(k, String(v));
      });
      // برای fetch همیشه صفحهٔ بعدی (page+1)؛ اگر در URL page=2 باشد،
      // این خط عدد را بازنویسی می‌کند تا تکرار نشود.
      q.set('page', String(page + 1));
      const res = await fetch(`/api/category-products?${q.toString()}`);
      const json = await res.json();
      const next: Product[] = (json?.products ?? []) as Product[];
      if (next.length > 0) {
        // حذف کپی احتمالی (اگر بک‌اند دو بار همان دسته را برگرداند)
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const unique = next.filter((p) => !seen.has(p.id));
          return unique.length ? [...prev, ...unique] : prev;
        });
        setPage((p) => p + 1);
      }
      // پایان: اگر کل محصولاتِ شناخته‌شده را رسیدیم → تمام؛
      // وگرنه اگر بک‌اند کمتر از یک بچ کامل داد (آخرین صفحه) → تمام.
      const loadedSoFar = products.length + next.length;
      if (totalCount > 0) setHasMore(loadedSoFar < totalCount);
      else setHasMore(next.length >= BATCH);
    } catch {
      setLoadError(true);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [loadingMore, hasMore, page, id, searchParams, products.length, totalCount]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '800px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // وقتی واقعاً همهٔ محصولات لود شده باشد (نه فقط به‌خاطر خطا متوقف شده باشد)
  const allLoaded =
    !hasMore &&
    !loadError &&
    Number(products?.length) > 0 &&
    (totalCount === 0 || products.length >= totalCount);

  const banners = resultProucts?.banner?.images;

  const sliders = resultProucts?.slider?.images;
  // @ts-expect-error error
  const stories = resultProucts?.story;

  return (
    <div className="lg:pt-4">
      <BackPrevPage title={resultProucts?.name ?? 'محصولات'} />
      {/* @ts-expect-error error */}
      {Number(sliders?.length) >= 1 && <Slider sliders={sliders || []} />}

      {Number(banners?.length) >= 1 && (
        // @ts-expect-error error
        <Banners banners={banners} />
      )}
      <div className="category-dark-shell container_page mt-7">
        {Array.isArray(resultProucts?.seo?.breadcrumbs) && (
          <Breadcrumbs
            page="/product-category"
            breadcrumbs={resultProucts?.seo?.breadcrumbs?.map((item) => ({
              name: item.name,
              url: item.link || item.url || null,
            }))}
          />
        )}
        {/* title and stories */}
        <div className="mt-[24px] flex flex-col items-center gap-3 overflow-hidden lg:mt-10 lg:flex-row lg:gap-[24px]">
          <h1 className="w-full shrink-0 text-right font-medium text-[20px] text-[#232429] lg:w-[320px] lg:min-w-[320px] lg:text-[28px]">
            {resultProucts?.name}
          </h1>
          {/* تعداد کالا - فقط نمایشی، نه heading */}
          {Number(resultProucts?.total) > 0 && (
            <span className="hidden shrink-0 text-right text-[14px] font-normal text-[#616A76] lg:block">
              {addCommas(Number(resultProucts?.total))} کالا
            </span>
          )}
          <div className="flex min-w-0 w-full flex-1 items-center overflow-hidden">
            {stories ? <Template1 story={stories} /> : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start gap-3 lg:mt-10 lg:flex-row lg:gap-[24px]">
          <Filters
            // @ts-expect-error error
            resultFilter={{
              ...resultProucts,
              // @ts-expect-error error
              maxProductPrice: resultProucts?.max_price,
              // @ts-expect-error error
              minProductPrice: resultProucts?.min_price,
            }}
            searchParams={searchParams}
          />
          <div className="flex-1">
            <Sort options={resultProucts?.sortable} searchParams={searchParams} />

            <>
              {Number(products?.length) >= 1 ? (
                <div className="category-products-grid grid grid-cols-1 lg:mt-3 lg:grid-cols-4 lg:gap-4">
                  {products?.map((product, idx) => (
                    <React.Fragment key={product?.id ?? idx}>
                      {/* DESKTOP */}
                      <CardProduct
                        classImage="!w-[90px] !h-[90px] mx-auto lg:!h-[180px] lg:!w-[80%]"
                        className="relative hidden !h-[220px] overflow-hidden rounded-lg border lg:flex lg:!h-[350px]"
                        product={product}
                      />
                      {/* MOBILE */}
                      <Link
                        prefetch={false}
                        href={`/product/${product.id}`}
                        className="category-mobile-product-row flex w-full items-center gap-2 border-b border-gray-200 lg:hidden"
                      >
                        <div>
                          {Array.isArray(product.images) || product?.image?.link ? (
                            <Image
                              src={
                                Array.isArray(product.images)
                                  ? product?.images[0]?.content?.path
                                  : product?.image?.link
                              }
                              alt={
                                Array.isArray(product.images)
                                  ? // @ts-expect-error error
                                    product?.images[0]?.content?.title || product?.name || ''
                                  : // @ts-expect-error error
                                    product?.image?.title || product?.name || ''
                              }
                              className="product-image-pad !h-[140px] !w-[140px] p-2"
                              imgClass={`object-cover`}
                              sizes="140px"
                              quality={75}
                              showLoader={true}
                            />
                          ) : (
                            <span className="product-image-pad relative flex !h-[120px] !w-[100px] items-center justify-center overflow-hidden rounded-lg">
                              <img
                                className="mx-auto !h-[90px] !w-[90px] lg:!h-[150px] lg:!w-[80%]"
                                height={100}
                                width={100}
                                src={Logo.src}
                              />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="line-clamp-2 pt-3 font-light text-[14px] leading-6 text-black lg:text-[16px] lg:leading-6">
                            {product.name}
                          </p>
                          {product?.price === 0 ? (
                            <p className="mt-3 font-medium text-[14px] text-red-500">ناموجود</p>
                          ) : (
                            <>
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center justify-end gap-px lg:gap-1">
                                  <p className="font-bold text-[14px] text-black lg:text-[16px]">
                                    {addCommas(
                                      Number(
                                        product.special_price
                                          ? product.special_price
                                          : product.price
                                      )
                                    )}
                                  </p>
                                  <p className="font-medium text-[11px] text-black lg:text-[13px]">
                                    تومان
                                  </p>
                                </div>
                                {discountCalculation(
                                  Number(product.special_price),
                                  Number(product.price!)
                                ) ? (
                                  <div className="flex h-fit w-fit items-center rounded bg-[#ffab00] px-2 font-reqular text-[14px] text-white lg:text-[16px]">
                                    <span>
                                      {discountCalculation(
                                        Number(product.special_price),
                                        Number(product.price!)
                                      )}
                                    </span>
                                    <span>%</span>
                                  </div>
                                ) : null}
                              </div>
                              {product.special_price ? (
                                <p className="flex w-fit items-center justify-center rounded bg-[#F93838] px-2 py-px font-light text-[12px] text-white line-through lg:text-[14px]">
                                  {addCommas(Number(product.price))}
                                </p>
                              ) : null}
                            </>
                          )}
                        </div>
                      </Link>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <EmptyCategory />
              )}
            </>
            {isPendingCategory ? <Loading /> : null}

            {/* Infinite scroll: loads the next 600 on scroll, no page reload */}
            {loadingMore ? (
              <div className="mt-10 flex items-center justify-center gap-2 text-[13px] text-[var(--offl-text-muted)]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--offl-border)] border-t-[var(--offl-primary)]" />
                در حال بارگذاری محصولات بیشتر…
              </div>
            ) : null}
            {allLoaded ? (
              <p className="mt-10 text-center text-[13px] text-[var(--offl-text-muted)]">
                همهٔ {addCommas(totalCount || Number(products?.length))} محصول نمایش داده شد.
              </p>
            ) : loadError ? (
              <div className="mt-10 flex flex-col items-center justify-center gap-2 text-[13px] text-[var(--offl-text-muted)]">
                <span>بارگذاری محصولات بیشتر با خطا مواجه شد.</span>
                <button
                  type="button"
                  onClick={() => loadMore()}
                  className="rounded-lg border border-[var(--offl-border)] px-3 py-1.5 font-medium text-[var(--offl-text)] transition hover:bg-[var(--offl-surface-2)]"
                >
                  تلاش مجدد
                </button>
              </div>
            ) : null}

            {/* شمارهٔ صفحات (لیبل offset ۱۰-تایی قدیمی: ۱، ۱۱، ۲۱…) – اندازهٔ بچ همچنان ۶۰۰ */}
            {totalCount > 0 && Math.ceil(totalCount / BATCH) > 1 ? (
              <div className="mt-8">
                <Pagination
                  total={Math.ceil(totalCount / BATCH)}
                  perPage={10}
                  offsetLabels
                  top={220}
                  className="mt-2"
                />
              </div>
            ) : null}

            <div ref={sentinelRef} className="h-px w-full" aria-hidden />
          </div>
        </div>
      </div>
      {Array.isArray(resultProucts?.tags) &&
      resultProucts.tags.filter((tag) => tag.has_index === true).length > 0 ? (
        <div className="category-tags-section container_page mt-6 rounded-xl p-4 text-center lg:p-6">
          <h2 className="mb-3 border-b border-gray-200 pb-2 text-right font-bold text-xl text-gray-800">
            تگ‌های مرتبط با دسته‌بندی
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {resultProucts.tags
              .filter((tag) => tag.has_index === true)
              .map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug || tag.id}`}
                  className="rounded-full bg-blue-500 px-3 py-1 font-medium text-[12px] text-white transition hover:bg-blue-600 lg:text-[14px]"
                >
                  {tag.name}
                </Link>
              ))}
          </div>
        </div>
      ) : null}
      {resultProucts?.description && (
        <CategoryDescription description={resultProucts?.description} />
      )}
    </div>
  );
};

export default CategoryComponent;
