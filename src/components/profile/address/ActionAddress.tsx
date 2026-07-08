'use client';
import React, { useEffect } from 'react';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMedia } from 'react-use';
import { AllowNumAndPer } from '@/lib/regexes';
import { SharedSelection } from '@heroui/react';
import { Address } from '@/types/Home';
import { useAddAddress } from '@/hooks/profile/useAddAddress';
import { removeEmptyFields, toEnglishDigits } from '@/lib/fun';
import BaseDialog from '@/components/common/BaseDialog';
import Textarea from '@/components/common/form/Textarea';
import Input from '@/components/common/form/Input';
import Select from '@/components/common/form/ReactSelect';
import { useUpdateAddress } from '@/hooks/profile/useUpdateAddress';
import { useGetRegions } from '@/hooks/profile/useGetReginos';
type Props = {
  setModal: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      info: null | Address;
    }>
  >;
  modal: {
    open: boolean;
    info: null | Address;
  };
};
const ActionAddress = ({ modal, setModal }: Props) => {
  const isMobile = useMedia('(max-width: 480px)', false);
  const { mutate, isPending, isSuccess } = useAddAddress();
  const { data: regions, isLoading } = useGetRegions();
  const {
    mutate: mutateUpdate,
    isPending: isPendingUpdate,
    isSuccess: isSuccessUpdate,
  } = useUpdateAddress();
  const formik = useFormik({
    initialValues: {
      street: '',
      city: '',
      first_name: '',
      last_name: '',
      mobile: '',
      telephone: '',
      post_code: '',
      province: '',
      other: false,
    },
    validationSchema: Yup.object({
      street: Yup.string()
        .matches(
          /^[\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9 0-9\-'‌\n\r]+$/,
          'لطفا ادرس را با حروف فارسی وارد کنید'
        )
        .required('فیلد اجباری است'),
      city: Yup.string().required('فیلد اجباری است'),
      post_code: Yup.string()
        .min(10, 'نباید کمتر از 10 رقم باشد')
        .max(10, 'نباید بیش از 10 رقم باشد')
        .matches(AllowNumAndPer, 'فقط عدد میتوانید وارد کنید')
        .required('فیلد اجباری است'),
      province: Yup.string().required('فیلد اجباری است'),
      first_name: Yup.string()
        .matches(AllowNumAndPer, 'لطفا نام را با حروف فارسی وارد کنید')
        .required('فیلد اجباری است'),
      last_name: Yup.string()
        .matches(AllowNumAndPer, 'لطفا نام خانوادگی را با حروف فارسی وارد کنید')
        .required('فیلد اجباری است'),
      mobile: Yup.string()
        .matches(AllowNumAndPer, 'فقط عدد میتوانید وارد کنید')
        .required('فیلد اجباری است'),
    }),
    onSubmit: (values) => {
      // @ts-expect-error error
      const findProvince = regions?.regions?.find((item) => item.name === values.province);
      const data = {
        street: values.street,
        post_code: Number(toEnglishDigits(values.post_code)),
        mobile: values.mobile.toString(),
        name: `${values.first_name} ${values?.last_name}`,
        // @ts-expect-error error
        city_id: findProvince?.cities.find((city) => city.name === values.city)?.id,
        telephone: values.telephone,
        id: modal?.info?.id,
      };
      if (modal.info) {
        mutateUpdate({ data: removeEmptyFields(data), id: modal?.info?.id });
      } else {
        mutate({ data: removeEmptyFields(data) });
      }
    },
  });
  const onClose = () => {
    setModal({ open: false, info: null });
    formik.setValues({
      street: '',
      city: '',
      first_name: '',
      last_name: '',
      mobile: '',
      post_code: '',
      telephone: '',
      province: '',
      other: false,
    });
  };

  useEffect(() => {
    if (isSuccess || isSuccessUpdate) {
      setModal({ open: false, info: null });
      formik.setValues({
        street: '',
        city: '',
        first_name: '',
        last_name: '',
        mobile: '',
        post_code: '',
        telephone: '',
        province: '',
        other: false,
      });
    }
  }, [isSuccess, isSuccessUpdate]);

  useEffect(() => {
    if (modal.info) {
      formik.setValues({
        ...formik.values,
        ...modal.info,
        first_name: modal.info.name.split(' ')[0],
        last_name: modal.info.name.split(' ')[1],
        province: modal.info.region,
        city: modal.info.city,
      });
    }
  }, [modal.info]);
  // @ts-expect-error error
  const findProvince = regions?.regions?.find((item) => item?.name === formik?.values?.province);
  return (
    <BaseDialog
      isOpen={modal.open}
      title="جزئیات آدرس"
      nameBtnFooter={modal.info ? 'ویرایش آدرس' : 'ثبت آدرس'}
      onClickFooter={formik.handleSubmit}
      onClose={onClose}
      isLoadingFooterBtn={isPending || isPendingUpdate}
      size={isMobile ? 'full' : 'xl'}
    >
      <div>
        <p className="font-medium text-[16px] text-[#616A76]">جزئیات آدرس را وارد کنید</p>
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 border-b border-[#E4E7E9] pb-4 lg:grid-cols-2">
            <Textarea
              label={'نشانی پستی'}
              isRequired
              classNameInput="bg-[#F5F6F6]"
              classNameLabel="text-[#616A76] text-[14px] lg:text-[16px] font-medium"
              className="lg:!col-span-2"
              name="street"
              // @ts-expect-error error
              formik={formik}
            />

            <Select
              isLoading={isLoading}
              label="استان"
              options={regions?.regions}
              nameLabel="name"
              nameValue="name"
              isRequired
              name="province"
              formik={formik}
              onChange={(selectedKeys: SharedSelection) => {
                formik?.setFieldValue('province', selectedKeys.currentKey);
                formik?.setFieldValue('city', '');
              }}
            />
            <Select
              label="شهر"
              options={findProvince?.cities}
              nameLabel="name"
              nameValue="name"
              isRequired
              name="city"
              formik={formik}
              emptyMessage="ابتدا استان مورد نظر خود را انتخاب کنید"
            />

            {/* <Input
                            label={"محله"}
                            isRequired
                            classNameInput='bg-[#F5F6F6] !h-[48px]'
                            classNameLabel='text-[#616A76] text-[16px] font-medium'
                            className='col-span-2'
                        /> */}
            <div className="flex items-center gap-3 lg:col-span-2">
              {/* <Input
                                label={"پلاک"}
                                isRequired
                                classNameInput='bg-[#F5F6F6] !h-[48px]'
                                classNameLabel='text-[#616A76] text-[16px] font-medium'
                            />
                            <Input
                                label={"واحد"}
                                classNameInput='bg-[#F5F6F6] !h-[48px]'
                                classNameLabel='text-[#616A76] text-[16px] font-medium'
                            /> */}
              <Input
                label={'کدپستی'}
                classNameInput="bg-[#F5F6F6] !pl-5 !h-[48px] "
                classNameLabel="text-[#616A76] text-[14px] lg:text-[16px]font-medium"
                dir="ltr"
                min={10}
                max={10}
                // @ts-expect-error error

                formik={formik}
                type="tel"
                name="post_code"
                description="کد پستی ده رقمی و بدون فاصله باشد"
                isRequired
              />
            </div>
          </div>
          {/* <Checkbox
            label="گیرنده خودم نیستم."
            className="lg:col-span-2 mt-4"
            name="other"
            // @ts-expect-error error
            formik={formik}
            onValueChange={onValueChange}
          /> */}

          {/* {formik.values.other && ( */}
          <div className="mt-5">
            <p className="font-medium text-[16px] text-[#616A76]">مشخصات گیرنده سفارش</p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <Input
                label={'نام گیرنده'}
                isRequired
                classNameInput="bg-[#F5F6F6] !h-[48px]"
                classNameLabel="text-[#616A76] text-[14px] lg:text-[16px] font-medium"
                // @ts-expect-error error

                formik={formik}
                name="first_name"
              />
              <Input
                label={'نام خانوادگی گیرنده'}
                isRequired
                classNameInput="bg-[#F5F6F6] !h-[48px]"
                classNameLabel="text-[#616A76] text-[14px] lg:text-[16px] font-medium"
                name="last_name"
                // @ts-expect-error error

                formik={formik}
              />
              <Input
                label={'شماره موبایل گیرنده'}
                isRequired
                classNameInput="bg-[#F5F6F6] !pl-5 !h-[48px]"
                classNameLabel="text-[#616A76] text-[14px] lg:text-[16px] font-medium"
                type="tel"
                // @ts-expect-error error

                formik={formik}
                name="mobile"
              />
              <Input
                label={'تلفن'}
                classNameInput="bg-[#F5F6F6] !pl-5 !h-[48px]"
                classNameLabel="text-[#616A76] text-[14px] lg:text-[16px] font-medium"
                type="tel"
                // @ts-expect-error error

                formik={formik}
                name="telephone"
              />
            </div>
          </div>
          {/* )} */}
        </div>
      </div>
    </BaseDialog>
  );
};

export default ActionAddress;
