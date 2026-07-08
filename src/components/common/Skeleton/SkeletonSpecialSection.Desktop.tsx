'use client';
import React from 'react';
import { Skeleton } from '@heroui/skeleton';

const SkeletonSpecialSectionDesktop = () => {
  return (
    <div className="container_page grid grid-cols-6 grid-rows-6 gap-4">
      {Array.from({ length: 9 }).map((_, index) => {
        const placement =
          index === 0
            ? 'lg:col-start-1 lg:col-span-1 lg:row-start-1 lg:row-span-3'
            : index === 1
              ? 'lg:col-start-2 lg:col-span-1 lg:row-start-1 lg:row-span-3'
              : index === 2
                ? 'lg:col-start-1 lg:col-span-1 lg:row-start-4 lg:row-span-3'
                : index === 3
                  ? 'lg:col-start-2 lg:col-span-1 lg:row-start-4 lg:row-span-3'
                  : index === 4
                    ? 'lg:col-start-3 lg:col-span-2 lg:row-start-1 lg:row-span-6'
                    : index === 5
                      ? 'lg:col-start-5 lg:col-span-1 lg:row-start-1 lg:row-span-3'
                      : index === 6
                        ? 'lg:col-start-6 lg:col-span-1 lg:row-start-1 lg:row-span-3'
                        : index === 7
                          ? 'lg:col-start-5 lg:col-span-1 lg:row-start-4 lg:row-span-3'
                          : index === 8
                            ? 'lg:col-start-6 lg:col-span-1 lg:row-start-4 lg:row-span-3'
                            : '';

        const imageClasses =
          index === 4
            ? 'mx-auto lg:!w-[90%] lg:!h-[460px] !object-cover lg:mt-4'
            : 'mx-auto lg:!w-[90%] !w-[130px] !h-[130px] lg:!h-[160px]';

        return (
          <div key={index} className={` ${placement} `}>
            <Skeleton className="relative !h-full !w-full flex-1 overflow-hidden rounded-lg border border-[#eee]">
              <div className={imageClasses} />
            </Skeleton>
          </div>
        );
      })}
    </div>
  );
};

export default SkeletonSpecialSectionDesktop;
