'use client';

import React from 'react';
import Image from '../common/Image';

interface ProductCardProps {
  product: any;
  onRemove?: (productId: number) => void;
  showRemoveButton?: boolean;
  size?: 'desktop' | 'mobile';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onRemove,
  showRemoveButton = false,
  size = 'desktop',
}) => {
  const getProductImage = (product: any) => {
    // Check if product has images array with small_image
    if (product.images && product.images.length > 0) {
      const smallImage = product.images.find((img: any) => img.content?.small_image === 1);
      if (smallImage?.content?.path) {
        return smallImage.content.path;
      }
      // If no small_image found, use the first image
      if (product.images[0]?.content?.path) {
        return product.images[0].content.path;
      }
    }

    // Fallback to old image structure
    if (product.image?.link) {
      return product.image.link;
    }

    return '/images/no-image.png';
  };

  const getProductName = (product: any) => {
    return product.name || 'نامشخص';
  };

  const isDesktop = size === 'desktop';
  const containerClass = isDesktop
    ? 'relative flex flex-col items-center bg-white p-4 border border-gray-100 rounded-2xl shadow-sm h-[180px]'
    : 'relative flex-shrink-0 w-32 bg-white rounded-xl shadow-sm border border-gray-100 p-3 overflow-visible';

  const imageClass = isDesktop
    ? 'w-24 h-24 mb-3 overflow-hidden'
    : 'w-20 h-20 mx-auto mb-2 overflow-hidden rounded-lg';

  const nameClass = isDesktop
    ? 'text-xs font-light text-black font-yekan line-clamp-2 text-center leading-tight flex-1 flex items-center'
    : 'text-xs font-medium text-gray-800 font-yekan text-center line-clamp-2 leading-tight';

  const removeButtonClass = isDesktop
    ? 'absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10'
    : 'absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10';

  const removeIconClass = isDesktop ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <div className={containerClass}>
      {showRemoveButton && onRemove && (
        <button
          onClick={() => product.id && onRemove(product.id)}
          className={removeButtonClass}
          title="حذف محصول"
        >
          <svg className={removeIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      <div className={imageClass}>
        <Image
          src={getProductImage(product)}
          alt={getProductName(product)}
          className="h-full w-full object-cover"
          sizes={isDesktop ? '96px' : '80px'}
        />
      </div>

      <h4 className={nameClass}>{getProductName(product)}</h4>
    </div>
  );
};

export default ProductCard;
