'use client';
import { Select as ReactSelect, SelectItem, SharedSelection } from '@heroui/react';
import { ReactNode } from 'react';

type Props = {
  emptyMessage?: string;
  label?: string;
  options?: { label: string; value: string }[];
  nameLabel?: string;
  description?: ReactNode;
  labelClass?: string;
  nameValue?: string;
  className?: string;
  formik?: unknown;
  name?: string;
  value?: string;
  onChange?: (keys: SharedSelection) => void;
  disabled?: boolean;
  isRequired?: boolean;
  isLoading?: boolean;
  selectionMode?: 'multiple' | 'single';
};

const Select = ({
  disabled,
  isRequired,
  formik,
  name,
  label,
  className,
  options = [],
  nameLabel = 'label',
  nameValue = 'value',
  selectionMode = 'single',
  value,
  description,
  onChange,
  isLoading,
  emptyMessage,
  labelClass,
}: Props) => {
  const isError = formik
    ? // @ts-expect-error error
      formik?.touched[name!] && formik.errors[name!]
      ? true
      : false
    : false;
  // Map through options and create items dynamically based on the provided nameLabel and nameValue
  const items = Array.isArray(options)
    ? options.map((item) => ({
        // @ts-expect-error error
        label: item[nameLabel], // Get label from the object
        // @ts-expect-error error
        value: item[nameValue], // Get value from the object
      }))
    : [];

  const onSelectionChange = (selectedKeys: SharedSelection) => {
    if (selectionMode === 'single') {
      // @ts-expect-error error
      formik?.setFieldValue(name!, selectedKeys.currentKey);
    } else {
      // @ts-expect-error error
      formik?.setFieldValue(name!, Array.from(selectedKeys));
    }
  };
  return (
    <div className={className}>
      {label && (
        <p
          className={`mb-[6px] pr-1 text-[14px] font-medium text-[#616A76] lg:text-[14px] ${labelClass}`}
        >
          {label} {isRequired && <span className="text-red-500">*</span>}
        </p>
      )}
      <div className={`flex items-center gap-3`}>
        <ReactSelect
          isDisabled={disabled}
          isLoading={isLoading}
          dir="rtl"
          selectionMode={selectionMode}
          selectedKeys={
            value
              ? [value]
              : selectionMode === 'multiple'
                ? // @ts-expect-error error
                  formik?.values[name!]
                : // @ts-expect-error error
                  [formik?.values[name!]]
          }
          classNames={{
            label: '!text-gray-700 text-[12px]',
            trigger: 'border border-gray-200 !h-[48px]',
            listbox: 'font-light',
            value: 'font-medium',
            errorMessage: 'font-regular',
          }}
          description={description}
          onSelectionChange={onChange ? onChange : onSelectionChange}
          renderValue={(selectedKeys) => {
            const selectedItems = selectedKeys.map((key) => {
              const column = items.find((col: { value: string }) => col.value === key.key);
              return column?.label;
            });
            return <p className="text-[12px]">{selectedItems.join(', ')}</p>;
          }}
          isInvalid={isError}
          // @ts-expect-error error
          errorMessage={formik?.errors[name!] as string}
        >
          {items.length > 0 ? (
            items.map((animal: { label?: string; value: string }) => (
              <SelectItem key={animal.value}>{animal.label}</SelectItem>
            ))
          ) : (
            <SelectItem
              classNames={{ title: '!text-[12px] font-medium py-2 text-center' }}
              isReadOnly
              key={''}
            >
              {emptyMessage ? emptyMessage : 'لیست خالی است'}
            </SelectItem>
          )}
        </ReactSelect>
      </div>
    </div>
  );
};

export default Select;
