import { BASEURL_SITE, SITE_NAME } from '@/lib/variable';
import { normalizePersianText } from './common';
import { Metadata } from 'next';
import { fetchHome } from '@/app/(user)/(home)/services/fetch-home';

const logo_image = `${BASEURL_SITE}/images/logo-off-3.png`;

export const jsonLdHome = {
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
      publisher: { '@id': `${BASEURL_SITE}/#organization` },
      inLanguage: 'fa-IR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_NAME}/?s={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'ImageObject',
      '@id': logo_image,
      url: logo_image,
      width: '750',
      height: '748',
      inLanguage: 'fa-IR',
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_NAME}/#webpage`,
      url: BASEURL_SITE,
      name: SITE_NAME,
      datePublished: '2023-08-30T15:00:46+03:30',
      dateModified: '2025-02-17T17:15:47+03:30',
      about: { '@id': `${BASEURL_SITE}/#organization` },
      isPartOf: { '@id': `${BASEURL_SITE}/#website` },
      primaryImageOfPage: { '@id': logo_image },
      inLanguage: 'fa-IR',
    },
    {
      '@type': 'Corporation',
      name: 'rozesefid',
      alternateName: SITE_NAME,
      url: SITE_NAME,
      logo: logo_image,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '02143000240',
        contactType: 'customer service',
        contactOption: 'HearingImpairedSupported',
        areaServed: 'IR',
        availableLanguage: 'Persian',
      },
      sameAs: [
        'https://t.me/offlir',
        'https://wa.me/989129490306',
        'https://instagram.com/offl.ir',
        BASEURL_SITE,
      ],
    },
  ],
};

export const default_meta_data = {
  title: normalizePersianText('آفلند: فروشگاه اینترنتی خرید لوازم آرایشی، بهداشتی و ادکلن'),
  description: normalizePersianText(
    'خرید بهترین لوازم آرایشی، بهداشتی، عطر و ادکلن و لوازم برقی زنانه و مردانه اورجینال با بهترین قیمت و ارسال سریع در فروشگاه اینترنتی آفلند'
  ),
  openGraph: {
    title: normalizePersianText('آفلند: فروشگاه اینترنتی خرید لوازم آرایشی، بهداشتی و ادکلن'),
    description: normalizePersianText(
      'خرید بهترین لوازم آرایشی، بهداشتی، عطر و ادکلن و لوازم برقی زنانه و مردانه اورجینال با بهترین قیمت و ارسال سریع در فروشگاه اینترنتی آفلند'
    ),
  },
  twitter: {
    title: normalizePersianText('آفلند: فروشگاه اینترنتی خرید لوازم آرایشی، بهداشتی و ادکلن'),
    description: normalizePersianText(
      'خرید بهترین لوازم آرایشی، بهداشتی، عطر و ادکلن و لوازم برقی زنانه و مردانه اورجینال با بهترین قیمت و ارسال سریع در فروشگاه اینترنتی آفلند'
    ),
  },
  robots:
    process.env.APP_ENV === 'stage'
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
};

export async function generate_metadata_home(): Promise<Metadata> {
  const data = await fetchHome();
  const seo = data.seo ?? null;
  return seo
    ? {
        title: normalizePersianText(seo.meta_title),
        description: normalizePersianText(seo.meta_description),
        keywords: normalizePersianText(
          seo.meta_keywords.map((i: { value: string }) => i.value).join(',')
        ),
        openGraph: {
          title: normalizePersianText(seo.meta_title),
          description: normalizePersianText(seo.meta_description),
          type: 'website',
          url: `${BASEURL_SITE}/`,
          siteName: SITE_NAME,
          locale: 'fa_IR',
          images: [
            {
              url: logo_image,
              alt: normalizePersianText(seo.meta_title || SITE_NAME),
            },
          ],
        },
        twitter: {
          title: normalizePersianText(seo.meta_title),
          description: normalizePersianText(seo.meta_description),
        },
        robots: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
        alternates: {
          canonical: `${BASEURL_SITE}/`,
        },
      }
    : {
        title: normalizePersianText('آفلند'),
        robots: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
        alternates: {
          canonical: `${BASEURL_SITE}/`,
        },
        openGraph: {
          title: normalizePersianText('آفلند'),
          description: normalizePersianText('آفلند'),
          type: 'website',
          url: `${BASEURL_SITE}/`,
          siteName: SITE_NAME,
          locale: 'fa_IR',
          images: [
            {
              url: logo_image,
              alt: normalizePersianText(SITE_NAME),
            },
          ],
        },
        twitter: {
          title: normalizePersianText('آفلند'),
          description: normalizePersianText('آفلند'),
        },
      };
}
