'use client';

import BackPrevPage from '@/components/common/BackPrevPage';
interface Props {
  response: {
    status: string;
    created_at: string;
    payment_method_title: string;
    base_grand_total: string;
    increment_id: string;
    id: string;
  }[];
}

const Orders = ({ response }: Props) => {
  return (
    <div className="flex flex-col justify-between overflow-auto bg-white md:h-[570px] md:p-10">
      <BackPrevPage title="لیست سفارشات" />
      <div>
        {!Array.isArray(response) ? (
          <div className="flex h-[450px] items-center justify-center">
            <p className="my-auto text-center font-medium text-xl text-zinc-400">
              هنوز هیچ فکتوری انتخاب نشده است
            </p>
          </div>
        ) : (
          <p></p>
        )}
      </div>
      {/* <Button
                onClick={() => router.push("/")}
                className="  bg-amber-500 mr-auto !rounded-lg !w-[120px]"
                name="افزودن محصول"
            /> */}
    </div>
  );
};

export default Orders;
