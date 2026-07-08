import { request } from '@/lib/client';
import { generateToken } from '@/lib/fun';
import { toSitemapDate } from '@/lib/sitemap-date';
import { BASEURL, BASEURL_SITE } from '@/lib/variable';
import { Product } from '@/types/Home'; // باید به Category تغییر کند
import { MetadataRoute } from 'next';

const CATEGORIES_PER_SITEMAP = 1000; // تعداد دسته‌بندی‌ها در هر نقشه سایت

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCategories({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}): Promise<{ totalCategories: number; categories: Product[] }> {
  try {
    await sleep(1500); // ۱.۵ ثانیه تأخیر برای جلوگیری از rate-limit
    const jwtKey = await generateToken();

    const response = await fetch(
      `${BASEURL}/catalog/categories/sitemap?page=${page}&per_page=${limit}&sort`,
      {
        next: {
          revalidate: 43200, // 12 ساعت
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${jwtKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return {
        totalCategories: 0,
        categories: [],
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Response is not JSON');
      return {
        totalCategories: 0,
        categories: [],
      };
    }

    const data = await response.json();

    return {
      totalCategories: data?.total || 0,
      categories: data?.categories || [],
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      totalCategories: 0,
      categories: [],
    };
  }
}

export async function generateSitemaps() {
  try {
    // دریافت تعداد کل دسته‌بندی‌ها
    const data = await getCategories({
      page: 1,
      limit: 1, // فقط برای دریافت تعداد کل
    });

    const totalCategories = data.totalCategories;
    const pageCount = Math.ceil(totalCategories / CATEGORIES_PER_SITEMAP);

    // تولید آرایه‌ای از تمام sitemap IDs
    return Array.from({ length: pageCount }, (_, i) => ({ id: i + 1 }));
  } catch (error) {
    console.error('Error generating sitemaps list:', error);
    // در صورت خطا، حداقل یک sitemap برگردان
    return [{ id: 1 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: number | Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  try {
    // دریافت دسته‌بندی‌های صفحه خاص
    // در Next.js 15، id ممکن است یک Promise باشد
    const pageId = typeof id === 'number' ? id : await id;

    const data = await getCategories({
      page: pageId,
      limit: CATEGORIES_PER_SITEMAP,
    });

    // تولید لینک‌های دسته‌بندی‌ها
    return (
      data?.categories?.map((category: Product) => ({
        // @ts-expect-error - type definition needs to be updated to Category
        url: `${BASEURL_SITE}/category/${encodeURIComponent(category.id)}`,
        lastModified: toSitemapDate(category?.updated_at),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      })) || []
    );
  } catch (error) {
    console.error('Error generating category sitemap:', error);
    return [];
  }
}
