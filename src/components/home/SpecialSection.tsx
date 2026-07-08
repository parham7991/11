'use client';
import React, { lazy, Suspense } from 'react';
import { HiSparkles } from 'react-icons/hi';
import { RiStarSFill } from 'react-icons/ri';

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
  return (
    <div className="home-special-section container_page overflow-hidden">
      {/* Header با آیکن و border */}
      <div className="mb-6 border-b border-gray-200 pb-3 lg:mb-1">
        <div className="flex items-center gap-2.5 lg:gap-3.5">
          <h2 className="font-bold text-[18px] text-gray-900 transition-all hover:text-blue-500 lg:!text-[24px]">
            {products.title}
          </h2>
        </div>
        {/* Border زیر عنوان */}
      </div>
      <div className="md:hidden">
        <Suspense fallback={<div className="h-64 animate-pulse rounded bg-gray-200"></div>}>
          <SpecialSectionMobile products={products} />
        </Suspense>
      </div>
      <div className="mt-5 hidden md:block">
        <Suspense fallback={<div className="h-64 animate-pulse rounded bg-gray-200"></div>}>
          <SpecialSectionDesktop products={products} />
        </Suspense>
      </div>
    </div>
  );
};

export default SpecialSection;
