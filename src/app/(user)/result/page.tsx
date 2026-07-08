import { request } from '@/lib/client';
import React from 'react';
import CategoryComponent from '@/components/common/CategoryComponent';
const getProducts = async ({
  searchParamsFilter,
  defaultSort = '_1',
}: {
  searchParamsFilter: SearchParamsCategory;
  defaultSort?: string;
}) => {
  searchParamsFilter.sort = searchParamsFilter?.sort || defaultSort;
  const filterProduct = new URLSearchParams();
  // Iterate over searchParams and encode key-value pairs
  for (const [key, value] of Object.entries(searchParamsFilter)) {
    filterProduct.append(key, value);
  }
  const newQueryString = filterProduct.toString();
  const result = await request({
    url: `/search?per_page=24&type=page&${newQueryString}`,
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
};
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// export async function generateMetadata({
//   searchParams,
// }: Props): Promise<Metadata> {
//   const { search } = await searchParams;
//   // @ts-expect-error error
//   return metadataResukt({ search: decodeURIComponent(search?.toString()) });
// }

const Page = async ({ searchParams }: Props) => {
  const searchParamsFilter = await searchParams;
  const data = await getProducts({ searchParamsFilter });
  const result = data;
  return (
    <div className="">
      {/* <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonldResult({ search: searchParamsFilter.search as string })
          ),
        }}
      /> */}
      <CategoryComponent
        //   urlBredcrumb="/result"
        id={''}
        searchParams={searchParamsFilter}
        // @ts-expect-error error
        resultFilter={{
          name: searchParamsFilter.search as string,
          breadcrumb: [{ title: 'نتایج جستجو', id: '1', url: '#', order: 99 }],
        }}
        resultProucts={result}
      />
    </div>
  );
};

export default Page;
