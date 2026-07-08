import { generateToken } from '@/lib/fun';
import { toSitemapDate } from '@/lib/sitemap-date';
import { BASEURL, BASEURL_SITE } from '@/lib/variable';
import { Product } from '@/types/Home';
import { MetadataRoute } from 'next';

const PRODUCTS_PER_SITEMAP = 1000; // تعداد محصولات در هر نقشه سایت
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getProducts({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}): Promise<{ totalProducts: number; products: Product[] }> {
  try {
    await sleep(1500); // ۱ ثانیه تأخیر برای جلوگیری از rate-limit
    const jwtKey = await generateToken();

    const response = await fetch(
      `${BASEURL}/catalog/product/sitemap?page=${page}&per_page=${limit}&sort`,
      {
        next: {
          revalidate: 43200,
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
        totalProducts: 0,
        products: [],
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Response is not JSON');
      return {
        totalProducts: 0,
        products: [],
      };
    }

    const data = await response.json();
    return {
      totalProducts: data?.total || 0,
      products: data?.products || [],
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      totalProducts: 0,
      products: [],
    };
  }
}

export async function generateSitemaps() {
  try {
    // دریافت تعداد کل محصولات
    const data = await getProducts({
      page: 1,
      limit: 1, // فقط برای دریافت تعداد کل
    });

    const totalProducts = data.totalProducts;
    const pageCount = Math.ceil(totalProducts / PRODUCTS_PER_SITEMAP);

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
    // دریافت محصولات صفحه خاص
    // در Next.js 15، id ممکن است یک Promise باشد
    const pageId = typeof id === 'number' ? id : await id;

    const data = await getProducts({
      page: pageId,
      limit: PRODUCTS_PER_SITEMAP,
    });

    // تولید لینک‌های محصولات
    return (
      data?.products?.map((product: Product) => ({
        // @ts-expect-error error
        url: `${BASEURL_SITE}/product/${encodeURIComponent(product.id)}`,
        lastModified: toSitemapDate(product?.updated_at),
        changeFrequency: 'daily',
        priority: 0.6,
      })) || []
    );
  } catch (error) {
    console.error('Error generating product sitemap:', error);
    return [];
  }
}
