import { BASEURL_SITE, SITE_NAME } from '@/lib/variable';
import { normalizePersianText } from './common';

type BrandData = {
  title: string;
  meta_title?: string;
  meta_keywords?: string;
  meta_description?: string;
  description?: string;
  id: string;
};

export const metadataBrand = (brand: BrandData) => {
  const title = normalizePersianText(brand.meta_title || brand.title || `برند ${brand.title}`);
  const description = normalizePersianText(
    brand.meta_description || `مشاهده همه محصولات ${brand.title} در ${SITE_NAME}`
  );

  return {
    title: normalizePersianText(`${title} | ${SITE_NAME}`),
    description: description,
    keywords: normalizePersianText(brand.meta_keywords || ''),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      locale: 'fa_IR',
      type: 'website',
      title: normalizePersianText(`${title} | ${SITE_NAME}`),
      description: description,
      url: `${BASEURL_SITE}/brand/${brand.title}`,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: normalizePersianText(`${title} | ${SITE_NAME}`),
      description: description,
    },
  };
};

export const jsonldBrand = (brand: BrandData) => {
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
        '@id': `${BASEURL_SITE}/brand/${brand.title}/#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@id': BASEURL_SITE,
              name: 'خانه',
            },
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: {
              '@id': `${BASEURL_SITE}/brand/${brand.title}`,
              name: brand.title,
            },
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${BASEURL_SITE}/brand/${brand.title}/#webpage`,
        url: `${BASEURL_SITE}/brand/${brand.title}`,
        name: normalizePersianText(`${brand.meta_title || brand.title} | ${SITE_NAME}`),
        description: normalizePersianText(
          brand.meta_description || `مشاهده همه محصولات ${brand.title}`
        ),
        isPartOf: {
          '@id': `${BASEURL_SITE}/#website`,
        },
        inLanguage: 'fa-IR',
        breadcrumb: {
          '@id': `${BASEURL_SITE}/brand/${brand.title}/#breadcrumb`,
        },
        about: {
          '@type': 'Brand',
          name: normalizePersianText(brand.title),
          description: normalizePersianText(
            brand.description
              ? brand.description.replace(/<[^>]*>/g, '').substring(0, 200)
              : `برند ${brand.title}`
          ),
        },
      },
      {
        '@type': 'Brand',
        '@id': `${BASEURL_SITE}/brand/${brand.title}/#brand`,
        name: normalizePersianText(brand.title),
        description: normalizePersianText(
          brand.description
            ? brand.description.replace(/<[^>]*>/g, '').substring(0, 500)
            : `برند ${brand.title}`
        ),
        url: `${BASEURL_SITE}/brand/${brand.title}`,
      },
    ],
  };
};
