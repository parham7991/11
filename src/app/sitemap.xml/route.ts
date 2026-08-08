import { generateToken } from '@/lib/fun';
import { BASEURL, BASEURL_SITE } from '@/lib/variable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PRODUCTS_PER_SITEMAP = 1000;
async function fetchCount(url: string): Promise<number> {
  try {
    const jwtKey = await generateToken();
    const response = await fetch(`${BASEURL}${url}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${jwtKey}`,
      },
    });
    if (!response.ok) return 0;
    const data = await response.json().catch(() => null);
    return data?.total ?? data?.response?.total ?? 0;
  } catch {
    return 0;
  }
}

export async function GET(): Promise<Response> {
  // fallback 0 if API timeout — sitemap must never crash build
  const [totalProducts, totalCategories, totalPosts] = await Promise.all([
    fetchCount(`/catalog/product/sitemap?page=1&per_page=1`),
    fetchCount(`/catalog/categories/sitemap?page=1&per_page=1`),
    fetchCount(`/mag/posts/sitemap?page=1&per_page=1`),
  ]);
  const now = new Date().toISOString();

  const makeSitemaps = (base: string, count: number, perPage: number) =>
    Array.from({ length: Math.ceil(count / perPage) }).map(
      (_, i) => `
      <sitemap>
        <loc>${BASEURL_SITE}/${base}/sitemap/${i + 1}.xml</loc>
        <lastmod>${now}</lastmod>
      </sitemap>`
    );

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${[
      ...makeSitemaps('product', totalProducts, PRODUCTS_PER_SITEMAP),
      ...makeSitemaps('category', totalCategories, PRODUCTS_PER_SITEMAP),
      ...makeSitemaps('mag', totalPosts, PRODUCTS_PER_SITEMAP),
    ].join('\n')}
  </sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
