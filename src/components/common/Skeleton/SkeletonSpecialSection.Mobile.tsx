'use client';
import React from 'react';
import { Skeleton } from '@heroui/skeleton';

const SkeletonSpecialSectionMobile = () => {
  return (
    <div className="container_page grid auto-rows-auto grid-cols-2 gap-4">
      {Array.from({ length: 5 }).map((_, index) => {
        const span = index === 2 ? 'col-span-2' : 'col-span-1';
        return (
          <div key={index} className={` ${span} `}>
            <Skeleton className="relative !h-full !w-full flex-1 overflow-hidden rounded-lg border border-[#eee]">
              <div className="mx-auto !h-[130px] !w-[130px]" />
            </Skeleton>
          </div>
        );
      })}
    </div>
  );
};

export default SkeletonSpecialSectionMobile;
