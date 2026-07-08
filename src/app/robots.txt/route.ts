import { NextResponse } from 'next/server';

export async function GET() {
  const serverMod = (
    process.env.SERVER_MOD ||
    process.env.SERVER_MODE ||
    'production'
  ).toLowerCase().trim();

  const isDev = ['development', 'staging', 'test', 'dev'].includes(serverMod);

  const content = isDev
    ? `User-agent: *
Disallow: /
`
    : `User-agent: *
Allow: /
Sitemap: https://www.offl.ir/sitemap.xml
Sitemap: https://www.offl.ir/static-sitemap.xml
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
