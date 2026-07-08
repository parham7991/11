'use client';
import BackPrevPage from '@/components/common/BackPrevPage';
import CardAddress from '@/components/common/CardAddress';
import { Add_Location_Icon_ } from '@/components/common/Icon';
import EmptyAddress from '@/components/empty/EmptyAddress';
import ActionAddress from '@/components/profile/address/ActionAddress';
import { useGetAddress } from '@/hooks/profile/useGetAddress';
import { Address } from '@/types/Home';
import { Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useMedia } from 'react-use';

const Page = () => {
  const isMobile = useMedia('(max-width: 480px)', false);
  const { data, isLoading } = useGetAddress();
  const [modal, setModal] = useState<{ open: boolean; info: Address | null }>({
    open: false,
    info: null,
  });

  const router = useRouter();

  const onActionAddress = () => {
    if (isMobile) {
      router.push(`/profile/user/address/new`);
    } else {
      setModal({
        open: true,
        info: null,
      });
    }
  };
  return (
    <>
      <div>
        <BackPrevPage title="آدرس‌ها" />
        {isLoading ? (
          <Spinner className="mt-10 flex items-center justify-center" />
        ) : (
          <div className="mt-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <p className="font-medium text-[14px] text-[#0C0C0C] lg:text-[18px]">لیست آدرس‌ها</p>{' '}
              <button
                onClick={onActionAddress}
                className="flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-100 px-3 lg:h-12"
              >
                <Add_Location_Icon_ className="block h-5 w-5 text-black" />
                <span className="text-right font-medium text-[12px] text-black lg:text-[15px]">
                  افزودن آدرس جدید
                </span>
              </button>{' '}
            </div>
            {data?.length >= 1 ? (
              <div className="mt-10 grid gap-3 lg:mt-4 lg:grid-cols-2">
                {data?.map((address: Address, idx: number) => (
                  <CardAddress
                    onEdit={() => setModal({ info: address, open: true })}
                    address={address}
                    key={idx}
                  />
                ))}
              </div>
            ) : (
              <EmptyAddress setModal={setModal} />
            )}
          </div>
        )}
      </div>
      {modal.open && <ActionAddress setModal={setModal} modal={modal} />}
    </>
  );
};

export default Page;
