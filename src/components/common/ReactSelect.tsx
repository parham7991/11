import { Select, SelectedItems, SelectItem, SelectSection } from '@heroui/react';
import { FormikProps } from 'formik';
import { useState, useEffect, ReactNode, Key, ChangeEventHandler, useMemo } from 'react';

type Props = {
  selectedKeys?: 'all' | Iterable<Key> | undefined;
  label?: string;
  placeholder?: string;
  options?: { [key: string]: string }[]; // Assuming options is an array of objects
  nameLabel?: string; // The key for label in the options object
  nameValue?: string; // The key for value in the options object
  className?: string;
  formik?: FormikProps<{ [key: string]: string | number | boolean }>;
  classNameLabel?: string;
  name?: string;
  disabled?: boolean;
  isFetching?: boolean;
  isLoading?: boolean;
  isRequired?: boolean;
  onAction?: (value: string) => void;
  RenderValue?: ((items: SelectedItems<object>) => ReactNode) | undefined;
  page?: number;
  total?: number;
  setPage?: (page: number) => void;
  selectionMode?: 'single' | 'multiple' | undefined;
  onChange?: ChangeEventHandler<HTMLSelectElement> | undefined;
  startContent?: React.ReactElement;
  endContent?: React.ReactElement;
  triggerClass?: string;
};

const ReactSelect = ({
  isFetching,
  isLoading,
  disabled,
  selectionMode = 'single',
  placeholder,
  RenderValue,
  isRequired,
  onAction,
  className,
  formik,
  name,
  label,
  options = [],
  nameLabel = 'label',
  nameValue = 'value',
  selectedKeys,
  startContent,
  onChange,
  endContent,
  classNameLabel,
  triggerClass,
}: Props) => {
  const isError = formik ? (formik?.touched[name!] && formik.errors[name!] ? true : false) : false;
  const [searchTerm] = useState(''); // مقدار ورودی جستجو

  // Initialize the finalItems state
  const [finalItems, setFinalItems] = useState<{ [key: string]: string }[]>(
    Array.isArray(options)
      ? options.map((item) => ({
          ...item,
          label: item[nameLabel], // Get label from the object
          value: item[nameValue], // Get value from the object
        }))
      : []
  );

  // Update finalItems when new options are passed
  const processedOptions = useMemo(() => {
    return Array.isArray(options)
      ? options.map((item) => ({
          ...item,
          label: item[nameLabel],
          value: item[nameValue],
        }))
      : [];
  }, [options]);

  useEffect(() => {
    setFinalItems((prev) => {
      const uniqueItems = processedOptions.filter(
        (newItem) => !prev.some((oldItem) => oldItem.value === newItem.value)
      );

      if (uniqueItems.length === 0) return prev;
      return [...prev, ...uniqueItems];
    });
  }, [processedOptions]);

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onAction) onAction(e.target.value);
    if (selectionMode === 'multiple') {
      formik?.setFieldValue(name!, new Set(e.target.value.split(',')));
    } else {
      formik?.setFieldValue(name!, e.target.value);
    }
  };

  const filteredItems = useMemo(() => {
    return finalItems.filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, finalItems]);

  return (
    <>
      <div className={className}>
        {typeof label === 'string' ? (
          <p className={`mb-[6px] pr-1 font-medium text-[14px] lg:text-[14px] ${classNameLabel} `}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </p>
        ) : (
          label
        )}
        <Select
          startContent={startContent}
          endContent={endContent}
          isLoading={isLoading || isFetching}
          aria-label={label}
          disableAnimation
          showScrollIndicators={true}
          placeholder={placeholder}
          isDisabled={disabled}
          selectionMode={selectionMode}
          multiple={selectionMode === 'multiple' ? true : false}
          dir="rtl"
          renderValue={RenderValue}
          onChange={onChange ? onChange : handleSelectionChange}
          // @ts-expect-error error
          selectedKeys={
            selectedKeys
              ? selectedKeys
              : selectionMode === 'multiple'
                ? formik?.values[name!]
                : [formik?.values[name!]]
          }
          name={name}
          className={`w-full`}
          classNames={{
            trigger: `border h-[48px]  lg:h-[64px] ${triggerClass} ${isError ? '!bg-[#fee7ef]' : ''}`,
            value: 'text-[14px] !font-medium',
            label: '!text-gray-700 text-[12px]',
            listboxWrapper: 'listbox relative font-regular',
            errorMessage: 'font-regular',
          }}
          isInvalid={isError}
          errorMessage={formik?.errors[name!] as string}
        >
          {/* <SelectItem textValue="search" classNames={{ selectedIcon: "hidden", base: "data-[hover=true]:!bg-transparent  !px-0 " }} isReadOnly className="text-center !h-[48px] mt-px" key={"search"}>
                        <Input
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="جستجو"
                            className="w-full !px-0"
                            classNames={{ inputWrapper: "px-0 bg-[#f4f5f5]", input: "!border-none px-4  !h-[40px] outline-none" }} />
                    </SelectItem> */}
          {filteredItems?.length > 0 ? (
            <SelectSection className="mt-3">
              {filteredItems.map((item) => (
                <SelectItem
                  className="!h-[40px]"
                  textValue={item.title}
                  classNames={{ title: 'text-[12px]' }}
                  key={item.value}
                  // @ts-expect-error error
                  value={item.title}
                >
                  {/* @ts-expect-error error */}
                  {RenderValue ? <RenderValue item={item} /> : item.label}
                </SelectItem>
              ))}
            </SelectSection>
          ) : (
            <SelectItem isReadOnly className="text-center" key={''}>
              لیست خالی است
            </SelectItem>
          )}
        </Select>
      </div>
    </>
  );
};

export default ReactSelect;
