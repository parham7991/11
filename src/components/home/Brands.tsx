'use client';
import { useEffect, useState } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import Link from 'next/link';
import Image from '../common/Image';

type Props = {
  brands?: {
    title: string;
    status: boolean;
    logo: string;
    url_key?: string;
  }[];
};

const Brands = ({ brands }: Props) => {
  const [loaded, setLoaded] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider(
    {
      loop: true,
      mode: 'snap',
      rtl: false,
      drag: true,
      dragSpeed: 0.5,
      slides: {
        perView: 'auto',
        spacing: 5,
      },
      breakpoints: {
        '(min-width: 768px)': {
          slides: {
            perView: 8.5,
            spacing: 0,
          },
        },
      },
      renderMode: 'performance',
      created() {
        setLoaded(true);
      },
    },
    [
      (slider) => {
        let timeout: ReturnType<typeof setTimeout>;
        let mouseOver = false;

        function clearNextTimeout() {
          clearTimeout(timeout);
        }

        function nextTimeout() {
          clearTimeout(timeout);
          if (mouseOver) return;
          timeout = setTimeout(() => {
            slider.next();
          }, 3000);
        }

        slider.on('created', () => {
          slider.container.addEventListener('mouseover', () => {
            mouseOver = true;
            clearNextTimeout();
          });
          slider.container.addEventListener('mouseout', () => {
            mouseOver = false;
            nextTimeout();
          });
          nextTimeout();
        });

        slider.on('dragStarted', clearNextTimeout);
        slider.on('animationEnded', nextTimeout);
        slider.on('updated', nextTimeout);
      },
    ]
  );

  useEffect(() => {
    if (!loaded) return;

    const update = () => instanceRef.current?.update();
    const timeout = setTimeout(update, 120);
    window.addEventListener('resize', update);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', update);
    };
  }, [loaded, instanceRef]);

  const activeBrands = brands?.filter((item) => item.status);

  if (!activeBrands || activeBrands.length === 0) return null;

  return (
    <section className="container_page !mt-20 mb-20">
      <div className="relative">
        {/* <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-200/30 blur-3xl" /> */}

        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 font-medium text-[12px] text-blue-600 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            برندهای منتخب
            <span className="h-2 w-2 rounded-full bg-purple-500" />
          </span>
          <h2 className="font-bold text-[20px] text-gray-900 lg:text-[28px]">محبوب‌ترین برندها</h2>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <p className="max-w-2xl font-reqular text-[13px] text-gray-600 lg:text-[14px]">
            برندهای پرطرفداری که کاربران ما بیشترین تعامل را با آن‌ها داشته‌اند؛ کیفیت، نوآوری و
            اعتماد در کنار هم.
          </p>
        </div>

        <div
          ref={sliderRef}
          className="keen-slider relative !flex !h-[100px] !max-h-[100px] !min-h-[150px] !items-center !gap-4 overflow-hidden !pt-4 lg:!gap-6"
        >
          {activeBrands.map((item, idx) => (
            <div
              key={idx}
              className="keen-slider__slide !flex !min-w-[70px] !max-w-[70px] !items-center !justify-center overflow-hidden lg:!min-w-[100px] lg:!max-w-[100px]"
            >
              <Link
                prefetch={false}
                href={`/brand/${item.title}`}
                className="group flex min-h-[70px] min-w-[70px] flex-col items-center justify-center rounded-2xl text-center transition-all duration-300 lg:min-h-[100px] lg:min-w-[100px]"
              >
                <Image
                  className="!h-[70px] !w-[70px] rounded-full border border-blue-300 object-cover transition-transform duration-300 group-hover:scale-105 lg:!h-[100px] lg:!w-[100px]"
                  alt={item.title || 'لوگوی برند'}
                  src={item.logo}
                  sizes="(max-width: 768px) 100px, 150px"
                />
                <span className="mt-3 line-clamp-1 font-reqular text-[13px] text-gray-700 lg:text-[14px]">
                  {item.title}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Brands;
