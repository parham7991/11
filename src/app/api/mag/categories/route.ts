import { NextResponse } from 'next/server';
import { request } from '@/lib/client';

export const revalidate = 0;

export async function GET() {
  try {
    const res = await request({ url: '/mag/categories', method: 'GET', cache: 'no-store' });
    return NextResponse.json(res ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
