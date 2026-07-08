'use client';
import { addCommas } from '@/lib/fun';
import Link from 'next/link';
import NextImage from 'next/image';
import { Swiper, SwiperSlide, SwiperProps } from 'swiper/react';
import { useRef, lazy, Suspense } from 'react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Image, Product } from '@/types/Home';
import Button from '../common/Button';

// Lazy load Carousel component
const Carousel = lazy(() => import('../common/Carousel'));
// import ImageSlider from "@/../public/images/slider.png"

type Props = {
  showProduct?: boolean;
  html: {
    items: {
      product: {
        price: number;
      };
      image: Image;
      link: string;
      redirect: string;
    }[];
    vitrin: {
      products: Product[];
    };
  };
};
const TopSlider = ({ html, showProduct }: Props) => {
  const swiperRef = useRef<SwiperProps>(null);

  return (
    <div className="bg-[#F3F6FB] lg:mt-0 lg:py-5 lg:pb-5">
      <div className="container_page overflow-hidden">
        <Swiper
          loop
          // @ts-expect-error error
          ref={swiperRef}
          dir="rtl"
          slidesPerView={1}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          modules={[Autoplay, Pagination]}
        >
          {html?.items?.map((slide, idx) => (
            <SwiperSlide key={idx}>
              <Link
                prefetch={false}
                href={'#'}
                className="flex w-full flex-col items-center gap-4 lg:mt-10 lg:flex-row lg:justify-between lg:px-10"
                key={idx}
              >
                <div>
                  {slide.image.title && (
                    <div className="font-bold text-lg md:text-2xl xl:text-5xl">
                      <p className="line-clamp-2 lg:w-[600px] lg:leading-[4.5rem]">
                        {slide.image.title}
                      </p>
                      {/* <p className='whitespace-nowrap'> بهترین <span className='text-main'>دوربین درونی</span></p><br />

                                                <p className='flex items-center whitespace-nowrap gap-1'>       که میتوانید آن را <span className='text-main'> تجربه کنید</span></p> */}
                    </div>
                  )}
                </div>
                <div className="flex w-full flex-col items-center gap-3 lg:items-end">
                  <NextImage
                    className="mr-auto h-[184px] object-contain indent-0 lg:h-[332px] lg:w-fit"
                    src={slide.image.link}
                    alt={slide.image.title || 'تصویر محصول'}
                    width={332}
                    height={332}
                    priority={idx === 0}
                    quality={85}
                    sizes="(max-width: 768px) 184px, 332px"
                  />
                  <p className="line-clamp-2 text-right font-medium text-[14px] lg:w-[300px] lg:text-left lg:text-[20px]">
                    {slide.image.title}
                  </p>
                  <Button className="mr-auto !h-[47px] w-fit !min-w-fit !bg-[#F9A038] !px-3 font-medium text-[14px] !text-white lg:!h-[61px] lg:!w-[205px] lg:min-w-[205px] lg:!text-[25px]">
                    {!slide?.product?.price ? addCommas(305000) : ''} تومان
                  </Button>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
        {showProduct && (
          <Suspense fallback={<div className="h-32 animate-pulse rounded bg-gray-200"></div>}>
            <Carousel className={'!mt-8 !w-full'} products={html?.vitrin?.products} />
          </Suspense>
        )}
        {/* <div className='flex items-center  justify-end m-2'>
                <Button onClick={handleNext} className='!min-w-fit'>
                    <Arrow_Icon size="19" className="!text-neutral-900 -rotate-180" />
                </Button>
                <div className='flex items-center gap-1'>
                    {sliders?.map((_, idx) => (
                        <span
                            key={idx}
                            onClick={() => {
                                if (swiperRef.current) {
                                    swiperRef.current.swiper.slideTo(idx);
                                }
                            }}
                            className={`block w-3 h-3 lg:w-4 lg:h-4 cursor-pointer rounded-full border ${currentSlide === idx ? 'bg-neutral-900 border-transparent' : ' border-neutral-900'
                                }`}
                        ></span>
                    ))}
                </div>

                <Button onClick={handlePrev} className='!min-w-fit'>
                    <Arrow_Icon size="19" className="!text-neutral-900 " />
                </Button>
            </div> */}
      </div>
    </div>
  );
};

export default TopSlider;
