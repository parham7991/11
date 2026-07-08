'use client';
import React, { useEffect } from 'react';
import Title from './Title';
import useCheckoutStore from '@/store/checkout-store';
import { Coin_Icon } from '../common/Icon';
import { Spinner } from '@heroui/react';
import { usePayment } from '@/hooks/checkout/usePayment';

const PaymentMethod = () => {
  const { data, isPending, isSuccess } = usePayment();
  const { checkout, setCheckout } = useCheckoutStore();
  useEffect(() => {
    if (isSuccess) {
      setCheckout({
        payment_methood: Array.isArray(data) && data?.length >= 1 ? data[0] : null,
      });
    }
  }, [isSuccess]);
  return (
    <div>
      <Title title="نحوه پرداخت" Icon={Coin_Icon} />
      {isPending ? (
        <Spinner className="mt-3" />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.map((payment: { id: string; title: string }, idx: number) => (
            <button
              // @ts-expect-error error
              onClick={() => setCheckout({ payment_methood: payment })}
              key={idx}
              className={`flex h-9 items-center justify-center rounded-lg border ${
                Number(checkout.payment_methood?.id) === Number(payment.id)
                  ? 'bg-[#ffab00] text-white'
                  : 'border-stone-300 bg-neutral-50 text-zinc-400'
              }`}
            >
              <p className="text-right font-medium text-xs">{payment.title}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethod;
