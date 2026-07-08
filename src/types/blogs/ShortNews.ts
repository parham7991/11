export interface ShortNewsTag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  pivot?: {
    post_id: number;
    tag_id: number;
  };
}

export interface ShortNewsCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  updated_at?: string;
}

export interface ShortNews {
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
  category_id?: number | null;
  category?: ShortNewsCategory | null;
  status?: string;
  view_count?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  tags?: ShortNewsTag[];
}
