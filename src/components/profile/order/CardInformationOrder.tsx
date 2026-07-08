import React from 'react';
interface Props {
  label: string;
  value: string;
}
const CardInformationOrder = ({ label, value }: Props) => {
  return (
    <div className="flex items-center gap-3">
      <p className="w-[90px] font-medium text-sm text-zinc-400">{label} :</p>
      <div className="flex h-8 min-w-[227.51px] items-center justify-center rounded-[10px] bg-neutral-100 px-3">
        <p className="font-medium text-[13px] text-zinc-900">{value}</p>
      </div>
    </div>
  );
};

export default CardInformationOrder;
