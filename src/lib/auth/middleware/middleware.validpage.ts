// middleware.mag-redirect.ts
// import { headers } from '@/lib/safeClient';
import { NextRequest, NextResponse } from 'next/server';
import { pages } from './middleware.constants';
import { getToken } from '@/lib/token';
import { BASEURL } from '@/lib/variable';

export async function handleValidpageRedirect(request: NextRequest): Promise<NextResponse | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const isProducts = pathname.startsWith('/products');
  const match = pathname.startsWith('/product-category');

  if (isProducts) {
    const urls = pathname.split('/');
    const newUrl = new URL(`/product/${urls[2]}`, request.url);
    return NextResponse.redirect(newUrl, 301);
  }

  if (match) {
    const urls = pathname.split('/');
    const newUrl = new URL(
      `/category/${urls[2]}?slug=${decodeURIComponent(pathname)}`,
      request.url
    );
    return NextResponse.redirect(newUrl, 301);
  }
  const isAllowedPage = pages.some((page) => pathname === page || pathname.startsWith(page + '/'));
  if (isAllowedPage) return null;

  if (!isAllowedPage) {
    const pathParts = pathname.split('/').filter(Boolean);
    const token = await getToken();
    const result = await fetch(`${BASEURL}/page?url_key=${pathParts[0]}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (Number(result.status) === 404) {
      const newUrl = new URL(request.url);
      newUrl.pathname = `/`;
      return NextResponse.redirect(newUrl, 301);
    }
  }

  return null;
}
