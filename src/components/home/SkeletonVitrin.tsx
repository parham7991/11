import React from 'react';
import SkeletonProduct from '../common/Skeleton/SkeletonProduct';
const SkeletonVitrin = () => {
  return (
    <div className="container_page mt-10 flex items-center gap-3 overflow-auto">
      {new Array(14).fill(14).map((_, idx) => (
        <SkeletonProduct key={idx} />
      ))}
    </div>
  );
};

export default SkeletonVitrin;
