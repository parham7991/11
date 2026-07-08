import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // جلوگیری از هشدار Turbopack وقتی در فولدرهای والد lockfileهای دیگر وجود دارد
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['192.168.1.166'], // اجازه دسترسی از IP شبکه محلی

  // بهینه‌سازی‌های Performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // حذف console.log در production
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['@heroui/react', 'react-icons'], // کاهش bundle size
  },
  // Cache configuration for Next.js 15+
  cacheLife: {
    route: {
      stale: 60, // زمان stale در ثانیه
      revalidate: 3600, // زمان revalidate در ثانیه
    },
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
          { key: 'Access-Control-Allow-Origin', value: '*' }, // replace this your actual origin
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
        // Cache headers برای تصاویر Next.js Image Optimization (همه تصاویر از backend)
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Cache headers برای static files
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
    minimumCacheTTL: 31536000, // یک سال (بهترین cache برای تصاویر)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    qualities: [50, 75, 90, 100], // تنظیم quality های مجاز
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '192.168.1.201',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.iwcs.ir',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.magenfa.ir',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.201',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'media.iwcs.ir',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.iwcs.ir',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'media.magenfa.ir',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'iwcs.media.ir',
        pathname: '/**',
      },
    ],
  },
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

export default nextConfig;
