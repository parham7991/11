'use client';
import React from 'react';
import { Skeleton } from '@heroui/react';
import SkeletonProduct from '../common/Skeleton/SkeletonProduct';

const SkeletonCategoryPage = () => {
  return (
    <div className="container_page">
      {/* Breadcrumbs skeleton */}
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded" />
        <span>/</span>
        <Skeleton className="h-4 w-20 rounded" />
        <span>/</span>
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      {/* Category title and description */}
      <div className="mt-5 flex flex-col gap-3">
        <Skeleton className="h-8 w-64 rounded lg:h-10 lg:w-80">
          <div className="h-full w-full rounded bg-default-300" />
        </Skeleton>
        <Skeleton className="h-4 w-full rounded lg:w-3/4">
          <div className="h-full w-full rounded bg-default-200" />
        </Skeleton>
        <Skeleton className="h-4 w-full rounded lg:w-2/3">
          <div className="h-full w-full rounded bg-default-200" />
        </Skeleton>
      </div>

      {/* Main content */}
      <div className="mt-5 flex flex-col items-start gap-3 lg:mt-10 lg:flex-row lg:gap-6">
        {/* Sidebar - Desktop only */}
        <div className="sticky top-0 hidden !w-[300px] min-w-[300px] items-center gap-3 lg:flex">
          <div className="flex h-[90vh] min-h-[500px] w-full flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4">
            {/* Filter title */}
            <Skeleton className="h-6 w-32 rounded">
              <div className="h-full w-full rounded bg-default-300" />
            </Skeleton>

            {/* Filter sections */}
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <Skeleton className="h-5 w-24 rounded">
                  <div className="h-full w-full rounded bg-default-300" />
                </Skeleton>
                <div className="space-y-2">
                  {[1, 2, 3].map((subIdx) => (
                    <div key={subIdx} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded">
                        <div className="h-full w-full rounded bg-default-200" />
                      </Skeleton>
                      <Skeleton className="h-4 w-full rounded">
                        <div className="h-full w-full rounded bg-default-200" />
                      </Skeleton>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <div className="w-full">
          {/* Sort and view options - Desktop */}
          <div className="mb-4 hidden items-center justify-between lg:flex">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-32 rounded-lg">
                <div className="h-full w-full rounded-lg bg-default-300" />
              </Skeleton>
              <Skeleton className="h-10 w-32 rounded-lg">
                <div className="h-full w-full rounded-lg bg-default-300" />
              </Skeleton>
            </div>
            <Skeleton className="h-10 w-24 rounded-lg">
              <div className="h-full w-full rounded-lg bg-default-300" />
            </Skeleton>
          </div>

          {/* Mobile filter button */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Skeleton className="h-10 w-28 rounded-lg">
              <div className="h-full w-full rounded-lg bg-default-300" />
            </Skeleton>
            <Skeleton className="h-10 w-28 rounded-lg">
              <div className="h-full w-full rounded-lg bg-default-300" />
            </Skeleton>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-3">
            {Array.from({ length: 20 }).map((_, idx) => (
              <div key={idx} className="h-[260px] w-full lg:h-[380px]">
                <SkeletonProduct />
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((idx) => (
              <Skeleton key={idx} className="h-10 w-10 rounded-lg">
                <div className="h-full w-full rounded-lg bg-default-300" />
              </Skeleton>
            ))}
          </div>
        </div>
      </div>

      {/* Category description - Bottom */}
      <div className="mt-10 flex flex-col gap-2">
        <Skeleton className="h-6 w-48 rounded">
          <div className="h-full w-full rounded bg-default-300" />
        </Skeleton>
        <Skeleton className="h-4 w-full rounded">
          <div className="h-full w-full rounded bg-default-200" />
        </Skeleton>
        <Skeleton className="h-4 w-full rounded">
          <div className="h-full w-full rounded bg-default-200" />
        </Skeleton>
        <Skeleton className="h-4 w-3/4 rounded">
          <div className="h-full w-full rounded bg-default-200" />
        </Skeleton>
      </div>
    </div>
  );
};

export default SkeletonCategoryPage;
