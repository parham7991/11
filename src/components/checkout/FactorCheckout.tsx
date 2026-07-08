'use client';
import { addCommas } from '@/lib/fun';
import React, { useEffect, useState } from 'react';
import CardProductCart from '../cart/CardProductCart';
import { useGetCart } from '@/hooks/cart/useGetCart';
import { addToast } from '@heroui/react';
import Button from '../common/Button';
import useCheckoutStore from '@/store/checkout-store';
import { Product } from '@/types/Home';
import Link from 'next/link';
import { useCheckout } from '@/hooks/checkout/useCheckout';
import { useSession } from '@/lib/auth/useSession';
import { useRouter } from 'next/navigation';
import BaseDialog from '../common/BaseDialog';
import { Warrnig_Icon } from '../common/Icon';

const FactorCheckout = () => {
  const [show, setShow] = useState(false);
  const [showVpn, setShowVpn] = useState(false);
  const { mutate, isPending } = useCheckout();
  const { checkout } = useCheckoutStore();
  const { data, isSuccess } = useGetCart();
  const router = useRouter();
  const session = useSession();
  const proceedPayment = () => {
    if (Number(data?.quote?.total) > 100000000) return setShow(true);

    const mainData = {
      shipping_method_id: checkout.how_to_send.id,
      payment_gateway_id: checkout.payment_methood.id,
      code: session?.finger,
      user_id: session?.id,
      address_id: checkout.reciverAddress.id,
    };
    mutate({ data: mainData });
  };

  const onPay = () => {
    if (checkout.reciverAddress?.id == null)
      return addToast({
        title: 'لطفا   آدرس گیرنده را انتخاب کنید',
        color: 'danger',
      });
    if (checkout.how_to_send?.id === null)
      return addToast({
        title: 'لطفا نحوه ارسال محصول را انتخاب کنید',
        color: 'danger',
      });
    if (checkout.payment_methood?.id === null)
      return addToast({
        title: 'لطفا نحوه پرداخت محصول را انتخاب کنید',
        color: 'danger',
      });

    setShowVpn(true);
  };
  useEffect(() => {
    if (isSuccess && Number(data?.items.length) < 1) {
      router.push('/cart');
    }
  }, [isSuccess]);
  return (
    <>
      {/* products */}
      <div className="h-fit space-y-2 overflow-y-auto">
        {data?.items?.map((product: Product, idx: number) => (
          <CardProductCart
            containerLeftClass="!-mt-10"
            classImage="!w-28 !h-28 "
            className="!h-fit !flex-col !px-2 !py-3"
            key={idx}
            product={product}
          />
        ))}
      </div>

      {/* factor */}
      <div className="mt-10 flex flex-col-reverse gap-2 lg:flex-col lg:gap-5">
        {/* count & price */}
        <div className="flex h-fit w-full flex-col justify-between gap-2 rounded-lg bg-slate-100 p-3 lg:gap-5 lg:rounded-3xl">
          <p className="flex w-full items-center justify-between">
            {/* count */}
            <span className="block text-right font-bold text-sm text-neutral-400">
              قیمت کالا ها ( {data?.items?.length} )
            </span>
            <span className="flex items-center gap-1">
              {/* price */}
              <span className="text-right font-medium text-lg text-neutral-900 lg:text-xl">
                {' '}
                {addCommas(Number(data?.quote?.total_without_discount))}
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
              <span className="text-right font-medium text-lg text-red-500 lg:text-xl">
                {addCommas(Number(data?.quote?.discount))}
              </span>
              <span className="text-right font-light text-xs text-red-500">تومان</span>
            </span>
          </p>
          <p className="flex w-full items-center justify-between">
            {/* count */}
            <span className="block text-right font-bold text-sm text-neutral-400">
              هزینه حمل و نقل
            </span>
            <span className="flex items-center gap-1">
              {/* price */}
              <span className="text-right font-medium text-[16px] text-neutral-900">
                {' '}
                {checkout?.how_to_send?.id
                  ? Number(checkout.how_to_send.price) === 0
                    ? 'پس کرایه'
                    : `${addCommas(Number(checkout.how_to_send.price))}`
                  : 'انتخاب نشده'}
              </span>
              <span className="text-right font-light text-xs text-neutral-900">تومان</span>
            </span>
          </p>
          {/* total cart */}
          <p className="flex w-full items-center justify-between">
            {/* count */}
            <span className="block text-right font-bold text-sm text-neutral-400">
              جمع سبد خرید
            </span>
            <span className="flex items-center gap-1">
              {/* price */}
              <span className="text-right font-medium text-lg text-neutral-900 lg:text-xl">
                {addCommas(Number(data?.quote?.total))}
              </span>
              <span className="text-right font-light text-xs text-neutral-900">تومان</span>
            </span>
          </p>
          <div className="bg-blue h-px w-full" />
          <p className="flex w-full items-center justify-between">
            {/* count */}
            <span className="block text-right font-bold text-sm text-neutral-400">مبلغ نهایی</span>
            <span className="flex items-center gap-1">
              {/* price */}
              <span className="text-right font-medium text-lg text-neutral-900 lg:text-xl">
                {addCommas(
                  Number(data?.quote?.total) + Number(checkout.how_to_send.price)
                )}
              </span>
              <span className="text-right font-light text-xs text-neutral-900">تومان</span>
            </span>
          </p>

          <div className="flex flex-col items-center gap-2 lg:flex-row lg:gap-10">
            <Link
              prefetch={false}
              href={'/cart'}
              className="flex h-9 w-full items-center justify-center rounded-md !border !border-zinc-900 !py-5 font-medium"
            >
              <span className="text-center font-bold text-xs text-zinc-900">بازگشت</span>
            </Link>
            <Button
              isLoading={isPending}
              onClick={onPay}
              className="h-9 w-full rounded-md !border !border-blue-500 !py-5"
            >
              <span className="text-center font-bold text-xs text-blue-500">پرداخت نهایی</span>
            </Button>
          </div>
        </div>
      </div>
      {show && (
        <BaseDialog
          onClose={() => setShow(false)}
          onClickFooter={() => {
            window.location.href = 'tel:02143000240';
          }}
          nameBtnFooter={`تماس با پشتیبانی(02143000240)`}
          size="lg"
          isOpen
          title="محدودیت در ثبت سفارش"
        >
          <div className="flex flex-col items-center justify-center pb-5">
            <Warrnig_Icon className="block h-14 w-14 text-yellow-500" />
            <p className="pt-3 text-center font-medium leading-8">
              محدودیت در پرداخت سفارش‌‌های بالای
              <span className="font-bold text-main"> ۱۰۰ میلیون تومان</span>;
              <br />
              لطفا برای ثبت سفارش با تیم پشتیبانی تماس بگیرید.
            </p>
          </div>
        </BaseDialog>
      )}
      {showVpn && (
        <BaseDialog
          onClose={() => setShowVpn(false)}
          onClickFooter={() => {
            setShowVpn(false);
            proceedPayment();
          }}
          nameBtnFooter="تایید و ادامه پرداخت"
          size="md"
          isOpen
          title="توصیه امنیت پرداخت"
        >
          <div className="flex flex-col items-center justify-center pb-5">
            <Warrnig_Icon className="block h-14 w-14 text-yellow-500" />
            <p className="pt-3 text-center font-medium leading-8">
              لطفاً برای تجربه بهتر و موفقیت پرداخت، از{' '}
              <span className="font-bold">خاموش بودن فیلترشکن</span> خود مطمئن شوید.
            </p>
          </div>
        </BaseDialog>
      )}
    </>
  );
};

export default FactorCheckout;
