import Link from 'next/link';
import { Menu_Icon, Phone_Icon, User_Icon } from '../Icon';
import Search from './Search';
import Cart from './Cart';
import Button from '../Button';
import { useGetCart } from '@/hooks/cart/useGetCart';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/../public/images/logo-off-3.png';
import Image from 'next/image';
import { useEffect, useTransition, useState } from 'react';
import Loading from '../Loading';
import Cookies from 'js-cookie';
import { cookieName } from '@/lib/utils';
import { Skeleton } from '@heroui/react';
import { useGetSession } from '@/hooks/auth/useGetSession';
import { getCookieRemoveOptions } from '@/lib/cookie-options';
import HeaderThemeToggle from '../theme/HeaderThemeToggle';
import AssembleButton from './AssembleButton';

const HeaderCenter = () => {
  const [isPending, startTransition] = useTransition();
  const { data } = useGetCart();
  const router = useRouter();
  const totalCountBasket = data?.items?.reduce((total: number, basket: { qty: number }) => {
    return total + (basket?.qty ? basket?.qty : 0);
  }, 0);

  const navigateHome = () => {
    startTransition(() => {
      router.push('/');
    });
  };
  return (
    <>
      <div className="container_page bg-blue relative z-10 flex flex-col items-center gap-4 md:flex-row md:gap-14 md:px-5 lg:bg-white">
        <div className="header-logo-bar hidden h-16 w-full items-center justify-between bg-main px-3 md:w-fit md:justify-start lg:flex lg:h-24 lg:bg-transparent">
          <div className="flex h-full items-center gap-4">
            {/* btn menu for mobile */}
            <div className="flex h-full items-center justify-center bg-blue-700 px-5 md:hidden">
              <Menu_Icon className="text-white" />
            </div>
            {/* logo */}
            <button onClick={navigateHome} className="hidden cursor-pointer gap-2 lg:flex">
              <Image className="h-fit w-[350px]" src={Logo} alt="آفلند" />
            </button>
          </div>
          <div className="flex items-center gap-2 space-x-2">
            <UserInfo className="md:hidden" />
            <Button
              onClick={() => router.push(`/cart`)}
              className="!h-[48px] !w-[48px] min-w-[48px] overflow-visible rounded-[12px] border border-[#E4E7E9] bg-white lg:hidden"
            >
              <span>
                <svg
                  width="24"
                  height="25"
                  viewBox="0 0 24 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 2.5H3.74001C4.82001 2.5 5.67 3.43 5.58 4.5L4.75 14.46C4.61 16.09 5.89999 17.49 7.53999 17.49H18.19C19.63 17.49 20.89 16.31 21 14.88L21.54 7.38C21.66 5.72 20.4 4.37 18.73 4.37H5.82001"
                    stroke="#7D8793"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.25 22.5C16.9404 22.5 17.5 21.9404 17.5 21.25C17.5 20.5596 16.9404 20 16.25 20C15.5596 20 15 20.5596 15 21.25C15 21.9404 15.5596 22.5 16.25 22.5Z"
                    stroke="#7D8793"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.25 22.5C8.94036 22.5 9.5 21.9404 9.5 21.25C9.5 20.5596 8.94036 20 8.25 20C7.55964 20 7 20.5596 7 21.25C7 21.9404 7.55964 22.5 8.25 22.5Z"
                    stroke="#7D8793"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 8.5H21"
                    stroke="#7D8793"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {totalCountBasket >= 1 ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F9C638] font-medium text-[12px] text-white">
                  {totalCountBasket ?? 0}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
        {/* search */}
        <div className="container_page flex items-center justify-between border-b border-gray-100 lg:border-none">
          <div className="lg:hidden">
            <button onClick={navigateHome} className="flex w-32 cursor-pointer gap-2 pt-2">
              <Image className="!h-fit max-h-[50px] w-full max-w-[350px]" src={Logo} alt="آفلند" />
            </button>
          </div>
          <div className="flex items-center gap-2 space-x-2 lg:flex-1">
            <Search />
            <a
              href="tel:02143000240"
              className="flex h-9 w-fit items-center justify-center gap-2 rounded-xl bg-main px-3 lg:hidden"
            >
              <span className="hidden font-reqular text-xs font-normal text-white lg:inline-block lg:text-base">
                02143000240
              </span>
              <Phone_Icon className="text-white" />
            </a>
            <AssembleButton className="asm-header-btn--compact lg:hidden" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3 space-x-3">
          <HeaderThemeToggle />
          <UserInfo className="hidden md:flex" />
          <Cart />
        </div>
      </div>
      {isPending && <Loading />}
    </>
  );
};

