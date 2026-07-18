import { Skeleton } from '@heroui/react';
import React from 'react';

const SkeletonProduct = () => {
  return (
    <div className="group flex !h-full !w-full flex-col justify-between overflow-hidden !rounded-lg border border-gray-200 bg-white shadow dark:border-white/5 dark:bg-zinc-900/40 dark:shadow-none">
      {/* Image skeleton */}
      <div className="px-1 pr-2 pt-6 lg:px-3">
        <Skeleton className="mx-auto h-[115px] w-[95px] rounded-lg lg:h-[191px] lg:w-[90%]">
          <div className="h-full w-full rounded-lg bg-default-300" />
        </Skeleton>
      </div>

      {/* Content skeleton */}
      <div className="flex flex-col gap-2 px-2 pb-3 pt-2 lg:gap-3 lg:px-3 lg:pb-4">
        {/* Title skeleton */}
        <Skeleton className="h-3 w-4/5 rounded-lg">
          <div className="h-3 w-4/5 rounded-lg bg-default-200" />
        </Skeleton>
        <Skeleton className="h-3 w-3/5 rounded-lg">
          <div className="h-3 w-3/5 rounded-lg bg-default-200" />
        </Skeleton>

        {/* Price and button skeleton */}
        <div className="mt-2 flex w-full items-center justify-between lg:mt-3">
          <Skeleton className="h-5 w-2/5 rounded">
            <div className="h-5 w-2/5 rounded bg-default-200" />
          </Skeleton>
          <Skeleton className="h-[32px] w-[32px] rounded-lg lg:h-[40px] lg:w-[40px]">
            <div className="h-full w-full rounded-lg bg-default-200" />
          </Skeleton>
        </div>
      </div>
    </div>
  );
};

export default SkeletonProduct;
