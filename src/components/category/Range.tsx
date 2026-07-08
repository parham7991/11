'use client';
import { Slider, SliderValue } from '@heroui/react';
import React, { useEffect, useState, useTransition } from 'react';
import { useFormik } from 'formik';
import { addCommas, removeNumNumeric } from '@/lib/fun';
import useGlobalStore from '@/store/global-store';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Input from '../common/form/Input';

type Props = {
  minProductPrice?: number;
  maxProductPrice?: number;
};
const Range = ({ maxProductPrice, minProductPrice }: Props) => {
  const [initialMinPrice] = useState<number>(Number(minProductPrice));
  const [initialMaxPrice] = useState<number>(Number(maxProductPrice));
  const sParams = useSearchParams();
  const pathname = usePathname();
  const { setIsPendingCategory } = useGlobalStore();
  const [value, setValue] = React.useState<SliderValue>([0, 1000]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      from: '',
      to: '',
    },
    onSubmit: () => {},
  });
  useEffect(() => {
    setValue([
      Number(removeNumNumeric(formik.values.from)),
      Number(removeNumNumeric(formik.values.to)),
    ]);
  }, [formik.values]);

  useEffect(() => {
    if (sParams.get('min_price')) {
      const min = sParams.get('min_price') ? Number(sParams.get('min_price')) : minProductPrice;
      const max = sParams.get('max_price') ? Number(sParams.get('max_price')) : maxProductPrice;
      setValue([min!, max!]);

      formik.setValues({
        from: addCommas(min!),
        to: addCommas(max!),
      });
    } else {
      setValue([initialMinPrice, initialMaxPrice]);
      formik.setValues({
        from: addCommas(initialMinPrice),
        to: addCommas(initialMaxPrice),
      });
    }
  }, [sParams]);
  // range
  const onThumbDragEnd = (values: number[]) => {
    startTransition(() => {
      const [minPrice, maxPrice] = values;
      const currentUrl = new URL(window.location.href);
      const searchParams = new URLSearchParams(currentUrl.search);
      searchParams.set('min_price', minPrice.toString());
      searchParams.set('max_price', maxPrice.toString());
      searchParams.set('page', '1');
      const newQueryString = searchParams.toString();
      router.push(`${pathname}?${newQueryString}`, { scroll: false });
    });
  };

  /* @ts-expect-error ssss */
  const onChangerange = (value) => {
    setValue(value);
    formik.setValues({
      ...formik.values,
      from: addCommas(value[0].toString()),
      to: addCommas(value[1].toString()),
    });
  };

  const onchange = (key: string) => {
    if (key === 'Enter') {
      startTransition(() => {
        const minPrice = formik.values.from;
        const maxPrice = formik.values.to;
        setValue([Number(removeNumNumeric(minPrice)), Number(removeNumNumeric(maxPrice))]);
        const currentUrl = new URL(window.location.href);
        const searchParams = new URLSearchParams(currentUrl.search);
        searchParams.set('min_price', minPrice ? removeNumNumeric(minPrice).toString() : '0');
        searchParams.set('max_price', maxPrice ? removeNumNumeric(maxPrice).toString() : '0');
        searchParams.set('page', '1');
        const newQueryString = searchParams.toString();
        router.push(`${pathname}?${newQueryString}`, { scroll: false });
      });
    }
  };

  useEffect(() => {
    setIsPendingCategory(isPending);
  }, [isPending]);

  return (
    <div>
      <div>
        <div className="space-y-1">
          <Input
            onKeyDown={(e) => onchange(e.key)}
            classNameInput="!h-[48px] bg-[#F5F6F6]"
            name="from"
            // @ts-expect-error formik
            formik={formik}
            price
            label="از"
          />
          <Input
            onKeyDown={(e) => onchange(e.key)}
            classNameInput="!h-[48px] bg-[#F5F6F6]"
            name="to"
            // @ts-expect-error formik
            formik={formik}
            price
            label="تا"
          />
        </div>
        <div className="mt-6 flex h-full w-full max-w-full flex-col items-start justify-center gap-2 lg:max-w-md">
          <Slider
            onChangeEnd={(values) => onThumbDragEnd(values as number[])}
            maxValue={initialMaxPrice}
            minValue={initialMinPrice}
            value={value}
            onChange={onChangerange}
            size="md"
            renderThumb={(props) => (
              <p
                {...props}
                className="mt-1 flex h-[28px] min-h-[28px] w-[28px] min-w-[28px] cursor-pointer items-center justify-center rounded-full border bg-white shadow-sm"
              >
                <svg
                  width="8"
                  height="12"
                  viewBox="0 0 8 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 1L1 11" stroke="#A6A6A6" strokeLinecap="round" />
                  <path d="M4 4L4 8" stroke="#A6A6A6" strokeLinecap="round" />
                  <path d="M7 1L7 11" stroke="#A6A6A6" strokeLinecap="round" />
                </svg>
              </p>
            )}
            classNames={{
              filler: 'bg-[#4285F4]',
              track: '!border-l-transparent !border-l-none',
              thumb: [
                'transition-size',
                'bg-[#4285F4]',
                'data-[dragging=true]:shadow-lg data-[dragging=true]:shadow-black/20',
                'data-[dragging=true]:w-7 data-[dragging=true]:h-7 data-[dragging=true]:after:h-6 data-[dragging=true]:after:w-6',
              ],
              step: 'data-[in-range=true]:bg-black/30 dark:data-[in-range=true]:bg-white/50',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Range;
