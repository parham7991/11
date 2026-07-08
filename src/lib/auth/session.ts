import 'server-only';

import { cookies, headers } from 'next/headers';

import { BASEURL } from '../variable';
import { User } from './types';
import { generateToken } from '../fun';
import { cookieName } from '../utils';

// تابع helper برای parse کردن cookie header
function parseCookieHeader(cookieHeader: string | null, cookieName: string): string | undefined {
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const targetCookie = cookies.find((c) => c.startsWith(`${cookieName}=`));

  if (!targetCookie) return undefined;

  // decode URI component برای handle کردن %7B و %22
  const value = targetCookie.split('=').slice(1).join('=');
  return decodeURIComponent(value);
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const headersList = await headers();
  const cookieNameValue = cookieName || process.env.NEXT_PUBLIC_COCKIES;

  // تلاش برای خواندن کوکی از cookies() API
  let rawSession = cookieNameValue ? cookieStore.get(cookieNameValue)?.value : undefined;

  // اگر پیدا نشد، از headers بخوان
  if (!rawSession && cookieNameValue) {
    const cookieHeader = headersList.get('cookie');
    rawSession = parseCookieHeader(cookieHeader, cookieNameValue);
  }

  const finger = cookieStore.get('finger')?.value as string;
  const viewport = cookieStore.get('viewport')?.value as string;

  if (!rawSession) {
    return {
      finger,
      viewport,
    };
  }

  const session = JSON.parse(rawSession);
  const { accessToken, userId } = session;
  if (accessToken) {
    const token = generateToken();

    const res = await fetch(`${BASEURL}/user/${userId}`, {
      headers: {
        token: accessToken,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return {
        finger,
      };
    }

    const user = await res.json();
    return {
      finger,
      viewport,
      ...user,
      accessToken,
    };
  }
  return {
    finger,
    viewport,
  };
}
