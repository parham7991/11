import type { StaticImageData } from 'next/image';
import { AWS_BUCKET, BASEURL, BASE_URL_IMAGE } from './variable';

export const IMAGE_CACHE_API_PREFIX = '/api/image-cache';
export const IMAGE_CACHE_REVALIDATE_SECONDS = 60 * 60 * 24 * 365; // 1 year
export const IMAGE_CACHE_STALE_WHILE_REVALIDATE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type CacheableImageSrc = string | StaticImageData | null | undefined;

const normalizeBase64Padding = (value: string) => {
  const remainder = value.length % 4;
  return remainder ? `${value}${'='.repeat(4 - remainder)}` : value;
};

export const encodeImageCacheKey = (value: string) => {
  const input = value.trim();

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  if (typeof TextEncoder !== 'undefined' && typeof btoa !== 'undefined') {
    const bytes = new TextEncoder().encode(input);
    let binary = '';

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  return encodeURIComponent(input);
};

export const decodeImageCacheKey = (value: string) => {
  try {
    const normalized = normalizeBase64Padding(value.replace(/-/g, '+').replace(/_/g, '/'));

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(normalized, 'base64').toString('utf8');
    }

    if (typeof atob !== 'undefined' && typeof TextDecoder !== 'undefined') {
      const binary = atob(normalized);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }

      return new TextDecoder().decode(bytes);
    }

    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

export const getCachedImageSrc = (src?: CacheableImageSrc): string | StaticImageData | null => {
  if (!src) return null;
  if (typeof src !== 'string') return src;

  const trimmedSrc = src.trim();
  if (!trimmedSrc) return null;

  return `${IMAGE_CACHE_API_PREFIX}/${encodeImageCacheKey(trimmedSrc)}`;
};

const getHostnameFromEnvUrl = (url?: string) => {
  if (!url) return null;

  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

export const getAllowedImageCacheHosts = () => {
  const envHosts = (process.env.NEXT_PUBLIC_IMAGE_CACHE_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return new Set(
    [
      'media.iwcs.ir',
      'media.magenfa.ir',
      'iwcs.media.ir',
      '192.168.1.201',
      getHostnameFromEnvUrl(BASE_URL_IMAGE),
      getHostnameFromEnvUrl(BASEURL),
      ...envHosts,
    ].filter(Boolean) as string[]
  );
};

const isLocalOrPrivateHostname = (hostname: string) => {
  const host = hostname.toLowerCase();

  return (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host === '0.0.0.0' ||
    host === '127.0.0.1' ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
};

export const normalizeRemoteImageUrl = (src?: string | null) => {
  if (!src) return null;

  const trimmedSrc = src.trim();
  if (!trimmedSrc) return null;

  try {
    const safeSrc = trimmedSrc
      .replace(/^\/\//, 'https://')
      .replace(/media\.magenfa\.ir/gi, 'media.iwcs.ir');

    if (/^https?:\/\//i.test(safeSrc)) {
      return new URL(safeSrc);
    }

    const baseUrl = `${BASE_URL_IMAGE}/${AWS_BUCKET}`.replace(/\/+$/g, '');
    return new URL(`${baseUrl}/${safeSrc.replace(/^\/+/, '')}`);
  } catch {
    return null;
  }
};

export const isAllowedRemoteImageUrl = (url: URL) => {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

  const allowedHosts = getAllowedImageCacheHosts();
  const hostname = url.hostname.toLowerCase();

  // Private/local hosts are accepted only when explicitly configured/known.
  if (isLocalOrPrivateHostname(hostname)) {
    return allowedHosts.has(hostname);
  }

  // Public HTTPS image hosts are accepted. If stricter control is needed, set
  // IMAGE_CACHE_STRICT_HOSTS=true and define NEXT_PUBLIC_IMAGE_CACHE_ALLOWED_HOSTS.
  if (process.env.IMAGE_CACHE_STRICT_HOSTS === 'true') {
    return allowedHosts.has(hostname);
  }

  return url.protocol === 'https:' || allowedHosts.has(hostname);
};
