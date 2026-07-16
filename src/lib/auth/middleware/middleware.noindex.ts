// middleware.noindex.ts
import { NextRequest, NextResponse } from 'next/server';
import { noIndexPaths } from './middleware.constants';

/**
 * =============================================
 * NOINDEX HANDLER (قوانین قدیمی پروژه)
 * =============================================
 * 
 * این تابع فقط قوانین خاص قبلی پروژه را اعمال می‌کند.
 * 
 * کنترل اصلی محیط (SERVER_MOD) در middleware.ts ریشه انجام می‌شود.
 */

export function handleNoIndex(request: NextRequest, response: NextResponse) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();

  // ۱. صفحات صفحه‌بندی مثل /page/2
  if (pathname.match(/\/page\/\d+\/?$/)) {
    response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
    return;
  }

  // ۲. مسیرهای خاص تعریف شده در پروژه
  if (noIndexPaths.some((path) => pathname.startsWith(path))) {
    response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
    return;
  }

  // ۳. صفحات با کوئری پارامتر (به جز محصول و دسته‌بندی)
  if (searchParams) {
    const isProductPage = pathname.startsWith('/product/') && pathname.split('/').length >= 3;
    const isCategoryPage = pathname.startsWith('/category/') && pathname.split('/').length >= 3;

    if (!isProductPage && !isCategoryPage) {
      response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
      return;
    }
  }
}
