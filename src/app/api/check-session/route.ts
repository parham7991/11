// app/api/check-session/route.ts
import { cookies } from 'next/headers';
import { cookieName } from '@/lib/utils';

export async function GET() {
  const cookieStore = await cookies();
  const cookieNameValue = cookieName || process.env.NEXT_PUBLIC_COCKIES;

  const rawSession = cookieNameValue ? cookieStore.get(cookieNameValue)?.value : null;
  const newOfflandFlag = cookieStore.get('NEW_OFFLAND_v2')?.value;

  return Response.json({
    hasSession: !!rawSession,
    hasFlag: !!newOfflandFlag,
    shouldCleanup: !newOfflandFlag && !!rawSession,
  });
}
