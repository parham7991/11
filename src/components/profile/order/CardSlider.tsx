import { addCommas } from '@/lib/fun';
import React from 'react';
import Image from 'next/image';

import Link from 'next/link';
import { Product } from '@/types/Home';
interface Props {
  order: Product;
}
const CardSlider = ({ order }: Props) => {
  return (
    <Link
      prefetch={false}
      href={`/product/${order?.id}`}
      className="rtl group relative mx-auto flex h-[111.39px] w-[95%] cursor-pointer items-center gap-3 rounded-[20px] border-2 border-zinc-100 bg-white px-2 font-medium transition-all duration-300 hover:border-violet-500 md:mx-1 md:w-[330px] md:max-w-[350px]"
    >
      <div className="relative flex h-[66.36px] min-w-[63.83px] items-center justify-center rounded-lg border bg-white">
        {order?.image && (
          // @ts-expect-error error
          <Image width={45} height={45} src={order.image as string} alt="" />
        )}
        <span className="absolute -bottom-2 left-1/2 flex h-[19.09px] w-[19.09px] -translate-x-1/2 items-center justify-center rounded bg-zinc-400 text-xs text-white transition-all duration-300 group-hover:bg-violet-500">
          {order?.qty}
        </span>
      </div>
      <div className="flex w-full flex-col">
        <p className="flex flex-col text-[11px] font-normal text-black">{order?.name}</p>
        <div className="mt-3 flex items-center gap-3">
          <p className="whitespace-nowrap text-[11px] font-normal text-zinc-400">مبلغ کالا: </p>
          <p className="flex flex-col text-[11px] font-normal text-black">
            {addCommas(Number(order.row_total))} تومان
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="whitespace-nowrap text-[11px] font-normal text-zinc-400">تخفیف کالا</p>
          <p className="flex flex-col text-[11px] font-normal text-black">
            {addCommas(Number(order.row_total))} تومان
          </p>
        </div>
      </div>
    </Link>
  );
};

export default CardSlider;
