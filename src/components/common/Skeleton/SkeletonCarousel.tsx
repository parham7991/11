'use client';
import React from 'react';
import SkeletonProduct from './SkeletonProduct';
import { Skeleton } from '@heroui/react';

interface SkeletonCarouselProps {
  title?: string;
}

const SkeletonCarousel = ({ title }: SkeletonCarouselProps) => {
  return (
    <div className="container_page relative">
      {/* Title skeleton or actual title */}
      <div className="flex items-center justify-between">
        {title ? (
          <h2 className="font-bold !text-[18px] text-black lg:!text-[24px]">{title}</h2>
        ) : (
          <Skeleton className="h-7 w-32 rounded lg:h-8 lg:w-40">
            <div className="h-7 w-32 rounded bg-default-300 lg:h-8 lg:w-40" />
          </Skeleton>
        )}
        <Skeleton className="h-5 w-20 rounded lg:h-6 lg:w-24">
          <div className="h-5 w-20 rounded bg-default-300 lg:h-6 lg:w-24" />
        </Skeleton>
      </div>

      {/* Grid skeleton - same layout as keen-slider result */}
      <div className="mt-3 grid grid-cols-2 gap-3 py-2 md:grid-cols-4 lg:mt-5 lg:grid-cols-5 lg:gap-3 lg:py-5">
        {/* موبایل: 2 تا، تبلت: 4 تا، دسکتاپ: 5 تا */}
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-[260px] w-full lg:h-[380px]">
            <SkeletonProduct />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonCarousel;
