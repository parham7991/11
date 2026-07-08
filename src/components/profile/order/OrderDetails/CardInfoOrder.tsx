import { addCommas } from '@/lib/fun';
import { Order } from '@/types/Home/Product';
import Image from 'next/image';
import React from 'react';
interface Props {
  order: Order;
}
const CardInfoOrder = ({ order }: Props) => {
  return (
    <div className="flex h-fit w-full flex-col gap-3 rounded-[20px] border border-zinc-200 bg-white p-3">
      <p className="text-right">
        <span className="font-medium text-sm text-zinc-400">قیمت</span>
        <span className="font-medium text-sm text-zinc-400"> :</span>
        <span className="font-medium text-sm text-zinc-900"> </span>
        <span className="font-medium text-sm text-zinc-900">
          {addCommas(Number(order.price))}
        </span>
      </p>

      <div className="h-[1px] w-full border border-zinc-100" />

      <div className="flex gap-3">
        <div className="flex min-h-[66.67px] min-w-[66.67px] items-center justify-center rounded-xl border">
          <Image width={50} height={50} src={order?.image} alt="" />
        </div>
        <div>
          <p className="text-right">
            <span className="font-medium text-sm text-zinc-400">تعداد</span>
            <span className="font-medium text-sm text-zinc-400"> :</span>
            <span className="font-medium text-sm text-zinc-900"> </span>
            <span className="font-medium text-sm text-zinc-900">{order.qty}</span>
          </p>
          <p className="w-[200px] overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[13px] text-zinc-900">
            {order.name}
          </p>
          <p className="text-right">
            <span className="font-medium text-sm text-zinc-400">قیمت نهایی</span>
            <span className="font-medium text-sm text-zinc-400"> :</span>
            <span className="font-medium text-sm text-zinc-900"> </span>
            <span className="font-medium text-sm text-zinc-900">{Number(order.row_total)}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardInfoOrder;
