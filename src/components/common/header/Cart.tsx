'use client';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addCommas } from '@/lib/fun';
import { useGetCart } from '@/hooks/cart/useGetCart';
import CardProductCart from '@/components/cart/CardProductCart';
import EmptyCart from '@/components/cart/EmptyCart';
import { Product } from '@/types/Home';
const Cart = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data } = useGetCart();
  const totalCountBasket = data?.items?.reduce((total: number, basket: { qty: number }) => {
    return total + (basket?.qty ? basket?.qty : 0);
  }, 0);

  // پرش badge سبد هنگام افزایش تعداد (micro-interaction)
  const [pop, setPop] = useState(false);
  const prevCountRef = useRef<number>(totalCountBasket ?? 0);
  useEffect(() => {
    const current = totalCountBasket ?? 0;
    if (current > prevCountRef.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 480);
      prevCountRef.current = current;
      return () => clearTimeout(t);
    }
    prevCountRef.current = current;
  }, [totalCountBasket]);

  //   const totalProductPrice = data?.items?.reduce((sum, item) => {
  //     const price = Number(item?.product.price) * Number(item?.count ?  item?.count: 0);
  //     return sum + price;
  //   }, 0);
  const onClose = () => setOpen(!open);
  const onRedirect = () => {
    router.push('/cart');
    onClose();
  };
  return (
    <div className="hidden items-center gap-4 lg:flex">
      <span className="block h-[32px] w-px bg-[#E4E7E9]"></span>
      <Dropdown
        closeOnSelect={false}
        placement="bottom-start"
        isOpen={open}
        onOpenChange={onClose}
        // shouldCloseOnInteractOutside={onClose}
      >
        <DropdownTrigger>
          <Button
            onPress={onClose}
            className="!h-[48px] !w-[48px] min-w-[48px] overflow-visible rounded-[12px] border border-[#E4E7E9] bg-transparent transition-all duration-300 hover:border-main"
          >
            <span className="group">
              <svg
                className={`stroke-[#7D8793] group-hover:stroke-main`}
                width="24"
                height="25"
                viewBox="0 0 24 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 2.5H3.74001C4.82001 2.5 5.67 3.43 5.58 4.5L4.75 14.46C4.61 16.09 5.89999 17.49 7.53999 17.49H18.19C19.63 17.49 20.89 16.31 21 14.88L21.54 7.38C21.66 5.72 20.4 4.37 18.73 4.37H5.82001"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.25 22.5C16.9404 22.5 17.5 21.9404 17.5 21.25C17.5 20.5596 16.9404 20 16.25 20C15.5596 20 15 20.5596 15 21.25C15 21.9404 15.5596 22.5 16.25 22.5Z"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.25 22.5C8.94036 22.5 9.5 21.9404 9.5 21.25C9.5 20.5596 8.94036 20 8.25 20C7.55964 20 7 20.5596 7 21.25C7 21.9404 7.55964 22.5 8.25 22.5Z"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 8.5H21"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {totalCountBasket >= 1 ? (
              <span
                className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F9C638] font-medium text-[12px] text-white shadow-[0_0_10px_rgba(249,198,56,0.55)] ${pop ? 'animate-cart-pop' : ''}`}
              >
                {totalCountBasket ?? 0}
              </span>
            ) : null}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          className="h-[550px] w-[516px]"
          aria-label="Static Actions"
          items={[{ label: 'jjjjjjjj', key: 'jjfjfjffjfjfjfjfjfjfjfj' }]}
        >
          <>
            <DropdownItem
              closeOnSelect={false}
              className="data-[hover=true]:!bg-transparent"
              key={'logout'}
            >
              <span className="font-medium text-[18px] text-[#7D8793]">
                {Array.isArray(data?.items) ? data?.items?.length : '0'} محصول
              </span>
              {data?.items?.length >= 1 ? (
                <div className="custom_sidebar mt-5 h-[410px] space-y-4 overflow-auto px-4 pb-3">
                  {data?.items?.map((product: Product, idx: number) => (
                    <CardProductCart
                      className="!h-fit !flex-col !items-start !p-3"
                      container_class={'lg:!w-20 !overflow-hidden lg:!h-20'}
                      classImage="!h-9 !w-9 !min-w-9 !min-h-9"
                      key={idx}
                      product={product}
                      containerLeftClass="!gap-1 !w-full !justify-end"
                    />
                  ))}
                </div>
              ) : (
                <EmptyCart className="mt-14" />
              )}
              {data?.items?.length >= 1 && (
                <div className="mt-6 flex items-center justify-between gap-5">
                  <Button
                    onPress={onRedirect}
                    className="h-[48px] w-full bg-main font-medium text-white lg:w-full"
                  >
                    ثبت سفارش
                  </Button>
                  <div className="space-y-3">
                    <span className="whitespace-nowrap font-medium text-[12px] text-[#7D8793]">
                      مبلغ قابل پرداخت
                    </span>

                    <span className="flex items-center gap-1">
                      <span className="whitespace-nowrap font-bold text-[16px] text-[#232429]">
                        {addCommas(Number(data?.quote?.total))}{' '}
                      </span>
                      <svg
                        width="22"
                        height="12"
                        viewBox="0 0 22 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.264 3.852C15.744 3.852 16.164 3.968 16.524 4.2C16.884 4.424 17.16 4.744 17.352 5.16C17.552 5.568 17.652 6.04 17.652 6.576V7.644H19.38C19.812 7.644 20.116 7.572 20.292 7.428C20.468 7.276 20.548 7.068 20.532 6.804C20.516 6.572 20.472 6.252 20.4 5.844C20.328 5.436 20.256 5.052 20.184 4.692L21.264 4.404C21.36 4.788 21.448 5.216 21.528 5.688C21.608 6.152 21.656 6.528 21.672 6.816C21.68 7.184 21.604 7.532 21.444 7.86C21.284 8.18 21.032 8.44 20.688 8.64C20.344 8.84 19.924 8.94 19.428 8.94H17.64V9.012C17.64 9.604 17.532 10.12 17.316 10.56C17.108 11.008 16.768 11.36 16.296 11.616C15.832 11.872 15.228 12 14.484 12H13.152V10.704H14.484H14.652C15.14 10.696 15.516 10.632 15.78 10.512C16.052 10.392 16.24 10.212 16.344 9.972C16.456 9.732 16.512 9.412 16.512 9.012V8.94H15.576C15.128 8.94 14.76 8.912 14.472 8.856C14.192 8.792 13.796 8.644 13.284 8.412C13.116 8.596 12.92 8.74 12.696 8.844C12.48 8.948 12.26 9 12.036 9H11.664C11.12 9 10.684 8.896 10.356 8.688C10.036 8.472 9.804 8.176 9.66 7.8C9.524 7.416 9.456 6.952 9.456 6.408V2.556C9.456 2.404 9.416 2.292 9.336 2.22C9.264 2.148 9.128 2.112 8.928 2.112H8.556C8.34 2.112 8.196 2.144 8.124 2.208C8.052 2.272 8.016 2.388 8.016 2.556L8.028 7.908C8.028 8.844 7.772 9.576 7.26 10.104C6.748 10.64 5.956 10.908 4.884 10.908H3.684C2.996 10.908 2.412 10.744 1.932 10.416C1.452 10.096 1.088 9.664 0.84 9.12C0.6 8.584 0.48 8.004 0.48 7.38C0.48 6.86 0.556 6.34 0.708 5.82C0.868 5.292 1.068 4.804 1.308 4.356L2.256 4.872C2.048 5.312 1.888 5.736 1.776 6.144C1.664 6.552 1.608 6.964 1.608 7.38C1.608 7.828 1.676 8.22 1.812 8.556C1.956 8.892 2.18 9.152 2.484 9.336C2.796 9.52 3.196 9.612 3.684 9.612H4.884C5.404 9.612 5.808 9.556 6.096 9.444C6.384 9.34 6.588 9.168 6.708 8.928C6.828 8.68 6.888 8.34 6.888 7.908V2.52C6.888 2.168 6.94 1.868 7.044 1.62C7.156 1.364 7.336 1.168 7.584 1.032C7.84 0.888 8.16 0.816 8.544 0.816H8.928C9.312 0.816 9.624 0.888 9.864 1.032C10.112 1.168 10.292 1.364 10.404 1.62C10.524 1.876 10.584 2.172 10.584 2.508L10.596 6.408C10.596 6.8 10.62 7.084 10.668 7.26C10.716 7.428 10.812 7.544 10.956 7.608C11.1 7.672 11.34 7.704 11.676 7.704H12.024C12.208 7.704 12.352 7.664 12.456 7.584C12.56 7.504 12.632 7.376 12.672 7.2L13.032 5.904C13.208 5.256 13.488 4.752 13.872 4.392C14.256 4.032 14.72 3.852 15.264 3.852ZM13.836 7.272C14.236 7.432 14.548 7.54 14.772 7.596C14.996 7.644 15.264 7.668 15.576 7.668H16.512V6.576C16.512 6.12 16.412 5.764 16.212 5.508C16.012 5.252 15.704 5.124 15.288 5.124C15.016 5.124 14.78 5.22 14.58 5.412C14.38 5.596 14.228 5.876 14.124 6.252L13.836 7.272ZM4.548 3.648C4.764 3.648 4.984 3.648 5.208 3.648V4.968H4.548C4.324 4.968 4.104 4.968 3.888 4.968V3.648H4.548ZM20.712 2.976C20.504 2.976 20.348 2.976 20.244 2.976C20.148 2.976 20 2.976 19.8 2.976H19.236V1.704H20.712V2.976ZM17.796 2.976V1.704H19.26V2.976H17.796Z"
                          fill="#7D8793"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              )}
            </DropdownItem>
          </>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default Cart;
