'use client';
import React, { useEffect, useState } from 'react';
import { Star_Icon } from '../common/Icon';
import { Slider } from '@heroui/react';
import Button from '../common/Button';
import BaseDialog from '../common/BaseDialog';
import { useFormik } from 'formik';
import Input from '../common/form/Input';
import Textarea from '../common/form/Textarea';
import PointCraeetComment from './PointCraeetComment';
import Checkbox from '../common/form/Checkbox';
import { useAddComment } from '@/hooks/product/useAddComment';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/useSession';
import { Product } from '@/types/Home';
type Props = {
  product?: Product;
  votes: number;
  isUserLoggedIn?: boolean;
  onShowLoginModal?: () => void;
};
const TotalScoresOpinionsUsers = ({ votes, product, isUserLoggedIn, onShowLoginModal }: Props) => {
  const { mutate, isPending, isSuccess } = useAddComment();
  const [open, setOpen] = useState(false);
  const formik = useFormik({
    initialValues: {
      title: '',
      content: '',
      product_id: '',
      vote: 5,
      anonymous: false,
      strengths: [],
      weaknesses: [],
    },
    validationSchema: Yup.object({
      title: Yup.string().required('فیلد اجباری است'),
      content: Yup.string().required('فیلد اجباری است'),
    }),
    onSubmit: (values) => {
      if (!isUserLoggedIn) {
        onShowLoginModal?.();
        return;
      }
      const data = {
        ...values,
        product_id: product?.id,
      };
      mutate({ data });
    },
  });
  useEffect(() => {
    if (isSuccess) {
      formik.resetForm();
      setOpen(false);
    }
  }, [isSuccess]);
  return (
    <>
      <div className="h-fit rounded-xl bg-slate-100 p-3 lg:w-72">
        <div className="flex items-center gap-3">
          <span className="font-num text-right font-bold text-3xl text-orange-400">{votes}</span>
          <Star_Icon className="text-orange-400" size="24" />
        </div>
        <span className="block w-full border-b py-3 text-right font-medium text-xs text-zinc-400">
          از مجموعه نظرات داده شده
        </span>
        {/* {votes?.length >= 1 && (
          <div className="mt-4 flex flex-col gap-4 border-b border-zinc-300 pb-8">
            {votes.map((vote, idx) => (
              <div key={idx} className="flex flex-col justify-start gap-3 text-blue-500">
                <span className="text-right text-xs font-medium text-neutral-900">
                  {vote.label}
                </span>
                <Progress
                  style={{ borderRadius: '14px' }}
                  color="primary"
                  value={vote.value * 20}
                />
              </div>
            ))}
          </div>
        )} */}
        <div className="mt-3 flex flex-col gap-1">
          <span className="block text-right font-bold text-xs text-black">
            شما هم نظر خود را بنویسید
          </span>

          <Button
            onClick={() => setOpen(!open)}
            className={`mt-2 h-9 rounded-md !border ${
              open ? '!border-orange' : '!border-blue-500'
            }`}
          >
            <span
              className={`text-center font-bold text-xs ${open ? 'text-orange' : 'text-blue-500'}`}
            >
              {open ? 'بعدا نظر میدم' : 'ثبت نظر جدید'}
            </span>
          </Button>
        </div>
      </div>
      <BaseDialog
        isLoadingFooterBtn={isPending}
        nameBtnFooter="ثبت نظرم"
        onClickFooter={() => formik.handleSubmit()}
        classBody="w-[90%] mx-auto overflow-auto px-3"
        size="xl"
        isOpen={open}
        onClose={() => setOpen(false)}
        title="ثبت نظر"
      >
        <div className="flex flex-col gap-4">
          <Slider
            classNames={{
              base: ' rounded-full mt-4 font-reqular', // معکوس کردن جهت پیشرفت
              mark: 'text-[12px] whitespace-nowrap',
              track: '!border-x-0',
            }}
            dir="rtl"
            className="max-w-full"
            color="primary"
            label="امتیاز"
            maxValue={5}
            minValue={0}
            showSteps={true}
            size="sm"
            step={1}
            orientation="horizontal"
            value={formik.values.vote}
            onChange={(value) => formik.setFieldValue('vote', Number(value))}
          />
          <Input
            classNameLabel="!text-[12px]"
            classNameInput={'!h-[40px] bg-[#fcfcfc]'}
            isRequired
            label={'عنوان نظر'}
            // @ts-expect-error error
            formik={formik}
            name="title"
          />
          <Textarea
            classNameLabel="!text-[12px]"
            classNameInput="bg-[#fcfcfc]"
            isRequired
            label={'متن نظر'}
            // @ts-expect-error error
            formik={formik}
            name="content"
          />
          <Checkbox
            name="anonymous"
            label="میخواهم ناشناس بمانم"
            // @ts-expect-error error
            formik={formik}
          />
          <PointCraeetComment name="strengths" formik={formik} label=" مثبت" />
          <PointCraeetComment name="weaknesses" formik={formik} label=" منفی" />
        </div>
      </BaseDialog>
    </>
  );
};

export default TotalScoresOpinionsUsers;
