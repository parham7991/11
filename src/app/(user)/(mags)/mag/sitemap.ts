import { generateToken } from '@/lib/fun';
import { toSitemapDate } from '@/lib/sitemap-date';
import { BASEURL, BASEURL_SITE } from '@/lib/variable';
import { MetadataRoute } from 'next';

const POSTS_PER_SITEMAP = 1000; // تعداد پست‌ها در هر نقشه سایت
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getPosts({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}): Promise<{ totalPosts: number; posts: any[] }> {
  try {
    await sleep(1500); // ۱ ثانیه تأخیر برای جلوگیری از rate-limit
    const jwtKey = await generateToken();

    const response = await fetch(
      `${BASEURL}/mag/posts/sitemap?page=${page}&per_page=${limit}&sort`,
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
        totalPosts: 0,
        posts: [],
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Response is not JSON');
      return {
        totalPosts: 0,
        posts: [],
      };
    }

    const data = await response.json();
    return {
      totalPosts: data?.total || 0,
      posts: data?.posts?.data || [],
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return {
      totalPosts: 0,
      posts: [],
    };
  }
}

export async function generateSitemaps() {
  try {
    // دریافت تعداد کل پست‌ها
    const data = await getPosts({
      page: 1,
      limit: 1, // فقط برای دریافت تعداد کل
    });

    const totalPosts = data.totalPosts;
    const pageCount = Math.ceil(totalPosts / POSTS_PER_SITEMAP);

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
    // دریافت پست‌های صفحه خاص
    // در Next.js 15، id ممکن است یک Promise باشد
    const pageId = typeof id === 'number' ? id : await id;

    const data = await getPosts({
      page: pageId,
      limit: POSTS_PER_SITEMAP,
    });

    // تولید لینک‌های پست‌ها
    return (
      data?.posts?.map((post: any) => ({
        url: `${BASEURL_SITE}/mag/${encodeURIComponent(post.slug || post.id)}`,
        lastModified: toSitemapDate(post?.updated_at),
        changeFrequency: 'weekly',
        priority: 0.5,
      })) || []
    );
  } catch (error) {
    console.error('Error generating mags sitemap:', error);
    return [];
  }
}
