export const dynamic = 'force-dynamic';
import { generateToken } from '@/lib/fun';
import { toSitemapDate, xmlEscape } from '@/lib/sitemap-date';
import { BASEURL, BASEURL_SITE } from '@/lib/variable';
import fs from 'fs';
// import { headers } from 'next/headers';
import path from 'path';
// import rangeCheck from 'ip-range-check';

const PRODUCTS_PER_SITEMAP = 1000;

async function getProducts(page: number, limit: number) {
  try {
    const jwtKey = await generateToken();
    const res = await fetch(`${BASEURL}/sitemap/products?page=${page}&per_page=${limit}`, {
      headers: {
        Authorization: `Bearer ${jwtKey}`,
        'Content-type': 'application/json',
      },
    });
    if (!res.ok) return { products: [] };
    return res.json();
  } catch (err) {
    console.error('Fetch failed:', err);
    return { products: [] };
  }
}

async function fetchCount(url: string): Promise<number> {
  const jwtKey = await generateToken();

  const res = await fetch(url, {
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${jwtKey}`,
    },
  });

  const data = await res.json();
  if (!data) return 0;
  return data?.total ?? 0;
}

export async function POST(): Promise<Response> {
  try {
    // const headerList = headers();
    // const ip = (await headerList).get('x-forwarded-for')?.split(',')[0].trim() || '';
    // if (!rangeCheck(ip, ['10.0.0.0/16'])) {
    //   return new Response('Forbidden', { status: 403 });
    // }

    const total = await fetchCount(`${BASEURL}/sitemap/products?page=1&per_page=1`);
    const now = new Date().toISOString();
    // تعداد صفحات
    const pageCount = Math.ceil(total / PRODUCTS_PER_SITEMAP);

    // مسیر ذخیره فایل‌های سایت مپ صفحات محصول
    const sitemapDir = path.join(process.cwd(), 'public', 'product', 'sitemap');
    if (!fs.existsSync(sitemapDir)) {
      fs.mkdirSync(sitemapDir, { recursive: true });
    }

    // برای هر صفحه، درخواست بزن و فایل XML بساز و ذخیره کن
    for (let page = 1; page <= pageCount; page++) {
      const data = await getProducts(page, PRODUCTS_PER_SITEMAP);

      // ساخت محتوای xml سایت مپ برای صفحه
      const urls = data.products
        .map(
          (product: any) => `
      <url>
        <loc>${xmlEscape(`${BASEURL_SITE}/product/${encodeURIComponent(product.id)}`)}</loc>
        <lastmod>${toSitemapDate(product.updated_at)}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.6</priority>
      </url>`
        )
        .join('\n');

      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

      // ذخیره فایل
      fs.writeFileSync(path.join(sitemapDir, `${page}.xml`), sitemapContent);
    }

    // ساخت فایل sitemap-index.xml
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: pageCount })
  .map(
    (_, i) => `
  <sitemap>
    <loc>${xmlEscape(`${BASEURL_SITE}/product/sitemap/${i + 1}.xml`)}</loc>
    <lastmod>${toSitemapDate(now)}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

    // ذخیره فایل ایندکس سایت‌مپ
    fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemapIndex);

    return Response.json({ result: 'okay' }, { status: 200 });
  } catch (error) {
    // در صورت خطا همچنان وضعیت موفق برمی‌گردونه
    return Response.json({ result: JSON.stringify(error) }, { status: 400 });
  }
}
