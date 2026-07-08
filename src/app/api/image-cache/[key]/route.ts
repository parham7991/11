import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import {
  decodeImageCacheKey,
  IMAGE_CACHE_REVALIDATE_SECONDS,
  IMAGE_CACHE_STALE_WHILE_REVALIDATE_SECONDS,
  isAllowedRemoteImageUrl,
  normalizeRemoteImageUrl,
} from '@/lib/image-cache';

export const runtime = 'nodejs';
export const revalidate = 31536000;

type RouteContext = {
  params: Promise<{ key: string }>;
};

const ONE_DAY_SECONDS = 60 * 60 * 24;

const getCacheControl = (maxAge = IMAGE_CACHE_REVALIDATE_SECONDS) =>
  `public, max-age=${ONE_DAY_SECONDS}, s-maxage=${maxAge}, stale-while-revalidate=${IMAGE_CACHE_STALE_WHILE_REVALIDATE_SECONDS}, immutable`;

const getCommonHeaders = (
  contentType?: string | null,
  cacheControl?: string
): Record<string, string> => ({
  ...(contentType ? { 'Content-Type': contentType } : null),
  'Cache-Control': cacheControl || getCacheControl(),
  'CDN-Cache-Control': getCacheControl(),
  'Vercel-CDN-Cache-Control': getCacheControl(),
  'Content-Disposition': 'inline',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
});

const imageAcceptHeader =
  'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';

const getFallbackImage = async (status = 404) => {
  try {
    const fallback = await readFile(join(process.cwd(), 'public', 'images', 'no-image.png'));

    return new NextResponse(fallback, {
      status,
      headers: getCommonHeaders('image/png', 'public, max-age=300, s-maxage=300'),
    });
  } catch {
    return new NextResponse(null, {
      status,
      headers: getCommonHeaders('image/png', 'public, max-age=300, s-maxage=300'),
    });
  }
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { key } = await params;
  const decodedSrc = decodeImageCacheKey(key);
  const remoteUrl = normalizeRemoteImageUrl(decodedSrc);

  if (!decodedSrc || !remoteUrl || !isAllowedRemoteImageUrl(remoteUrl)) {
    return getFallbackImage(400);
  }

  const cacheTag = `image-cache:${crypto.createHash('sha1').update(remoteUrl.href).digest('hex')}`;

  try {
    const remoteResponse = await fetch(remoteUrl.href, {
      cache: 'force-cache',
      next: {
        revalidate: IMAGE_CACHE_REVALIDATE_SECONDS,
        tags: [cacheTag],
      },
      headers: {
        Accept: imageAcceptHeader,
        'User-Agent': 'Offland-Image-Cache/1.0',
      },
    });

    if (!remoteResponse.ok || !remoteResponse.body) {
      return getFallbackImage(remoteResponse.status || 404);
    }

    const contentType = remoteResponse.headers.get('content-type') || 'image/jpeg';

    if (!contentType.toLowerCase().startsWith('image/')) {
      return getFallbackImage(415);
    }

    const headers = getCommonHeaders(contentType);
    const contentLength = remoteResponse.headers.get('content-length');
    const contentEncoding = remoteResponse.headers.get('content-encoding');
    const etag = remoteResponse.headers.get('etag');
    const lastModified = remoteResponse.headers.get('last-modified');

    if (contentLength && !contentEncoding) headers['Content-Length'] = contentLength;
    if (etag) headers['ETag'] = etag;
    if (lastModified) headers['Last-Modified'] = lastModified;

    return new NextResponse(remoteResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Image cache proxy failed:', error);
    return getFallbackImage(500);
  }
}

export async function HEAD(_request: Request, { params }: RouteContext) {
  const { key } = await params;
  const decodedSrc = decodeImageCacheKey(key);
  const remoteUrl = normalizeRemoteImageUrl(decodedSrc);

  if (!decodedSrc || !remoteUrl || !isAllowedRemoteImageUrl(remoteUrl)) {
    return new NextResponse(null, { status: 400, headers: getCommonHeaders('image/png') });
  }

  return new NextResponse(null, {
    status: 200,
    headers: getCommonHeaders(),
  });
}
