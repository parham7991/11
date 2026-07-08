import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const title = String(form.get('title') || '').trim();
    const text = String(form.get('text') || '').trim();
    const url = String(form.get('url') || '').trim();
    const query = encodeURIComponent([title, text, url].filter(Boolean).join(' ').slice(0, 200));
    const redirectUrl = new URL(query ? `/result?q=${query}&source=share-target` : '/?source=share-target', req.url);
    return NextResponse.redirect(redirectUrl, 303);
  } catch {
    return NextResponse.redirect(new URL('/?source=share-target', req.url), 303);
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/', req.url), 302);
}
