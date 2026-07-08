'use client';
import React from 'react';
import PersonalInformation from './PersonalInformation';
import MyAddress from './MyAddress';
import MyProducts from './MyProducts';
type Props = {
  className?: string;
};
const Home = ({ className }: Props) => {
  // const {data,isPending} = useGetOrders()

  return (
    <div className={`${className}`}>
      <div className="flex flex-col gap-6">
        <PersonalInformation className="!h-fit xl:!max-w-[400px] 2xl:max-w-[500px]" />
        <MyAddress className="lg:min-w-[400px]" />
      </div>
      <div className="mt-4 flex w-full flex-col gap-6 xl:flex-row">
        <MyProducts
          showCount={4}
          classNameContainerProduct="space-y-4 mt-4"
          title="لیست سفارشات من"
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default Home;
