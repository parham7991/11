'use client';
import React from 'react';
import { useGetShortNews } from '@/hooks/blogs/useGetShortNews';
import Article from './Article';
import SkeletonShortNewsCard from './SkeletonShortNewsCard';
import type { ShortNews } from '@/types/blogs/ShortNews';

export default function ShortNews() {
  const { data, isLoading } = useGetShortNews();

  const parsePosts = (res: any): ShortNews[] => {
    if (!res) return [];
    const original = res?.original ?? res;
    const dataArray = Array.isArray(original?.data) ? original.data : Array.isArray(res) ? res : [];
    return dataArray;
  };

  const posts = parsePosts(data);

  // اگر داده آمده و خالی است، چیزی نمایش نده
  if (!isLoading && (!posts || posts.length === 0)) {
    return null;
  }

  // فقط وقتی در حال لودینگ هستیم و هنوز داده‌ای نیامده، لودینگ نمایش بده
  if (isLoading && !data) {
    return (
      <div className="my-8 flex flex-col gap-8 lg:my-10 lg:gap-10">
        <div className="group relative inline-flex w-fit items-center gap-3 overflow-hidden rounded-xl border-2 border-gray-200 bg-white px-5 py-3 shadow-md transition-all duration-300 hover:border-blue-300 hover:shadow-lg lg:px-6 lg:py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm lg:h-9 lg:w-9">
            <svg
              className="h-5 w-5 text-white lg:h-6 lg:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="font-bold text-[18px] leading-[1.4] text-gray-900 lg:text-[20px]">
            اخبار کوتاه روز
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonShortNewsCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 flex flex-col gap-8 lg:my-10 lg:gap-10">
      <div className="group relative inline-flex w-fit items-center gap-3 overflow-hidden rounded-xl border-2 border-gray-200 bg-white px-5 py-3 shadow-md transition-all duration-300 hover:border-blue-300 hover:shadow-lg lg:px-6 lg:py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm lg:h-9 lg:w-9">
          <svg
            className="h-5 w-5 text-white lg:h-6 lg:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="font-bold text-[18px] leading-[1.4] text-gray-900 lg:text-[20px]">
          اخبار کوتاه روز
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {posts.map((item: ShortNews, index: number) => (
          <Article
            key={item.id || index}
            cardarticle={{
              slug: item.slug,
              id: item.id,
              img: `${item.cover}` || '',
              title: item.title,
              type: item.category?.name || 'مقاله',
              date: item.published_at || item.created_at || '',
            }}
            className="flex items-center gap-2.5 rounded-xl border-2 border-gray-100 bg-white p-2 shadow-md transition-all duration-300 hover:border-blue-200 hover:shadow-lg lg:gap-3 lg:p-2.5"
            classNameImg="!w-[100px] !min-w-[100px] !h-[65px] lg:!w-[120px] lg:!min-w-[120px] lg:!h-[75px] !flex-shrink-0 border border-gray-200 !overflow-hidden !rounded-lg shadow-sm !object-cover"
            classNametype="bg-gradient-to-r from-blue-600 to-purple-600 text-white lg:text-[11px] text-[10px] font-medium lg:px-2.5 px-2 py-1 !rounded-lg shadow-sm"
            classNamedate="text-gray-500 font-reqular text-[11px] lg:text-[12px]"
            classNametitle="text-gray-900 font-medium lg:text-[14px] text-[13px] text-justify leading-snug line-clamp-2"
            hideCategory={true}
            titleFirst={true}
            iconColor="text-blue-500"
            sizeIcon="16"
          />
        ))}
      </div>
    </div>
  );
}
