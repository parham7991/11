import { addCommas } from '@/lib/fun';
import { Product } from '@/types/Home';
import Link from 'next/link';
type Props = {
  className?: string;
  product?: Product;
};
const CardOrder = ({ className, product }: Props) => {
  return (
    <Link
      prefetch={false}
      href={`/profile/user/orders/${product?.id}`}
      className={`flex items-center justify-between border-b border-gray-200 py-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-fit flex-col justify-between gap-3">
          <p className="-mt-1 text-right">
            <span className="font-medium text-[13px] text-neutral-400">شماره فاکتور :</span>
            <span className="font-medium text-[13px] text-neutral-900"> </span>
            <span className="font-medium text-[13px] font-normal text-neutral-900">
              {product?.increment_id}
            </span>
          </p>
          <p className="text-blue whitespace-nowrap font-medium text-xs font-normal">
            {product?.created_at}
          </p>
        </div>
      </div>
      <div className="flex h-[79px] flex-col justify-between">
        <p className="whitespace-nowrap text-left font-medium text-sm text-orange-400">
          {product?.created_at}
        </p>
        <div className="my-3 flex h-8 w-fit items-center justify-center self-end rounded-md bg-neutral-900 p-1">
          <p className="whitespace-nowrap text-right font-medium text-base text-neutral-50">
            {addCommas(Number(product?.base_grand_total))}{' '}
            <span className="text-right text-[11px] font-normal text-neutral-50">تومان</span>
          </p>
        </div>
        <p className="-mt-1 self-end font-light !text-[14px]">مشاهده جزئیات</p>
      </div>
    </Link>
  );
};

export default CardOrder;
