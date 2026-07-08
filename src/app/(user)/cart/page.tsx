'use client';

import CardProductCart from '@/components/cart/CardProductCart';
import EmptyCart from '@/components/cart/EmptyCart';
import Invoice from '@/components/cart/Invoice';
import { useGetCart } from '@/hooks/cart/useGetCart';
import { Product } from '@/types/Home';
import { Spinner } from '@heroui/react';
import React from 'react';

const Cart = () => {
  const { data, isPending } = useGetCart();
  return (
    <div className="container_page bg-white pb-10">
      {isPending ? (
        <Spinner
          classNames={{ base: 'flex justify-center items-center py-20', label: 'font-medium' }}
          label="در حال انتقال به سبد خرید ..."
        />
      ) : (
        <div className="mx-auto flex flex-col gap-5 pt-9 lg:flex-row lg:gap-16">
          {data?.items?.length > 0 ? (
            <div className="flex-1 space-y-5">
              {data?.items?.map((product: Product, idx: number) => (
                <CardProductCart
                  containerLeftClass="!-mt-10"
                  className="!h-fit !flex-col !px-2 !py-3"
                  product={product}
                  key={idx}
                />
              ))}
            </div>
          ) : (
            <EmptyCart />
          )}
          <Invoice />
        </div>
      )}
    </div>
  );
};

export default Cart;
