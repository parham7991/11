import { Product } from '@/types/Home';
import React from 'react';
type Props = {
  product: Product;
};
const Information = ({ product }: Props) => {
  return (
    <div className="flex w-full flex-col items-start gap-2 lg:items-center lg:gap-6">
      {product?.attributes?.map((attribute, idx) => (
        <div key={idx} className="flex w-full flex-col items-center gap-2 lg:flex-row lg:gap-24">
          <span className="block w-[200px] self-start text-start font-medium text-[14px] text-zinc-400">
            {attribute.title} :
          </span>
          <div className="w-full rounded-lg bg-neutral-100 px-3 py-2 lg:w-fit">
            <span className="font-light text-xs text-zinc-900"> {attribute.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Information;
