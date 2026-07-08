import React from 'react';

export default function SkeletonArticleCard() {
  return (
    <div className="skeleton-article-card flex min-h-[300px] flex-col gap-3 rounded-xl border-2 border-gray-100 bg-white p-3 shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 lg:min-h-[320px] lg:gap-4 lg:p-4">
      {/* Image Skeleton */}
      <div className="relative h-[160px] w-full overflow-hidden rounded-xl bg-gray-200 dark:bg-slate-800 lg:h-[180px]">
        <div className="shimmer absolute inset-0"></div>
      </div>

      {/* Category and Date Skeleton */}
      <div className="flex items-center justify-between">
        <div className="relative h-7 w-20 overflow-hidden rounded-lg bg-gray-200 dark:bg-slate-800 lg:h-8">
          <div className="shimmer absolute inset-0"></div>
        </div>
        <div className="relative h-4 w-24 overflow-hidden rounded bg-gray-200 dark:bg-slate-800 lg:h-5">
          <div className="shimmer absolute inset-0"></div>
        </div>
      </div>

      {/* Title Skeleton */}
      <div className="mt-1 space-y-2">
        <div className="relative h-[18px] w-full overflow-hidden rounded bg-gray-200 dark:bg-slate-800 lg:h-[20px]">
          <div className="shimmer absolute inset-0"></div>
        </div>
        <div className="relative h-[18px] w-3/4 overflow-hidden rounded bg-gray-200 dark:bg-slate-800 lg:h-[20px]">
          <div className="shimmer absolute inset-0"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
