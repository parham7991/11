'use client';
import HowToSend from '@/components/checkout/HowToSend';
import ReceiverAddress from '@/components/checkout/ReceiverAddress';
import PaymentMethod from '@/components/checkout/PaymentMethod';
import React from 'react';
import FactorCheckout from '@/components/checkout/FactorCheckout';
import { useShipping } from '@/hooks/checkout/useShipping';
import { usePayment } from '@/hooks/checkout/usePayment';
import { Spinner } from '@heroui/react';

const Page = () => {
  const { isPending } = useShipping();
  const { isPending: isPendingPayment } = usePayment();
  if (isPending || isPendingPayment)
    return <Spinner className="mt-10 flex items-center justify-center" />;

  return (
    <div className="container_page bg-white pb-10">
      <div className="mx-auto flex flex-col gap-10 lg:flex-row lg:pt-6">
        <div className="flex flex-1 flex-col gap-8 overflow-hidden">
          {/* <ReceiverInformation /> */}
          <ReceiverAddress />
          <HowToSend />
          <PaymentMethod />
        </div>

        <div className="flex-1">
          <FactorCheckout />
        </div>
      </div>
    </div>
  );
};

export default Page;
