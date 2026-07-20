'use client';
import { useGetCart } from '@/hooks/cart/useGetCart';
import { useSession } from '@/lib/auth/useSession';
import { usePathname, useRouter } from 'next/navigation';
import React, { useTransition, useState, useEffect } from 'react';
import Loading from './Loading';
import { safeRequest } from '@/lib/client';
import { useTheme } from '@/components/common/theme/ThemeProvider';

const profilePages: string[] = ['/product'];
type Props = {
  isShow?: boolean;
  className?: string;
};
const MenuBottom = ({ isShow = false, className }: Props) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useGetCart();
  const session = useSession(false); // Optional mode
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [hasLoadedCategories, setHasLoadedCategories] = useState(false);

  const totalCountBasket = data?.items?.reduce((total: number, basket: { qty: number }) => {
    return total + (basket?.qty ? basket?.qty : 0);
  }, 0);
  const { resolvedTheme, toggleTheme } = useTheme();
  const isProfilePage = profilePages.some((page) => pathname.startsWith(page));
  const onselect = (menu: { href: string }) => {
    startTransition(() => {
      router.push(menu.href);
    });
  };

  // تابع برای بارگذاری دسته‌بندی‌ها
  const loadCategories = async () => {
    if (hasLoadedCategories || isLoadingCategories) return;

    // بررسی localStorage
    try {
      const storedData = localStorage.getItem('categories');
      const storedTimestamp = localStorage.getItem('categoriesTimestamp');

      if (storedData && storedTimestamp) {
        const storedTime = parseInt(storedTimestamp);
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 دقیقه

        if (now - storedTime < CACHE_DURATION) {
          const parsedData = JSON.parse(storedData);
          setCategories(parsedData);
          setHasLoadedCategories(true);
          return;
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }

    setIsLoadingCategories(true);
    try {
      const categoryData = await safeRequest<any>({
        url: `/catalog/megamenu`,
        revalidate: 3600,
        defaultValue: [],
      });

      // ذخیره در localStorage
      try {
        localStorage.setItem('categories', JSON.stringify(categoryData));
        localStorage.setItem('categoriesTimestamp', Date.now().toString());
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }

      setCategories(categoryData);
      setHasLoadedCategories(true);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // بارگذاری دسته‌بندی‌ها وقتی کامپوننت mount می‌شود
  useEffect(() => {
    loadCategories();
  }, []);

  const menus = [
    {
      name: 'خانه',
      href: '/',
      icon: (
        <svg
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.5 18.5V15.5"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.57 3.31985L3.64002 8.86985C2.86002 9.48985 2.36002 10.7998 2.53002 11.7798L3.86002 19.7398C4.10002 21.1598 5.46002 22.3098 6.90002 22.3098H18.1C19.53 22.3098 20.9 21.1498 21.14 19.7398L22.47 11.7798C22.63 10.7998 22.13 9.48985 21.36 8.86985L14.43 3.32985C13.36 2.46985 11.63 2.46985 10.57 3.31985Z"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          width="24"
          height="25"
          viewBox="0 0 24 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity="0.4"
            d="M20.83 8.51002L14.28 3.27002C13 2.25002 11 2.24002 9.72996 3.26002L3.17996 8.51002C2.23996 9.26002 1.66996 10.76 1.86996 11.94L3.12996 19.48C3.41996 21.17 4.98996 22.5 6.69996 22.5H17.3C18.99 22.5 20.59 21.14 20.88 19.47L22.14 11.93C22.32 10.76 21.75 9.26002 20.83 8.51002Z"
            fill="#386BF9"
          />
          <path
            d="M12 19.25C11.59 19.25 11.25 18.91 11.25 18.5V15.5C11.25 15.09 11.59 14.75 12 14.75C12.41 14.75 12.75 15.09 12.75 15.5V18.5C12.75 18.91 12.41 19.25 12 19.25Z"
            fill="#386BF9"
          />
        </svg>
      ),
    },
    {
      name: 'دسته بندی',
      href: '/category-list/',
      icon: (
        <svg
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.833 10.5H19.833C21.833 10.5 22.833 9.5 22.833 7.5V5.5C22.833 3.5 21.833 2.5 19.833 2.5H17.833C15.833 2.5 14.833 3.5 14.833 5.5V7.5C14.833 9.5 15.833 10.5 17.833 10.5Z"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.83301 22.5H7.83301C9.83301 22.5 10.833 21.5 10.833 19.5V17.5C10.833 15.5 9.83301 14.5 7.83301 14.5H5.83301C3.83301 14.5 2.83301 15.5 2.83301 17.5V19.5C2.83301 21.5 3.83301 22.5 5.83301 22.5Z"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.83301 10.5C9.04215 10.5 10.833 8.70914 10.833 6.5C10.833 4.29086 9.04215 2.5 6.83301 2.5C4.62387 2.5 2.83301 4.29086 2.83301 6.5C2.83301 8.70914 4.62387 10.5 6.83301 10.5Z"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.833 22.5C21.0421 22.5 22.833 20.7091 22.833 18.5C22.833 16.2909 21.0421 14.5 18.833 14.5C16.6239 14.5 14.833 16.2909 14.833 18.5C14.833 20.7091 16.6239 22.5 18.833 22.5Z"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.57398 2.5H5.67398C3.48398 2.5 2.33398 3.65 2.33398 5.83V7.73C2.33398 9.91 3.48398 11.06 5.66398 11.06H7.56398C9.74398 11.06 10.894 9.91 10.894 7.73V5.83C10.904 3.65 9.75398 2.5 7.57398 2.5Z"
            fill="#386BF9"
          />
          <path
            opacity="0.4"
            d="M19.0034 2.5H17.1034C14.9234 2.5 13.7734 3.65 13.7734 5.83V7.73C13.7734 9.91 14.9234 11.06 17.1034 11.06H19.0034C21.1834 11.06 22.3334 9.91 22.3334 7.73V5.83C22.3334 3.65 21.1834 2.5 19.0034 2.5Z"
            fill="#386BF9"
          />
          <path
            d="M19.0034 13.9297H17.1034C14.9234 13.9297 13.7734 15.0797 13.7734 17.2597V19.1597C13.7734 21.3397 14.9234 22.4897 17.1034 22.4897H19.0034C21.1834 22.4897 22.3334 21.3397 22.3334 19.1597V17.2597C22.3334 15.0797 21.1834 13.9297 19.0034 13.9297Z"
            fill="#386BF9"
          />
          <path
            opacity="0.4"
            d="M7.57398 13.9297H5.67398C3.48398 13.9297 2.33398 15.0797 2.33398 17.2597V19.1597C2.33398 21.3497 3.48398 22.4997 5.66398 22.4997H7.56398C9.74398 22.4997 10.894 21.3497 10.894 19.1697V17.2697C10.904 15.0797 9.75398 13.9297 7.57398 13.9297Z"
            fill="#386BF9"
          />
        </svg>
      ),
    },
    {
      name: 'سبد خرید',
      href: '/cart/',
      badge: totalCountBasket,
      icon: (
        <svg
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.16699 2.5H3.907C4.987 2.5 5.83699 3.43 5.74699 4.5L4.91699 14.46C4.77699 16.09 6.06699 17.49 7.70699 17.49H18.357C19.797 17.49 21.057 16.31 21.167 14.88L21.707 7.38C21.827 5.72 20.567 4.37 18.897 4.37H5.987"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.417 22.5C17.1073 22.5 17.667 21.9404 17.667 21.25C17.667 20.5596 17.1073 20 16.417 20C15.7266 20 15.167 20.5596 15.167 21.25C15.167 21.9404 15.7266 22.5 16.417 22.5Z"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.41699 22.5C9.10735 22.5 9.66699 21.9404 9.66699 21.25C9.66699 20.5596 9.10735 20 8.41699 20C7.72664 20 7.16699 20.5596 7.16699 21.25C7.16699 21.9404 7.72664 22.5 8.41699 22.5Z"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.16699 8.5H21.167"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.9167 23C17.8832 23 18.6667 22.2165 18.6667 21.25C18.6667 20.2835 17.8832 19.5 16.9167 19.5C15.9502 19.5 15.1667 20.2835 15.1667 21.25C15.1667 22.2165 15.9502 23 16.9167 23Z"
            fill="#386BF9"
          />
          <path
            d="M8.91675 23C9.88325 23 10.6667 22.2165 10.6667 21.25C10.6667 20.2835 9.88325 19.5 8.91675 19.5C7.95025 19.5 7.16675 20.2835 7.16675 21.25C7.16675 22.2165 7.95025 23 8.91675 23Z"
            fill="#386BF9"
          />
          <path
            opacity="0.4"
            d="M5.50674 4.44L5.30675 6.89C5.26675 7.36 5.63675 7.75 6.10675 7.75H21.4167C21.8367 7.75 22.1868 7.42999 22.2168 7.00999C22.3468 5.23999 20.9967 3.8 19.2267 3.8H6.95674C6.85674 3.36 6.65674 2.94 6.34674 2.59C5.85674 2.06 5.15675 1.75 4.43675 1.75H2.66675C2.25675 1.75 1.91675 2.09 1.91675 2.5C1.91675 2.91 2.25675 3.25 2.66675 3.25H4.40675C4.71675 3.25 5.00675 3.38001 5.21675 3.60001C5.42675 3.83001 5.52674 4.13 5.50674 4.44Z"
            fill="#386BF9"
          />
          <path
            d="M21.1768 9.25H5.8368C5.4168 9.25 5.0768 9.57 5.0368 9.98L4.6768 14.33C4.5368 16.03 5.8768 17.5 7.5868 17.5H18.7068C20.2068 17.5 21.5268 16.27 21.6368 14.77L21.9668 10.1C22.0068 9.64001 21.6468 9.25 21.1768 9.25Z"
            fill="#386BF9"
          />
        </svg>
      ),
    },
    {
      name: 'پروفایل',
      href: '/profile/',
      icon: session?.accessToken ? (
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 13C15.9915 13 18.4167 10.5749 18.4167 7.58333C18.4167 4.59179 15.9915 2.16667 13 2.16667C10.0085 2.16667 7.58334 4.59179 7.58334 7.58333C7.58334 10.5749 10.0085 13 13 13Z"
            stroke="#A6AFB9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.69417 23.8333C3.69417 19.6408 7.865 16.25 13 16.25C14.04 16.25 15.0475 16.3908 15.99 16.6508"
            stroke="#A6AFB9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M23.8333 19.5C23.8333 20.3125 23.6058 21.0817 23.205 21.7317C22.9775 22.1217 22.685 22.4683 22.3492 22.75C21.5908 23.4325 20.5942 23.8333 19.5 23.8333C17.9183 23.8333 16.5425 22.9883 15.795 21.7317C15.3941 21.0817 15.1667 20.3125 15.1667 19.5C15.1667 18.135 15.795 16.9108 16.7917 16.12C17.5392 15.5242 18.4817 15.1667 19.5 15.1667C21.8942 15.1667 23.8333 17.1058 23.8333 19.5Z"
            stroke="#A6AFB9"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.81 19.5L18.8825 20.5725L21.19 18.4384"
            stroke="#A6AFB9"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.5 12.5C15.2614 12.5 17.5 10.2614 17.5 7.5C17.5 4.73858 15.2614 2.5 12.5 2.5C9.73858 2.5 7.5 4.73858 7.5 7.5C7.5 10.2614 9.73858 12.5 12.5 12.5Z"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21.0901 22.5C21.0901 18.63 17.2402 15.5 12.5002 15.5C7.76015 15.5 3.91016 18.63 3.91016 22.5"
            stroke="#A8AFB8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      activeIcon: (
        <svg
          width="24"
          height="25"
          viewBox="0 0 24 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity="0.4"
            d="M12 12.5C14.7614 12.5 17 10.2614 17 7.5C17 4.73858 14.7614 2.5 12 2.5C9.23858 2.5 7 4.73858 7 7.5C7 10.2614 9.23858 12.5 12 12.5Z"
            fill="#386BF9"
          />
          <path
            d="M12 15C6.99003 15 2.91003 18.36 2.91003 22.5C2.91003 22.78 3.13003 23 3.41003 23H20.59C20.87 23 21.09 22.78 21.09 22.5C21.09 18.36 17.01 15 12 15Z"
            fill="#386BF9"
          />
        </svg>
      ),
    },
  ];

  if (isProfilePage && !isShow) return null;

  return (
    <>
      <div
        className={`shadow_menu_bottom fixed bottom-0 left-1/2 z-[9] flex h-[75px] w-full -translate-x-1/2 items-center justify-between bg-white px-4 lg:hidden ${className}`}
      >
        {menus.map((menu, idx) => (
          <button
            onClick={() => onselect(menu)}
            className={`relative flex h-[44px] items-center gap-2 rounded-full px-3 ${pathname === menu.href ? 'bg-main/10' : ''}`}
            key={idx}
          >
            {pathname === menu.href ? menu.activeIcon : menu.icon}

            <p
              className={`font-medium text-main transition-all duration-300 ${pathname === menu.href ? 'mb-0 w-fit opacity-100' : '-mb-20 w-0 opacity-0'}`}
            >
              {menu.name}
            </p>
            {menu?.badge && Number('2') >= 1 ? (
              <span className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-main font-reqular text-[12px] text-white">
                <span className="pt-px">{totalCountBasket}</span>
              </span>
            ) : null}
          </button>
        ))}

        {/* دکمهٔ چت - باز کردن دستیار از منوی پایین (موبایل) */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('offl-open-chat'))}
          aria-label="دستیار هوشمند"
          className="relative flex h-[44px] items-center justify-center rounded-full px-3"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A8AFB8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>

        {/* دکمهٔ دارک‌مود - فقط موبایل (از هدر حذف شد) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'روشن کردن' : 'تاریک کردن'}
          className="relative flex h-[44px] items-center justify-center rounded-full px-3"
        >
          {resolvedTheme === 'dark' ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A8AFB8"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A8AFB8"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
      {isPending && <Loading />}
    </>
  );
};

export default MenuBottom;
