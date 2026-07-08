import Blogs from '@/components/blogs/Blogs';
import { request } from '@/lib/client';
import { Metadata } from 'next';
import Script from 'next/script';
import { generate_metadata_magList, jsonLdMag } from '@/seo/mag';

export async function generateMetadata(): Promise<Metadata> {
  return generate_metadata_magList();
}

export default async function Mags() {
  const [topPosts, shortNewsData] = await Promise.all([
    request({
      url: '/mag/posts/top?short_news=0',
      method: 'GET',
    }),
    request({
      url: '/mag/news?per_page=4',
      method: 'GET',
    }),
  ]);

  const jsonLd = jsonLdMag();

  return (
    <>
      <Script
        id="mag-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Blogs top_posts={topPosts} shortNews={shortNewsData?.data} />
    </>
  );
}
