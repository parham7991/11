import { BASEURL_SITE, SITE_NAME } from '@/lib/variable';
import type { Metadata } from 'next';
import { normalizePersianText } from './common';

// JSON-LD Structured Data برای صفحه اخبار کوتاه
export const jsonLdShortNews = () => {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASEURL_SITE}/#organization`,
        name: SITE_NAME,
        url: BASEURL_SITE,
      },
      {
        '@type': 'WebSite',
        '@id': `${BASEURL_SITE}/#website`,
        url: BASEURL_SITE,
        name: SITE_NAME,
        publisher: {
          '@id': `${BASEURL_SITE}/#organization`,
        },
        inLanguage: 'fa-IR',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASEURL_SITE}/short-news/#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@id': BASEURL_SITE,
              name: normalizePersianText('خانه'),
            },
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: {
              '@id': `${BASEURL_SITE}/short-news`,
              name: normalizePersianText('اخبار کوتاه'),
            },
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${BASEURL_SITE}/short-news/#webpage`,
        url: `${BASEURL_SITE}/short-news/`,
        name: normalizePersianText('اخبار کوتاه روز'),
        description: normalizePersianText(
          'مجموعه اخبار کوتاه و خلاصه روزانه در زمینه‌های مختلف. اخبار فوری، خلاصه رویدادها و اطلاعات مهم روز.'
        ),
        isPartOf: {
          '@id': `${BASEURL_SITE}/#website`,
        },
        inLanguage: 'fa-IR',
        breadcrumb: {
          '@id': `${BASEURL_SITE}/short-news/#breadcrumb`,
        },
        about: {
          '@type': 'ItemList',
          name: normalizePersianText('اخبار کوتاه'),
          description: normalizePersianText('مجموعه اخبار کوتاه و خلاصه روزانه'),
        },
      },
      {
        '@type': 'NewsMediaOrganization',
        '@id': `${BASEURL_SITE}/#newsOrganization`,
        name: SITE_NAME,
        url: BASEURL_SITE,
        publishingPrinciples: `${BASEURL_SITE}/short-news`,
      },
    ],
  };
};

// Metadata Generator برای صفحه اخبار کوتاه
export function generate_metadata_shortNews(): Metadata {
  const title = normalizePersianText('اخبار کوتاه روز | آفلند');
  const description = normalizePersianText(
    'مجموعه اخبار کوتاه و خلاصه روزانه در زمینه‌های مختلف. اخبار فوری، خلاصه رویدادها و اطلاعات مهم روز. به‌روزترین اخبار کوتاه را در آفلند بخوانید.'
  );
  const keywords = normalizePersianText(
    'اخبار کوتاه, اخبار روز, اخبار فوری, خلاصه اخبار, اخبار امروز, خبر کوتاه'
  );

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${BASEURL_SITE}/short-news`,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'fa_IR',
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
    },
    alternates: {
      canonical: `${BASEURL_SITE}/short-news`,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    other: {
      'og:locale': 'fa_IR',
      'article:section': normalizePersianText('اخبار کوتاه'),
    },
  };
}
