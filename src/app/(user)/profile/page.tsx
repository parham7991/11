import React from 'react';
import SidebarDashboard from './SidebarDashboard';
import Home from '@/components/profile/user/Home';
import { sidebarUser } from '@/lib/data';

const Page = () => {
  return (
    <div className="mt-8">
      <SidebarDashboard className="flex lg:!hidden" menus={sidebarUser} />
      <Home className="!hidden gap-10 pb-10 lg:!flex" />
    </div>
  );
};

export default Page;
