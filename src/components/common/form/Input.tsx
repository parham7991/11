import { Input as ReactInput } from '@heroui/react';
import { FormikProps } from 'formik';
import { KeyboardEventHandler, ReactElement, ReactNode, useState } from 'react';
import { CgClose } from 'react-icons/cg';
import { BiEditAlt } from 'react-icons/bi';
import { addCommas, removeNumNumeric } from '@/lib/convert';

type Props = {
  placeholder?: string;
  startContent?: ReactNode;
  endContent?: ReactNode;
  type?: string;
  label?: string | ReactElement;
  classNameInput?: string | ReactElement;
  subLabel?: string;
  className?: string;
  classNameLabel?: string;
  name?: string;
  value?: string;
  formik?: FormikProps<unknown>;
  disabled?: boolean;
  dir?: 'ltr' | 'rtl';
  url?: boolean;
  defaultValue?: string;
  description?: string | ReactNode;
  isRequired?: boolean;
  price?: boolean;
  helperText?: string;
  min?: number;
  max?: number;
  showCommentIcon?: boolean;
  onAction?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAvailable?: boolean;
  onKeyDown?: (KeyboardEventHandler<HTMLInputElement> & ((e: KeyboardEvent) => void)) | undefined;
};

const Input = ({
  classNameInput,
  price,
  dir = 'rtl',
  classNameLabel,
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
  helperText,
  onChange,
  defaultValue = '',
  isAvailable,
  onKeyDown,
  min,
  max,
}: Props) => {
  const [show, setShow] = useState(false);
  // @ts-expect-error formik
  const isError = formik ? formik.touched[name] && formik.errors[name] : false;
  const onClose = () => {
    formik?.setFieldValue('url', null);
    setShow(!show);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onAction) onAction();
    if (url && !isAvailable) {
      formik?.setFieldValue('url', e.target.value);
    }

    if (formik) {
      const newValue = price ? addCommas(removeNumNumeric(e.target.value)) : e.target.value;

      formik.setFieldValue(name, newValue);
    }

    if (onChange) onChange(e);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {typeof label === 'string' ? (
        <p className={`mb-[6px] pr-1 font-medium text-[12px] lg:text-[14px] ${classNameLabel}`}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </p>
      ) : (
        label
      )}
      <ReactInput
        minLength={min}
        maxLength={max}
        defaultValue={defaultValue}
        dir={dir}
        // isClearable={disabled ? false : true}
        aria-label={name}
        isDisabled={disabled}
        name={name}
        type={type}
        placeholder={placeholder}
        // @ts-expect-error formik
        value={value || (formik ? formik.values[name] : '')}
        onChange={handleChange}
        startContent={startContent}
        onKeyDown={onKeyDown}
        isInvalid={!!isError}
        endContent={endContent}
        // @ts-expect-error formik
        errorMessage={formik?.errors[name] as string}
        description={
          url ? (
            <div className="flex items-center justify-end gap-1">
              {show ? (
                <CgClose className="cursor-pointer" size={17} onClick={onClose} />
              ) : (
                <BiEditAlt className="cursor-pointer" onClick={() => setShow(!show)} size={18} />
              )}
              <span>{helperText}</span>
            </div>
          ) : price ? (
            <span className="inline-block pr-1 text-[12px]">
              {/* {PN.convert(Number(removeNumNumeric(formik?.values[name]!)))}{' '} */}
              تومان
            </span>
          ) : (
            description
          )
        }
        // onClear={disabled ? undefined : () => formik?.setFieldValue(name, '')}
        classNames={{
          input: `px-2 !border-none !ring-0 !outline-none focus:!outline-none focus-visible:!outline-none ${classNameInput}`,
          inputWrapper: `bg-[#eee] rounded-[8px] !pl-3 overflow-hidden font-medium pl-0 h-[56px] w-full !border-none !ring-0 !outline-none focus:!outline-none focus-visible:!outline-none data-[hover=true]:!border-none group-data-[focus=true]:!border-none group-data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!outline-none ${classNameInput}`,
        }}
        className={`font-light text-[14px] ${disabled ? '!opacity-70' : ''}`}
      />
    </div>
  );
};

export default Input;
