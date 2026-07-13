import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'فروشگاه اینترنتی آفلند',
    short_name: 'آفلند',
    description:
      'خرید آنلاین لوازم آرایشی، بهداشتی، عطر و ادکلن اورجینال با بهترین قیمت و ارسال سریع در فروشگاه اینترنتی آفلند.',
    lang: 'fa',
    dir: 'rtl',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#386bf9',
    categories: ['shopping', 'lifestyle', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'فروشگاه',
        short_name: 'فروشگاه',
        description: 'مشاهده محصولات و دسته‌بندی‌ها',
        url: '/',
      },
      {
        name: 'اسمبل آنلاین هوشمند',
        short_name: 'اسمبل',
        description: 'میانبر مستقیم به اسمبل آنلاین هوشمند',
        url: '/assemble-online',
      },
      {
        name: 'مجله آفلند',
        short_name: 'مجله',
        description: 'مقالات و جدیدترین‌ها',
        url: '/mag',
      },
    ],
    share_target: {
      action: '/api/pwa/share',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
  };
}
