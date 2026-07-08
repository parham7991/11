import { request } from '@/lib/client';
import { BASE_URL_IMAGE, BASEURL_SITE, SITE_NAME } from '@/lib/variable';
import { htmlToText } from 'html-to-text';
import { Product } from '@/types/Home/Product';
import { normalizePersianText, normalizeUrl } from './common';

export type SearchParamsTag = {
  attribiutes?: string;
  available?: string;
  discounted?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  search?: string;
  page?: number;
};

export const getProductsTag = async ({
  searchParamsFilter,
  defaultSort = '_4',
  id,
}: {
  searchParamsFilter?: any;
  defaultSort?: string;
  id?: string;
}) => {
  searchParamsFilter = searchParamsFilter || {};
  searchParamsFilter.sort = searchParamsFilter?.sort ? searchParamsFilter?.sort : defaultSort;

  const filterProduct = new URLSearchParams();
  filterProduct.set('tag', id || '');

  // Iterate over searchParams and encode key-value pairs
  for (const [key, value] of Object.entries(searchParamsFilter)) {
    if (value && typeof value === 'string') {
      filterProduct.append(decodeURIComponent(key), decodeURIComponent(value));
    }
  }

  const newQueryString = filterProduct.toString();
  const result = await request({
    url: `/tag/products?${newQueryString}`,
  });

  return result;
};

type TagSeoProps = {
  seo: {
    id: number;
    name: string;
    slug: string;
    seo_title: string | null;
    seo_description: string | null;
    seo_keywords: string | null;
    content?: string;
  };
  name: string;
  products: Product[];
  total: number;
};

export const jsonLdTag = ({ seo, name, products }: TagSeoProps) => {
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
        '@id': `${BASEURL_SITE}/tags/${seo.slug || seo.id}/#breadcrumb`,
        itemListElement: [
          { title: 'خانه', link: BASEURL_SITE },
          { title: 'تگ‌ها', link: null },
          { title: name, link: `/tags/${seo.slug || seo.id}` },
        ]
          .filter((item): item is { title: string; link: string } => {
            return item.link !== null && typeof item.link === 'string';
          })
          .map((item, idx) => {
            return {
              '@type': 'ListItem',
              position: idx + 1,
              item: {
                // @ts-expect-error - normalizeUrl accepts string | null | undefined
                '@id': normalizeUrl(BASEURL_SITE, item.link),
                name: normalizePersianText(item.title),
              },
            };
          }),
      },
      {
        '@type': 'CollectionPage',
        '@id': `${BASEURL_SITE}/tags/${seo.slug || seo.id}/#webpage`,
        url: `${BASEURL_SITE}/tags/${seo.slug || seo.id}`,
        name: normalizePersianText(name),
        isPartOf: {
          '@id': `${BASEURL_SITE}/#website`,
        },
        inLanguage: 'fa-IR',
        breadcrumb: {
          '@id': `${BASEURL_SITE}/tags/${seo.slug || seo.id}/#breadcrumb`,
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
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
            aggregateRating: product?.reviews?.length
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: product?.average_rating || 4.0,
                  reviewCount: product?.review_count || product?.reviews?.length || 1,
                  bestRating: 5,
                  worstRating: 1,
                }
              : undefined,
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
              : undefined,
          };
        }),
      },
    ],
  };
};

export const generate_metadata_tag = async ({
  id,
  searchParamsFilter,
}: {
  id: string;
  searchParamsFilter: SearchParamsTag;
}) => {
  // has query params - ignore default sort parameter
  const defaultSort = '_4'; // default sort value
  const hasQueryParams =
    searchParamsFilter &&
    Object.keys(searchParamsFilter).filter((key) => {
      const value = searchParamsFilter[key as keyof SearchParamsTag];
      // ignore empty values and default sort
      return value && !(key === 'sort' && value === defaultSort);
    }).length > 0;

  const data = await getProductsTag({ searchParamsFilter, id });
  const tagData = data?.data?.data ?? data?.data ?? data;
  const seoData = data?.seo ?? tagData?.seo;

  const fullHtml = seoData?.seo_description || seoData?.content || '';

  const textContent = htmlToText(fullHtml, {
    wordwrap: 130,
  });
  const sentences = textContent.slice(0, 168);

  if (seoData) {
    const tagName = seoData.name || decodeURIComponent(id);
    const tagSlug = seoData.slug || id;

    // ساخت Title بهینه: شامل نام تگ + CTA
    const seoTitle = seoData.seo_title || `${tagName} | قیمت، مشخصات و خرید`;

    // ساخت Description بهینه: توضیح طبیعی + CTA
    const seoDescription =
      seoData.seo_description ||
      seoData.content ||
      sentences ||
      `لیست محصولات ${tagName} با مشخصات کامل، مقایسه قیمت و بررسی برندها. انتخاب و خرید آسان از ${SITE_NAME}.`;

    // Canonical همیشه به صفحه اصلی تگ (بدون query params)
    const canonicalUrl = `${BASEURL_SITE}/tags/${tagSlug}`;

    // اگر query params داریم یا pagination، canonical به صفحه اصلی تگ
    const finalCanonical = hasQueryParams || searchParamsFilter?.page ? canonicalUrl : canonicalUrl;

    // Robots: اگر تگ خالی است یا has_index=false، noindex
    const hasContent = seoData.content || seoData.seo_description || tagData?.total > 0;
    const shouldIndex = seoData.has_index !== false && hasContent;

    return {
      title: normalizePersianText(seoTitle),
      description: normalizePersianText(seoDescription),
      keywords: normalizePersianText(seoData.seo_keywords || ''),
      openGraph: {
        title: normalizePersianText(seoTitle),
        description: normalizePersianText(seoDescription),
        locale: `fa_IR`,
        type: `website`, // تغییر از article به website
        siteName: `${SITE_NAME}`,
        url: finalCanonical,
      },
      twitter: {
        title: normalizePersianText(seoTitle),
        description: normalizePersianText(seoDescription),
        card: 'summary_large_image',
      },
      alternates: {
        canonical: finalCanonical,
      },
      other: {
        'og:locale': 'fa_IR',
        'twitter:label1': 'محصولات',
        'twitter:data1': tagData?.total || 0,
      },
      robots: shouldIndex
        ? {
            index: true,
            follow: true,
            'max-image-preview': 'large' as const,
            'max-snippet': -1,
            'max-video-preview': -1,
          }
        : {
            index: false,
            follow: false,
            'max-image-preview': 'large' as const,
            'max-snippet': -1,
            'max-video-preview': 0,
          },
    };
  } else {
    return {
      title: normalizePersianText(decodeURIComponent(id)),
      description: normalizePersianText(decodeURIComponent(id)),
      robots: {
        index: false, // اگر seoData نداریم، noindex
        follow: false,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
        'max-video-preview': 0,
      },
    };
  }
};
