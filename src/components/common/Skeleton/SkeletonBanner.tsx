import { Card, Skeleton } from '@heroui/react';
import React from 'react';

const SkeletonBanner = () => {
  return (
    <div className="container_page flex flex-col items-center gap-4 lg:flex-row lg:gap-10">
      {new Array(3).fill(3).map((_, idx) => (
        <Card key={idx} className="w-full flex-1 border border-gray-300 p-2">
          <Skeleton className="rounded-lg">
            <div className="h-[140px] rounded-lg bg-default-300 lg:h-[210px]" />
          </Skeleton>
        </Card>
      ))}
    </div>
  );
};

export default SkeletonBanner;
