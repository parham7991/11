'use client';
import Image from 'next/image';
import React, { Suspense, useEffect } from 'react';
import Auth from '@/../public/images/verify.png';
import { useFormik } from 'formik';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import Link from 'next/link';
import { InputOtp } from '@heroui/react';
import { useVerifyAuth } from '@/hooks/auth/useVerifyAuth';
import { useGetSession } from '@/hooks/auth/useGetSession';
import * as yup from 'yup';
const Verify = () => {
  const { isPending, mutate } = useVerifyAuth();
  const serachParams = useSearchParams();
  const router = useRouter();
  const { session, isLoading } = useGetSession();

  // اگر کاربر لاگین است، به صفحه اصلی redirect کن
  useEffect(() => {
    if (!isLoading && session?.accessToken) {
      const redirectTo =
        serachParams.get('page') && serachParams.get('page') !== 'null'
          ? (serachParams.get('page') as string)
          : '/';
      router.push(redirectTo);
    }
  }, [session, isLoading, router, serachParams]);
  const formik = useFormik({
    initialValues: {
      code: '',
    },
    validationSchema: yup.object({
      code: yup.string().required('فیلد اجباری است'),
    }),
    onSubmit: (values) => {
      mutate({
        type: 'verify',
        code: values.code,
        mobile: serachParams.get('mobile'),
      });
    },
  });

  const isError = formik.touched.code && formik.errors.code ? true : false;

  return (
    <Suspense>
      <div className="container_page flex h-screen items-center justify-center">
        <div className="flex w-full flex-col-reverse items-center justify-between gap-14 lg:flex-row">
          <div className="flex flex-1 items-center justify-center">
            <div className="lg:w-[500px]">
              <p className="flex items-center justify-center gap-2">
                <span className="text-blue flex items-center gap-2 font-bold text-[18px] lg:text-[32px]">
                  {' '}
                  کد ارسال شده{' '}
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 shadow-inner lg:h-14 lg:w-14 lg:rounded-2xl">
                    <svg
                      width="41"
                      height="41"
                      viewBox="0 0 41 41"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g filter="url(#filter0_d_1187_9174)">
                        <path
                          d="M36.0687 19.5154C35.8758 16.3955 34.774 13.4001 32.8992 10.8987C31.0243 8.39721 28.4582 6.49902 25.5174 5.43809C22.5766 4.37716 19.3896 4.19987 16.3492 4.92809C13.3089 5.65631 10.5481 7.25819 8.40724 9.53625C6.26641 11.8143 4.83911 14.669 4.3013 17.7483C3.76349 20.8276 4.13868 23.997 5.38062 26.8657C6.62256 29.7344 8.67696 32.177 11.2905 33.8924C13.9041 35.6078 16.9626 36.521 20.089 36.5194H29.4011C31.1689 36.5177 32.8638 35.8147 34.1138 34.5649C35.3639 33.315 36.0669 31.6203 36.0687 29.8528V19.5154ZM33.4016 29.8528C33.4016 30.9136 32.9802 31.931 32.2299 32.6812C31.4796 33.4313 30.4621 33.8528 29.4011 33.8528H20.089C18.2073 33.8519 16.3469 33.4545 14.6291 32.6865C12.9114 31.9185 11.3748 30.7971 10.1196 29.3954C8.85827 27.9945 7.91114 26.3401 7.34168 24.5431C6.77221 22.7462 6.59357 20.8484 6.81774 18.9768C7.17171 16.0247 8.49824 13.2743 10.5882 11.1593C12.6782 9.04431 15.4127 7.68491 18.3608 7.29543C18.9358 7.22336 19.5148 7.18685 20.0944 7.18609C23.2021 7.17762 26.2137 8.2633 28.6009 10.2528C29.9952 11.4114 31.1396 12.841 31.9648 14.4549C32.79 16.0689 33.2788 17.8336 33.4016 19.6421V29.8528Z"
                          fill="#FCFCFC"
                        />
                        <path
                          d="M14.732 16.5193H20.0661C20.4198 16.5193 20.7589 16.3789 21.009 16.1288C21.2591 15.8788 21.3996 15.5396 21.3996 15.186C21.3996 14.8324 21.2591 14.4932 21.009 14.2432C20.7589 13.9931 20.4198 13.8527 20.0661 13.8527H14.732C14.3783 13.8527 14.0391 13.9931 13.789 14.2432C13.5389 14.4932 13.3984 14.8324 13.3984 15.186C13.3984 15.5396 13.5389 15.8788 13.789 16.1288C14.0391 16.3789 14.3783 16.5193 14.732 16.5193Z"
                          fill="#FCFCFC"
                        />
                        <path
                          d="M25.3997 19.1862H14.7319C14.3783 19.1862 14.0391 19.3266 13.789 19.5767C13.5389 19.8267 13.3984 20.1659 13.3984 20.5195C13.3984 20.8731 13.5389 21.2123 13.789 21.4623C14.0391 21.7123 14.3783 21.8528 14.7319 21.8528H25.3997C25.7533 21.8528 26.0925 21.7123 26.3426 21.4623C26.5927 21.2123 26.7332 20.8731 26.7332 20.5195C26.7332 20.1659 26.5927 19.8267 26.3426 19.5767C26.0925 19.3266 25.7533 19.1862 25.3997 19.1862Z"
                          fill="#FCFCFC"
                        />
                        <path
                          d="M25.3997 24.5194H14.7319C14.3783 24.5194 14.0391 24.6599 13.789 24.9099C13.5389 25.16 13.3984 25.4991 13.3984 25.8527C13.3984 26.2064 13.5389 26.5455 13.789 26.7956C14.0391 27.0456 14.3783 27.1861 14.7319 27.1861H25.3997C25.7533 27.1861 26.0925 27.0456 26.3426 26.7956C26.5927 26.5455 26.7332 26.2064 26.7332 25.8527C26.7332 25.4991 26.5927 25.16 26.3426 24.9099C26.0925 24.6599 25.7533 24.5194 25.3997 24.5194Z"
                          fill="#FCFCFC"
                        />
                      </g>
                      <defs>
                        <filter
                          id="filter0_d_1187_9174"
                          x="0.0625"
                          y="0.487427"
                          width="40.0078"
                          height="40.0321"
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood floodOpacity="0" result="BackgroundImageFix" />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feGaussianBlur stdDeviation="2" />
                          <feComposite in2="hardAlpha" operator="out" />
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.988235 0 0 0 0 0.988235 0 0 0 0 0.988235 0 0 0 1 0"
                          />
                          <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_1187_9174"
                          />
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_1187_9174"
                            result="shape"
                          />
                        </filter>
                      </defs>
                    </svg>
                  </span>
                </span>
                <span className="font-bold text-[18px] text-neutral-900 lg:text-[32px]">
                  {' '}
                  را وارد کنید
                </span>
              </p>
              <p className="mt-3 text-center">
                <span className="font-medium text-base text-zinc-400">
                  لطفا کد ارسال شده به شماره{' '}
                </span>
                <span className="font-medium text-base text-zinc-400">
                  {serachParams.get('mobile')}
                </span>
                <span className="font-medium text-base text-zinc-400"> را وارد کنید </span>
              </p>
              <div className="flex flex-col items-center gap-5">
                <form
                  onSubmit={formik.handleSubmit}
                  className="flex !w-full flex-col items-center justify-center gap-10 overflow-hidden"
                >
                  <InputOtp
                    classNames={{
                      errorMessage: 'font-reqular',
                      base: '!mx-auto  mt-5',
                      segmentWrapper: '!flex gap-5 justify-between ',
                      segment:
                        '!w-[41px] !font-reqular !h-[63px] !text-[14px] data-[has-value=true]:!border-main data-[has-value=true]:!text-main border  data-[active=true]:!bg-white data-[active=true]:!text-block',
                    }}
                    name="code"
                    onValueChange={(e) => formik.setFieldValue('code', e)}
                    value={formik.values.code}
                    length={4}
                    errorMessage={formik.errors.code}
                    isInvalid={isError}
                    autoFocus
                    onComplete={() => formik.handleSubmit()}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    dir="ltr"
                  />
                  <Button isLoading={isPending} className="bg-main text-white" type="submit">
                    تائید کد
                  </Button>
                </form>

                <div className="h-1 w-[91.10px] rounded-xl bg-neutral-900" />
                <Link
                  prefetch={false}
                  href={`/auth/password?mobile=${serachParams.get('mobile')}`}
                  className="!w-[70%] !rounded-xl !py-3 text-center !font-medium text-xs text-white"
                  style={{ background: '#F9A038' }}
                >
                  ورود با رمز عبور
                </Link>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-1 justify-end">
            <Image src={Auth} alt="" />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default Verify;
