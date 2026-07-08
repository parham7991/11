import React from 'react';
import CardOrder from './CardOrder';
import TitleDashboard from '@/components/common/TitleDashboard';
import { useGetOrders } from '@/hooks/profile/useGetOrders';
import { Product } from '@/types/Home';
import Pagination from '@/components/product/Pagination';
import EmptyOrder from '@/components/empty/EmptyOrder';
import { Skeleton } from '@heroui/react';
type Props = {
  className?: string;
  title: string;
  classNameContainerProduct?: string;
  showCount?: number;
  showPagination?: boolean;
};
const MyProducts = ({
  className,
  title,
  showCount,
  showPagination,
  classNameContainerProduct,
}: Props) => {
  const { data, isPending } = useGetOrders();
  return (
    <div className={className}>
      {title && <TitleDashboard href="/profile/user/orders" title={title} />}

      {isPending ? (
        <div className={`${classNameContainerProduct}`}>
          {[1, 2, 3, 4].map((idx) => (
            <Skeleton key={idx} className="rounded-lg">
              <div className="h-32 w-full rounded-lg bg-gray-200" />
            </Skeleton>
          ))}
        </div>
      ) : Number(data?.data?.length) >= 1 ? (
        <div className={`${classNameContainerProduct}`}>
          {data?.data?.slice(0, showCount)?.map((product: Product, idx: number) => (
            <CardOrder product={product} key={idx} className="rounded-lg bg-[#F5F5F5] p-3" />
          ))}
        </div>
      ) : (
        <EmptyOrder />
      )}
      {showPagination && <Pagination total={1} top={400} className="mt-10" />}
    </div>
  );
};

export default MyProducts;
