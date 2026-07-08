import React from 'react';

export default function SkeletonShortNewsCard() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border-2 border-gray-100 bg-white p-2 shadow-md lg:gap-3 lg:p-2.5">
      {/* Image Skeleton */}
      <div className="relative !h-[65px] !w-[100px] !min-w-[100px] !flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-200 lg:!h-[75px] lg:!w-[120px] lg:!min-w-[120px]">
        <div className="shimmer absolute inset-0"></div>
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Title Skeleton */}
        <div className="space-y-1.5">
          <div className="relative h-[16px] w-full overflow-hidden rounded bg-gray-200 lg:h-[18px]">
            <div className="shimmer absolute inset-0"></div>
          </div>
          <div className="relative h-[16px] w-3/4 overflow-hidden rounded bg-gray-200 lg:h-[18px]">
            <div className="shimmer absolute inset-0"></div>
          </div>
        </div>

        {/* Date Skeleton */}
        <div className="relative h-[14px] w-20 overflow-hidden rounded bg-gray-200 lg:h-[16px]">
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
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          );
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
