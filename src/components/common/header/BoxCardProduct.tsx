import { addCommas } from '@/lib/fun';
import { Product } from '@/types/Home';
import React from 'react';
import Image from '../Image';
type Props = {
  showAction?: boolean;
  priceEnd?: boolean;
  onClick?: () => void;
  product: Product;
  className?: string;
};
const BoxCardProduct = ({ priceEnd, onClick, product, className }: Props) => {
  return (
    <button
      onClick={onClick}
      className={`flex h-fit w-full justify-between rounded-xl bg-zinc-100 !p-3 lg:!p-2 ${className}`}
    >
      <div className="flex flex-1 gap-3">
        {/* image */}
        <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-white lg:h-20 lg:w-20">
          <Image
            className="h-16 w-16"
            src={
              Array.isArray(product.images)
                ? product?.images[0]?.content?.path
                : product?.image?.link
            }
            alt={
              Array.isArray(product.images)
                ? // @ts-expect-error error
                  product?.images[0]?.content?.title || product?.name || ''
                : // @ts-expect-error error
                  product?.image?.title || product?.name || ''
            }
          />
        </div>
        <div className="flex w-full flex-1 flex-col justify-between">
          {/* link */}
          <p className="line-clamp-2 text-right font-medium text-xs leading-5 text-neutral-900">
            {product?.name}
          </p>
          {/* price */}
          <p className="text-end font-medium text-xs text-red-500 line-through">
            {product?.special_price ? `${product.price} تومان` : ''}
          </p>
          <div className={`flex items-center gap-1 ${priceEnd ? 'justify-end' : ''}`}>
            {Number(product?.price) === 0 ? (
              <p className="font-medium text-xs text-red-500">ناموجود</p>
            ) : (
              <>
                <span className="text-right font-reqular text-base text-neutral-900">
                  {product?.special_price
                    ? addCommas(Number(product?.special_price))
                    : addCommas(Number(product?.price))}
                </span>
                <span className="text-right font-reqular text-xs text-neutral-900">تومان</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default BoxCardProduct;
