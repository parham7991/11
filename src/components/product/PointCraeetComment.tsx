import React, { useState } from 'react';

import { BiPlus } from 'react-icons/bi';
import { CgClose } from 'react-icons/cg';

type Props = {
  label?: string;
  formik?: unknown;
  name: string;
};
const PointCraeetComment = ({ label, formik, name }: Props) => {
  const [point, setPoint] = useState('');
  const onAdd = () => {
    if (point) {
      setPoint('');
      // @ts-expect-error formik
      formik.setFieldValue(name, [...formik.values[name], point]);
    }
  };
  const onDelete = (item: string) => {
    // @ts-expect-error formik
    const filterItems = formik.values[name].filter((option: string) => option !== item);
    // @ts-expect-error formik
    formik.setFieldValue(name, filterItems);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (point) {
        setPoint('');
        // @ts-expect-error formik
        formik.setFieldValue(name, [...formik.values[name], point]);
      }
    }
  };
  return (
    <div>
      <div className="">
        {label ? (
          <label
            className={`relative block pb-1 pr-1 font-reqular text-[12px] ${name === 'strengths' ? 'text-main' : 'text-[#F9A038]'}`}
          >
            <span className="text-black">ویژگی</span>
            {label}
          </label>
        ) : null}
        <div className="flex items-center rounded-lg border bg-[#FCFCFC] p-1">
          <input
            onKeyDown={onKeyDown}
            value={point}
            onChange={(e) => setPoint(e.target.value)}
            className="text-zinc_500 w-full bg-transparent font-medium text-[13px] outline-none"
          />
          <button
            type="button"
            onClick={onAdd}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100"
          >
            <BiPlus
              className={`block h-4 w-4 ${name === 'strengths' ? '!text-main' : '!text-[#F9A038]'}`}
              size={20}
            />
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {/* @ts-expect-error formik */}
        {formik.values[name!].map((item: string, idx: number) => (
          <div
            className={`flex items-center justify-between rounded-lg border p-2 ${name === 'strengths' ? 'border-main bg-main bg-opacity-10' : 'border-[#F9A038] bg-red-50'}`}
            key={idx}
          >
            <span
              className={`font-medium text-[13px] ${name === 'strengths' ? 'text-main' : 'text-[#F9A038]'}`}
            >
              {item}
            </span>
            <button type="button" onClick={() => onDelete(item)}>
              <CgClose
                className={`block h-4 w-4 ${name === 'strengths' ? '!text-main' : '!text-[#F9A038]'}`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PointCraeetComment;
