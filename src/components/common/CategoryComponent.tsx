'use client';
import EmptyCategory from '@/components/category/EmptyCategory';
import Filters from '@/components/category/Filters';
import Sort from '@/components/category/Sort';
import BackPrevPage from '@/components/common/BackPrevPage';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import CardProduct from '@/components/common/CardProduct';
import Loading from '@/components/common/Loading';
import Pagination from '@/components/product/Pagination';
import { FilterCategory } from '@/types/Home';
import useGlobalStore from '@/store/global-store';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from './Image';
import Logo from '@/../public/images/no-image.png';
import { discountCalculation, addCommas } from '@/lib/fun';
import Banners from './Banners';
import CategoryDescription from './CategoryDescription';
import Slider from './Slider';
import Template1 from '../home/Template1';

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
  };
};
const CategoryComponent = ({ resultProucts, searchParams, redirect }: Props) => {
  const router = useRouter();
  const { isPendingCategory } = useGlobalStore();
  useEffect(() => {
    if (redirect) return router.push(redirect);
  }, [redirect]);
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
        <div className="mt-[24px] flex flex-col items-center gap-3 lg:mt-10 lg:flex-row lg:gap-[24px]">
          <h1 className="w-full text-right font-medium text-[20px] text-[#232429] lg:w-[320px] lg:min-w-[320px] lg:text-[28px]">
            {resultProucts?.name}
          </h1>
          {/* تعداد کالا - فقط نمایشی، نه heading */}
          {Number(resultProucts?.total) > 0 && (
            <span className="hidden text-right text-[14px] font-normal text-[#616A76] lg:block lg:w-[320px] lg:min-w-[320px]">
              {addCommas(Number(resultProucts?.total))} کالا
            </span>
          )}
          <div className="flex w-full flex-1 items-center justify-center">
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
              {Number(resultProucts?.products?.length) >= 1 ? (
                <div className="category-products-grid grid grid-cols-1 lg:mt-3 lg:grid-cols-4 lg:gap-4">
                  {resultProucts?.products?.map((product, idx) => (
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
            {Number(resultProucts?.products?.length) >= 1 && (
              <Pagination
                total={Math.ceil(Number(resultProucts?.total) / 600)}
                perPage={600}
                offsetLabels
                className="mt-10"
              />
            )}
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
