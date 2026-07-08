import { NextResponse } from 'next/server';
import { BASEURL_SITE, BASEURL } from '@/lib/variable';
import { generateToken } from '@/lib/fun';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Configuration - can be extended to read from database
// Future: const DISALLOWED_PATHS = await getDisallowedPathsFromDB();
const DISALLOWED_PATHS = [
  '/api/',
  '/_next/',
  '/admin/',
  '/auth/',
  '/checkout/',
  '/profile/',
  '/cart/',
  '/compare/',
];

const PRODUCTS_PER_SITEMAP = 1000;

async function fetchCount(url: string): Promise<number> {
  const jwtKey = await generateToken();
  const response = await fetch(`${BASEURL}${url}`, {
    next: {
      revalidate: 43200,
    },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${jwtKey}`,
    },
  });
  const data = await response.json();
  return data?.total ?? 0;
}

// Helper function to generate robots.txt content
function generateRobotsTxt(
  siteUrl: string,
  disallowedPaths: string[],
  sitemapUrls: string[]
): string {
  const userAgentRules = `User-agent: *
${disallowedPaths.map((path) => `Disallow: ${path}`).join('\n')}
Disallow: /*?*
`;

  const sitemaps = sitemapUrls.map((url) => `Sitemap: ${url}`).join('\n');

  return `${userAgentRules}\n\n${sitemaps}`;
}

export async function GET() {
  try {
    // Get site URL - can be extended to read from database
    const siteUrl = 'https://www.offl.ir';

    // دریافت تعداد کل برای هر دسته (طبق الگوی sitemap.xml)
    const [totalProducts, totalCategories, totalPosts] = await Promise.all([
      fetchCount(`/catalog/product/sitemap?page=1&per_page=1`),
      fetchCount(`/catalog/categories/sitemap?page=1&per_page=1`),
      fetchCount(`/mag/posts/sitemap?page=1&per_page=1`),
    ]);

    // ساخت آدرس‌های sitemap طبق الگوی واقعی (مستقیماً در route)
    const makeSitemapUrls = (base: string, count: number, perPage: number) =>
      Array.from({ length: Math.ceil(count / perPage) }).map(
        (_, i) => `${siteUrl}/${base}/sitemap/${i + 1}.xml`
      );

    // تولید تمام آدرس‌های sitemap طبق الگوی واقعی
    const sitemapUrls = [
      `${siteUrl}/sitemap.xml`, // sitemap index اصلی
      `${siteUrl}/static-sitemap.xml`, // sitemap صفحات استاتیک مهم
      ...makeSitemapUrls('product', totalProducts, PRODUCTS_PER_SITEMAP),
      ...makeSitemapUrls('category', totalCategories, PRODUCTS_PER_SITEMAP),
      ...makeSitemapUrls('mag', totalPosts, PRODUCTS_PER_SITEMAP),
    ];

    const robotsTxtContent = generateRobotsTxt(siteUrl, DISALLOWED_PATHS, sitemapUrls);

    // ساخت/بروزرسانی فایل فیزیکی robots.txt در public directory
    try {
      const publicDir = join(process.cwd(), 'public');
      const robotsFilePath = join(publicDir, 'robots.txt');

      // اطمینان از وجود دایرکتوری public
      await mkdir(publicDir, { recursive: true });

      // نوشتن/بروزرسانی فایل
      await writeFile(robotsFilePath, robotsTxtContent, 'utf-8');

      console.log('✅ robots.txt file updated successfully at:', robotsFilePath);
    } catch (fileError) {
      console.error('⚠️ Error writing robots.txt file:', fileError);
      // ادامه می‌دهیم حتی اگر نوشتن فایل خطا داشت
    }

    return new NextResponse(robotsTxtContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    return new NextResponse('Error generating robots.txt', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
