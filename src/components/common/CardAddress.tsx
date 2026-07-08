'use client';
import useCheckoutStore from '@/store/checkout-store';
import React, { useState } from 'react';
import { Check_Icon, Delete_Icon, Edit_Icon } from './Icon';
import { Address } from '@/types/Home';
import DeleteAddress from '../profile/address/DeleteAddress';
interface Props {
  address: Address;
  onEdit?: () => void;
}
const CardAddress = ({ address, onEdit }: Props) => {
  const { checkout } = useCheckoutStore();
  const [modal, setModal] = useState<{ open: boolean; info: Address | null }>({
    open: false,
    info: null,
  });

  return (
    <>
      <div
        className={`h-[150px] !w-full cursor-pointer rounded-lg border-[1.2px] p-1 lg:rounded-2xl lg:p-3 ${
          checkout.reciverAddress?.id === address.id
            ? 'bg-main/5 border-blue-500'
            : 'border-gray-200 bg-neutral-50'
        }`}
      >
        <div className="border-b border-zinc-400 pb-3">
          <div className="flex items-center justify-between">
            {/* name */}
            <span className="text-[14px] font-medium text-black lg:text-base">{address.name}</span>
            {/* delete */}
            <button
              onClick={() => setModal({ open: true, info: address })}
              className="flex h-8 w-8 items-center justify-center self-end rounded-lg border border-red-500 bg-transparent"
            >
              <Delete_Icon className="text-red-500" />
            </button>
          </div>
          {/* address */}
          <span className="font-reqular text-xs text-zinc-400">{address.street}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium text-zinc-400">
              کد پستی :{' '}
              <span className="font-num text-xs font-normal text-zinc-900">
                {address.post_code}
              </span>
            </span>
            <span className="flex text-xs font-medium whitespace-nowrap text-zinc-400">
              {' '}
              شماره موبایل :{' '}
              <span className="font-num text-xs font-normal text-zinc-900">{address.mobile}</span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={onEdit}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900"
            >
              <Edit_Icon />
            </button>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md ${
                checkout.reciverAddress?.id === address.id ? 'bg-blue' : ''
              }`}
            >
              <Check_Icon className="text-white" size="14" />
            </span>
          </div>
        </div>
      </div>
      {modal.open && <DeleteAddress setOpen={setModal} open={modal} />}
    </>
  );
};

export default CardAddress;
