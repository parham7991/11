'use client';
import { addCommas } from '@/lib/fun';
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Button from '../common/Button';
import { useGetCart } from '@/hooks/cart/useGetCart';
import { useGetSession } from '@/hooks/auth/useGetSession';
import BaseDialog from '../common/BaseDialog';
import { User_Icon } from '../common/Icon';

const Invoice = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const { session, isLoading } = useGetSession();
  const { data } = useGetCart();
  const router = useRouter();

  const hasToken = Boolean(session?.accessToken);
  const hasFirstName = Boolean(session?.first_name);

  const onRedirect = () => {
    if (isLoading || isButtonLoading) return;
    setIsButtonLoading(true);
    if (!hasToken) {
      router.push(`/auth?page=${pathname}`);
    } else if (hasFirstName) {
      router.push('/checkout/');
    } else {
      setOpen(true);
      setIsButtonLoading(false);
    }
  };
  return (
    <div className="flex flex-col-reverse gap-5 lg:w-80 lg:flex-col">
      {/* count & price */}
      <div className="flex h-fit w-full flex-col justify-between gap-5 rounded-lg bg-slate-100 p-3 lg:rounded-3xl">
        <p className="flex w-full items-center justify-between">
          {/* count */}
          <span className="block text-right font-bold text-sm text-neutral-400">
            قیمت کالا ها ( {data?.items?.length} )
          </span>
          <span className="flex items-center gap-1">
            {/* price */}
            <span className="text-right font-medium text-xl text-neutral-900">
              {addCommas(Number(data?.quote?.total_without_discount ?? 0))}
            </span>
            <span className="text-right font-light text-xs text-neutral-900">تومان</span>
          </span>
        </p>

        {/* discount  */}
        <p className="flex w-full items-center justify-between">
          {/* count */}
          <span className="block text-right font-bold text-sm text-red-500">میزان تخفیف</span>
          <span className="flex items-center gap-1">
            {/* price */}
            <span className="text-right font-medium text-xl text-red-500">
              {addCommas(Number(data?.quote?.discount ?? 0))}
            </span>
            <span className="text-right font-light text-xs text-red-500">تومان</span>
          </span>
        </p>

        {/* total cart */}
        <p className="flex w-full items-center justify-between">
          {/* count */}
          <span className="block text-right font-bold text-sm text-neutral-400">جمع سبد خرید</span>
          <span className="flex items-center gap-1">
            {/* price */}
            <span className="text-right font-medium text-xl text-neutral-900">
              {addCommas(Number(data?.quote?.total ?? 0))}
            </span>
            <span className="text-right font-light text-xs text-neutral-900">تومان</span>
          </span>
        </p>
        <div className="bg-blue h-px w-full" />

        <Button
          disabled={Number(data?.items?.length) === 0 || isLoading || isButtonLoading}
          isLoading={isLoading || isButtonLoading}
          onClick={onRedirect}
          className="h-9 w-full rounded-md !border !border-blue-500 !py-5"
        >
          <span className="text-center font-bold text-xs text-blue-500">ادامه فرایند خرید</span>
        </Button>
      </div>

      {open ? (
        <BaseDialog
          onClose={() => setOpen(false)}
          onClickFooter={() => {
            router.push(`/profile/user/personal-information?page=${pathname}`);
            setOpen(false);
          }}
          size="lg"
          nameBtnFooter="تکمیل اطلاعات"
          isOpen={open}
          title="هشدار"
        >
          <div className="py-5">
            <User_Icon className="mx-auto block h-14 w-14 text-main" />
            <p className="mt-5 text-center font-medium text-gray-500">
              برای ادامه فرایند خرید، لطفا اطلاعات پروفایل خود را تکمیل کنید و سپس خرید خود را انجام
              دهید
            </p>
          </div>
        </BaseDialog>
      ) : null}
    </div>
  );
};

export default Invoice;
