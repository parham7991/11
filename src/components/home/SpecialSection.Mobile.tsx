'use client';
import React, { useMemo } from 'react';
import CardProduct from '../common/CardProduct';

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
};

const SpecialSectionMobile = ({ products }: Props) => {
  if (!Array.isArray(products?.items) || products.items.length === 0) return null;

  // انتخاب کارت وسط: اگر آیتم سوم وجود دارد همان، در غیر اینصورت اولین آیتم
  const centerItem = products.items[2] ?? products.items[0];

  // ساخت استخر آیتم‌ها بدون کارت وسط
  const pool = useMemo(() => {
    return products.items.filter((it, idx) => (products.items[2] ? idx !== 2 : idx !== 0));
  }, [products.items]);

  // شافل ساده سپس انتخاب 4 آیتم: 2 بالا + 2 پایین
  const { topItems, bottomItems } = useMemo(() => {
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const top = arr.slice(0, 2);
    const bottom = arr.slice(2, 4);
    return { topItems: top, bottomItems: bottom };
  }, [pool]);

  return (
    <div className="mt-5 grid auto-rows-auto grid-cols-2 gap-4">
      {/* بالا: 4 آیتم رندوم */}
      {topItems.map((product, index) => (
        <div key={`${product?.id ?? product?.product_name}-top-${index}`} className="col-span-1">
          <CardProduct
            className="relative !h-full !w-full flex-1 !justify-between overflow-hidden rounded-lg border border-[#eee] transition-all duration-300 hover:border-main"
            classImage={'mx-auto !w-[105px] !h-[105px]'}
            classAction="absolute top-0"
            classItmsBottom="mt-6"
            imageQuality={75}
            imageSizes={'105px'}
            product={{
              name: product.product_name,
              image: product.image,
              price: Number(product.product_price.old_price),
              special_price: Number(product.product_price.price),
              qty: Number(product?.product_price?.qty),
              // @ts-expect-error id can be undefined in some feeds
              id: product.id,
            }}
          />
        </div>
      ))}

      {/* کارت وسط */}
      <div className="col-span-2">
        <CardProduct
          className="relative !h-full !w-full flex-1 !justify-between overflow-hidden rounded-lg border border-[#eee] transition-all duration-300 hover:border-main"
          classImage={'mx-auto !w-[180px] !h-[180px]'}
          classAction="absolute top-0"
          classItmsBottom="mt-3"
          imageQuality={100}
          imageSizes={'360px'}
          product={{
            name: centerItem.product_name,
            image: centerItem.image,
            price: Number(centerItem.product_price.old_price),
            special_price: Number(centerItem.product_price.price),
            qty: Number(centerItem?.product_price?.qty),
            // @ts-expect-error id can be undefined in some feeds
            id: centerItem.id,
          }}
        />
      </div>

      {/* پایین: 2 آیتم رندوم */}
      {bottomItems.map((product, index) => (
        <div key={`${product?.id ?? product?.product_name}-bottom-${index}`} className="col-span-1">
          <CardProduct
            className="relative !h-full !w-full flex-1 !justify-between overflow-hidden rounded-lg border border-[#eee] transition-all duration-300 hover:border-main"
            classImage={'mx-auto !w-[105px] !h-[105px]'}
            classAction="absolute top-0"
            classItmsBottom="mt-6"
            imageQuality={75}
            imageSizes={'105px'}
            product={{
              name: product.product_name,
              image: product.image,
              price: Number(product.product_price.old_price),
              special_price: Number(product.product_price.price),
              qty: Number(product?.product_price?.qty),
              // @ts-expect-error id can be undefined in some feeds
              id: product.id,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default SpecialSectionMobile;
