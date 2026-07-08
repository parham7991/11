'use client';
import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import TitleDashboard from '@/components/common/TitleDashboard';
import Input from '@/components/common/form/Input';
import { useSession } from '@/lib/auth/useSession';
import { Skeleton } from '@heroui/react';
type Props = {
  className?: string;
};
const PersonalInformation = ({ className }: Props) => {
  const session = useSession(false);
  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      mobile: '',
      email: '',
    },
    enableReinitialize: true,
    onSubmit: () => {},
  });
  useEffect(() => {
    if (session) {
      formik.setValues({
        email: '',
        first_name: '',
        last_name: '',
        mobile: '',
        ...session,
      });
    }
  }, [session]);

  const isLoading = !session;

  return (
    <div className={`flex-1 ${className}`}>
      <TitleDashboard href="/profile/user/personal-information" title="اطلاعات شخصی" />
      {isLoading ? (
        <div className="mt-3 grid h-fit w-full grid-cols-2 gap-2 gap-x-5 rounded-2xl bg-[#f5f5f5] p-2 xl:p-3">
          {[1, 2, 3, 4].map((idx) => (
            <Skeleton key={idx} className="rounded-lg">
              <div className="h-[48px] w-full rounded-lg bg-gray-200" />
            </Skeleton>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid h-fit w-full grid-cols-2 gap-2 gap-x-5 rounded-2xl bg-[#f5f5f5] p-2 xl:p-3">
          <Input
            classNameInput={'h-[48px]'}
            disabled
            // @ts-expect-error error
            formik={formik}
            name="first_name"
            label="نام"
            required
          />

          <Input
            classNameInput={'h-[48px]'}
            disabled
            // @ts-expect-error error
            formik={formik}
            name="last_name"
            label="نام‌خانوادگی"
            required
          />

          <Input
            classNameInput={'h-[48px]'}
            disabled
            // @ts-expect-error error
            formik={formik}
            name="mobile"
            label="شماره تلفن"
            required
          />

          <Input
            classNameInput={'h-[48px]'}
            disabled
            // @ts-expect-error error
            formik={formik}
            name="email"
            label="ایمیل"
            required
          />
        </div>
      )}
    </div>
  );
};

export default PersonalInformation;
