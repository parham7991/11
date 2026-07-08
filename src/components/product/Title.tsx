import React from 'react';
interface Props {
  className?: string;
  name: string;
  en_name: string;
}
const Title = ({ className, name, en_name }: Props) => {
  return (
    <div className={`mt-7 lg:mt-0 ${className}`}>
      <h1 className="text-right text-[16px] font-bold text-black lg:text-2xl">{name}</h1>
      <div className="mt-2 flex items-center gap-2 lg:mt-4">
        <p className="text-right text-xs font-bold text-stone-300">{en_name}</p>
        <div className="h-px flex-1 bg-stone-300" />
      </div>
    </div>
  );
};

export default Title;
