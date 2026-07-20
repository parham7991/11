import { request } from '@/lib/client';

export const getProductsCategory = async ({
  searchParamsFilter,
  defaultSort = '_4',
  id,
}: {
  searchParamsFilter?: any;
  defaultSort?: string;
  id?: string;
}) => {
  searchParamsFilter.sort = searchParamsFilter?.sort ? searchParamsFilter?.sort : defaultSort;

  const filterProduct = new URLSearchParams();
  // Iterate over searchParams and encode key-value pairs
  for (const [key, value] of Object.entries(searchParamsFilter!)) {
    filterProduct.append(decodeURIComponent(key), decodeURIComponent(value as string));
  }
  const newQueryString = filterProduct.toString();
  const result = await request({
    // SEO: افزایش تعداد محصولات SSR اولیه از ۲۴ به ۵۰ تا گوگل تنوع محصول
    // (Product Variety) بالای فروشگاه را در HTML اولیه ببیند.
    url: `/catalog/category/${id ? `${id}` : ''}?pre_page=50&${newQueryString}`,
  });

  return result;
};

export const sortBreadcumb = (breadcrumb: { order: number; title: string }[]) => {
  return Array.isArray(breadcrumb)
    ? breadcrumb.sort((a, b) => {
        if (a.order === null) return -1;
        if (b.order === null) return 1;
        return a.order - b.order;
      })
    : [];
};

import { BASE_URL_IMAGE, BASEURL_SITE, SITE_NAME } from '@/lib/variable';
import { htmlToText } from 'html-to-text';
import { Product } from '@/types/Home/Product';
import { normalizePersianText, normalizeUrl } from './common';
import { Metadata } from 'next';
type SearchParamsCategory = {
  attribiutes?: string;
  available?: string;
  discounted?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  search?: string;
  page?: number;
};
type Props = {
  seo: {
    meta_title: string;
    meta_description: string;
    meta_keywords: { value: string }[];
    breadcrumbs: {
      '@type': 'ListItem';
      name: string;
      link?: string;
      url?: string;
      position: number;
    }[];
  };
  name: string;
  description: string;
  en_name: string;
  id: number;
  link: string;
  max_price: number;
  min_price: number;
  redirecturltype?: number;
  redirecturl?: string;
  products: Product[];
  total?: number;
};

export const jsonLdProductCategory = ({
  seo,
  name,
  description,
  id,
  link,
  products,
  total,
}: Props) => {
  // تعداد کل موجودی دسته‌بندی (حتی اگر همه در HTML لود نشده باشند)
  const totalItems = Number(total) > 0 ? Number(total) : products.length;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASEURL_SITE}/#organization`,
        name: name,
        url: `${BASEURL_SITE}`,
      },
      {
        '@type': 'WebSite',
        '@id': `${BASEURL_SITE}/#website`,
        url: `${BASEURL_SITE}`,
        name: name,
        publisher: {
          '@id': `${BASEURL_SITE}/#organization`,
        },
        inLanguage: 'fa-IR',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASEURL_SITE}/category/${id}/#breadcrumb`,
        itemListElement: [
          { title: 'صفحه اصلی', link: undefined },
          ...seo.breadcrumbs.map((item) => ({ title: item.name, link: item.link || item.url })),
          { title: name, link: link },
        ].map((item, idx) => {
          return {
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@id': item.link ? `${item.link}` : `${BASEURL_SITE}`,
              name: normalizePersianText(item.title),
            },
          };
        }),
      },
      {
        '@type': 'CollectionPage',
        '@id': `${BASEURL_SITE}/category/${id}/#webpage`,
        // @ts-expect-error - normalizeUrl accepts string | null | undefined
        url: normalizeUrl(BASEURL_SITE, link),
        name: normalizePersianText(name),
        isPartOf: {
          '@id': `${BASEURL_SITE}/#website`,
        },
        inLanguage: 'fa-IR',
        breadcrumb: {
          '@id': `${BASEURL_SITE}/category/${id}/#breadcrumb`,
        },
        // SEO: به گوگل اعلام می‌کند کلاً چند کالا در این دسته‌بندی موجود است
        // (numberOfItems = کل موجودی) حتی اگر همهٔ آن‌ها در HTML لود نشده باشند.
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: totalItems,
          itemListElement: products.map((product, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            // @ts-expect-error - normalizeUrl accepts string | null | undefined
            url: normalizeUrl(BASEURL_SITE, product.link),
            name: normalizePersianText(product.name),
          })),
        },
      },
      {
        '@context': 'https://schema.org/',
        '@graph': products.map((product) => {
          return {
            '@type': 'Product',
            image: `${BASE_URL_IMAGE}/${product?.image?.link || ''}`,
            name: normalizePersianText(product.name),
            // @ts-expect-error - normalizeUrl accepts string | null | undefined
            url: normalizeUrl(BASEURL_SITE, product.link),
            // @ts-expect-error - normalizeUrl accepts string | null | undefined
            '@id': normalizeUrl(BASEURL_SITE, product.link),
            description: normalizePersianText(product.description || product.name),
            offers: {
              '@type': 'Offer',
              priceCurrency: 'IRR',
              price: product?.special_price ? product.special_price : product.price,
              availability: `https://schema.org/${product.is_in_stock === 0 ? 'OutOfStock' : 'InStock'}`,
              priceValidUntil:
                product?.special_to_date ||
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
              hasMerchantReturnPolicy: {
                '@type': 'MerchantReturnPolicy',
                returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                merchantReturnDays: 7,
                returnMethod: 'https://schema.org/ReturnByMail',
                returnFees: 'https://schema.org/FreeReturn',
              },
              shippingDetails: {
                '@type': 'OfferShippingDetails',
                shippingRate: {
                  '@type': 'MonetaryAmount',
                  value: 0,
                  currency: 'IRR',
                },
                deliveryTime: {
                  '@type': 'ShippingDeliveryTime',
                  handlingTime: {
                    '@type': 'QuantitativeValue',
                    minValue: 1,
                    maxValue: 3,
                    unitCode: 'DAY',
                  },
                  transitTime: {
                    '@type': 'QuantitativeValue',
                    minValue: 1,
                    maxValue: 7,
                    unitCode: 'DAY',
                  },
                },
                shippingDestination: {
                  '@type': 'DefinedRegion',
                  addressCountry: 'IR',
                },
              },
              areaServed: [
                {
                  '@type': 'Country',
                  name: 'Iran',
                },
              ],
              applicenceCountery: 'ایران',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: product?.average_rating || 4.0,
              reviewCount: product?.review_count || 1,
              bestRating: 5,
              worstRating: 1,
            },
            review: product?.reviews?.length
              ? product.reviews.map((review: any) => ({
                  '@type': 'Review',
                  reviewRating: {
                    '@type': 'Rating',
                    ratingValue: review.rating || 4,
                    bestRating: 5,
                    worstRating: 1,
                  },
                  author: {
                    '@type': 'Person',
                    name: normalizePersianText(review.user_name || 'کاربر'),
                  },
                  reviewBody: normalizePersianText(review.content || 'محصول خوب و با کیفیت'),
                  datePublished: review.created_at || new Date().toISOString(),
                }))
              : [
                  {
                    '@type': 'Review',
                    reviewRating: {
                      '@type': 'Rating',
                      ratingValue: 4,
                      bestRating: 5,
                      worstRating: 1,
                    },
                    author: {
                      '@type': 'Person',
                      name: normalizePersianText('کاربر'),
                    },
                    reviewBody: normalizePersianText('محصول خوب و با کیفیت'),
                    datePublished: new Date().toISOString(),
                  },
                ],
          };
        }),
      },
    ],
  };
};

