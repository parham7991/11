'use client';

import React from 'react';

interface ProductInfoCardProps {
  product: any;
  children: React.ReactNode;
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({ product, children }) => {
  const getProductName = (product: any) => {
    return product.name || 'نامشخص';
  };

  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
      <div className="font-yekan mb-1 truncate font-medium text-xs text-gray-600">
        {getProductName(product)}
      </div>
      <div className="text-right">{children}</div>
    </div>
  );
};

export default ProductInfoCard;
