// middleware.noindex.ts
import { NextRequest, NextResponse } from 'next/server';
import { noIndexPaths } from './middleware.constants';

export function handleNoIndex(request: NextRequest, response: NextResponse) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();

  // no index pathname/page/:id => id is number
  if (pathname.match(/\/page\/\d+\/?$/)) {
    response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
  }

  // noindex special path
  if (noIndexPaths.some((path) => pathname.startsWith(path))) {
    response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
  }

  // noindex for query params, but allow product pages with specific params
  if (searchParams) {
    // Allow product pages with query params (for SEO and tracking)
    const isProductPage = pathname.startsWith('/product/') && pathname.split('/').length >= 3;

    // Allow category pages with query params
    const isCategoryPage = pathname.startsWith('/category/') && pathname.split('/').length >= 3;

    // Only apply noindex for non-product and non-category pages with query params
    if (!isProductPage && !isCategoryPage) {
      response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
    }
  }
}
