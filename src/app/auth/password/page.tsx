'use client';
import Image from 'next/image';
import React, { Suspense } from 'react';
import Auth from '@/../public/images/password.png';
import { useFormik } from 'formik';
import Input from '@/components/common/form/Input';
import Button from '@/components/common/Button';
import { Tell_Icon } from '@/components/common/Icon';
import { useVerifyAuth } from '@/hooks/auth/useVerifyAuth';

const PasswordContent = () => {
  const { isPending, mutate } = useVerifyAuth();
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const formik = useFormik({
    initialValues: {
      password: '',
    },
    onSubmit: () => {
      mutate({
        type: 'password',
        mobile: '09142608206',
      });
    },
  });
  // const { mutate,loading } = useLoginWithPassword(formik.values.password)
  return (
    <div className="container_page flex h-screen items-center justify-center">
      <div className="flex w-full flex-col-reverse items-center justify-between gap-14 lg:flex-row">
        <div className="w-full lg:w-fit">
          <p className="flex items-center gap-2 text-right">
            <span className="font-bold text-[18px] text-neutral-900 lg:text-[32px]">
              امنیت را با{' '}
            </span>
            <span className="text-blue flex items-center gap-2 font-bold text-[18px] lg:text-[32px]">
              {' '}
              رمز عبور{' '}
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 shadow-inner lg:h-14 lg:w-14 lg:rounded-2xl">
                <Tell_Icon />
              </span>{' '}
            </span>
            <span className="font-bold text-[18px] text-neutral-900 lg:text-[32px]"> احساس کن</span>
          </p>
          <form onSubmit={formik.handleSubmit} className="mt-4 space-y-10 lg:mt-8">
            <Input
              type="password"
              name="password"
              // @ts-expect-error error
              formik={formik}
              placeholder="رمز عبور خود را وارد کنید"
              endContent={
                <button
                  aria-label="toggle password visibility"
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {/* {isVisible ? (
                                    <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                  ) : (
                                    <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                  )} */}
                </button>
              }
            />
            <Button isLoading={isPending} className="bg-main text-white">
              ورود
            </Button>
          </form>
        </div>
        <div>
          <Image src={Auth} alt="" />
        </div>
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <PasswordContent />
    </Suspense>
  );
};

export default Page;
