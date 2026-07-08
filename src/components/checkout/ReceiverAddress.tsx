'use client';
import React, { useEffect, useState } from 'react';
import Title from './Title';
import { Swiper, SwiperSlide } from 'swiper/react';
import useCheckoutStore from '@/store/checkout-store';
import { AddCartCricle_Icon, Truck_Icon } from '../common/Icon';
import CardAddress from '../common/CardAddress';
import 'swiper/css';
import 'swiper/css/pagination';
import { useGetAddress } from '@/hooks/profile/useGetAddress';
import ActionAddress from '../profile/address/ActionAddress';
import { Address } from '@/types/Home';
import { useMedia } from 'react-use';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@heroui/react';
const ReceiverAddress = () => {
  const isMobile = useMedia('(max-width: 480px)', false);
  const { data, isSuccess, isPending } = useGetAddress();
  const router = useRouter();
  const [open, setOpen] = useState<{ open: boolean; info: Address | null }>({
    open: false,
    info: null,
  });
  const { setCheckout, checkout } = useCheckoutStore();
  const findAddress = data?.find(
    (address: Address) =>
      address.id === checkout?.reciverAddress?.id ||
      (checkout?.reciverAddress?.id == null && address.is_default === 1)
  );
  useEffect(() => {
    if (isSuccess) {
      setCheckout({
        reciverAddress: findAddress,
      });
    }
  }, [isSuccess]);

  const onActionAddress = (address?: Address) => {
    if (isMobile) {
      router.push(`/profile/user/address/${address?.id ? address?.id : 'new'}`);
    } else {
      setOpen({
        open: true,
        info: address ? address : null,
      });
    }
  };
  return (
    <div className="">
      <Title title="آدرس گیرنده" Icon={Truck_Icon} />
      {isPending ? (
        <>
          <div className="relative mt-6 flex w-[98%] items-center gap-2">
            <Swiper
              dir="rtl"
              slidesPerView={1.5}
              spaceBetween={8}
              wrapperClass="!w-full"
              className="!w-full"
            >
              {[1, 2].map((idx) => (
                <SwiperSlide key={idx} className="w-full">
                  <Skeleton className="rounded-lg">
                    <div className="h-[150px] w-full rounded-lg bg-gray-200" />
                  </Skeleton>
                </SwiperSlide>
              ))}
            </Swiper>
            <Skeleton className="rounded-xl">
              <div className="h-[150px] w-14 min-w-14 rounded-xl bg-gray-200" />
            </Skeleton>
          </div>
          <div className="pt-4">
            <Skeleton className="rounded">
              <div className="h-5 w-48 rounded bg-gray-200" />
            </Skeleton>
          </div>
        </>
      ) : (
        <>
          <div className="relative mt-6 flex w-[98%] items-center">
            <Swiper
              dir="rtl"
              slidesPerView={1.5}
              spaceBetween={8}
              wrapperClass="!w-full"
              className="!w-full"
            >
              {data?.map((address: Address, idx: number) => (
                <SwiperSlide
                  className="w-full"
                  key={idx}
                  onClick={() => setCheckout({ reciverAddress: address })}
                >
                  <CardAddress onEdit={() => onActionAddress(address)} address={address} />
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              onClick={() => onActionAddress()}
              className={`flex !h-[150px] w-14 min-w-14 flex-col items-center justify-center gap-3 rounded-xl border border-black bg-neutral-50 shadow`}
            >
              <p className="text-center font-bold text-xs leading-6 text-black">
                افزودن
                <br />
                آدرس
                <br />
                جدید
              </p>
              <AddCartCricle_Icon />
            </button>
          </div>

          <div className="pt-4 font-medium text-[14px] text-zinc-400 lg:text-[16px]">
            آدرس انتخاب شده:{' '}
            <span className="font-light text-zinc-600">
              {findAddress?.region}-{findAddress?.city}-{findAddress?.street}
            </span>
          </div>
        </>
      )}

      <ActionAddress modal={open} setModal={setOpen} />
    </div>
  );
};

export default ReceiverAddress;
