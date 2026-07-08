'use client';

import BackPrevPage from '@/components/common/BackPrevPage';
import Button from '@/components/common/Button';
import Input from '@/components/common/form/Input';
import Select from '@/components/common/form/ReactSelect';
import { useUpdateProfile } from '@/hooks/profile/useUpdateProfile';
import { useSession } from '@/lib/auth/useSession';
import { removeEmptyFields } from '@/lib/fun';
import { useFormik } from 'formik';
import React, { Suspense, useEffect } from 'react';
import * as Yup from 'yup';

function isValidIranianNationalCode(code: string): boolean {
  // بررسی ساختار کلی
  if (!/^(?!0{10}|1{10}|2{10}|3{10}|4{10}|5{10}|6{10}|7{10}|8{10}|9{10})\d{10}$/.test(code))
    return false;

  const check = +code[9];
  const sum = code
    .split('')
    .slice(0, 9)
    .reduce((acc, cur, i) => acc + +cur * (10 - i), 0);
  const remainder = sum % 11;

  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}

const PersonalInformationContent = () => {
  const { mutate, isPending } = useUpdateProfile();
  const session = useSession();
  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      telephone: '',
      gender: '',
      national_code: '',
      email: '',
      mobile: '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      first_name: Yup.string().required('فیلد اجباری است'),
      last_name: Yup.string().required('فیلد اجباری است'),
      mobile: Yup.string(),
      national_code: Yup.string()
        .nullable()
        .transform((value, originalValue) => {
          // تبدیل عدد به string اگر number باشد
          return originalValue == null ? '' : String(originalValue);
        })
        .test('isValidNationalCode', 'کد ملی معتبر نیست', (value) => {
          // اگر خالی یا null باشد، معتبر است (اختیاری)
          if (!value || value.toString().trim() === '') {
            return true;
          }
          // اگر پر شده باشد، باید معتبر باشد
          const codeString = value.toString().trim();
          // بررسی طول (باید 10 رقم باشد)
          if (codeString.length !== 10) {
            return false;
          }
          return isValidIranianNationalCode(codeString);
        }),
    }),
    onSubmit: (values) => {
      const data = removeEmptyFields(values);
      mutate({ data });
    },
  });
  useEffect(() => {
    if (session) {
      formik.setValues({
        ...formik.values,
        ...session,
      });
    }
  }, [session]);
  return (
    <div className="">
      <BackPrevPage title="اطلاعات شخصی" />
      <p className="hidden border-b border-gray-200 pb-3 font-medium text-[14px] text-[#0C0C0C] lg:block lg:text-[18px]">
        اطلاعات کاربری
      </p>
      <form
        onSubmit={formik.handleSubmit}
        className="mt-5 grid gap-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
      >
        <Input
          isRequired
          classNameInput={'h-[48px]'}
          // @ts-expect-error error
          formik={formik}
          name="first_name"
          label="نام"
          required
        />

        <Input
          isRequired
          classNameInput={'h-[48px]'}
          // @ts-expect-error error
          formik={formik}
          name="last_name"
          label="نام‌خانوادگی"
          required
        />

        <Input
          classNameInput={'h-[48px]'}
          // @ts-expect-error error
          formik={formik}
          name="national_code"
          label="کد ملی"
          type="text"
          maxLength={10}
          inputMode="numeric"
        />

        <Input
          disabled
          isRequired
          classNameInput={'h-[48px]'}
          // @ts-expect-error error
          formik={formik}
          name="mobile"
          label="شماره تلفن"
          required
        />

        <Input
          classNameInput={'h-[48px]'}
          // @ts-expect-error error
          formik={formik}
          name="telephone"
          label="شماره ثابت"
        />

        <Input
          classNameInput={'h-[48px]'}
          // @ts-expect-error error
          formik={formik}
          name="email"
          label="ایمیل"
          required
        />
        <Select
          options={[
            { label: 'مرد', value: 'male' },
            { label: 'زن', value: 'faamle' },
          ]}
          formik={formik}
          name="gender"
          label="جنسیت"
        />
        <Button
          isLoading={isPending}
          type="submit"
          className={`mt-6 flex h-[48px] w-full items-center justify-center self-end rounded-xl border border-zinc-100 md:mt-0 ${'bg-main !text-white'}`}
        >
          <span className="font-bold text-[13px]">ثبت درخواست</span>
        </Button>
      </form>
    </div>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <PersonalInformationContent />
    </Suspense>
  );
};

export default Page;
