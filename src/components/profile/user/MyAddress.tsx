'use client';
import TitleDashboard from '@/components/common/TitleDashboard';
import React, { useState } from 'react';
import { Add_Location_Icon_ } from '@/components/common/Icon';
import { useGetAddress } from '@/hooks/profile/useGetAddress';
import { Address } from '@/types/Home';
import CardAddress from '@/components/common/CardAddress';
import ActionAddress from '../address/ActionAddress';
import { Skeleton } from '@heroui/react';
type Props = {
  className?: string;
};
const MyAddress = ({ className }: Props) => {
  const { data, isPending } = useGetAddress();
  const [modal, setModal] = useState<{ open: boolean; info: Address | null }>({
    open: false,
    info: null,
  });
  return (
    <>
      <div className={className}>
        <TitleDashboard href="/profile/user/address" title="آدرس های من" />
        {isPending ? (
          <div className="mt-3 flex h-fit flex-col gap-4 rounded-xl bg-[#f5f5f5] p-3">
            {[1, 2].map((idx) => (
              <Skeleton key={idx} className="rounded-xl">
                <div className="h-24 w-full rounded-xl bg-gray-200" />
              </Skeleton>
            ))}
            <Skeleton className="mt-5 rounded-xl">
              <div className="h-12 w-full rounded-xl bg-gray-200" />
            </Skeleton>
          </div>
        ) : (
          <div className="mt-3 flex h-fit flex-col gap-4 rounded-xl bg-[#f5f5f5] p-3">
            {data?.map((addres: Address, idx: number) => (
              <CardAddress
                onEdit={() => setModal({ open: true, info: addres })}
                address={addres}
                key={idx}
              />
            ))}
            <button
              onClick={() => setModal({ open: true, info: null })}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-100"
            >
              <Add_Location_Icon_ className="block h-5 w-5 text-black" />
              <span className="text-right font-bold text-[15px] text-black">افزودن آدرس جدید</span>
            </button>
          </div>
        )}
      </div>
      {modal.open && <ActionAddress setModal={setModal} modal={modal} />}
    </>
  );
};

export default MyAddress;
