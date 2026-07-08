import { Accordion, AccordionItem, Checkbox } from '@heroui/react';
import React, { useEffect, useState, useTransition } from 'react';
import Range from './Range';
import { useRouter } from 'next/navigation';
import useGlobalStore from '@/store/global-store';
import { FilterCategory } from '@/types/Home';
import Input from '../common/form/Input';

type Props = {
  resultFilter?: FilterCategory;
  searchParams: {
    attributes?: string;
    available?: string;
    discounted?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    search?: string;
  };
};

const CheckboxFilter = ({ resultFilter, searchParams }: Props) => {
  const { setIsPendingCategory } = useGlobalStore();
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const oldAttributes = searchParams.attributes ? JSON.parse(searchParams.attributes) : [];
  const [singleSelections, setSingleSelections] = useState<{ [key: string]: string }>({});

  const defaultOpenAccordions = resultFilter?.attributes
    ?.map((property, idx) =>
      property?.options?.some((attr) => oldAttributes.includes(attr.attribute_id.toString()))
        ? idx.toString()
        : null
    )
    .filter(Boolean) as string[];

  const handleSearchChange = (index: number, value: string) => {
    setSearchTerms((prev) => ({ ...prev, [index]: value }));
  };

  useEffect(() => {
    setIsPendingCategory(isPending);
  }, [isPending]);
  const onAttributes = (
    option: { attribute_id?: number; id: string; value: string; type?: string },
    isSingleSelect: boolean = false,
    groupKey?: string
  ) => {
    startTransition(() => {
      const currentUrl = new URL(window.location.href);
      const searchParams = new URLSearchParams(currentUrl.search);

      // ---------- بخش برند (تکی و ذخیره encoded) ----------
      if (option.type === 'brand') {
        const currentBrandEncoded = searchParams.get('brand');
        const optionValueEncoded = encodeURIComponent(option.value);

        if (currentBrandEncoded === optionValueEncoded) {
          // اگر برند انتخاب‌شده دوباره کلیک شد → حذفش کن
          searchParams.delete('brand');
          setSingleSelections((prev) => ({ ...prev, brand: '' }));
        } else {
          // برند جدید را با encode ذخیره کن
          searchParams.set('brand', optionValueEncoded);
          setSingleSelections((prev) => ({ ...prev, brand: option.value }));
        }
      } else {
        // ---------- بخش attribute ها ----------
        const existingAttributes = searchParams.get('attributes')
          ? JSON.parse(searchParams.get('attributes')!)
          : [];

        let newAttributes = existingAttributes;

        if (isSingleSelect && groupKey) {
          // حذف تمام attribute هایی که متعلق به این گروه هستند
          newAttributes = existingAttributes.filter(
            (attr: { attribute_id: number }) => attr.attribute_id !== option.attribute_id
          );

          if (singleSelections[groupKey] === option.id) {
            // دوباره کلیک → حذف
            setSingleSelections((prev) => ({ ...prev, [groupKey]: '' }));
          } else {
            newAttributes.push({
              key: option.id,
              value: option.value,
              attribute_id: option.attribute_id,
            });
            setSingleSelections((prev) => ({ ...prev, [groupKey]: option.id }));
          }
        } else {
          // حالت چندتایی
          const foundAttribute = existingAttributes.find(
            (attr: { attribute_id: number }) => attr.attribute_id === option.attribute_id
          );

          newAttributes = existingAttributes.filter(
            (attr: { attribute_id: number }) => attr.attribute_id !== option.attribute_id
          );

          if (foundAttribute) {
            if (foundAttribute.key !== option.id) {
              newAttributes.push({
                key: option.id,
                value: option.value,
                attribute_id: option.attribute_id,
              });
            }
          } else {
            newAttributes.push({
              key: option.id,
              value: option.value,
              attribute_id: option.attribute_id,
            });
          }
        }

        if (newAttributes.length > 0) {
          searchParams.set('attributes', JSON.stringify(newAttributes));
        } else {
          searchParams.delete('attributes');
        }
      }

      // صفحه رو به 1 برگردون
      searchParams.set('page', '1');

      // رفتن به URL جدید
      const newPath = currentUrl.pathname;
      const newQueryString = searchParams.toString();
      router.push(`${newPath}?${newQueryString}`, { scroll: true });
    });
  };

  const brands =
    Number(resultFilter?.brands?.length) >= 1
      ? {
          type: 'brand',
          title: 'برند‌ها',
          isSingleSelect: true, // ✅ فقط یک برند قابل انتخاب است
          options: resultFilter?.brands.map((item) => {
            return {
              value: item.title,
              id: item.id,
              type: 'brand',
            };
          }),
        }
      : null;
  return (
    <div className="category-checkbox-filter !rounded-lg lg:!mt-5 lg:bg-[#F3F6FB] lg:!px-3">
      {/* @ts-expect-error error */}
      <Accordion
        defaultSelectedKeys={defaultOpenAccordions}
        className="container_accordion_filter px-0"
      >
        <AccordionItem
          indicator={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995"
                stroke="#393B40"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          key={'range'}
          aria-label={`Accordion range`}
          classNames={{
            base: 'border-b border-[#E4E7E9] hidden lg:block',
            title: 'text-[#0C0C0C] text-[16px] font-medium',
          }}
          title="محدوده قیمت"
        >
          <Range
            maxProductPrice={resultFilter?.maxProductPrice}
            minProductPrice={resultFilter?.minProductPrice}
          />
        </AccordionItem>
        {/*  ...resultFilter?.attributes */}
        {[...(brands ? [brands] : [])]?.map((property, idx) => {
          if (property.title === 'وضعیت موجودی') return null;
          const searchTerm = searchTerms[idx] || '';
          const filteredAttributes = property?.options?.filter((attr) =>
            attr.value.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // const selectedAttributesForProperty = property.options.filter(attr =>
          //     selectedAttributes.includes(attr.attribute_id.toString())
          // );

          return (
            <AccordionItem
              indicator={
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995"
                    stroke="#393B40"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              key={idx}
              aria-label={`Accordion ${idx}`}
              classNames={{
                base: 'border-b !border-[#E4E7E9]',
                title: 'text-[#0C0C0C] text-[14px] lg:text-[16px] font-medium',
              }}
              title={property.title}
            >
              <div>
                {/* {selectedAttributesForProperty?.length > 0 && (
                                    <div className="!mb-10 ">
                                        <p className='text-[#616A76] my-3 text-[14px] font-medium'>  فیلترهای انتخاب شده:</p>
                                        <ul className="list-disc flex flex-col gap-2">
                                            {selectedAttributesForProperty?.map((attribute) => (
                                                <Checkbox
                                                    // انتخاب پیش‌فرض چک‌باکس‌ها
                                                    isSelected={selectedAttributes.includes(attribute.attribute_id.toString())}
                                                    key={attribute._id}
                                                    classNames={{
                                                        label: 'pr-1 text-[14px] !font-medium text-[#0C0C0C]',
                                                        wrapper: 'after:!bg-main',
                                                    }}
                                                    onValueChange={(value) => onAttributes(attribute)}
                                                >
                                                    <div className='flex items-center gap-2'>

                                                        {attribute.value}
                                                    </div>
                                                </Checkbox>
                                            ))}
                                        </ul>
                                    </div>
                                )} */}

                <Input
                  classNameInput="!h-[45px] bg-[#f5f6f6]"
                  placeholder="جستجو"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(idx, e.target.value)}
                />

                <div className="mt-5 flex flex-col gap-4">
                  {Number(filteredAttributes?.length) > 0 ? (
                    filteredAttributes?.map((attribute) => (
                      <Checkbox
                        key={attribute.id}
                        isSelected={singleSelections['brand'] === attribute.value} // انتخاب شده؟
                        onValueChange={() =>
                          onAttributes(attribute, property.isSingleSelect, 'brand')
                        }
                        classNames={{
                          label: 'pr-1 text-[14px] !font-medium text-[#0C0C0C]',
                          wrapper: 'after:!bg-main',
                        }}
                      >
                        <div className="flex items-center gap-2">{attribute.value}</div>
                      </Checkbox>
                    ))
                  ) : (
                    <p className="font-medium text-[14px] text-gray-500">موردی یافت نشد</p>
                  )}
                </div>
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default CheckboxFilter;
