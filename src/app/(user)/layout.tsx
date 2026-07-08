import LazyLayout from '@/components/common/LazyLayout';
import React, { ReactNode } from 'react';
import { BASEURL } from '@/lib/variable';

export const fetchCategories = async () => {
  try {
    const res = await fetch(`${BASEURL}/catalog/megamenu`, {
      next: { tags: ['categories'], revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

const Layout = async ({ children }: { children: ReactNode }) => {
  const categories = await fetchCategories();
  return <LazyLayout categories={categories}>{children}</LazyLayout>;
};

export default Layout;
