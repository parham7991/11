import { options_site } from '@/lib/data';
import React from 'react';

const OptionSites = () => {
  return (
    <div className="hide-scroll mt-7 flex h-16 w-full items-center justify-around gap-4 overflow-x-auto rounded-2xl border border-zinc-100 bg-neutral-50 px-3">
      {options_site.map((option, idx) => (
        <div key={idx} className="flex items-center">
          <option.icon />
          <span className="whitespace-nowrap text-center font-medium text-xs lg:text-[14px] text-zinc-900">
            {option.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default OptionSites;
