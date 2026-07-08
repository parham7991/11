'use client';
import { memo, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Product } from '@/types/Home';
import LazyCardProduct from './LazyCardProduct';
import Link from 'next/link';
import { HiSparkles, HiLightningBolt } from 'react-icons/hi';
import { RiStarSFill } from 'react-icons/ri';

interface Props {
  title?: string;
  className?: string;
  products?: Product[];
  vitrinId?: number;
}

const FeaturedCarousel = memo(({ title, className, products, vitrinId }: Props) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const productsLength = useMemo(() => products?.length ?? 0, [products?.length]);

  if (!products || productsLength <= 6) return null;

  return (
    <div
      className={`featured-product-showcase relative mx-auto mb-8 w-[99%] overflow-hidden rounded-xl border border-blue-500 bg-gradient-to-br from-blue-100 via-blue-50 to-purple-50 lg:mb-12 ${className ?? ''}`}
    >
      {/* آیکن‌های دکوری پراکنده */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{ opacity: 0.07 }}>
        {/* ردیف بالا - راست */}
        <RiStarSFill
          style={{ position: 'absolute', right: '5%', top: '10px' }}
          className="lg:h-18 lg:w-18 h-14 w-14 text-yellow-500"
        />
        <HiSparkles
          style={{ position: 'absolute', right: '15%', top: '25px' }}
          className="hidden h-10 w-10 text-blue-500 lg:block lg:h-14 lg:w-14"
        />
        <HiLightningBolt
          style={{ position: 'absolute', right: '30%', top: '15px' }}
          className="hidden h-12 w-12 text-purple-500 lg:block lg:h-16 lg:w-16"
        />

        {/* ردیف بالا - چپ */}
        <HiSparkles
          style={{ position: 'absolute', left: '5%', top: '20px' }}
          className="lg:h-15 lg:w-15 h-11 w-11 text-pink-400"
        />
        <RiStarSFill
          style={{ position: 'absolute', left: '18%', top: '8px' }}
          className="hidden h-10 w-10 text-blue-400 lg:block lg:h-14 lg:w-14"
        />
        <HiLightningBolt
          style={{ position: 'absolute', left: '35%', top: '18px' }}
          className="lg:h-13 lg:w-13 hidden h-9 w-9 text-yellow-400 lg:block"
        />

        {/* ردیف پایین - راست */}
        <HiLightningBolt
          style={{ position: 'absolute', right: '8%', bottom: '20px' }}
          className="h-13 w-13 lg:h-17 lg:w-17 text-yellow-500"
        />
        <RiStarSFill
          style={{ position: 'absolute', right: '22%', bottom: '12px' }}
          className="lg:h-15 lg:w-15 hidden h-11 w-11 text-purple-400 lg:block"
        />
        <HiSparkles
          style={{ position: 'absolute', right: '38%', bottom: '25px' }}
          className="lg:h-13 lg:w-13 hidden h-9 w-9 text-blue-500 lg:block"
        />

        {/* ردیف پایین - چپ */}
        <RiStarSFill
          style={{ position: 'absolute', left: '6%', bottom: '15px' }}
          className="h-12 w-12 text-blue-500 lg:h-16 lg:w-16"
        />
        <HiSparkles
          style={{ position: 'absolute', left: '20%', bottom: '22px' }}
          className="hidden h-10 w-10 text-pink-500 lg:block lg:h-14 lg:w-14"
        />
        <HiLightningBolt
          style={{ position: 'absolute', left: '36%', bottom: '10px' }}
          className="lg:h-15 lg:w-15 hidden h-11 w-11 text-purple-500 lg:block"
        />
      </div>

      <div className="container_page relative py-8 lg:py-12">
        {/* Header */}
        {title && (
          <div className="mb-2 flex items-center justify-between lg:mb-8">
            {/* Title با آیکن‌ها - سمت راست */}
            <div className="flex items-center gap-2.5 lg:gap-3.5">
              {/* Large star - left */}

              {/* Lightning bolt */}
              <HiLightningBolt className="hidden h-7 w-7 text-yellow-500 lg:block lg:h-9 lg:w-9" />

              {/* Title */}
              <h2 className="font-bold text-[18px] text-gray-900 lg:text-[28px]">{title}</h2>

              {/* Sparkles */}
              <HiSparkles className="hidden h-6 w-6 text-blue-600 lg:block lg:h-8 lg:w-8" />

              {/* Large star - right */}
            </div>

            {/* View All Link - سمت چپ */}
            <Link
              prefetch={false}
              target="_blank"
              href={`/result/?vitrin_id=${vitrinId}`}
              className="flex items-center gap-1.5 rounded-lg border border-blue-500 bg-blue-50 px-4 py-2 text-[12px] transition-all hover:bg-blue-100 hover:shadow-md lg:px-5 lg:py-2.5 lg:text-[14px]"
            >
              <span className="font-medium text-blue-700">مشاهده همه</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-blue-700"
              >
                <path
                  d="M11.9473 15.223C11.947 14.9579 11.8415 14.7037 11.6539 14.5163L6.53927 9.40166C6.38446 9.24689 6.26165 9.06314 6.17786 8.8609C6.09408 8.65866 6.05096 8.4419 6.05096 8.22299C6.05096 8.00409 6.09408 7.78732 6.17786 7.58509C6.26165 7.38285 6.38446 7.1991 6.53927 7.04433L11.6473 1.93299C11.8294 1.74439 11.9302 1.49179 11.9279 1.22959C11.9257 0.967395 11.8205 0.716583 11.6351 0.531175C11.4497 0.345766 11.1989 0.240598 10.9367 0.238319C10.6745 0.236041 10.4219 0.336835 10.2333 0.518993L5.12527 5.62633C4.43844 6.3145 4.0527 7.24706 4.0527 8.21933C4.0527 9.1916 4.43844 10.1242 5.12527 10.8123L10.2399 15.927C10.3796 16.0667 10.5575 16.162 10.7512 16.2007C10.945 16.2394 11.1458 16.2199 11.3285 16.1446C11.5111 16.0693 11.6674 15.9416 11.7775 15.7775C11.8876 15.6135 11.9467 15.4206 11.9473 15.223Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </div>
        )}

        {/* Swiper با Navigation */}
        <div className="relative overflow-hidden">
          <style
            dangerouslySetInnerHTML={{
              __html: `
              .featured-swiper .swiper-slide {
                box-sizing: border-box !important;
                height: 260px !important;
              }
              @media (min-width: 1024px) {
                .featured-swiper .swiper-slide {
                  height: 380px !important;
                }
              }
              .featured-swiper .swiper-slide > * {
                box-sizing: border-box !important;
                width: 100% !important;
                max-width: 100% !important;
                height: 100% !important;
              }
            `,
            }}
          />
          {/* Navigation Buttons */}
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="featured-swiper-button-prev absolute right-0 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-all hover:scale-105 hover:border-blue-400 hover:bg-blue-50 lg:h-14 lg:w-14"
            aria-label="قبلی"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-700"
            >
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="featured-swiper-button-next absolute left-0 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-all hover:scale-105 hover:border-blue-400 hover:bg-blue-50 lg:h-14 lg:w-14"
            aria-label="بعدی"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-700"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => {
              setCurrentSlide(swiper.realIndex);
            }}
            dir="rtl"
            loop={true}
            modules={[Navigation, Pagination]}
            className="featured-swiper pt-4 lg:pt-6"
            slidesPerView={2}
            spaceBetween={16}
            breakpoints={{
              768: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 5,
                spaceBetween: 24,
              },
            }}
          >
            {products?.map((item, idx) => (
              <SwiperSlide key={item.id || `product-${idx}`}>
                <div className="group relative h-full w-full">
                  {/* کارت محصول با استایل ویژه */}
                  <div className="relative h-full w-full overflow-hidden rounded-xl border border-blue-200 bg-white shadow-md transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 group-hover:scale-[1.03]">
                    <LazyCardProduct
                      className="h-full w-full border-0 shadow-none"
                      classImage="!w-[95px] !h-[115px] lg:!w-[90%] lg:!h-[191px] mx-auto"
                      product={item}
                      isSpical={true}
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Pagination Dots - خارج از container_page */}
      {swiperRef.current && products && products.length > 0 && (
        <div className="relative z-10 mb-4 flex justify-center gap-2 pb-4 pt-2 lg:mb-6 lg:pb-6">
          {Array.from({ length: Math.min(Math.ceil(products.length / 5), 5) }).map((_, idx) => {
            const groupSize = Math.ceil(products.length / Math.ceil(products.length / 5));
            const isActive =
              currentSlide >= idx * groupSize && currentSlide < (idx + 1) * groupSize;

            return (
              <button
                key={idx}
                onClick={() => swiperRef.current?.slideTo(idx * groupSize)}
                className={`h-2.5 rounded-full transition-all ${
                  isActive ? 'w-8 bg-blue-600' : 'w-2.5 bg-gray-400 hover:bg-gray-500'
                }`}
                aria-label={`صفحه ${idx + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

FeaturedCarousel.displayName = 'FeaturedCarousel';

export default FeaturedCarousel;
