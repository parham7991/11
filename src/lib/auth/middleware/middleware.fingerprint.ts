import { NextRequest, NextResponse, userAgent } from 'next/server';
import { generateUniqueToken } from './middleware.lib';

export function handleFingerprint(request: NextRequest, response: NextResponse) {
  const finger = request.cookies.get('finger')?.value;
  const { device } = userAgent(request);
  const viewport = device.type === 'mobile' ? 'mobile' : 'desktop';

  if (!finger) {
    response.cookies.set({
      name: 'finger',
      value: generateUniqueToken(),
      maxAge: 1000 * 24 * 60 * 60,
      expires: 1000 * 24 * 60 * 60,
    });
  }

  response.cookies.set({
    name: 'viewport',
    value: viewport,
    maxAge: 1000 * 24 * 60 * 60,
    expires: 1000 * 24 * 60 * 60,
  });
}
