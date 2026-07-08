'use client';
import { useMemo, memo, useState, useEffect } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import Link from 'next/link';
import { getFinalSrc } from '@/lib/fun';
import SkeletonSlider from './Skeleton/SkeletonSlider';
import Image from './Image';

interface SlideContent {
  sort_order: number;
  path: string;
  link: string;
  is_mobile?: boolean;
  title?: string;
}

interface SlideItem {
  content: SlideContent;
  link: string;
  redirect?: string | null;
}

interface Props {
  showProduct?: boolean;
  sliders: SlideItem[];
}

const Slider = memo(({ sliders }: Props) => {
  // مرتب‌سازی کلی
  const sortedData = useMemo(() => {
    return [...sliders].sort((a, b) => a.content?.sort_order - b.content?.sort_order);
  }, [sliders]);

  // فیلتر و مرتب‌سازی برای موبایل و دسکتاپ
  const mobileSliders = useMemo(() => {
    const filtered = [...sliders].filter((slide) => slide.content?.is_mobile === true);
    // اگر هیچ اسلایدر موبایلی نبود، از همه استفاده کن
    return filtered.length > 0
      ? filtered.sort((a, b) => a.content?.sort_order - b.content?.sort_order)
      : sortedData;
  }, [sliders, sortedData]);

  const desktopSliders = useMemo(() => {
    const filtered = [...sliders].filter((slide) => slide.content?.is_mobile === false);
    // اگر هیچ اسلایدر دسکتاپی نبود، از همه استفاده کن
    return filtered.length > 0
      ? filtered.sort((a, b) => a.content?.sort_order - b.content?.sort_order)
      : sortedData;
  }, [sliders, sortedData]);

  // Slider configs برای موبایل و دسکتاپ
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const [currentDesktopSlide, setCurrentDesktopSlide] = useState(0);
  const [mobileLoaded, setMobileLoaded] = useState(false);
  const [desktopLoaded, setDesktopLoaded] = useState(false);

  const mobileConfig = useMemo(
    () => ({
      initial: 0,
      loop: mobileSliders.length > 1,
      slides: {
        perView: 1,
      },
      slideChanged(slider: any) {
        setCurrentMobileSlide(slider.track.details.rel);
      },
      created() {
        setMobileLoaded(true);
      },
    }),
    [mobileSliders.length]
  );

  const desktopConfig = useMemo(
    () => ({
      initial: 0,
      loop: desktopSliders.length > 1,
      slides: {
        perView: 1,
      },
      slideChanged(slider: any) {
        setCurrentDesktopSlide(slider.track.details.rel);
      },
      created() {
        setDesktopLoaded(true);
      },
    }),
    [desktopSliders.length]
  );

  const [mobileSliderRef, mobileInstanceRef] = useKeenSlider(mobileConfig);
  const [desktopSliderRef, desktopInstanceRef] = useKeenSlider(desktopConfig);

  // Force re-initialize sliders when data changes
  useEffect(() => {
    if (mobileInstanceRef.current && mobileSliders.length > 0) {
      mobileInstanceRef.current.update();
    }
  }, [mobileSliders, mobileInstanceRef]);

  useEffect(() => {
    if (desktopInstanceRef.current && desktopSliders.length > 0) {
      desktopInstanceRef.current.update();
    }
  }, [desktopSliders, desktopInstanceRef]);

  // اگر دیتا نیست، skeleton نشان بده
  if (!sliders || sliders.length === 0) return <SkeletonSlider />;

  // تابع کمکی برای render کردن slider
  const renderSlider = (
    slides: SlideItem[],
    sliderRef: any,
    instanceRef: any,
    currentSlide: number,
    loaded: boolean,
    className: string = ''
  ) => (
    <div className={`relative overflow-hidden ${className}`} suppressHydrationWarning>
      <div
        ref={sliderRef}
        className="keen-slider lg:!pt-4 2xl:!pb-14"
        key={`slider-${slides.length}`}
      >
        {slides.map((slide, idx) => {
          const altText = slide.content?.title || 'بنر تبلیغاتی';

          return (
            <div
              className="keen-slider__slide"
              key={`slide-${slide.content.path}-${idx}`}
              style={{ minWidth: '100%', maxWidth: '100%' }}
            >
              <Link
                rel="follow"
                prefetch={false}
                target="_blank"
                className="block h-full w-full"
                href={slide?.content?.link || '#'}
              >
                <div className="relative h-[180px] max-h-[180px] w-full lg:h-[400px] lg:max-h-[400px]">
                  <Image
                    src={getFinalSrc(slide.content.path) as string}
                    alt={altText}
                    className="h-full w-full cursor-pointer"
                    imgClass="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 2048px"
                    priority={idx === 0}
                    quality={75}
                    showLoader={true}
                  />
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {loaded && instanceRef.current && slides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              instanceRef.current?.prev();
            }}
            className="absolute bottom-20 right-4 !z-10 flex h-[40px] w-[40px] !min-w-fit items-center justify-center rounded-full lg:bottom-24 lg:right-[5%] lg:bg-white"
            aria-label="Previous slide"
          >
            <svg
              className="h-[20px] w-[20px] fill-white lg:h-[15px] lg:w-[15px] lg:fill-main"
              viewBox="0 0 16 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_643_4991)">
                <path d="M4.05273 1.89078C4.05297 2.1559 4.15848 2.41009 4.34607 2.59744L9.46073 7.71211C9.61554 7.86688 9.73835 8.05063 9.82214 8.25287C9.90592 8.45511 9.94904 8.67187 9.94904 8.89078C9.94904 9.10968 9.90592 9.32644 9.82214 9.52868C9.73835 9.73092 9.61554 9.91467 9.46073 10.0694L4.35273 15.1808C4.17058 15.3694 4.06978 15.622 4.07206 15.8842C4.07434 16.1464 4.17951 16.3972 4.36492 16.5826C4.55032 16.768 4.80114 16.8732 5.06333 16.8755C5.32553 16.8777 5.57813 16.7769 5.76673 16.5948L10.8747 11.4874C11.5616 10.7993 11.9473 9.86671 11.9473 8.89444C11.9473 7.92217 11.5616 6.98962 10.8747 6.30144L5.76007 1.18678C5.62041 1.04703 5.4425 0.951784 5.24876 0.913055C5.05503 0.874325 4.85417 0.893848 4.67153 0.96916C4.48888 1.04447 4.33263 1.1722 4.22251 1.33622C4.11238 1.50024 4.0533 1.69321 4.05273 1.89078Z" />
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              instanceRef.current?.next();
            }}
            className="absolute bottom-20 left-0 !z-10 flex h-[40px] w-[40px] !min-w-fit items-center justify-center rounded-full lg:bottom-24 lg:left-[90%] lg:bg-white"
            aria-label="Next slide"
          >
            <svg
              className="h-[20px] w-[20px] fill-white lg:h-[15px] lg:w-[15px] lg:fill-main"
              viewBox="0 0 16 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_643_4989)">
                <path d="M11.9473 15.8907C11.947 15.6256 11.8415 15.3714 11.6539 15.1841L6.53927 10.0694C6.38446 9.91462 6.26165 9.73086 6.17786 9.52863C6.09408 9.32639 6.05096 9.10963 6.05096 8.89072C6.05096 8.67181 6.09408 8.45505 6.17786 8.25281C6.26165 8.05057 6.38446 7.86682 6.53927 7.71205L11.6473 2.60072C11.8294 2.41212 11.9302 2.15951 11.9279 1.89732C11.9257 1.63512 11.8205 1.38431 11.6351 1.1989C11.4497 1.01349 11.1989 0.908322 10.9367 0.906044C10.6745 0.903765 10.4219 1.00456 10.2333 1.18672L5.12527 6.29405C4.43844 6.98223 4.0527 7.91478 4.0527 8.88705C4.0527 9.85932 4.43844 10.7919 5.12527 11.4801L10.2399 16.5947C10.3796 16.7345 10.5575 16.8297 10.7512 16.8684C10.945 16.9072 11.1458 16.8876 11.3285 16.8123C11.5111 16.737 11.6674 16.6093 11.7775 16.4453C11.8876 16.2813 11.9467 16.0883 11.9473 15.8907Z" />
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
        </>
      )}

      {/* Pagination Dots */}
      {loaded && instanceRef.current && slides.length > 1 && (
        <div className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 gap-2 lg:bottom-[96px]">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => instanceRef.current?.moveToIdx(idx)}
              className={`h-2 w-2 rounded-full transition-all ${
                currentSlide === idx ? 'w-6 bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Slider - فقط در موبایل نمایش داده میشه */}
      {renderSlider(
        mobileSliders,
        mobileSliderRef,
        mobileInstanceRef,
        currentMobileSlide,
        mobileLoaded,
        'lg:hidden'
      )}

      {/* Desktop Slider - فقط در دسکتاپ نمایش داده میشه */}
      {renderSlider(
        desktopSliders,
        desktopSliderRef,
        desktopInstanceRef,
        currentDesktopSlide,
        desktopLoaded,
        'hidden lg:block'
      )}
    </>
  );
});

Slider.displayName = 'Slider';

export default Slider;
