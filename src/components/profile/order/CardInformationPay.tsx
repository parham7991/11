import React from 'react';
import CardInformationOrder from './CardInformationOrder';
interface Props {
  title: string;
  subLabel: string;
  value1: string;
  value2: string;
}
const CardInformationPay = ({ title, subLabel, value1, value2 }: Props) => {
  return (
    <div className="flex flex-1 flex-col rounded-lg border-2 border-zinc-100 bg-white px-5 lg:rounded-[32px]">
      <div className="mx-auto flex min-h-[39.11px] w-[241.05px] items-center justify-center rounded-bl-[32px] rounded-br-[32px] bg-neutral-100">
        <p className="font-bold text-[12px] text-zinc-900">{title}</p>
      </div>
      <div className="mt-3 flex flex-1 flex-col justify-between gap-3 py-3">
        <CardInformationOrder label={title} value={value1} />
        <CardInformationOrder label={subLabel} value={`${value2} تومان`} />
      </div>
    </div>
  );
};

export default CardInformationPay;
