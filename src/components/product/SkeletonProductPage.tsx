'use client';
import React from 'react';
import { Skeleton } from '@heroui/react';

const SkeletonProductPage = () => {
  return (
    <div className="container_page bg-white">
      <div className="pt-4">
        {/* Breadcrumbs skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <span>/</span>
          <Skeleton className="h-4 w-20 rounded" />
          <span>/</span>
          <Skeleton className="h-4 w-24 rounded" />
        </div>

        {/* Exchange of views - Mobile */}
        <div className="mt-4 flex items-center gap-3 lg:hidden">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>

        {/* Main content */}
        <div className="mt-4 flex w-full flex-col md:flex-row lg:mt-10 lg:gap-10">
          {/* Preview/Images - Left side */}
          <div className="w-full md:w-5/12 lg:w-[400px]">
            {/* Main image */}
            <Skeleton className="h-[300px] w-full rounded-xl lg:h-[400px]">
              <div className="h-full w-full rounded-xl bg-default-300" />
            </Skeleton>

            {/* Thumbnail images */}
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4].map((idx) => (
                <Skeleton key={idx} className="h-16 w-16 rounded-lg lg:h-20 lg:w-20">
                  <div className="h-full w-full rounded-lg bg-default-300" />
                </Skeleton>
              ))}
            </div>
          </div>

          {/* Product info - Right side */}
          <div className="mt-5 flex w-full flex-1 flex-col md:mt-0">
            {/* Title - Desktop */}
            <div className="hidden lg:block">
              <Skeleton className="mb-2 h-7 w-3/4 rounded lg:h-8">
                <div className="h-full w-full rounded bg-default-300" />
              </Skeleton>
              <Skeleton className="h-5 w-1/2 rounded">
                <div className="h-full w-full rounded bg-default-200" />
              </Skeleton>
            </div>

            {/* Exchange of views - Desktop */}
            <div className="mt-4 hidden items-center gap-3 lg:flex">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>

            <div className="flex w-full flex-col justify-between gap-10 lg:flex-row">
              <div className="mt-5 flex w-full flex-col gap-4 lg:mt-10">
                {/* Product ID and Brand */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <Skeleton className="h-14 w-14 rounded-lg lg:h-24 lg:w-24">
                    <div className="h-full w-full rounded-lg bg-default-300" />
                  </Skeleton>
                </div>

                {/* Short description */}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>

                {/* Colors */}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-20 rounded" />
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((idx) => (
                      <Skeleton key={idx} className="h-8 w-8 rounded-full">
                        <div className="h-full w-full rounded-full bg-default-300" />
                      </Skeleton>
                    ))}
                  </div>
                </div>

                {/* Short attributes */}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-24 rounded" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-4 w-32 rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warranty */}
                <Skeleton className="h-10 w-48 rounded-xl">
                  <div className="h-full w-full rounded-xl bg-default-300" />
                </Skeleton>
              </div>

              {/* Factor - Desktop */}
              <div className="hidden w-full lg:flex lg:max-w-[350px]">
                <div className="flex w-full flex-col gap-4 rounded-xl border border-gray-200 p-4">
                  <Skeleton className="h-6 w-32 rounded" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <div className="mt-4 flex items-center justify-between">
                    <Skeleton className="h-6 w-20 rounded" />
                    <Skeleton className="h-6 w-24 rounded" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl">
                    <div className="h-full w-full rounded-xl bg-default-300" />
                  </Skeleton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-8">
          <div className="w-full rounded-xl border border-gray-200 bg-[#FCFCFC] p-2">
            {/* Tabs header */}
            <div className="flex gap-2 border-b border-gray-200 pb-2 lg:gap-6">
              {[1, 2, 3, 4].map((idx) => (
                <Skeleton key={idx} className="h-10 w-32 rounded-lg lg:h-[59px] lg:w-[209px]">
                  <div className="h-full w-full rounded-lg bg-default-300" />
                </Skeleton>
              ))}
            </div>

            {/* Tab content */}
            <div className="mt-4 space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((idx) => (
                <Skeleton key={idx} className="h-4 w-full rounded">
                  <div className="h-full w-full rounded bg-default-200" />
                </Skeleton>
              ))}
            </div>
          </div>
        </div>

        {/* Related products carousel skeleton */}
        <div className="mt-4 lg:mt-16">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-32 rounded lg:h-8 lg:w-40">
              <div className="h-7 w-32 rounded bg-default-300 lg:h-8 lg:w-40" />
            </Skeleton>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 py-2 md:grid-cols-4 lg:mt-5 lg:grid-cols-5 lg:gap-3 lg:py-5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-[260px] w-full lg:h-[380px]">
                <Skeleton className="h-full w-full rounded-lg">
                  <div className="h-full w-full rounded-lg bg-default-300" />
                </Skeleton>
              </div>
            ))}
          </div>
        </div>

        {/* Factor - Mobile */}
        <div className="mt-8 flex w-full lg:hidden">
          <div className="flex w-full flex-col gap-4 rounded-xl border border-gray-200 p-4">
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-6 w-24 rounded" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl">
              <div className="h-full w-full rounded-xl bg-default-300" />
            </Skeleton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonProductPage;
