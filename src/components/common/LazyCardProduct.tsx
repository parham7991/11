'use client';
import React from 'react';
import CardProduct from './CardProduct';
import { Product } from '@/types/Home';

interface LazyCardProductProps {
  product: Product;
  className?: string;
  classImage?: string;
  classAction?: string;
  classItmsBottom?: string;
  isSpical?: boolean;
}

const LazyCardProduct: React.FC<LazyCardProductProps> = ({
  product,
  className,
  classImage,
  classAction,
  classItmsBottom,
  isSpical,
}) => {
  return (
    <div className="h-full">
      <CardProduct
        product={product}
        className={className}
        classImage={classImage}
        classAction={classAction}
        classItmsBottom={classItmsBottom}
        isSpical={isSpical}
      />
    </div>
  );
};

export default LazyCardProduct;
