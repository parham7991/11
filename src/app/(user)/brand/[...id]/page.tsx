import { request } from '@/lib/client';
import React from 'react';
import CategoryComponent from '@/components/common/CategoryComponent';
import { Metadata } from 'next';
import { metadataBrand, jsonldBrand } from '@/seo/brand';

const getProducts = async ({
  searchParamsFilter,
  defaultSort = '_1',
}: {
  searchParamsFilter: SearchParamsCategory;
  defaultSort?: string;
}) => {
  const filterProduct = new URLSearchParams();
  // Iterate over searchParams and encode key-value pairs
  for (const [key, value] of Object.entries(searchParamsFilter)) {
    filterProduct.append(key, value);
  }
  const newQueryString = filterProduct.toString();
  const result = await request({
    url: `/search?per_page=24&type=page&${newQueryString}`,
    cache: 'force-cache',
    tag: `brand-${searchParamsFilter.brand_id}`,
  });
  return result;
};

type SearchParamsCategory = {
  attribiutes?: string;
  available?: string;
  discounted?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  search?: string;
  brand_id?: string;
};
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // دریافت اطلاعات از همان API جستجو
  const data = await getProducts({
    searchParamsFilter: { brand_id: decodeURIComponent(id) },
  });

  // اطلاعات SEO برند از data.seo می‌آید
  const seoData = data?.seo;
  if (!seoData) {
    return {
      title: 'برند یافت نشد',
    };
  }

  return metadataBrand({
    title: seoData.title || 'برند',
    meta_title: seoData.meta_title,
    meta_keywords: seoData.meta_keywords,
    meta_description: seoData.meta_description,
    description: seoData.description || data?.description,
    id: decodeURIComponent(id),
  });
}

const Page = async ({ searchParams, params }: Props) => {
  const { id } = await params;
  const searchParamsFilter = await searchParams;

  const data = await getProducts({
    searchParamsFilter: { ...searchParamsFilter, brand_id: decodeURIComponent(id) },
  });

  // اطلاعات SEO برند از data.seo می‌آید
  const seoData = data?.seo;

  // تولید JSON-LD برای SEO
  const jsonLd = seoData
    ? jsonldBrand({
        title: seoData.title || 'برند',
        meta_title: seoData.meta_title,
        meta_keywords: seoData.meta_keywords,
        meta_description: seoData.meta_description,
        description: seoData.description || data?.description,
        id: decodeURIComponent(id),
      })
    : null;

  return (
    <>
      {/* JSON-LD Schema */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div>
        <CategoryComponent
          //   urlBredcrumb="/brand"
          id={''}
          searchParams={searchParamsFilter}
          // @ts-expect-error error
          resultFilter={{
            name: seoData?.title || 'برند',
            description: seoData?.description || data?.description,
          }}
          resultProucts={data}
        />
      </div>
    </>
  );
};

export default Page;
