import { Switch } from '@heroui/react';
import React from 'react';
type Props = {
  searchParams: {
    attribiutes?: string;
    available?: string;
    discounted?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    search?: string;
  };
  onToggle: (value: boolean, name: string) => void;
};
const ToggleFilter = ({ searchParams, onToggle }: Props) => {
  return (
    <div className="category-toggle-filter rounded-lg lg:bg-[#F3F6FB] lg:p-3">
      <div className="flex !h-[56px] items-center justify-between border-b border-[#E4E7E9]">
        <h3 className="category-filter-text font-medium text-[16px] text-[#0C0C0C]">فقط کالاهای موجود</h3>
        <Switch
          isSelected={searchParams.available === 'true'}
          onValueChange={(value) => onToggle(value, 'available')}
          classNames={{ wrapper: 'group-data-[selected=true]:bg-main' }}
        />
      </div>
      <div className="flex !h-[56px] items-center justify-between">
        <h3 className="category-filter-text font-medium text-[16px] text-[#0C0C0C]">فقط کالاهای تخفیف‌دار</h3>
        <Switch
          isSelected={searchParams.discounted === 'true'}
          onValueChange={(value) => onToggle(value, 'discounted')}
          classNames={{ wrapper: 'group-data-[selected=true]:bg-main' }}
        />
      </div>
    </div>
  );
};

export default ToggleFilter;
