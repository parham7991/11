import React from 'react';
import Counter from '../product/Counter';
import { Product } from '@/types/Home';
import { discountCalculation, getFinalSrc, addCommas } from '@/lib/fun';
import Link from 'next/link';
import Image from '../common/Image';
interface Props {
  product: Product;
  className?: string;
  backgroundImage?: string;
  classImage?: string;
  containerLeftClass?: string;
  container_class?: string;
}
const CardProductCart = ({
  product,
  className,
  containerLeftClass,
  classImage,
  container_class,
}: Props) => {
  return (
    <Link
      prefetch={false}
      href={`/product/${product.id}`}
      className={`relative flex w-full flex-col items-center justify-between rounded-xl bg-neutral-100 px-3 py-2 lg:h-48 lg:flex-row lg:px-6 lg:py-0 ${className}`}
    >
      <div className="flex w-full justify-center gap-3">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 lg:h-36 lg:w-36 ${container_class}`}
        >
          {product.thumbnail ? (
            <Image
              className={`relative !h-16 !min-h-16 !w-16 !min-w-16 overflow-hidden lg:!h-14 lg:!min-h-32 lg:!w-32 lg:!min-w-32 ${classImage}`}
              alt=""
              src={getFinalSrc(product.thumbnail) as string}
            />
          ) : null}
        </div>
        <div className="flex w-full flex-col items-end justify-between lg:flex-row lg:justify-center">
          <h3 className="line-clamp-2 w-full self-start font-medium text-xs text-neutral-900 lg:text-base">
            {product.name}
          </h3>
          <div
            className={`flex h-full w-full flex-col items-end justify-end ${containerLeftClass}`}
          >
            {/* <Button
          isLoading={isPending}
          onClick={onDelete}
          className="absolute min-w-fit top-2 left-2 lg:static w-8 h-8 self-end flex justify-center items-center bg-zinc-100 rounded-lg border border-neutral-900"
        >
          <Delete_Icon className="!text-black" size="20" />
        </Button> */}

            <div className="flex flex-col items-center gap-4 lg:mt-0">
              {/* discount */}
              {typeof product.price === 'object' &&
              product.price !== null &&
              discountCalculation(Number(product.price.price), Number(product.price.old_price)) !==
                0 ? (
                <div className="flex items-center gap-1 self-end lg:gap-3">
                  <p className="flex items-center text-right font-medium text-[13px] text-red-500 line-through lg:text-base">
                    {product.price.old_price}
                    <span className="text-right font-light text-xs text-red-500">تومان</span>
                  </p>
                  <span className="flex h-6 w-fit items-center rounded bg-[#ffab00] px-2 text-white lg:text-[16px]">
                    <span className="text-right font-medium font-normal">
                      {typeof product.price === 'object' &&
                      product.price?.old_price &&
                      product.price?.price
                        ? discountCalculation(
                            Number(product.price.price),
                            Number(product.price.old_price)
                          )
                        : null}{' '}
                    </span>
                    %
                  </span>
                </div>
              ) : null}

              {/* price & counter */}
              <div className={`flex items-center gap-4`}>
                {/* className='absolute top-[50%] lg:static right-3 bg-transparent border !border-black' */}
                <Counter
                  classCount="!text-black"
                  container_Class="gap-4"
                  classNameCounter="border border-black lg:h-10 rounded-lg px-2"
                  color="#000"
                  product={product}
                />
                <div className="flex h-8 w-fit items-center gap-1 rounded-lg bg-main px-3 lg:h-10 lg:gap-2">
                  <span className="text-right font-medium text-xs text-neutral-50 lg:text-xl">
                    {typeof product.price === 'object' && product.price !== null
                      ? addCommas(
                          Number(
                            discountCalculation(
                              Number(product.price.price),
                              Number(product.price.old_price)
                            ) !== 0
                              ? product.price.price
                              : product.price.old_price
                          )
                        )
                      : ''}
                  </span>

                  <span className="text-right font-light text-[10px] text-neutral-50 lg:text-xs">
                    تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CardProductCart;
