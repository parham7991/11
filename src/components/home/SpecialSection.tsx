'use client';
import React, { lazy, Suspense } from 'react';
import { HiFire } from 'react-icons/hi';
import SpecialCountdown from './SpecialCountdown';

// Lazy load heavy components
const SpecialSectionMobile = lazy(() => import('./SpecialSection.Mobile'));
const SpecialSectionDesktop = lazy(() => import('./SpecialSection.Desktop'));

type Product = {
  id?: string;
  product_name: string;
  image: {
    title: string;
    link: string;
  };
  product_price: {
    qty?: number;
    price: string;
    old_price?: string;
    from_date?: string | null;
    to_date?: string | null;
  };
};

type Props = {
  products: {
    title: string;
    items: Product[];
  };
  vitrinId?: number;
};

// ... (بقیه کد بدون تغییر)

const SpecialSection = ({ products }: Props) => {
  if (!Array.isArray(products?.items) || products?.items?.length === 0) return null;

  // نزدیک‌ترین تاریخِ پایانِ پیشنهاد ویژه را از میان آیتم‌ها پیدا کن (برای شمارش معکوس هدر).
  const offerEnd =
    products.items
      .map((it) => it?.product_price?.to_date)
      .filter((d): d is string => Boolean(d))
      .sort()[0] ?? null;

  return (
    <div className="home-special-section container_page overflow-hidden">
      {/* Header: شعله + عنوان + شمارش معکوس نئون */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-white/5 lg:mb-1">
        <div className="flex items-center gap-2.5 lg:gap-3.5">
          <HiFire
            className="h-6 w-6 shrink-0 animate-pulse text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.55)] motion-reduce:animate-none lg:h-7 lg:w-7"
            aria-hidden
          />
          <h2 className="font-bold text-[18px] text-gray-900 transition-all hover:text-blue-500 dark:text-zinc-100 lg:!text-[24px]">
            {products.title}
          </h2>
        </div>
        <SpecialCountdown toDate={offerEnd} />
      </div>
      <div className="md:hidden">
        <Suspense fallback={<div className="skeleton-shimmer h-64 rounded"></div>}>
          <SpecialSectionMobile products={products} />
        </Suspense>
      </div>
      <div className="mt-5 hidden md:block">
        <Suspense fallback={<div className="skeleton-shimmer h-64 rounded"></div>}>
          <SpecialSectionDesktop products={products} />
        </Suspense>
      </div>
    </div>
  );
};

export default SpecialSection;