export const generate_metadata_productCategory = async ({
  id,
  searchParamsFilter,
}: {
  id: string;
  searchParamsFilter: SearchParamsCategory;
}) => {
  // has query params - ignore default sort parameter
  const defaultSort = '_4'; // default sort value
  const hasQueryParams =
    searchParamsFilter &&
    Object.keys(searchParamsFilter).filter((key) => {
      const value = searchParamsFilter[key as keyof SearchParamsCategory];
      // ignore empty values and default sort
      return value && !(key === 'sort' && value === defaultSort);
    }).length > 0;
  const data = await getProductsCategory({ searchParamsFilter, id });
  const product = data?.response;

  const fullHtml = product?.meta_description;

  const textContent = htmlToText(fullHtml, {
    wordwrap: 130,
  });
  const sentences = textContent.slice(0, 168);
  if (product) {
    return {
      title: normalizePersianText(product.seo?.meta_title || product.name),
      description: normalizePersianText(
        product.seo?.meta_description || product.description || sentences
      ),
      keywords: normalizePersianText(
        product.seo?.meta_keywords?.map((k: any) => k.value).join(',') || ''
      ),
      openGraph: {
        title: normalizePersianText(product.seo?.meta_title || product.name),
        description: normalizePersianText(
          product.seo?.meta_description || product.description || sentences
        ),
        locale: `fa_IR`,
        type: `article`,
        siteName: `${SITE_NAME}`,
        url: product.link
          ? // @ts-expect-error - normalizeUrl accepts string | null | undefined
            normalizeUrl(BASEURL_SITE, product.link)
          : `${BASEURL_SITE}/product/${id}`,
      },
      twitter: {
        title: normalizePersianText(product.seo?.meta_title || product.name),
        description: normalizePersianText(
          product.seo?.meta_description || product.description || sentences
        ),
      },
      alternates: {
        canonical: product.link
          ? // @ts-expect-error - normalizeUrl accepts string | null | undefined
            normalizeUrl(BASEURL_SITE, product.link)
          : `${BASEURL_SITE}/product/${id}`,
      },
      other: {
        'og:locale': 'fa_IR',
        'twitter:label1': 'محصولات',
        'twitter:data1': product.total || 0,
      },
      robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    } satisfies Metadata;
  } else {
    return {
      title: normalizePersianText(decodeURIComponent(id)),
      description: normalizePersianText(decodeURIComponent(id)),
      robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large' as const,
        'max-snippet': 0,
        'max-video-preview': 0,
      },
    } satisfies Metadata;
  }
};
