import React from 'react';
import { Arrow_Icon } from './Icon';
import Link from 'next/link';
interface Props {
  title: string;
  href: string;
}
const TitleDashboard = ({ title, href = '#' }: Props) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-right font-bold text-black sm:text-xl">{title}</span>
      <Link prefetch={false} href={href} className="flex items-center gap-1 sm:gap-2">
        <span className="text-blue text-right font-medium text-[12px] sm:text-[13px]">
          مشاهده همه
        </span>
        <Arrow_Icon className="text-blue block h-3 w-3" />
      </Link>
    </div>
  );
};

export default TitleDashboard;
