import React from 'react';
import Image from 'next/image';
import { ProductDetail } from '@/types/Home';
interface Props {
  order: ProductDetail;
}
const CardDetailsOrder = ({ order }: Props) => {
  return (
    <div
      className={`flex h-[84.20px] items-center justify-between rounded-[20px] border border-transparent bg-neutral-100 px-10 transition-all duration-500 hover:border-violet-500 hover:bg-white`}
    >
      <div className="flex flex-1 items-center justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-900">
          {order.qty}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Image width={40} height={40} src={order.image} alt="" />
      </div>
      <p className="flex flex-1 items-center justify-center whitespace-nowrap text-[13px] font-normal text-zinc-900">
        {order.name}
      </p>
      <p className="flex flex-1 items-center justify-center text-xs font-normal text-black">
        2,500,000
      </p>
      <p className="flex flex-1 items-center justify-center text-xs font-normal text-black">2</p>
      <p className="flex flex-1 items-center justify-center text-xs font-normal text-black">
        2,500,000
      </p>
    </div>
  );
};

export default CardDetailsOrder;
