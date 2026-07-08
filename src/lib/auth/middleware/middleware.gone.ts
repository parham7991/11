// middleware.gone.ts
import { BASEURL } from '@/lib/variable';
import { NextRequest, NextResponse } from 'next/server';
import { gonePaths } from './middleware.constants';

export async function handleGonePaths(request: NextRequest): Promise<NextResponse | null> {
  const pathname = new URL(request.url).pathname;

  if (gonePaths.some((path) => pathname.startsWith(path))) {
    if (pathname.startsWith('/product-tag/')) {
      const slug = pathname.split('/')[2];
      const res = await fetch(`${BASEURL}/user/product/alltag?productTag=${slug}`, {
        // headers,
        credentials: 'include',
      });
      const json = await res.json();

      if (json?.errors?.statusCode === 410) {
        return new NextResponse('این صفحه توسط شرکت حذف شده است', {
          status: 410,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      }
      return null;
    }

    if (pathname === '/brands/') return null;

    return new NextResponse('این صفحه توسط شرکت حذف شده است', {
      status: 410,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  return null;
}
