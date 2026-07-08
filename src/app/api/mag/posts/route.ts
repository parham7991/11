import { NextRequest, NextResponse } from 'next/server';
import { request } from '@/lib/client';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams(searchParams as any).toString();
    const url = `/mag/posts${params ? `?${params}` : ''}`;
    const res = await request({ url, method: 'GET', cache: 'no-store' });
    return NextResponse.json(res ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
