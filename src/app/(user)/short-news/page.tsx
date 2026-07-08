import { Metadata } from 'next';
import Script from 'next/script';
import { generate_metadata_shortNews, jsonLdShortNews } from '@/seo/short-news';
import { request } from '@/lib/client';
import ShortNews from '@/components/blogs/ShortNews';
import ShortNewsList from '@/components/blogs/ShortNewsList';
import ShortNewsHeader from '@/components/blogs/ShortNewsHeader';

// Metadata برای SEO
export async function generateMetadata(): Promise<Metadata> {
  return generate_metadata_shortNews();
}

// JSON-LD Structured Data
const jsonLd = jsonLdShortNews();

export default async function ShortNewsPage() {
  // دریافت اخبار کوتاه از API
  let shortNewsData = null;
  try {
    shortNewsData = await request({
      url: '/mag/news?per_page=20',
      method: 'GET',
    });
  } catch (error) {
    console.error('Error fetching short news:', error);
  }

  return (
    <>
      {/* JSON-LD Structured Data برای گوگل */}
      <Script
        id="short-news-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header با H1 برای SEO */}
        <ShortNewsHeader />

        {/* نمایش اخبار کوتاه */}
        <div className="mx-auto max-w-7xl">
          {shortNewsData ? <ShortNewsList data={shortNewsData} /> : null}
        </div>

        {/* اطلاعات اضافی برای SEO */}
        <footer className="mt-12 border-t border-gray-200 pt-8 text-center">
          <p className="font-reqular text-sm text-gray-500">
            آخرین به‌روزرسانی: {new Date().toLocaleDateString('fa-IR')}
          </p>
        </footer>
      </main>
    </>
  );
}
