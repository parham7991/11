import { BASEURL_SITE, SITE_NAME } from '@/lib/variable';
import { getFinalSrc } from '@/lib/fun';
import type { Metadata } from 'next';
import { normalizePersianText } from './common';

export const jsonLdMag = () => {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASEURL_SITE}/#organization`,
        name: normalizePersianText('خانه'),
        url: BASEURL_SITE,
      },
      {
        '@type': 'WebSite',
        '@id': `${BASEURL_SITE}/#website`,
        url: BASEURL_SITE,
        name: normalizePersianText('خانه'),
        publisher: {
          '@id': `${BASEURL_SITE}/#organization`,
        },
        inLanguage: 'fa-IR',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASEURL_SITE}/mag/#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: '1',
            item: {
              '@id': BASEURL_SITE,
              name: normalizePersianText('خانه'),
            },
          },
          {
            '@type': 'ListItem',
            position: '2',
            item: {
              '@id': BASEURL_SITE,
              name: normalizePersianText('مقاله‌ها'),
            },
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${BASEURL_SITE}/mag/#webpage`,
        url: `${BASEURL_SITE}/mag/`,
        name: normalizePersianText('مقاله ها'),
        isPartOf: {
          '@id': `${BASEURL_SITE}/#website`,
        },
        inLanguage: 'fa-IR',
        breadcrumb: {
          '@id': `${BASEURL_SITE}/mag/#breadcrumb`,
        },
      },
    ],
  };
};
export const jsonLdCategoryMag = ({ title, url }: { title: string; url: string }) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          name: normalizePersianText('خانه'),
          '@id': BASEURL_SITE,
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          name: normalizePersianText(title),
          '@id': `${BASEURL_SITE}/mag/${url}`,
        },
      },
    ],
  };
};

// ---------------- SEO helpers for Mags ----------------

type MagPost = {
  id?: string | number;
  slug?: string;
  title?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  excerpt?: string;
  summary?: string;
  image?: { link?: string };
  cover?: string;
  featured_image?: string;
  author?: { name?: string };
  created_at?: string;
  updated_at?: string;
  read_time?: number | string;
};

export function jsonLdArticle(post: MagPost, fallbackId: string | number): Record<string, any> {
  const image = post?.image?.link || post?.cover || post?.featured_image;
  const urlId = encodeURIComponent(post?.slug || String(fallbackId));
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: normalizePersianText(post?.title),
    description: normalizePersianText(post?.seo_description || post?.excerpt || post?.summary),
    image: image ? getFinalSrc(image) : undefined,
    datePublished: post?.created_at,
    dateModified: post?.updated_at,
    author: post?.author?.name
      ? { '@type': 'Person', name: post.author.name }
      : { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASEURL_SITE}/mag/${urlId}` },
    timeRequired:
      post?.read_time !== undefined && post?.read_time !== null
        ? `PT${Number(post.read_time)}M`
        : undefined,
  };
}

export async function generate_metadata_magList(): Promise<Metadata> {
  const title = normalizePersianText('مجله');
  const description = normalizePersianText('مقالات، آموزش‌ها و اخبار جدید در مجله سایت.');
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASEURL_SITE}/mag`,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'fa_IR',
    },
    twitter: { title, description },
    alternates: { canonical: `${BASEURL_SITE}/mag` },
    robots: { index: true, follow: true },
  };
}

export function generate_metadata_magPost(post: MagPost, fallbackId: string | number): Metadata {
  const title = normalizePersianText(post?.seo_title || post?.title || SITE_NAME);
  const description = normalizePersianText(
    post?.seo_description || post?.excerpt || post?.summary || ''
  );
  const keywords = normalizePersianText(post?.seo_keywords || '');
  // @ts-expect-error error
  const image = post?.seo_image || post?.image?.link || post?.cover || post?.featured_image;
  const slug = post?.slug || String(fallbackId);
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${BASEURL_SITE}/mag/${encodeURIComponent(slug)}`,
      siteName: SITE_NAME,
      locale: 'fa_IR',
      images: image
        ? [
            {
              url: `${getFinalSrc(image)}`,
              alt: normalizePersianText(title),
            },
          ]
        : undefined,
    },
    twitter: { title, description },
    alternates: { canonical: `${BASEURL_SITE}/mag/${encodeURIComponent(slug)}` },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  };
}
