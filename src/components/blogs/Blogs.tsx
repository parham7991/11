import React from 'react';
import HottestArticles from './HottestArticles';

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content?: string;
  cover?: string;
  short_content?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  user_id?: number;
  user?: string;
  category_id?: number;
  status?: string;
  view_count?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  tags?: unknown[];
  category?: BlogCategory;
}

import type { ShortNews } from '@/types/blogs/ShortNews';

type Props = {
  top_posts: BlogPost[];
  shortNews?: ShortNews[];
};

export default function Blogs({ top_posts, shortNews }: Props) {
  return (
    <main className="mag-page-shell bg-[#f6f8fc] pb-12 text-slate-950 dark:bg-slate-950 dark:text-slate-100 lg:pb-20">
      <div className="container_page">
        <HottestArticles top_posts={top_posts} shortNews={shortNews} />
      </div>
    </main>
  );
}