export default HeaderCenter;

export const UserInfo = ({ className }: { className: string }) => {
  const pathname = usePathname();
  const router = useRouter();
  const protectedRoute = ['/checkout', '/admin', '/profile'];
  const { session, isLoading } = useGetSession();
  const hasToken = Boolean(session?.accessToken);
  useEffect(() => {
    const isProtectedRoute = protectedRoute.find((page) => pathname.startsWith(page));

    // فقط زمانی کوکی را حذف کن که loading تمام شده باشد و توکن وجود نداشته باشد
    if (!isLoading && !hasToken && isProtectedRoute) {
      // حذف کوکی
      const removeOptions = getCookieRemoveOptions();
      if (cookieName) {
        Cookies.remove(cookieName, removeOptions);
      }
      Cookies.remove('NEW_OFFLAND', removeOptions);
      Cookies.remove('NEW_OFFLAND_v1', removeOptions);
      Cookies.remove('NEW_OFFLAND_v2', removeOptions);
      router.push('/auth?page=/');
    }
  }, [hasToken, isLoading, pathname, router]);

  return (
    <div className={`items-center justify-end gap-3 ${className}`}>
      {isLoading ? (
        // Loading skeleton - برای دکمه ورود یا آیکون پروفایل
        <Skeleton className="rounded-xl">
          <div className="h-12 w-12 rounded-xl bg-gray-200" />
        </Skeleton>
      ) : hasToken ? (
        <Link
          prefetch={false}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white lg:bg-main"
          href={'/profile'}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 13C15.9915 13 18.4167 10.5749 18.4167 7.58333C18.4167 4.59179 15.9915 2.16667 13 2.16667C10.0085 2.16667 7.58334 4.59179 7.58334 7.58333C7.58334 10.5749 10.0085 13 13 13Z"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3.69417 23.8333C3.69417 19.6408 7.865 16.25 13 16.25C14.04 16.25 15.0475 16.3908 15.99 16.6508"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M23.8333 19.5C23.8333 20.3125 23.6058 21.0817 23.205 21.7317C22.9775 22.1217 22.685 22.4683 22.3492 22.75C21.5908 23.4325 20.5942 23.8333 19.5 23.8333C17.9183 23.8333 16.5425 22.9883 15.795 21.7317C15.3941 21.0817 15.1667 20.3125 15.1667 19.5C15.1667 18.135 15.795 16.9108 16.7917 16.12C17.5392 15.5242 18.4817 15.1667 19.5 15.1667C21.8942 15.1667 23.8333 17.1058 23.8333 19.5Z"
              stroke="#fff"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.81 19.5L18.8825 20.5725L21.19 18.4384"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      ) : (
        <Link
          prefetch={false}
          href={`/auth?page=${pathname}`}
          className="whitespace-nowrap rounded-lg bg-white px-3 py-2 font-reqular text-[14px] text-main shadow-sm transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-md active:scale-95 lg:bg-main lg:py-3 lg:text-white lg:hover:!bg-blue-700 lg:hover:shadow-lg"
        >
          ورود / ثبت‌نام
        </Link>
      )}
    </div>
  );
};
