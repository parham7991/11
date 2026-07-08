import Image from 'next/image';
import React from 'react';
import EmptyCartImage from '@/../public/images/empty-cart.png';
import Link from 'next/link';
const EmptyCart = ({ className }: { className?: string }) => {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative h-[300px] w-[300px]">
        <Image fill src={EmptyCartImage} alt="" />
      </div>
      <span className="text-right">
        <span className="font-bold text-xl text-neutral-900">سبد خرید شما </span>
        <span className="font-bold text-xl text-orange-400">خالی</span>
        <span className="font-bold text-xl text-neutral-900"> می باشد</span>
      </span>
      <p className="-mt-1 text-right">
        <span className="font-bold text-base text-zinc-400">تو </span>
        <Link prefetch={false} href={'/'} className="font-bold text-base text-blue-500">
          سرزمین آفلند
        </Link>
        <span className="font-bold text-base text-zinc-400"> دست خالی بر نمیگردی</span>
      </p>
    </div>
  );
};

export default EmptyCart;
