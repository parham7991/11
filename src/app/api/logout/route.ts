// app/api/logout/route.ts
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(process.env.NEXT_PUBLIC_COCKIES!, '', { maxAge: 0 });
  cookieStore.delete('NEW_OFFLAND');
  cookieStore.delete('NEW_OFFLAND_v1');
  cookieStore.delete('NEW_OFFLAND_v2');
  return new Response(JSON.stringify({ message: 'Logged out' }), { status: 200 });
}
