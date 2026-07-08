export const dynamic = 'force-dynamic';
import React from 'react';
import { generate_metadata_tag, getProductsTag, jsonLdTag } from '@/seo/tag';
import { Metadata } from 'next';
import CategoryComponent from '@/components/common/CategoryComponent';
import { FilterCategory } from '@/types/Home';
import { SearchParamsTag } from '@/seo/tag';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const searchParamsFilter = await searchParams;
  return generate_metadata_tag({ id, searchParamsFilter: searchParamsFilter as SearchParamsTag });
}

const Page = async ({ params, searchParams }: Props) => {
  const { id } = await params;
  const searchParamsFilter = await searchParams;

  const data = await getProductsTag({
    searchParamsFilter: searchParamsFilter as SearchParamsTag,
    id,
  });
  const tagData = data?.data?.data ?? data?.data ?? data;
  const seoData = data?.seo ?? tagData?.seo;
  const products = tagData?.products ?? [];

  const tagName = seoData?.name || tagData?.name || `برچسب ${decodeURIComponent(id)}`;
  const tagSlug = seoData?.slug || id;
  const tagUrl = `/tags/${tagSlug}`;

  const normalizedResult = {
    ...tagData,
    name: tagName,
    products,
    total: tagData?.total ?? products.length,
    banner: tagData?.banner ?? { images: [] },
    slider: tagData?.slider ?? { images: [] },
    description: seoData?.content || tagData?.description || '',
    seo: {
      breadcrumbs: [
        { name: '', link: null, url: null }, // index 0 - ignored by Breadcrumbs component
        { name: '', link: null, url: null }, // index 1 - ignored by Breadcrumbs component
        { name: tagName, link: tagUrl, url: tagUrl }, // index 2 - current tag (displayed)
      ],
      meta_title: seoData?.seo_title || seoData?.name || tagName,
      meta_description: seoData?.seo_description || seoData?.content || '',
      meta_keywords: seoData?.seo_keywords ? [{ value: seoData.seo_keywords }] : [],
    },
    sortable: tagData?.sortable ?? [],
    max_price: tagData?.max_price ?? 0,
    min_price: tagData?.min_price ?? 0,
  } as unknown as FilterCategory;
  return (
    <>
      {seoData && products.length > 0 ? (
        <script
          id="jsonld_tag"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              jsonLdTag({
                seo: seoData,
                name: seoData.name || decodeURIComponent(id),
                products,
                total: tagData?.total || 0,
              })
            ),
          }}
        />
      ) : null}
      <CategoryComponent
        id={id}
        searchParams={searchParamsFilter as SearchParamsTag}
        resultProucts={normalizedResult}
      />
    </>
  );
};

export default Page;
