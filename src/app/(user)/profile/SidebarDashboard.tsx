'use client';
import React, { FC } from 'react';
import { Bag_Icon, Bell_Icon, Wallet_Icon } from '@/components/common/Icon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMedia } from '@/hooks/common/use-media';
import { useSession } from '@/lib/auth/useSession';
import Logout from '@/components/common/Logout';

interface Props {
  menus: {
    name: string;
    Icon: FC<Props>;
    url: string;
  }[];
  className?: string;
}
const SidebarDashboard = ({ menus, className }: Props) => {
  const isMobile = useMedia('(max-width: 480px)', false);
  const pathname = usePathname();
  const session = useSession();
  return (
    <aside className={`container_sidebar ${className}`}>
      <div>
        <div className="container_bg_sidebar !bg-cover">
          <div className="flex h-14 w-20 items-center justify-center rounded-2xl bg-neutral-50 shadow">
            <Bag_Icon />
          </div>
          {/* information */}
          <div className="flex h-full w-full items-center">
            <div className="space-y-2 sm:hidden lg:block">
              <div className="text-right">
                <span className="font-medium text-base text-neutral-50">
                  {session?.first_name
                    ? `${session.first_name} ${session.last_name}`
                    : 'کاربر آفلند'}
                </span>
              </div>
              <p className="font-medium text-white">{session?.mobile}</p>
            </div>

            <div className="-mt-2 hidden w-full items-center justify-end gap-3 sm:flex lg:hidden">
              <div className="flex h-12 items-center justify-center gap-4 rounded-xl bg-white px-1 shadow">
                <span className="flex h-10 !w-20 items-center justify-center rounded-[10px] bg-zinc-900">
                  <Wallet_Icon className="block h-6 w-6 text-white lg:text-blue-500" />
                </span>
                <div className="flex items-center">
                  <span className="text-right font-medium text-zinc-900 xl:text-[28px]">110.8</span>
                  <span className="text-right font-medium text-xs text-zinc-900">میلیون تومان</span>
                </div>
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50">
                <Bell_Icon className="block h-5 w-5 text-neutral-900 xl:h-6 xl:w-6" />
              </div>
            </div>
          </div>
        </div>
        <div className="menu">
          {menus.map((menu, idx) => {
            return (
              <div key={idx} className="container_link">
                <div
                  className={`hidden sm:block ${pathname === menu.url ? 'active block' : 'hidden'}`}
                />
                <Link
                  prefetch={false}
                  className={`link ${pathname === menu.url ? 'sm:rounded-[9px] sm:bg-white sm:shadow' : ''}`}
                  href={
                    menu.url === '/profile/user' && isMobile
                      ? '/profile/user/all-activities'
                      : menu.url === '/profile/investor' && isMobile
                        ? '/profile/investor/all-activities'
                        : menu.url
                  }
                  key={idx}
                >
                  <div className="name">
                    {/* @ts-expect-error error  */}
                    <menu.Icon
                      className={`block h-6 w-6 ${pathname === menu.url ? '!text-blue-500' : ''}`}
                    />
                    <span className={`${pathname === menu.url ? 'sm:!text-neutral-900' : ''}`}>
                      {menu.name}
                    </span>
                  </div>
                  {/* {
                                        warnnig && <Warrnig_Icon className="text-amber-500 w-4 h-4" />
                                    } */}

                  {/* {
                                        badge && <div className="badge" >
                                            <span>3</span>
                                        </div>
                                    } */}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      <Logout className="lg:mt-20" />
    </aside>
  );
};

export default SidebarDashboard;
