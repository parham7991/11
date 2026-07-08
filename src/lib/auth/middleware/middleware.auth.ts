// middleware.auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from './middleware.constants';
import { redirectToSignIn } from './middleware.lib';

export async function handleAuthProtection(request: NextRequest): Promise<NextResponse | null> {
  const cookies = request.cookies as {
    get: (name: string) => { value: string } | undefined;
  };
  const rawSession = cookies.get(process.env.NEXT_PUBLIC_COCKIES as string)?.value;

  // const allCookies = request.cookies.getAll();
  // const refreshToken = request.cookies.get('rf')?.value;

  // if (!refreshToken) {
  //   return redirectToSignIn(request);
  // }

  const pathname = new URL(request.url).pathname;
  //todo: Revert below code
  // if (process.env.APP_ENV === 'stage' && !rawSession) {
  //   return redirectToSignIn(request);
  // }

  const isProtectedRoute = protectedRoute.find((page) => pathname.startsWith(page));

  if (!rawSession && isProtectedRoute) {
    return redirectToSignIn(request);
  }

  return null
}
