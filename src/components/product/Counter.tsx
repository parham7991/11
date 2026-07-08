// "use client";
// import useSingleProduct from "@/store/singleProduct";
// import { addToast } from "@heroui/react";
// import React from "react";
// import { Arrow_Icon } from "../common/Icon";
// import { useAddCart } from "@/hooks/cart/useAddCart";
// import Button from "../common/Button";

// type Props = {
//   is_in_stock: number;
// };
// const Counter = ({ is_in_stock }: Props) => {
//   const { mutate } = useAddCart();
//   const { qty, onQty } = useSingleProduct();
//   const inceriment = () => {
//     if (qty === is_in_stock)
//       return addToast({
//         title: `موجودی این کالا در انبار ${is_in_stock} عدد می‌باشد`,
//         color: "danger",
//       });
//     mutate();
//   };
//   const deceriment = () => {
//     if (qty === 1) return;
//     onQty(qty - 1);
//   };
//   return (
//     <div className="flex items-center gap-2 ">
//       <span className="text-center text-black text-sm font-medium">
//         تعداد محصول :
//       </span>
//       <div className="flex gap-2">
//         <div className="flex flex-col gap-1">
//           <button
//             onClick={inceriment}
//             className="w-7 h-4 flex justify-center items-center bg-neutral-50 rounded border border-zinc-100"
//           >
//             <Arrow_Icon
//               className="rotate-90 block text-black w-3 h-3"
//               size="12"
//             />
//           </button>
//           <button
//             onClick={deceriment}
//             className="w-7 h-4 flex justify-center items-center bg-neutral-50 rounded border border-zinc-100"
//           >
//             <Arrow_Icon
//               className="-rotate-90 block w-3 h-3 text-black"
//               size="12"
//             />
//           </button>
//         </div>
//         <div className="w-8 h-8 bg-neutral-50 rounded border border-zinc-100 flex justify-center items-center">
//           <span className="text-center text-black text-base font-normal font-medium">
//             {qty}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Counter;

'use client';
import { addToast, Spinner } from '@heroui/react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/types/Home';
import { useGetCart } from '@/hooks/cart/useGetCart';
import { useAddCart } from '@/hooks/cart/useAddCart';
import { useRemoveCart } from '@/hooks/cart/useRemoveCart';
import BaseDialog from '../common/BaseDialog';
import Button from '../common/Button';
import { addCommas, discountCalculation, getFinalSrc } from '@/lib/fun';

