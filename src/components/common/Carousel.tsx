'use client';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { Product } from '@/types/Home';
import LazyCardProduct from './LazyCardProduct';
import Link from 'next/link';
import { HiSparkles } from 'react-icons/hi';
import { RiStarSFill } from 'react-icons/ri';

interface Props {
  title?: string;
  className?: string;
  showSwiperSlide?: boolean;
  Icon?: () => React.JSX.Element;
  products?: Product[];
  vitrinId?: number;
  noContainer?: boolean;
}

const Carousel = memo(({ title, className, products, vitrinId, noContainer }: Props) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const productsLength = useMemo(() => products?.length ?? 0, [products?.length]);

  // باید همیشه useKeenSlider صدا بزنیم (Rules of Hooks)
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    slides: {
      perView: 2,
      spacing: 12,
    },
    breakpoints: {
      '(min-width: 768px)': {
        slides: {
          perView: 'auto',
          spacing: 12,
        },
      },
      '(min-width: 1024px)': {
        slides: {
          perView: 'auto',
          spacing: 12,
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

  // Fix: Update slider بعد از mount و resize
  useEffect(() => {
    if (instanceRef.current) {
      const timer = setTimeout(() => {
        instanceRef.current?.update();
      }, 100);

      const handleResize = () => {
        instanceRef.current?.update();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [instanceRef, products]);

  if (!products || productsLength <= 6) return null;

  return (
    <div className={`product-carousel-section ${noContainer ? '' : 'container_page'} relative ${className ?? ''}`}>
      {title && (
        <div>
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            {/* Title با آیکن‌ها */}
            <div className="flex items-center gap-2.5 lg:gap-3">
              {/* <RiStarSFill className="hidden h-7 w-7 text-gray-600 lg:block lg:h-9 lg:w-9" />
              <HiSparkles className="hidden h-5 w-5 text-gray-500 lg:block lg:h-7 lg:w-7" /> */}
              <h2 className="font-bold text-[18px] text-gray-900 transition-all hover:text-blue-500 lg:text-[24px]">
                {title}
              </h2>
              {/* <HiSparkles className="hidden h-5 w-5 text-gray-500 lg:block lg:h-7 lg:w-7" />
              <RiStarSFill className="hidden h-7 w-7 text-gray-600 lg:block lg:h-9 lg:w-9" /> */}
            </div>

            {/* View All Link */}
            <Link
              prefetch={false}
              target="_blank"
              href={`/result/?vitrin_id=${vitrinId}`}
              className="group flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2 text-[12px] transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm lg:px-5 lg:py-2.5 lg:text-[14px]"
            >
              <span className="font-medium text-gray-700 transition-colors group-hover:text-blue-600">
                مشاهده همه
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-700 transition-colors group-hover:text-blue-600"
              >
                <path
                  d="M11.9473 15.223C11.947 14.9579 11.8415 14.7037 11.6539 14.5163L6.53927 9.40166C6.38446 9.24689 6.26165 9.06314 6.17786 8.8609C6.09408 8.65866 6.05096 8.4419 6.05096 8.22299C6.05096 8.00409 6.09408 7.78732 6.17786 7.58509C6.26165 7.38285 6.38446 7.1991 6.53927 7.04433L11.6473 1.93299C11.8294 1.74439 11.9302 1.49179 11.9279 1.22959C11.9257 0.967395 11.8205 0.716583 11.6351 0.531175C11.4497 0.345766 11.1989 0.240598 10.9367 0.238319C10.6745 0.236041 10.4219 0.336835 10.2333 0.518993L5.12527 5.62633C4.43844 6.3145 4.0527 7.24706 4.0527 8.21933C4.0527 9.1916 4.43844 10.1242 5.12527 10.8123L10.2399 15.927C10.3796 16.0667 10.5575 16.162 10.7512 16.2007C10.945 16.2394 11.1458 16.2199 11.3285 16.1446C11.5111 16.0693 11.6674 15.9416 11.7775 15.7775C11.8876 15.6135 11.9467 15.4206 11.9473 15.223Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </div>
          {/* Border زیر عنوان */}
          <div className="h-0.5 w-40 rounded-full bg-gradient-to-r from-gray-400 to-gray-200 lg:w-52"></div>
        </div>
      )}

      {/* Keen Slider */}
      <div className={title ? '' : 'mt-3 lg:mt-5'}>
        <div ref={sliderRef} className="keen-slider !py-2 lg:!py-5">
          {products?.map((item, idx) => (
            <div
              key={item.id || `product-${idx}`}
              className={`keen-slider__slide hover:shadow_pro group !h-[260px] overflow-hidden !rounded-lg lg:!h-[380px] ${
                !loaded ? 'mx-2 !min-w-[300px]' : '!min-w-[300px]'
              }`}
            >
              <LazyCardProduct
                className="!h-full !w-full !rounded-lg border transition-all duration-300"
                classImage="!w-[95px] !h-[115px] lg:!w-[90%] lg:!h-[191px] mx-auto"
                product={item}
              />
            </div>
          ))}
        </div>
      </div>

      {/* navigation */}
      {loaded && instanceRef.current && (
        <div className="absolute -bottom-3 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-20 lg:flex">
          <button onClick={handlePrevSlide} className="cursor-pointer" aria-label="Previous slide">
            <svg
              width="16"
              height="17"
              viewBox="0 0 16 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_643_4991)">
                <path
                  d="M4.05273 1.89078C4.05297 2.1559 4.15848 2.41009 4.34607 2.59744L9.46073 7.71211C9.61554 7.86688 9.73835 8.05063 9.82214 8.25287C9.90592 8.45511 9.94904 8.67187 9.94904 8.89078C9.94904 9.10968 9.90592 9.32644 9.82214 9.52868C9.73835 9.73092 9.61554 9.91467 9.46073 10.0694L4.35273 15.1808C4.17058 15.3694 4.06978 15.622 4.07206 15.8842C4.07434 16.1464 4.17951 16.3972 4.36492 16.5826C4.55032 16.768 4.80114 16.8732 5.06333 16.8755C5.32553 16.8777 5.57813 16.7769 5.76673 16.5948L10.8747 11.4874C11.5616 10.7993 11.9473 9.86671 11.9473 8.89444C11.9473 7.92217 11.5616 6.98962 10.8747 6.30144L5.76007 1.18678C5.62041 1.04703 5.4425 0.951784 5.24876 0.913055C5.05503 0.874325 4.85417 0.893848 4.67153 0.96916C4.48888 1.04447 4.33263 1.1722 4.22251 1.33622C4.11238 1.50024 4.0533 1.69321 4.05273 1.89078Z"
                  fill="#0F1014"
                />
              </g>
              <defs>
                <clipPath id="clip0_643_4991">
                  <rect
                    width="16"
                    height="16"
                    fill="white"
                    transform="matrix(1 -8.74228e-08 -8.74228e-08 -1 0 16.8907)"
                  />
                </clipPath>
              </defs>
            </svg>
          </button>
          <button onClick={handleNextSlide} className="cursor-pointer" aria-label="Next slide">
            <svg
              width="16"
              height="17"
              viewBox="0 0 16 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_643_4989)">
                <path
                  d="M11.9473 15.8907C11.947 15.6256 11.8415 15.3714 11.6539 15.1841L6.53927 10.0694C6.38446 9.91462 6.26165 9.73086 6.17786 9.52863C6.09408 9.32639 6.05096 9.10963 6.05096 8.89072C6.05096 8.67181 6.09408 8.45505 6.17786 8.25281C6.26165 8.05057 6.38446 7.86682 6.53927 7.71205L11.6473 2.60072C11.8294 2.41212 11.9302 2.15951 11.9279 1.89732C11.9257 1.63512 11.8205 1.38431 11.6351 1.1989C11.4497 1.01349 11.1989 0.908322 10.9367 0.906044C10.6745 0.903765 10.4219 1.00456 10.2333 1.18672L5.12527 6.29405C4.43844 6.98223 4.0527 7.91478 4.0527 8.88705C4.0527 9.85932 4.43844 10.7919 5.12527 11.4801L10.2399 16.5947C10.3796 16.7345 10.5575 16.8297 10.7512 16.8684C10.945 16.9072 11.1458 16.8876 11.3285 16.8123C11.5111 16.737 11.6674 16.6093 11.7775 16.4453C11.8876 16.2813 11.9467 16.0883 11.9473 15.8907Z"
                  fill="#0F1014"
                />
              </g>
              <defs>
                <clipPath id="clip0_643_4989">
                  <rect
                    width="16"
                    height="16"
                    fill="white"
                    transform="matrix(-1 8.74228e-08 8.74228e-08 1 16 0.890747)"
                  />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
      )}

      {/* Pagination Dots - Max 3 groups */}
      {loaded && instanceRef.current && products && products.length > 0 && (
        <div className="absolute left-1/2 z-50 flex -translate-x-1/2 gap-2">
          {[0, 1, 2].map((groupIdx) => {
            const totalSlides = products.length;
            const groupSize = Math.ceil(totalSlides / 3);
            const isActive =
              currentSlide >= groupIdx * groupSize && currentSlide < (groupIdx + 1) * groupSize;

            return (
              <button
                key={groupIdx}
                onClick={() => instanceRef.current?.moveToIdx(groupIdx * groupSize)}
                className={`h-2 w-2 rounded-full transition-all ${
                  isActive ? 'w-6 bg-blue-500' : 'bg-gray-400 hover:bg-gray-500'
                }`}
                aria-label={`Go to group ${groupIdx + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

Carousel.displayName = 'Carousel';

export default Carousel;
