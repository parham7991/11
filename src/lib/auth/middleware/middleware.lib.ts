import { NextRequest, NextResponse } from 'next/server';

export function generateUniqueToken(length = 82) {
  const characters =
    'ABC2343423423DEFGHIJKLMNOPQR2351235STUVWX68757656545YZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters[randomIndex];
  }

  return token;
}

export function redirectToSignIn(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = '/auth';

  const response = NextResponse.redirect(url.toString());
  response.cookies.delete(process.env.NEXT_PUBLIC_COCKIES as string);

  return response;
}
