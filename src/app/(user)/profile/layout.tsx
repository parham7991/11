import React from 'react';
import SidebarDashboard from './SidebarDashboard';
import { sidebarUser } from '@/lib/data';
import HeadSidebar from './HeadSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  children: React.ReactNode;
}
const Layout = ({ children }: Props) => {
  return (
    <div className="mx-auto flex w-[95%] md:w-[90%] lg:mt-10 lg:gap-9">
      <SidebarDashboard className="!hidden lg:!flex lg:!h-fit" menus={sidebarUser} />
      <div className="flex-1 overflow-hidden">
        <HeadSidebar className="hidden lg:flex" />
        {children}
      </div>
    </div>
  );
};

export default Layout;
