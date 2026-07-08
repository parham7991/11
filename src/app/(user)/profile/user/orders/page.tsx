'use client';
import BackPrevPage from '@/components/common/BackPrevPage';
import EmptyOrder from '@/components/empty/EmptyOrder';
import MyProducts from '@/components/profile/user/MyProducts';
import { useGetOrders } from '@/hooks/profile/useGetOrders';
import React, { Suspense } from 'react';
import { Skeleton } from '@heroui/react';

const Page = () => {
  const { data, isPending } = useGetOrders();
  return (
    <Suspense>
      <BackPrevPage title="سفارشات من" />
      <p className="hidden border-b border-gray-200 pb-3 font-medium text-[14px] text-[#0C0C0C] lg:block lg:text-[18px]">
        لیست سفارشات
      </p>

      {isPending ? (
        <div className="my-10 grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Skeleton key={idx} className="rounded-lg">
              <div className="flex h-32 w-full items-center justify-between rounded-lg bg-[#F5F5F5] p-3">
                <div className="flex flex-1 flex-col gap-3">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-8 w-24 rounded-md bg-gray-200" />
                  <div className="h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
            </Skeleton>
          ))}
        </div>
      ) : Number(data?.data?.length) >= 1 ? (
        <MyProducts
          classNameContainerProduct="grid my-10  lg:grid-cols-2 gap-4"
          showPagination={true}
          title=""
        />
      ) : (
        <EmptyOrder />
      )}
    </Suspense>
  );
};

export default Page;
