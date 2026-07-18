'use client';
import React from 'react';
import CardProduct from '../common/CardProduct';
import useMedia from 'react-use/lib/useMedia';

type Product = {
  id?: string;
  product_name: string;
  image: {
    title: string;
    link: string;
  };
  product_price: {
    qty?: number;
    price: string;
    old_price?: string;
    from_date?: string | null;
    to_date?: string | null;
  };
};

type Props = {
  products: {
    title: string;
    items: Product[];
  };
  vitrinId?: number;
};

// ... (بقیه کد بدون تغییر)

const SpecialSectionDesktop = ({ products }: Props) => {
  const isMobile = useMedia('(max-width: 480px)', false);
  const isTablet = useMedia('(max-width: 768px)', false);

  const renderProductCard = (product: Product, index: number) => {
    const isCenterCard = index === 2;

    // Desktop explicit placement (lg):

    return (
      <div
        key={index}
        className={`row-span-3 flex h-full flex-col justify-between rounded-lg border ${index === 2 ? 'col-span-2 row-span-6' : ''} `}
      >
        <CardProduct
          className="relative !h-full !w-full flex-1 !justify-between overflow-hidden transition-all duration-300 hover:border-main"
          classImage={`mx-auto  ${
            isCenterCard
              ? '!w-[165px] !h-[165px] lg:!w-[90%] lg:!h-[440px] !object-fill lg:mt-4'
              : '!w-[105px] !h-[105px] lg:!w-[90%] lg:!h-[141px]'
          }`}
          classAction="absolute top-0"
          classItmsBottom="mt-6"
          stockQty={Number(product?.product_price?.qty)}
          imageQuality={isCenterCard ? 100 : 75}
          imageSizes={
            isCenterCard ? '(max-width: 768px) 165px, 600px' : '(max-width: 768px) 105px, 162px'
          }
          product={{
            name: product.product_name,
            image: product.image,
            price: Number(product.product_price.old_price),
            special_price: Number(product.product_price.price),
            qty: Number(product?.product_price?.qty),
            // @ts-expect-error error
            id: product.id,
          }}
        />
      </div>
    );
  };
  if (!Array.isArray(products?.items) || products?.items?.length === 0) return null;
  return (
    <div
      className={`grid gap-4 ${
        isMobile
          ? 'auto-rows-auto grid-cols-2'
          : isTablet
            ? 'auto-rows-auto grid-cols-6'
            : 'grid-cols-6 grid-rows-6'
      } `}
    >
      {products.items.map((product, index) => renderProductCard(product, index))}
    </div>
  );
};

export default SpecialSectionDesktop;
