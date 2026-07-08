import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth/session';

// create a GET request handler
// this handler will return the session from getSession
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(null);
  }

  return NextResponse.json(session);
}
