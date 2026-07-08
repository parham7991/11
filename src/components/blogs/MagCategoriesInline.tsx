'use client';
import React, { useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getMagCategories, PublicCategoryItem } from '@/lib/public';

export default function MagCategoriesInline() {
  const [categories, setCategories] = useState<PublicCategoryItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const items = await getMagCategories();
      if (mounted) setCategories(items);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSelect = (id: number | string) => {
    startTransition(() => router.push(`/mag/category/${id}`));
  };

  // استخراج category ID از pathname
  const activeId = pathname?.includes('/category/')
    ? pathname.split('/category/')[1]?.split('/')[0] || ''
    : '';

  return (
    <nav
      className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 lg:flex-wrap lg:overflow-x-visible"
      style={{ fontFamily: 'IRANYekanX, IranYekanX, iranyekan, Tahoma, sans-serif' }}
    >
      {categories.map((cat) => {
        const isActive = String(cat.id) === activeId;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`whitespace-nowrap rounded-full border-none px-3 py-1.5 font-medium text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-transparent text-white'}`}
            title={cat.name}
          >
            {cat.name}
          </button>
        );
      })}
    </nav>
  );
}
