import React from 'react';
import Success from './Success';
import Faild from './Faild';
type Props = {
  searchParams: Promise<{ status: string; order_id: string }>;
};
const Page = async ({ searchParams }: Props) => {
  const { status, order_id } = await searchParams;
  return (
    <div>
      {status === 'success' ? <Success order_id={order_id} /> : <Faild order_id={order_id} />}
    </div>
  );
};

export default Page;
