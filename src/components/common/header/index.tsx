'use client';
import React, { useEffect, useState } from 'react';
import HeaderTop from './HeaderTop';
import HeaderCenter from './HeaderCenter';
import HeaderBottom from './HeaderBottom';
import MenuSkeleton from '../MenuSkeleton';
import { Category } from '@/types/Home';
import { usePathname } from 'next/navigation';
import useGlobalStore from '@/store/global-store';
type Props = {
  category: {
    mega_menu: Category[];
    menus: {
      title: string;
      link?: string;
    }[];
  }[];
  onCategoryMenuOpen?: () => void;
  isLoading?: boolean;
};

const pages = ['/category', '/result', '/product', '/profile'];
const Header = ({ category, onCategoryMenuOpen, isLoading }: Props) => {
  const { setCategories } = useGlobalStore();
  const [position, setPosition] = useState(0);
  const [, setVisible] = useState(true);
  const pathname = usePathname();
  const categories = Array.isArray(category?.[0]?.mega_menu?.[0]?.sub_category)
    ? category[0].mega_menu[0].sub_category
    : [];
  useEffect(() => {
    const handleScroll = () => {
      const moving = window.scrollY;

      setVisible(position > moving);
      setPosition(moving);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  useEffect(() => {
    setPosition(window.scrollY);
  }, []);

  useEffect(() => {
    setCategories(categories);
  }, []);
  const findPages = pages.find((item) => pathname.startsWith(item));
  // اگر مسیر مجله است، هدر اصلی را نمایش نده
  if (pathname.startsWith('/mag')) return null;
  // const cls = visible ? "yes" : "no";
  return (
    <header
      className={`sticky top-0 z-50 border-b border-gray-200 bg-white/70 backdrop-blur-md transition-all duration-300 dark:border-white/5 dark:bg-[#0B0F19]/80 ${findPages ? 'hidden lg:block' : ''}`}
    >
      <HeaderTop />
      <HeaderCenter />

      <HeaderBottom
        menus={Array.isArray(category?.[0]?.menus) ? category?.[0]?.menus : []}
        categories={categories}
        onCategoryMenuOpen={onCategoryMenuOpen}
        isLoading={isLoading}
      />
    </header>
  );
};

export default Header;
