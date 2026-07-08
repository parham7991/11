'use client';
import BackPrevPage from '@/components/common/BackPrevPage';
import EmptyWishlist from '@/components/profile/user/EmptyWishlist';
import CardWishlist from '@/components/profile/wishlist/CardWishlist';
import { useGetWishlistUser } from '@/hooks/profile/useGetWishlistUser';
import { Spinner } from '@heroui/react';
import React from 'react';

const Page = () => {
  const { data, isLoading } = useGetWishlistUser();
  if (isLoading) return <Spinner className="mt-5 flex items-center justify-center" />;
  return (
    <div>
      <BackPrevPage title="لیست علاقه‌مندی‌ها" />
      <p className="hidden border-b border-gray-200 pb-3 font-medium text-[14px] text-[#0C0C0C] lg:block lg:text-[18px]">
        لیست علاقه مندی‌ها
      </p>
      {Number(data?.response?.length) >= 1 ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {// @ts-expect-error error
          data?.response?.map((product, idx) => <CardWishlist product={product} key={idx} />)}
        </div>
      ) : (
        <EmptyWishlist />
      )}
    </div>
  );
};

export default Page;
