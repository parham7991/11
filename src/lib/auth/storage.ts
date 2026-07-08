'use server';
import { cookies } from 'next/headers';
import { cookieName } from '../utils';
import { revalidateTag } from 'next/cache';

interface Session {
  accessToken: string;
}

export async function saveSession(session: Session) {
  (await cookies()).set(cookieName!, JSON.stringify(session), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 60 * 60 * 24,
  });
}

export async function removeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName!);
  cookieStore.delete('NEW_OFFLAND');
  cookieStore.delete('NEW_OFFLAND_v1');
  cookieStore.delete('NEW_OFFLAND_v2');
}
export async function updateTag(name: string) {
  await revalidateTag(name, 'route');
}
