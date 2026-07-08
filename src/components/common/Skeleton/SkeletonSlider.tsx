import { Skeleton } from '@heroui/react';
import React from 'react';

const SkeletonSlider = () => {
  return (
    <div>
      <Skeleton className="rounded-lg">
        <div className="h-[180px] rounded-lg bg-default-300 lg:h-[400px]" />
      </Skeleton>
    </div>
  );
};

export default SkeletonSlider;
