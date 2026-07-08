import React from 'react';
import CardInformationOrder from './CardInformationOrder';

interface AddressInfo {
  name?: string;
  mobile?: string;
  address?: string;
  post_code?: string;
}

interface Props {
  title: string;
  address: AddressInfo | null;
}
const InformationOrder = ({ title, address }: Props) => {
  if (!address) {
    return (
      <div className="flex min-h-[248.11px] flex-1 flex-col rounded-lg border-2 border-zinc-100 bg-white px-5 lg:rounded-[32px]">
        <div className="mx-auto flex min-h-[39.11px] w-[241.05px] items-center justify-center rounded-bl-[32px] rounded-br-[32px] bg-neutral-100">
          <p className="font-bold text-[12px] text-zinc-900">{title}</p>
        </div>
        <div className="mt-3 flex flex-1 flex-col justify-center py-3">
          <p className="text-center text-sm text-gray-500">اطلاعاتی موجود نیست</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[248.11px] flex-1 flex-col rounded-lg border-2 border-zinc-100 bg-white px-5 lg:rounded-[32px]">
      <div className="mx-auto flex min-h-[39.11px] w-[241.05px] items-center justify-center rounded-bl-[32px] rounded-br-[32px] bg-neutral-100">
        <p className="font-bold text-[12px] text-zinc-900">{title}</p>
      </div>
      <div className="mt-3 flex flex-1 flex-col justify-between py-3">
        <CardInformationOrder label="نام گیرنده" value={address.name || '-'} />
        {address.address ? (
          <CardInformationOrder label="آدرس گیرنده" value={address.address} />
        ) : null}
        {address.post_code ? (
          <CardInformationOrder label="کد پستی " value={address.post_code!} />
        ) : null}
        <CardInformationOrder label="شماره تماس" value={address.mobile || '-'} />
      </div>
    </div>
  );
};

export default InformationOrder;
