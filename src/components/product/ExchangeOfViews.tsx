import React from 'react';
import { Star_Icon } from '../common/Icon';
import { Product } from '@/types/Home';
interface Props {
  className?: string;
  product: Product;
}
const ExchangeOfViews = ({ className, product }: Props) => {
  return (
    <div className={`mt-4 flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Star_Icon size="13" className="-mt-1 h-5 w-5 text-[#FFC700]" />
        <span className="text-center font-medium text-xs text-black">4.2</span>
      </div>
      <div className="h-2.5 w-px bg-zinc-400" />
      <div className="flex items-center gap-1">
        <span className="text-center font-medium text-xs text-blue-500">
          {Number(product?.comments?.length ?? 0)}
        </span>
        <span className="text-center font-medium text-xs text-blue-500">دیدگاه</span>
      </div>
      <div className="h-2.5 w-px bg-zinc-400" />
      <div className="flex items-center gap-1">
        <span className="text-center font-medium text-xs text-blue-500">
          {Number(product?.questions?.length ?? 0)}
        </span>
        <span className="text-center font-medium text-xs text-blue-500">پرسش</span>
      </div>
    </div>
  );
};

export default ExchangeOfViews;
