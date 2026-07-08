import React from 'react';

interface MenuSkeletonProps {
  className?: string;
}

const MenuSkeleton: React.FC<MenuSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-main ${className}`}>
      <div className="container_page relative hidden h-16 w-full items-center gap-4 lg:flex lg:px-6">
        {/* Category Menu Button Skeleton */}
        <div className="flex h-10 w-32 animate-pulse items-center gap-3 rounded bg-blue-500/20 px-3">
          <div className="h-6 w-6 rounded bg-blue-400/30"></div>
          <div className="h-4 w-16 rounded bg-blue-400/30"></div>
        </div>

        {/* Menu Items Skeleton */}
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="flex h-10 w-20 animate-pulse items-center justify-center rounded bg-blue-500/20 px-3"
          >
            <div className="h-4 w-16 rounded bg-blue-400/30"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuSkeleton;
