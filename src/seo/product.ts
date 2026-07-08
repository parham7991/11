import { BASEURL_SITE, SITE_NAME, BASE_URL_IMAGE } from '@/lib/variable';
import { getRobotsMeta, normalizePersianText, normalizeUrl } from './common';
import { request } from '@/lib/client';
import { getFinalSrc } from '@/lib/fun';
import { Product } from '@/types/Home';

export const getProduct = async (id: string) => {
  try {
    const result = await request({
      url: `/catalog/product/${id}`,
    });
    return {
      product: result[0],
    };
  } catch (error) {
    return {
      product: null,
    };
  }
};

export const getProductCompare = async (id: string[]) => {
  const result = await request({
    url: `/search/by/attributeset?ids=${id.join(',')}`,
  });
  return {
    product: result,
  };
};

export const sortBreadcumb = (breadcrumb: { order: number; title: string; url: string }[]) => {
  return Array.isArray(breadcrumb)
    ? breadcrumb.sort((a, b) => {
        if (a.order === null) return -1;
        if (b.order === null) return 1;
        return a.order - b.order;
      })
    : [];
};

export const generate_metadata_product = async ({ id }: { id?: string }) => {
  const productData = await getProduct(id as string);
  const product = productData?.product;
  const findBaseImage = product?.images?.find(
    (item: { content: { base_image: number } }) => item.content.base_image === 1
  );
  if (product) {
    return {
      other: {
        // ...(findBrand ? { product_brand: findBrand.attribiuts[0].title } : null),
        'twitter:label1': 'قیمت',
        'twitter:data1': `${Number(product?.special_price ? product?.special_price : product?.price)} تومان`,
        'twitter:label2': 'وضعیت موجودی',
        'twitter:data2': product?.is_in_stock === 0 ? 'ناموجود' : 'موجود',
        'og:type': 'product',
        'og:url': `${BASEURL_SITE}/product/${product.id}`,
        'product:retailer_item_id': product.id,
        'og:updated_time': product.updated_at,
        'og:image:secure_url': `${getFinalSrc(findBaseImage?.content?.path)}`,
        'og:image:alt': normalizePersianText(findBaseImage?.content?.title || product?.name || ''),
        'og:image:type': 'image/png',
        'og:image': 'image/png',
        'product:price:currency': 'IRT',
        'og:image:width': '370',
        'og:image:height': '390',
        product_id: product.id,
        product_price: product.special_price,
        product_old_price: product.price,
        product_name: product.name,
        availability: product?.is_in_stock === 0 ? 'outofstock' : 'instock',
        guarantee: product?.warranty,
      },
      title: normalizePersianText(
        product?.seo?.meta_title ? product.seo?.meta_title : product.name
      ),
      description: normalizePersianText(product?.seo?.metaDescription),
      keywords: normalizePersianText(
        product?.seo?.meta_keywords?.map((k: { value: string }) => k.value).join(',')
      ),
      twitter: {
        title: normalizePersianText(
          product?.seo?.meta_title ? product.seo?.meta_title : product.name
        ),
        description: normalizePersianText(product?.seo?.metaDescription),
        label1: 'قیمت',
        data1: product.discountPrice ? product.discountPrice : product.price,
        label2: 'وضعیت موجودی',
        data2: product?.is_in_stock === 0 ? 'ناموجود' : 'موجود',
      },
      openGraph: {
        url: `${BASEURL_SITE}/product/${product.id}`,
        title: normalizePersianText(
          product?.seo?.meta_title ? product.seo?.meta_title : product.name
        ),
        description: normalizePersianText(product?.seo?.metaDescription),
        locale: 'fa_IR',
        siteName: SITE_NAME,
        countryName: 'Iran',
        images: [
          {
            url: `${getFinalSrc(findBaseImage?.content?.path)}`,
            alt: normalizePersianText(findBaseImage?.content?.title || product?.name || ''),
            width: 370,
            height: 390,
          },
        ],
      },

      alternates: {
        canonical: product.canonicalurl
          ? product.canonicalurl
          : `${BASEURL_SITE}/product/${product?.id}`,
      },
      robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': '-1',
      },
    };
  } else {
    return {
      title: 'محصول',
    };
  }
};

export const jsonLdProduct = (product: Product) => {
  const findBaseImage = (product?.images as any)?.find(
    (item: any) => item.content?.base_image === 1
  );
  const baseImagePath = findBaseImage?.content?.path || product?.image?.link || '';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${BASEURL_SITE}/product/${product.id}/#product`,
        name: normalizePersianText(product.name),
        description: normalizePersianText(
          product.description || product.short_description || product.name
        ),
        image: baseImagePath ? `${getFinalSrc(baseImagePath)}` : undefined,
        brand: product?.brand?.title
          ? {
              '@type': 'Brand',
              name: normalizePersianText(product.brand.title),
            }
          : undefined,
        sku: String(product.id),
        mpn: String(product.id),
        offers: {
          '@type': 'Offer',
          url: `${BASEURL_SITE}/product/${product.id}`,
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
        aggregateRating: product?.comment?.length
          ? {
              '@type': 'AggregateRating',
              ratingValue:
                product.comment.reduce((sum: number, c: any) => sum + (c.vote || 0), 0) /
                  product.comment.length || 4.0,
              reviewCount: product.comment.length,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
        review: product?.comment?.length
          ? product.comment.slice(0, 5).map((review: any) => ({
              '@type': 'Review',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: review.vote || 4,
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
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASEURL_SITE}/product/${product.id}/#breadcrumb`,
        itemListElement: [
          { title: 'صفحه اصلی', link: BASEURL_SITE, position: 1 },
          ...(product?.seo?.breadcrumbs || []).map((item: any, idx: number) => ({
            title: item.name,
            link: item.url || item.link,
            position: idx + 2,
          })),
          {
            title: product.name,
            link: `${BASEURL_SITE}/product/${product.id}`,
            position: (product?.seo?.breadcrumbs?.length || 0) + 2,
          },
        ].map((item: any, idx) => ({
          '@type': 'ListItem',
          position: item.position || idx + 1,
          item: {
            '@id': item.link || BASEURL_SITE,
            name: normalizePersianText(item.title),
          },
        })),
      },
      {
        '@type': 'WebPage',
        '@id': `${BASEURL_SITE}/product/${product.id}/#webpage`,
        url: `${BASEURL_SITE}/product/${product.id}`,
        name: normalizePersianText(product.name),
        isPartOf: {
          '@id': `${BASEURL_SITE}/#website`,
        },
        inLanguage: 'fa-IR',
        breadcrumb: {
          '@id': `${BASEURL_SITE}/product/${product.id}/#breadcrumb`,
        },
        primaryImageOfPage: baseImagePath
          ? {
              '@type': 'ImageObject',
              url: `${getFinalSrc(baseImagePath)}`,
              alt: normalizePersianText(findBaseImage?.content?.title || product?.name || ''),
            }
          : undefined,
      },
    ],
  };
};
