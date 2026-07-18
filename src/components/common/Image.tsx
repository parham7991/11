'use client';
import React, { useState, useEffect, useRef } from 'react';
import NextImage, { StaticImageData } from 'next/image';
import Logo from '@/../public/images/no-image.png';
import { AWS_BUCKET, BASE_URL_IMAGE } from '@/lib/variable';

// فرض کنید Base URL شما اینه:
const BASE_URL = `${BASE_URL_IMAGE}/${AWS_BUCKET}`;

type Props = {
  src?: string | StaticImageData;
  alt: string;
  className: string;
  imgClass?: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  quality?: number;
  showLoader?: boolean; // نمایش loader یا نه
};

const getFinalSrc = (src?: string | StaticImageData): string | StaticImageData | null => {
  if (!src) return null;

  if (typeof src === 'string') {
    try {
      // اگر URL کامل بود، فقط path رو بگیر
      if (src.startsWith('http')) {
        const url = new URL(src);
        return `${BASE_URL_IMAGE}/${url.pathname.replace(/^\/+/, '')}`;
      } else {
        // اگر نسبی بود
        return `${BASE_URL}/${src.replace(/^\/+/, '')}`;
      }
    } catch (error) {
      // اگر پارس URL شکست خورد، به صورت نسبی فرض کن
      return `${BASE_URL}/${src.replace(/^\/+/, '')}`;
    }
  }

  return src;
};

const Image = ({
  src,
  alt,
  className,
  imgClass,
  sizes,
  priority = false,
  unoptimized = false,
  quality = 100,
  showLoader = true,
}: Props) => {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(priority); // برای priority از ابتدا true
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // ✅ Intersection Observer برای lazy loading واقعی
  useEffect(() => {
    // تصاویر priority بلافاصله render میشن
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // بعد از دیده شدن، دیگر نیازی به observe کردن نیست
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // 200px قبل از رسیدن به viewport شروع کن برای نمایش سریع‌تر skeleton
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const computedSrc = getFinalSrc(src);
  const finalSrc = !isError && computedSrc ? computedSrc : Logo;

  // تشخیص GIF و SVG برای unoptimized شدن خودکار
  const isGifOrSvg =
    typeof finalSrc === 'string' &&
    (finalSrc.toLowerCase().endsWith('.gif') || finalSrc.toLowerCase().endsWith('.svg'));
  const shouldBeUnoptimized = unoptimized || isGifOrSvg;

  // نمایش loader: بلافاصله برای priority، و برای بقیه وقتی در viewport هستند و هنوز لود نشده‌اند
  const shouldShowLoader = showLoader && isLoading && (priority || isInView);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Skeleton Loading - Simple and Clean */}
      {shouldShowLoader && (
        <div
          className={`rounded-inherit absolute inset-0 z-20 overflow-hidden transition-opacity duration-300 ${
            imageLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="h-full w-full bg-gray-200">
            {/* Shimmer Animation */}
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%]"></div>
          </div>
        </div>
      )}

      {/* تصویر: priority بلافاصله، بقیه وقتی در viewport */}
      {(priority || isInView) && (
        <NextImage
          src={finalSrc}
          alt={alt}
          title={alt}
          fill
          sizes={sizes || '100vw'}
          onError={() => {
            setIsError(true);
            setIsLoading(false);
            setImageLoaded(false);
          }}
          onLoad={() => {
            setIsLoading(false);
            // تاخیر کوچک برای smooth transition
            setTimeout(() => {
              setImageLoaded(true);
            }, 50);
          }}
          quality={quality}
          unoptimized={shouldBeUnoptimized}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          className={`transition-all duration-700 ease-out ${
            imageLoaded ? 'scale-100 opacity-100 blur-0' : 'scale-[1.02] opacity-0 blur-[2px]'
          } ${finalSrc === Logo ? 'h-14 w-14 scale-75' : ''} ${imgClass || ''} object-contain`}
        />
      )}
    </div>
  );
};

export default Image;
