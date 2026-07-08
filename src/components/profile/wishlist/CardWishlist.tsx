import { addCommas } from '@/lib/fun';
import Button from '@/components/common/Button';
import { useAddWidhlist } from '@/hooks/product/useAddWidhlist';
import { Product } from '@/types/Home';
import React from 'react';
type Props = {
  className?: string;
  product?: Product;
};
const CardOrder = ({ className, product }: Props) => {
  const { isPending, mutate } = useAddWidhlist();

  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-b px-3 py-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex max-h-[79px] min-h-[79px] min-w-[79px] max-w-[79px] items-center justify-center rounded-xl bg-neutral-50">
          <div className="relative h-12 w-12">
            {/* @ts-expect-error error */}
            <img src={product?.image} alt="" />
          </div>
        </div>
        <div className="flex h-[79px] flex-col justify-between">
          <p className="text-right font-medium text-sm text-neutral-900">{product?.product_name}</p>

          <p className="text-blue font-medium text-xs font-normal">
            {/* @ts-expect-error errr */}
            {new Date(product?.created_at).toLocaleDateString('fa-IR')}
          </p>
        </div>
      </div>
      <div className="flex h-[79px] flex-col justify-between">
        <Button
          isLoading={isPending}
          onClick={() =>
            mutate({
              method: 'DELETE',
              //   @ts-expect-error error
              data: { product_id: product?.product?.id },
            })
          }
          className="-mt-3 mr-auto !w-fit min-w-fit"
        >
          <span className="text-main">
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 512 512"
              height="25px"
              width="25px"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M256 448a32 32 0 0 1-18-5.57c-78.59-53.35-112.62-89.93-131.39-112.8-40-48.75-59.15-98.8-58.61-153C48.63 114.52 98.46 64 159.08 64c44.08 0 74.61 24.83 92.39 45.51a6 6 0 0 0 9.06 0C278.31 88.81 308.84 64 352.92 64c60.62 0 110.45 50.52 111.08 112.64.54 54.21-18.63 104.26-58.61 153-18.77 22.87-52.8 59.45-131.39 112.8a32 32 0 0 1-18 5.56z"></path>
            </svg>
          </span>
        </Button>
        <div className="flex h-8 w-[107px] items-center justify-center rounded-md bg-neutral-900">
          <p className="text-right font-medium text-base text-neutral-50">
            {addCommas(Number(product?.product_price))}
            <span className="text-right text-[11px] font-normal text-neutral-50">تومان</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardOrder;
