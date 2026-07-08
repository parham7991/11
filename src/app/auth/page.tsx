'use client';
import Image from 'next/image';
import React, { Suspense } from 'react';
import Auth from '@/../public/images/auth.png';
import { useFormik } from 'formik';
import Button from '@/components/common/Button';
import Input from '@/components/common/form/Input';
import { Phone_Icon, Tell_Icon } from '@/components/common/Icon';
import * as Yup from 'yup';
import { useGetCode } from '@/hooks/auth/useGetCode';

const AuthContent = () => {
  const { mutate, isPending } = useGetCode();
  const formik = useFormik({
    initialValues: {
      mobile: '',
    },
    validationSchema: Yup.object({
      mobile: Yup.string()
        .required('شماره تلفن را وارد کنید')
        .matches(/^09[0-9]{9}$/, 'شماره تلفن وارد شده صحیح نیست'),
    }),
    onSubmit: async (values) => {
      mutate({ mobile: values.mobile });
    },
  });
  return (
    <div className="container_page flex h-screen items-center justify-center">
      <div className="flex w-full flex-1 flex-col-reverse items-center justify-between gap-14 lg:flex-row">
        <div className="flex w-full justify-center">
          <div className="w-full lg:w-[490px]">
            <p className="flex items-center gap-2 whitespace-nowrap text-right">
              <span className="font-bold text-[18px] text-neutral-900 lg:text-[32px]">
                تنها با{' '}
              </span>
              <span className="flex items-center gap-2 font-bold text-[18px] !text-[#386BF9] lg:text-[32px]">
                شماره تلفن{' '}
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 shadow-inner lg:h-14 lg:w-14 lg:rounded-2xl">
                  <Tell_Icon />
                </span>{' '}
              </span>
              <span className="font-bold text-[18px] text-neutral-900 lg:text-[32px]">
                {' '}
                ثبت نام کنید !
              </span>
            </p>
            <form className="space-y-10" onSubmit={formik.handleSubmit}>
              <Input
                type="tel"
                className="mt-8"
                endContent={<Phone_Icon />}
                name="mobile"
                // @ts-expect-error error
                formik={formik}
                placeholder="شماره تلفن خود را وارد کنید"
              />
              <Button isLoading={isPending} type="submit" className="!bg-[#386BF9] text-white">
                ارسال کد
              </Button>
            </form>
          </div>
        </div>
        <div className="flex w-full justify-end">
          <Image className="h-[300px] lg:h-fit" src={Auth} alt="" />
        </div>
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <AuthContent />
    </Suspense>
  );
};

export default Page;
