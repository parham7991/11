import { NextRequest, NextResponse } from 'next/server';
import { handleAuthProtection } from './src/lib/auth/middleware/middleware.auth';
import { handleNoIndex } from './src/lib/auth/middleware/middleware.noindex';
import { handleValidpageRedirect } from './src/lib/auth/middleware/middleware.validpage';
import { handleFingerprint } from './src/lib/auth/middleware/middleware.fingerprint';

/**
 * ROOT MIDDLEWARE - آفلند
 * 
 * کنترل ایندکس گوگل بر اساس متغیر محیطی:
 * SERVER_MOD=production   → index, follow
 * SERVER_MOD=development  → noindex, nofollow (محیط تست)
 */

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = new URL(request.url).pathname;

  // ============================================
  // کنترل اصلی محیط سرور
  // ============================================
  const serverMod = (
    process.env.SERVER_MOD ||
    process.env.SERVER_MODE ||
    'production'
  ).toLowerCase().trim();

  const isDevEnv = ['development', 'staging', 'test', 'dev'].includes(serverMod);

  if (isDevEnv) {
    // محیط تست → گوگل ایندکس نکند
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  }

  // رد کردن فایل‌های استاتیک
  if (/\.(xml|json|txt|jpg|png|svg|ico|webp|avif|css|js|map|woff2?)$/i.test(pathname)) {
    return response;
  }

  // اعمال قوانین قدیمی noindex
  handleNoIndex(request, response);

  // تضمین noindex در محیط تست
  if (isDevEnv) {
    const current = response.headers.get('X-Robots-Tag') || '';
    if (!current.includes('noindex')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
  }

  // بقیه منطق
  const authRes = await handleAuthProtection(request);
  if (authRes) return authRes;

  const validpage = await handleValidpageRedirect(request);
  if (validpage) return validpage;

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml)$).*)',
  ],
};
