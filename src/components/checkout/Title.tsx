import React, { ComponentType } from 'react';
interface Props {
  Icon?: ComponentType<{ className?: string }>; // اینجا تغییر کرد
  title: string;
  className?: string;
}
const Title = ({ Icon, title, className }: Props) => {
  return (
    <div
      className={`mb-1 flex h-10 w-full items-center gap-2 rounded-xl bg-main px-4 text-neutral-50 lg:mb-4 lg:h-14 ${className}`}
    >
      {Icon && <Icon className="h-6 w-6 text-white" />}
      <p className="lg:text-md text-right font-bold text-[12px]">{title}</p>
    </div>
  );
};

export default Title;
