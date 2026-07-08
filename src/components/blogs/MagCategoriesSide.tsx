'use client';
import React, { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMagCategories, PublicCategoryItem } from '@/lib/public';

export default function MagCategoriesSide() {
  const [categories, setCategories] = useState<PublicCategoryItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

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
    const qp = new URLSearchParams(searchParams?.toString());
    qp.set('category_id', String(id));
    startTransition(() => router.push(`/mag?${qp.toString()}`));
  };

  return (
    <aside
      className="no-scrollbar w-full max-w-[100%] overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 bg-white p-3 lg:max-w-[320px]"
      style={{ fontFamily: 'IRANYekanX, IranYekanX, iranyekan, Tahoma, sans-serif' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-[14px] text-neutral-800">دسته‌بندی مقالات</span>
      </div>
      <nav className="flex flex-col gap-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-[13px] text-gray-800 transition-colors hover:bg-blue-50"
            title={cat.name}
          >
            <span className="truncate">{cat.name}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-blue-600"
            >
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </nav>
    </aside>
  );
}
