import { toSitemapDate, xmlEscape } from '@/lib/sitemap-date';
import { BASEURL_SITE } from '@/lib/variable';

/**
 * static-sitemap.xml
 * نقشه‌ی سایت برای صفحات استاتیک و مهم سایت (نه محصول/دسته/پست).
 * این صفحات معمولاً در sitemap های داینامیک پوشش داده نمی‌شوند ولی برای
 * SEO و ایندکس‌شدن صفحات کلیدی بسیار مهم هستند.
 */

type StaticRoute = {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
};

const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/mag', changefreq: 'daily', priority: 0.8 },
  { path: '/short-news', changefreq: 'hourly', priority: 0.7 },
  { path: '/category-list', changefreq: 'weekly', priority: 0.8 },
];

export async function GET(): Promise<Response> {
  const now = toSitemapDate(new Date());

  const urls = STATIC_ROUTES.map(
    (route) => `
  <url>
    <loc>${xmlEscape(`${BASEURL_SITE}${route.path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  ).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
    },
  });
}
