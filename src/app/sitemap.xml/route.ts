import { generateToken } from '@/lib/fun';
import { BASEURL, BASEURL_SITE } from '@/lib/variable';

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
  console.log(data, 'data');
  return data?.total ?? 0;
}

export async function GET(): Promise<Response> {
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
