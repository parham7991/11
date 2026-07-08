'use client';
import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMagCategories, PublicCategoryItem } from '@/lib/public';

export default function MagCategoriesSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<PublicCategoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const items = await getMagCategories();
        if (mounted) setCategories(items);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [categories, query]);

  const onSelect = (id: number | string) => {
    const qp = new URLSearchParams(searchParams?.toString());
    qp.set('category_id', String(id));
    startTransition(() => {
      router.push(`/mag?${qp.toString()}`);
    });
  };

  return (
    <div
      className="w-full"
      style={{ fontFamily: 'IRANYekanX, IranYekanX, iranyekan, Tahoma, sans-serif' }}
    >
      <div className="flex flex-col gap-3">
        {/* Search input */}
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی دسته‌بندی مقالات..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-[14px] outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {/* Search icon */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 20C15.4183 20 19 16.4183 19 12C19 7.58172 15.4183 4 11 4C6.58172 4 3 7.58172 3 12C3 16.4183 6.58172 20 11 20Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M21 21L18 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          {/* Clear button */}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-200"
            >
              پاک کردن
            </button>
          )}
        </div>

        {/* Popular chips (horizontal scroll) */}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {categories.slice(0, 12).map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-600"
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results grid */}
        <div className="mt-1 grid max-h-[280px] grid-cols-2 gap-2 overflow-auto lg:grid-cols-3">
          {loading && (
            <>
              {new Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </>
          )}
          {!loading &&
            filtered.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className="truncate rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-[13px] text-gray-800 shadow-sm transition-all hover:border-blue-500 hover:shadow"
                title={cat.name}
              >
                {cat.name}
              </button>
            ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-gray-200 p-4 text-center text-[13px] text-gray-500">
              دسته‌بندی‌ای یافت نشد
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
