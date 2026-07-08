'use client';
import { IoShieldCheckmark } from 'react-icons/io5';

import useSingleProduct from '@/store/singleProduct';
import React, { useEffect, useMemo, useState } from 'react';
import { Whatsup_Icon } from '../common/Icon';
import { addCommas, discountCalculation } from '@/lib/fun';
import { Product } from '@/types/Home';
import Counter from './Counter';
import Link from 'next/link';
import { useAttributeAsambleOnline } from '@/hooks/product/useAttributeAsambleOnline';
import { Spinner } from '@heroui/react';

type Props = {
  product: Product;
  className?: string;
};
const Factor = ({ product, className }: Props) => {
  const [isStock, setIsStock] = useState(true);
  const { data, isLoading, isSuccess } = useAttributeAsambleOnline({
    enabled: product?.attribute_name === 'کیس های اسمبل شده',
  });
  const { selectOption } = useSingleProduct();
  const titleColor = selectOption.find((option) => Number(option?.type_id) === 5);

  const totalPrice = selectOption?.reduce((accumulator, currentItem) => {
    // @ts-expect-error error
    return Number(accumulator) + Number(parseInt(currentItem?.price));
  }, 0);

  useEffect(() => {
    if (data?.total === 0) {
      setIsStock(false);
    } else if (!data?.total && (Number(product?.price) === 0 || product?.is_in_stock === 0)) {
      setIsStock(false);
    } else {
      setIsStock(true);
    }
  }, [isSuccess, data]);
  const tips = useMemo(() => {
    const qtyValue = Number(product?.qty ?? product?.available_order_qty ?? 0);
    const availableQty = Number.isNaN(qtyValue) ? 0 : qtyValue;
    const hasLowStock = availableQty > 0 && availableQty < 3;
    const productSeed = Number(product?.id ?? 0);
    const interestedCount = 10 + (Number.isNaN(productSeed) ? 0 : productSeed % 11);

    const baseTips = [
      {
        id: 'price',
        icon: '🏷️',
        text: 'بهترین قیمت در ۳۰ روز گذشته',
      },
      {
        id: 'favorite',
        icon: '❤️',
        text: `${addCommas(interestedCount)}+ نفر به این کالا علاقه دارند`,
      },
    ];

    if (hasLowStock) {
      baseTips.unshift({
        id: 'stock',
        icon: '📦',
        text: `تنها ${addCommas(availableQty)} عدد در انبار باقی مانده`,
      });
    }

    return baseTips;
  }, [product?.qty, product?.available_order_qty, product?.id]);

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    setCurrentTipIndex(0);
  }, [tips]);

  useEffect(() => {
    if (tips.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [tips]);

  const currentTip = tips[currentTipIndex] ?? tips[0];

  const finalPrice = data?.total
    ? addCommas(data?.total)
    : addCommas(
        Number(
          totalPrice + product?.special_price!
            ? Number(product?.special_price)
            : Number(product?.price)
        )
      );

  return (
    <div
      className={`factor-box sticky bottom-0 z-[2] mt-10 h-fit w-full flex-col rounded-xl bg-slate-100 px-2 py-3 lg:mt-0 lg:w-72 lg:min-w-72 lg:px-3 ${className}`}
    >
      {isLoading ? (
        <Spinner className="p-4" />
      ) : isStock === false ? (
        <p className="text-blue p-4 text-center font-medium lg:whitespace-nowrap">
          این محصول ناموجود می باشد
        </p>
      ) : (
        <>
          {/* color */}
          {titleColor?.title && (
            <div className="border-b pb-2 text-right font-bold text-sm text-black">
              رنگ : {titleColor?.title}
            </div>
          )}

          {/* ── قیمت بروز badge ── */}
          <div className="price-updated-badge my-2 flex items-center gap-2 rounded-lg bg-gradient-to-l from-emerald-50 to-teal-50 px-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white shadow-sm">
              ✓
            </span>
            <span className="font-bold text-[13px] text-emerald-700 lg:text-[14px]">قیمت بروز</span>
          </div>

          {/* discount */}
          <div className="flex w-full flex-row-reverse items-center justify-between gap-1 lg:flex-col lg:gap-3">
            {!product?.special_price ? null : (
              <div className="flex w-full flex-col-reverse items-end lg:flex-row lg:items-center lg:justify-between">
                <span className="flex items-center gap-1 text-right font-medium text-zinc-400 line-through lg:text-xl">
                  {addCommas(Number(product?.price))}{' '}
                  <span className="font-light text-xs">تومان</span>
                </span>
                <div className="flex h-6 w-fit items-center gap-1 rounded bg-red-500 px-2 text-white">
                  <span className="text-right font-reqular !text-[12px] text-base font-normal lg:!text-[14px]">
                    {discountCalculation(product?.special_price!, Number(product?.price!))}
                  </span>
                  %
                </div>
              </div>
            )}
            <div className="flex w-full items-center py-2 lg:justify-between">
              <span className="lg:text-md text-right font-medium text-[14px] text-black">
                قیمت :
              </span>
              <span className="flex items-center text-right font-bold text-[16px] font-normal text-zinc-400 lg:text-xl">
                {finalPrice}{' '}
                <span className="px-px font-light text-xs">تومان</span>
              </span>
            </div>
          </div>

          <div className="overflow-hidden">
            <div
              key={currentTip.id}
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-right backdrop-blur-sm"
              style={{ animation: 'tipSlideUp 0.45s ease forwards' }}
            >
              <span className="text-xl leading-none">{currentTip.icon}</span>
              <p className="flex-1 text-right font-medium text-[12px] text-slate-700 lg:text-[13px]">
                {currentTip.text}
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-3 lg:flex-col">
            <Counter
              color="#fff"
              container_Class="flex  items-center justify-between bg-main py-2 rounded-lg px-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-main/90 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
              showCartLink
              showAddBasketDialog
              showBasketIcon
              product={{ ...product, available_order_qty: product?.qty }}
              classNameAddBtnName="text-[12px]"
            />
            <Link
              prefetch={false}
              target="_blank"
              href={`https://wa.me/989129490306`}
              className="!flex h-[45px] items-center justify-center !gap-2 whitespace-nowrap rounded-lg bg-[#00D757] px-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#00c853] hover:shadow-lg hover:shadow-green-400/40 active:scale-95 md:h-[40px]"
            >
              <span className="text-right font-medium text-xs text-white">سوالی دارید؟</span>
              <Whatsup_Icon className="h-4 w-4 text-white" />
            </Link>
          </div>
        </>
      )}
      <style jsx>{`
        @keyframes tipSlideUp {
          0% {
            transform: translateY(12px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Factor;
