'use client';
import React, { useEffect } from 'react';
import Title from './Title';
import { useFormik } from 'formik';
import useCheckoutStore from '@/store/checkout-store';
import { User_Icon } from '../common/Icon';
import Input from '../common/form/Input';
const ReceiverInformation = () => {
  const { setCheckout } = useCheckoutStore();
  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      nid: '',
      phone: '',
    },
    onSubmit: () => {},
  });

  useEffect(() => {
    // @ts-expect-error error
    setCheckout({ reciverInformation: formik.values });
  }, [formik.values]);
  return (
    <div>
      <Title title="اطلاعات گیرنده" Icon={User_Icon} />
      <div className="mt-3 grid gap-x-5 gap-y-3 lg:grid-cols-2">
        {/* @ts-expect-error error */}
        <Input name="first_name" formik={formik} required label="نام" />
        {/* @ts-expect-error error */}
        <Input name="last_name" formik={formik} required label="نام‌خانوادگی" />
        {/* @ts-expect-error error */}
        <Input name="nid" formik={formik} required label="کدملی" />
        {/* @ts-expect-error error */}
        <Input name="phone" formik={formik} required label="شماره تلفن" />
      </div>
    </div>
  );
};

export default ReceiverInformation;
