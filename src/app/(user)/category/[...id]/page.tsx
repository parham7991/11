export const dynamic = 'force-dynamic';
import React from 'react';
import {
  generate_metadata_productCategory,
  getProductsCategory,
  jsonLdProductCategory,
} from '@/seo/product-category';
import { Metadata } from 'next';
import CategoryComponent from '@/components/common/CategoryComponent';
export type SearchParamsCategory = {
  attribiutes?: string;
  available?: string;
  discounted?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  search?: string;
  slug?: string;
};

type Props = {
  params: Promise<{ id: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id: ids } = await params;
  const searchParamsFilter = await searchParams;
  const id = ids[0];
  return generate_metadata_productCategory({ id, searchParamsFilter });
}
const Page = async ({ params, searchParams }: Props) => {
  const { id: ids } = await params;
  const searchParamsFilter = await searchParams;
  const id = ids[0];
  const data = await getProductsCategory({ searchParamsFilter, id });
  // const resultFilter = filters?.data?.data?.category ? filters.data.data.category : null
  const products = data?.response;
  return (
    <>
      {products?.seo?.json ? (
        <script
          id="jsonld_product_category"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdProductCategory(products)),
          }}
        />
      ) : null}
      <CategoryComponent
        redirect={data?.redirect}
        id={id}
        searchParams={searchParamsFilter}
        resultProucts={products}
      />
    </>
  );
};

export default Page;
