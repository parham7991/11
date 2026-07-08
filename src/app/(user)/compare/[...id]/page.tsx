import { getProductCompare } from '@/seo/product';
import React from 'react';
import Compare from '@/components/compare/Compare';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Products',
  description: 'Compare Products',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    noimageindex: true,
  },
};

const Page = async ({ params }: { params: Promise<{ id: string[] }> }) => {
  const { id: ids } = await params;

  // Fetch comparison data
  const comparisonData = await getProductCompare(ids);

  // Extract selected products and attributes
  const selectedProducts = comparisonData.product?.selected_products || [];
  const attributes = comparisonData.product?.attributes || [];
  const allProducts = comparisonData.product?.products || [];

  return (
    <>
      <Compare
        selectedProducts={selectedProducts}
        attributes={attributes}
        allProducts={allProducts}
        currentProductIds={ids.map((id) => parseInt(id))}
      />
    </>
  );
};

export default Page;
