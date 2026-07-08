import React from 'react';

interface SpecialSectionSkeletonProps {
  className?: string;
}

const SpecialSectionSkeleton: React.FC<SpecialSectionSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`container_page overflow-hidden ${className}`}>
      {/* Title */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-6 w-48 animate-pulse rounded bg-blue-100"></div>
        <div className="h-4 w-24 animate-pulse rounded bg-blue-100"></div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3">
              {/* Image */}
              <div className="mb-3 h-32 w-full animate-pulse rounded bg-blue-100"></div>

              {/* Title */}
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-blue-100"></div>

              {/* Price */}
              <div className="mb-2 h-5 w-20 animate-pulse rounded bg-blue-100"></div>

              {/* Rating */}
              <div className="h-4 w-16 animate-pulse rounded bg-blue-100"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 bg-white p-4">
              {/* Image */}
              <div className="mb-4 h-48 w-full animate-pulse rounded bg-blue-100"></div>

              {/* Title */}
              <div className="mb-3 h-5 w-full animate-pulse rounded bg-blue-100"></div>

              {/* Price */}
              <div className="mb-3 h-6 w-24 animate-pulse rounded bg-blue-100"></div>

              {/* Rating */}
              <div className="mb-3 h-4 w-20 animate-pulse rounded bg-blue-100"></div>

              {/* Button */}
              <div className="h-10 w-full animate-pulse rounded bg-blue-100"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpecialSectionSkeleton;
