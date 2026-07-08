'use client';
import React from 'react';
import { Skeleton } from '@heroui/skeleton';

const SkeletonSpecialSection = () => {
  const renderSkeletonCard = (index: number) => {
    const baseMobileSpan = index === 2 ? 'col-span-2' : 'col-span-1';
    const mdSpan = index === 3 ? 'md:col-span-6 md:row-span-2' : 'md:col-span-2 md:row-span-2';
    const lgSpan = index === 2 ? 'lg:col-span-2 lg:row-span-6' : 'lg:row-span-3';

    const isCenterAtMd = index === 3;
    const isCenterAtLg = index === 2;

    const imageClasses = [
      'mx-auto',
      '!w-[105px] !h-[105px]',
      'lg:!w-[90%]',
      isCenterAtMd
        ? 'md:!w-[165px] md:!h-[165px] md:!object-cover md:lg:!w-[90%]'
        : 'md:!w-[90%] md:!h-[141px]',
      isCenterAtLg ? 'lg:!h-[420px] lg:!mt-4' : 'lg:!h-[141px]',
    ].join(' ');

    return (
      <div key={index} className={` ${baseMobileSpan} ${mdSpan} ${lgSpan} `}>
        <Skeleton className="relative !h-full !w-full flex-1 !justify-between overflow-hidden rounded-lg border border-[#eee]">
          <div className={imageClasses}></div>
        </Skeleton>
      </div>
    );
  };

  return (
    <div className="container_page overflow-hidden">
      <div className="grid auto-rows-auto grid-cols-2 gap-4 md:auto-rows-auto md:grid-cols-6 lg:grid-cols-6 lg:grid-rows-6">
        {Array.from({ length: 9 }).map((_, idx) => renderSkeletonCard(idx))}
      </div>
    </div>
  );
};

export default SkeletonSpecialSection;
