'use client';
import { addCommas } from '@/lib/fun';
import React from 'react';
import SliderDetailsOrder from '../SliderDetailsOrder';
import { TypeOrderDetail } from '@/types/Home';
import BackPrevPage from '@/components/common/BackPrevPage';
import Title from '@/components/checkout/Title';
import StatusSendProduct from '../StatusSendProduct';
import InformationOrder from '../InformationOrder';
import CardInformationPay from '../CardInformationPay';
import { Arrow_back_mobile } from '@/components/common/Icon';
import Link from 'next/link';

interface Props {
  order: TypeOrderDetail;
}
const OrderDetails = ({ order }: Props) => {
  return (
    <div className="mb-32 h-fit !rounded-lg bg-white md:mb-0 md:px-4 lg:mt-5">
      <BackPrevPage title="جزئیات سفارش" />
      <div className="hidden items-center gap-5 border-b border-gray-200 pb-3 lg:flex">
        <Link prefetch={false} href={'/profile/user/orders'}>
          <Arrow_back_mobile className="block h-6 w-6 stroke-gray-400" />
        </Link>
        <p className="font-medium text-[14px] text-[#0C0C0C] lg:block lg:text-[18px]">
          جزئیات سفارش
        </p>
      </div>
      <Title className="mt-5 border border-main !bg-[#EBF0FF] !text-main" title="لیست سفارشات" />
      <SliderDetailsOrder orders={order.items} />
      <Title
        className="!mt-10 border border-main !bg-[#EBF0FF] !text-main lg:!mt-0"
        title=" وضعیت سفارش"
      />
      <StatusSendProduct states={order.states} stateTitle={order.order.state_title} />

      <Title className="!mt-10 border border-main !bg-[#EBF0FF] !text-main" title="اطلاعات سفارش" />
      <div className="mt-10 flex flex-col items-center justify-between gap-10 !px-2 md:flex-row">
        <InformationOrder
          address={
            order.customer && order.customer[0]
              ? {
                  name: `${order.customer[0].first_name || ''} ${order.customer[0].last_name || ''}`.trim(),
                  mobile: order.customer[0].mobile || '',
                  address: '',
                }
              : null
          }
          title="آدرس ارسال"
        />
        <InformationOrder
          address={
            order.address
              ? {
                  name: order.address.name,
                  mobile: order.address.mobile,
                  address: order.address.address,
                  post_code: order.address.post_code,
                }
              : null
          }
          title="آدرس صورت حساب"
        />
      </div>
      <div className="my-10 flex flex-col items-center justify-between gap-10 md:flex-row">
        <CardInformationPay
          value2={addCommas(Number(order.order.shipping_method_amount))}
          value1={order.order.shipping_method_title}
          subLabel="هزینه ارسال"
          title="روش ارسال"
        />
        <CardInformationPay
          value1={order.order.payment_method_title}
          value2={addCommas(Number(order.order.base_grand_total))!}
          subLabel="هزینه نهایی"
          title="روش پرداخت"
        />
      </div>
    </div>
  );
};

export default OrderDetails;