type Props = {
  color?: string;
  product: Product;
  classNameCounter?: string;
  container_Class?: string;
  classAddBtn?: string;
  classCount?: string;
  classNameAddBtnName?: string;
  showCartLink?: boolean;
  showAddBasketDialog?: boolean;
  showDeleteIcon?: boolean;
  showBasketIcon?: boolean;
};
const Counter = ({
  classNameAddBtnName,
  showBasketIcon = true,
  product,
  showAddBasketDialog,
  classNameCounter,
  classCount,
  container_Class,
  showCartLink,
  classAddBtn,
  color,
}: Props) => {
  const { data, isLoading: isPeningBasket } = useGetCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { mutate, isPending, isSuccess } = useAddCart();
  const { mutate: mutateRemoveBasket, isPending: isPendingRemoveBasket } = useRemoveCart();
  const productIsBasket = data?.items?.find((cart: Product) => cart?.id === product?.id);

  const onPress = () => {
    router.push('/cart');
    setOpen(!open);
  };
  useEffect(() => {
    if (isSuccess) {
      setOpen(!open);
    }
  }, [isSuccess]);

  const increment = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    // if (product.singleSale && Number(productIsBasket?.count) >= 1) return addToast({ title: "شما فقط میتوانید  یه عدد از این محصول را بخرید.", color: "danger" })
    // //  if(Number(productIsBasket?.count) >= product.minCart) return toast.error(``)
    if (Number(product?.available_order_qty) <= Number(productIsBasket?.qty))
      return addToast({
        title: `موجودی محصول کمتر از تعداد انتخابی شما است.`,
        color: 'danger',
      });
    mutate({ qty: Number(productIsBasket?.qty) + 1, id: Number(product.id) });
  };
  const descrement = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    mutateRemoveBasket({ qty: 1, id: Number(product.id) });
  };
  if (isPeningBasket)
    return (
      <Spinner
        size="sm"
        classNames={{ circle1: '!border-b-main', circle2: '!border-b-main' }}
        className="ml-auto mt-2"
      />
    );
  return (
    <>
      {productIsBasket ? (
        <div
          className={` ${container_Class} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95`}
        >
          <div className="flex items-center gap-2">
            <div className={`flex items-center ${classNameCounter}`}>
              <button
                onClick={increment}
                className="flex !h-fit w-full !min-w-fit items-center justify-center rounded-lg bg-white/10 px-0 transition-colors duration-200 hover:bg-white/20"
              >
                {isPending ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <svg
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.5 8H12.5"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.5 12V4"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span
                className={`block min-w-[32px] flex-1 rounded-md border border-white/20 bg-white/10 text-center font-bold text-[14px] text-white backdrop-blur-sm ${classCount}`}
              >
                {productIsBasket.qty}
              </span>
              <button
                disabled={isPending}
                onClick={descrement}
                className="flex !h-fit w-full !min-w-fit items-center justify-center rounded-lg bg-white/10 px-0 transition-colors duration-200 hover:bg-white/20"
              >
                {Number(productIsBasket?.qty) === 1 ? (
                  <span>
                    {isPendingRemoveBasket ? (
                      <Spinner color="current" size="sm" />
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14 3.98665C11.78 3.76665 9.54667 3.65332 7.32 3.65332C6 3.65332 4.68 3.71999 3.36 3.85332L2 3.98665"
                          stroke={color}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5.66675 3.31337L5.81341 2.44004C5.92008 1.80671 6.00008 1.33337 7.12675 1.33337H8.87341C10.0001 1.33337 10.0867 1.83337 10.1867 2.44671L10.3334 3.31337"
                          stroke={color}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12.5667 6.09338L12.1334 12.8067C12.06 13.8534 12 14.6667 10.14 14.6667H5.86002C4.00002 14.6667 3.94002 13.8534 3.86668 12.8067L3.43335 6.09338"
                          stroke={color}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.88672 11H9.10672"
                          stroke={color}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.33325 8.33337H9.66659"
                          stroke={color}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                ) : isPendingRemoveBasket ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <svg
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.5 8H12.5"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
            {/* {
                                // @ts-expect-error error
                                Number(productIsBasket?.count) >= 1 && showDeleteIcon ? <Button disabled={isPendingRemoveBasket} isPending={isPendingRemoveBasket} onClick={descrement} className='px-0 min-w-fit w-fit pt-1'>
                                    <span>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14 3.98665C11.78 3.76665 9.54667 3.65332 7.32 3.65332C6 3.65332 4.68 3.71999 3.36 3.85332L2 3.98665" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M5.66675 3.31337L5.81341 2.44004C5.92008 1.80671 6.00008 1.33337 7.12675 1.33337H8.87341C10.0001 1.33337 10.0867 1.83337 10.1867 2.44671L10.3334 3.31337" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M12.5667 6.09338L12.1334 12.8067C12.06 13.8534 12 14.6667 10.14 14.6667H5.86002C4.00002 14.6667 3.94002 13.8534 3.86668 12.8067L3.43335 6.09338" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M6.88672 11H9.10672" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M6.33325 8.33337H9.66659" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>

                                    </span>
                                </Button>
                                    : null
                            } */}
          </div>
          {showCartLink && (
            <Link
              prefetch={false}
              className="flex h-[24px] w-fit items-center justify-center whitespace-nowrap rounded px-2 font-medium text-[12px] text-white"
              href={'/cart'}
            >
              مشاهده در سبد خرید
            </Link>
          )}
        </div>
      ) : (
        <button
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            mutate({ qty: 1 });
          }}
          className={`flex h-[45px] w-full items-center justify-center gap-2 rounded-lg bg-main px-3 font-medium text-[123x] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-main/90 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 md:h-[40px] lg:w-full ${classAddBtn}`}
        >
          {showBasketIcon ? (
            <span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 25 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.5 2.5H4.24001C5.32001 2.5 6.17 3.43 6.08 4.5L5.25 14.46C5.11 16.09 6.39999 17.49 8.03999 17.49H18.69C20.13 17.49 21.39 16.31 21.5 14.88L22.04 7.38C22.16 5.72 20.9 4.37 19.23 4.37H6.32001"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.75 22.5C17.4404 22.5 18 21.9404 18 21.25C18 20.5596 17.4404 20 16.75 20C16.0596 20 15.5 20.5596 15.5 21.25C15.5 21.9404 16.0596 22.5 16.75 22.5Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.75 22.5C9.44036 22.5 10 21.9404 10 21.25C10 20.5596 9.44036 20 8.75 20C8.05964 20 7.5 20.5596 7.5 21.25C7.5 21.9404 8.05964 22.5 8.75 22.5Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 8.5H21.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : null}
          {isPending ? (
            <Spinner
              classNames={{
                circle1: '!border-b-white',
                circle2: '!border-b-white',
              }}
              size="sm"
            />
          ) : (
            <span className={classNameAddBtnName}>افزودن به سبد</span>
          )}
        </button>
      )}

      {open && showAddBasketDialog && (
        <BaseDialog
          isOpen={true}
          size="md"
          onClose={() => setOpen(!open)}
          classBody="bg-[#F5F6FA] px-3 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 py-4">
              <span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.4"
                    d="M19.24 5.58006H18.84L15.46 2.20006C15.19 1.93006 14.75 1.93006 14.47 2.20006C14.2 2.47006 14.2 2.91006 14.47 3.19006L16.86 5.58006H7.14L9.53 3.19006C9.8 2.92006 9.8 2.48006 9.53 2.20006C9.26 1.93006 8.82 1.93006 8.54 2.20006L5.17 5.58006H4.77C3.87 5.58006 2 5.58006 2 8.14006C2 9.11006 2.2 9.75006 2.62 10.1701C2.86 10.4201 3.15 10.5501 3.46 10.6201C3.75 10.6901 4.06 10.7001 4.36 10.7001H19.64C19.95 10.7001 20.24 10.6801 20.52 10.6201C21.36 10.4201 22 9.82006 22 8.14006C22 5.58006 20.13 5.58006 19.24 5.58006Z"
                    fill="#009B72"
                  />
                  <path
                    d="M19.6609 10.7H4.36094C4.07094 10.7 3.75094 10.69 3.46094 10.61L4.72094 18.3C5.01094 20.02 5.76094 22 9.09094 22H14.7009C18.0709 22 18.6709 20.31 19.0309 18.42L20.5409 10.61C20.2609 10.68 19.9609 10.7 19.6609 10.7ZM14.8809 15.05L11.6309 18.05C11.4909 18.18 11.3009 18.25 11.1209 18.25C10.9309 18.25 10.7409 18.18 10.5909 18.03L9.09094 16.53C8.80094 16.24 8.80094 15.76 9.09094 15.47C9.38094 15.18 9.86094 15.18 10.1509 15.47L11.1409 16.46L13.8609 13.95C14.1609 13.67 14.6409 13.69 14.9209 13.99C15.2109 14.3 15.1909 14.77 14.8809 15.05Z"
                    fill="#009B72"
                  />
                </svg>
              </span>
              <span className="pt-px font-medium text-[16px] text-[#009B72]">
                این کالا به سبد خرید شما اضافه شد!
              </span>
            </div>
            <Button onClick={() => setOpen(!open)} className="w-fit min-w-fit px-0">
              <span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 6L18 18"
                    stroke="#545A66"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 6L6 18"
                    stroke="#616A76"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Button>
          </div>

          <div className="flex items-start gap-2 rounded-lg border-b border-gray-100 bg-white p-4 pb-3">
            <div className="flex min-h-[64px] min-w-[64px] items-center justify-center overflow-hidden rounded-lg">
              {Array.isArray(product.images) && product.images.length >= 1 ? (
                <img
                  width={60}
                  height={60}
                  src={getFinalSrc(product.images[0].content.path) as string}
                  alt={
                    (product.images[0].content as any)?.title ||
                    product.name ||
                    product.title ||
                    'تصویر محصول'
                  }
                  className="object-contain"
                />
              ) : null}
            </div>
            <div>
              <p className="line-clamp-2 font-medium text-[16px] text-[#0C0C0C]">{product.title}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  {Boolean(product?.special_price) ? (
                    <p className="text-left !font-reqular text-[12px] text-[#A8AFB8] line-through">
                      {addCommas(Number(product.price))}
                    </p>
                  ) : null}
                  <p className="flex items-center gap-1">
                    <span className="font-bold text-[12px] text-[#0C0C0C]">
                      {product?.special_price
                        ? addCommas(Number(product?.special_price))
                        : addCommas(Number(product?.price))}
                    </span>
                    {/* <Toman_Icon /> */}
                  </p>
                </div>
                {discountCalculation(product.special_price, Number(product.price)) !== 0 ? (
                  <span className="flex h-[20px] w-[39px] items-center justify-center rounded-md bg-main pt-px font-medium text-[10px] text-white lg:h-[24px] lg:w-[41px] lg:text-[12px]">
                    {discountCalculation(product.special_price, Number(product.price))}%
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onPress} className="border border-[#E4E7E9] bg-transparent text-main">
              مشاهده در سبد خرید
            </Button>
            <Button onClick={() => setOpen(false)} className="bg-main text-white">
              ادامه خرید
            </Button>
          </div>
        </BaseDialog>
      )}
    </>
  );
};

export default Counter;
