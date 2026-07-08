'use client';
import React from 'react';
import ShortNewsCard from './ShortNewsCard';
import type { ShortNews } from '@/types/blogs/ShortNews';

interface ShortNewsListProps {
  data: any;
}

// Helper function to extract text from HTML content
const extractTextFromHTML = (html: string | undefined): string => {
  if (!html) return '';
  // Remove HTML tags and decode HTML entities
  const text = html.replace(/<[^>]*>/g, '').trim();
  // Limit to 150 characters for excerpt
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
};

export default function ShortNewsList({ data }: ShortNewsListProps) {
  const posts = data?.data;

  if (!posts || posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">در حال حاضر اخبار کوتاهی موجود نیست.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
        {posts.map((item: ShortNews, index: number) => {
          // Use short_content if available, otherwise extract from content
          const excerpt = item.short_content || item.content;

          return (
            <ShortNewsCard
              key={item.id || index}
              title={item.title}
              date={item.published_at || item.created_at || ''}
              slug={item.slug || `short-news-${item.id}`}
              category={item.category?.name}
              excerpt={excerpt}
            />
          );
        })}
      </div>
    </div>
  );
}
