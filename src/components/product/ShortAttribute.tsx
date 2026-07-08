'use client';
import React from 'react';
import { Diamond_Icon } from '../common/Icon';

type Props = {
  short_attributes?: { title: string; value: string }[];
  attribute_name: string;
};

const ShortAttribute = ({ short_attributes, attribute_name }: Props) => {
  // فیلتر ویژگی‌ها: حذف "برچسب محصول" و فیلتر محصولات اسمبل شده
  let filteredAttributes = short_attributes?.filter((attr) => attr.title !== 'برچسب محصول');

  // فیلتر ویژگی‌ها در صورتی که محصول اسمبل شده باشد و مقدار فقط عدد باشد
  filteredAttributes =
    attribute_name === 'کیس های اسمبل شده'
      ? filteredAttributes?.filter((attr) => isNaN(Number(attr.value)))
      : filteredAttributes;

  return (
    <div className="w-full">
      <h3 className="text-right font-medium text-base text-black">مشخصات کوتاه :</h3>
      {filteredAttributes?.map((attributes, idx) => (
        <div key={idx} className="mt-2 flex items-baseline gap-3">
          <div className="flex items-center gap-1">
            <Diamond_Icon className="text-[#ADADAD]" />
            <span className="text-center font-reqular text-[14px] text-zinc-400">
              {attributes.title} :
            </span>
          </div>
          <span className="font-medium text-[14px] text-zinc-900">{attributes.value}</span>
        </div>
      ))}
    </div>
  );
};

export default ShortAttribute;
