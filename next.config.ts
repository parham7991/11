import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ['192.168.1.166'],
  output: 'standalone',

  // بهینه‌سازی‌های Performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['@heroui/react', 'react-icons'],
  },

  async redirects() {
    return [
      {
        source: '/shop/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/author/:path*',
        destination: '/',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'] as any,
    qualities: [75, 90],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '192.168.1.201', pathname: '/**' },
      { protocol: 'http', hostname: '192.168.1.201', pathname: '/**' },
      { protocol: 'https', hostname: 'media.iwcs.ir', pathname: '/**' },
      { protocol: 'http', hostname: 'media.iwcs.ir', pathname: '/**' },
      { protocol: 'https', hostname: 'media.magenfa.ir', pathname: '/**' },
      { protocol: 'http', hostname: 'media.magenfa.ir', pathname: '/**' },
      { protocol: 'https', hostname: 'iwcs.media.ir', pathname: '/**' },
    ],
  },
  eslint: {
    // اگر توی CI به خاطر lint fail میشی، موقتا true کن:
    ignoreDuringBuilds: true,
  },
  typescript: {
    // اگر ارور TS داری و میخوای بیلد رد بشه:
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
