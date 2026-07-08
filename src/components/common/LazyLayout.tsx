'use client';
import React, { ReactNode, useEffect, useState } from 'react';
import LazyFooter from './LazyFooter';
import Header from '@/components/common/header';
import MenuBottom from '@/components/common/MenuButtom';

interface LayoutProps {
  children: ReactNode;
  categories: any[];
}

const Layout: React.FC<LayoutProps> = ({ children, categories }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="pb-20 lg:pb-0" suppressHydrationWarning>
      {mounted ? <Header category={categories} /> : null}
      {children}
      {mounted ? <MenuBottom /> : null}
      <LazyFooter />
    </div>
  );
};

export default Layout;
