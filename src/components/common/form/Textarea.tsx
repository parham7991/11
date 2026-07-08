'use client';
import { addCommas, removeNumNumeric } from '@/lib/fun';
import { Textarea as ReactInput } from '@heroui/react';
import { FormikProps } from 'formik';
// import PN from 'persian-number';
import { ReactElement, ReactNode } from 'react';

type Props = {
  placeholder?: string;
  startContent?: React.ReactElement;
  endContent?: React.ReactElement;
  type?: string;
  label?: string | ReactElement;
  subLabel?: string;
  className?: string;
  classNameLabel?: string;
  classNameInput?: string;
  name?: string;
  value?: string;
  formik?: FormikProps<unknown>;
  disabled?: boolean;
  dir?: 'ltr' | 'rtl';
  url?: boolean;
  defaultValue?: string;
  description?: ReactNode;
  isRequired?: boolean;
  price?: boolean;
  helperText?: string;
  showCommentIcon?: boolean;
  onAction?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const Textarea = ({
  price,
  dir,
  isRequired,
  disabled,
  description,
  className = '',
  name = '',
  placeholder = '',
  startContent,
  type = 'text',
  label,
  endContent,
  url,
  value,
  formik,
  onAction,
  onChange,
  defaultValue = '',
  classNameInput,
  classNameLabel,
}: Props) => {
  // @ts-expect-error formik
  const isError = formik ? formik.touched[name] && formik.errors[name] : false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onAction) onAction();
    if (url) {
      formik?.setFieldValue('url', e.target.value);
    }

    if (formik) {
      const newValue = price ? addCommas(removeNumNumeric(e.target.value)) : e.target.value;

      formik.setFieldValue(name, newValue);
    }

    if (onChange) onChange(e);
  };

  return (
    <div className={`w-full ${className}`}>
      {typeof label === 'string' ? (
        <p className={`mb-[6px] pr-1 font-medium text-[12px] lg:text-[14px] ${classNameLabel}`}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </p>
      ) : (
        label
      )}
      <ReactInput
        defaultValue={defaultValue}
        dir={dir}
        // isClearable={false}
        aria-label={name}
        isDisabled={disabled}
        name={name}
        type={type}
        placeholder={placeholder}
        // @ts-expect-error formik
        value={value || (formik ? formik.values[name] : '')}
        onChange={handleChange}
        startContent={startContent}
        endContent={endContent}
        isInvalid={!!isError}
        // @ts-expect-error formik
        errorMessage={formik?.errors[name] as string}
        description={
          price ? (
            <span className="inline-block pr-1 text-[12px]">
              {/* {PN.convert(Number(removeNumNumeric(formik?.values[name]!)))}
                تومان */}
            </span>
          ) : (
            description
          )
        }
        // onClear={() => formik?.setFieldValue(name, '')}
        classNames={{
          input: 'px-2 !border-none !ring-0 !outline-none',
          inputWrapper: `bg-[#f5f6f6] rounded-[8px] !border !border-zinc-400 !ring-0 !outline-none group-data-[focus-visible=true]:!ring-0 group-data-[focus-visible=true]:!border group-data-[focus-visible=true]:!border-zinc-400 group-data-[focus-visible=true]:!outline-none overflow-hidden font-medium pl-0 h-[48px] lg:h-[64px] w-full ${classNameInput}`,
        }}
        className="font-light text-[14px]"
      />
    </div>
  );
};

export default Textarea;
