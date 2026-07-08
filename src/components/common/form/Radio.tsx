import { RadioGroup, Radio as RadioButton } from '@heroui/react';
import React from 'react';
import { FormikProps } from 'formik';

type Props = {
  formik?: FormikProps<{ [key: string]: string | number | boolean }>;
  name?: string;
  label?: string;
  className?: string;
  isRequired?: boolean;
  options?: { [key: string]: string }[];
};

const Radio = ({ options, className, formik, name, label, isRequired }: Props) => {
  const isInvalid = formik ? (formik.touched[name!] && formik.errors[name!] ? true : false) : false;
  return (
    <div className={className}>
      {typeof label === 'string' ? (
        <p className="mb-[6px] pr-1 font-medium text-[12px]">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </p>
      ) : (
        label
      )}
      <RadioGroup
        name={name}
        // @ts-expect-error error
        value={formik?.values[name!]}
        onValueChange={(value) => formik?.setFieldValue(name!, value)}
        isInvalid={isInvalid}
        errorMessage={formik?.errors[name!] as string}
        orientation="horizontal"
      >
        {options?.map((option, idx) => (
          <RadioButton
            key={idx}
            classNames={{
              label: 'pr-2',
              control: 'group-data-[selected=true]:bg-red-500',
              wrapper: 'group-data-[selected=true]:!border-red-500',
            }}
            value={option.value}
          >
            {option.label}
          </RadioButton>
        ))}
      </RadioGroup>
    </div>
  );
};

export default Radio;
