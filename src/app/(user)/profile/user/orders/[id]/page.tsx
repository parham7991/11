import OrderDetails from '@/components/profile/order/OrderDetails/OrderDetails';
import { request } from '@/lib/client';
import React from 'react';
type Props = {
  params: Promise<{ id: string }>;
};
const page = async ({ params }: Props) => {
  const { id } = await params;
  const response = await request({ url: `/user/order/${id}` });

  console.log(response);

  return (
    <>
      <OrderDetails order={response} />
    </>
  );
};

export default page;
