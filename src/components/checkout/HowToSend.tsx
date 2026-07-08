'use client';
import { addCommas } from '@/lib/fun';
import React from 'react';
import Title from './Title';
import useCheckoutStore from '@/store/checkout-store';
import { Location_Icon_ } from '../common/Icon';
import { useShipping } from '@/hooks/checkout/useShipping';
import { Spinner } from '@heroui/react';
type Shipping = {
  id: number;
  title: string;
  description: string;
  price: number;
};
const HowToSend = () => {
  const { data, isPending } = useShipping();
  const { checkout, setCheckout } = useCheckoutStore();
  return (
    <div>
      <Title title="نحوه ارسال" Icon={Location_Icon_} />
      {isPending ? (
        <Spinner className="mt-3" />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.map((shipping: Shipping, idx: number) => (
            <button
              key={idx}
              onClick={() => setCheckout({ how_to_send: shipping })}
              className={`flex h-9 items-center justify-center rounded-lg border ${
                checkout.how_to_send?.id === shipping.id
                  ? 'bg-[#ffab00] text-white'
                  : 'border-stone-300 bg-neutral-50 text-zinc-400'
              }`}
            >
              <p className="px-px text-right font-medium text-xs">{shipping.title}</p>
            </button>
          ))}
        </div>
      )}
      <div className="mt-4">
        <span className="font-medium text-sm text-zinc-400">هزینه ارسال :</span>
        <span className="font-medium text-sm text-zinc-400"> </span>
        <span className="font-medium text-sm text-zinc-900">
          {checkout?.how_to_send?.id
            ? Number(checkout.how_to_send.price) === 0
              ? 'پس کرایه'
              : `${addCommas(Number(checkout.how_to_send.price))} ${'تومان'}`
            : 'انتخاب نشده'}
        </span>
      </div>
      <div className="mt-4">
        <span className="font-medium text-sm text-zinc-400">توضیحات: </span>
        <span className="font-medium text-sm text-zinc-400"> </span>
        <span className="font-medium text-sm text-zinc-900">
          {checkout?.how_to_send?.description}
        </span>
      </div>
    </div>
  );
};

export default HowToSend;
