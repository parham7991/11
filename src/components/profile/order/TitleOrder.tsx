import React from 'react';
interface Props {
  title: string;
  className?: string;
}
const TitleOrder = ({ title, className }: Props) => {
  return (
    <div className={`my-14 flex flex-col items-center justify-center ${className}`}>
      <p className="h-[1px] w-full bg-zinc-100"></p>
      <div className="flex h-[49px] w-full items-center justify-center rounded-bl-[32px] rounded-br-[32px] bg-neutral-100 md:w-[396px]">
        <p className="text-md font-bold text-black">{title}</p>
      </div>
    </div>
  );
};

export default TitleOrder;
