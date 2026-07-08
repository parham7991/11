import ProductComponent from '@/components/product/ProductComponent';
import { generate_metadata_product, getProduct, jsonLdProduct } from '@/seo/product';
import { Metadata } from 'next';
import Script from 'next/script';
import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const idString = Array.isArray(id) ? (id[0] as string) : '';
  const productData = await getProduct(idString);
  if (!productData?.product) {
    redirect('/');
  }
  // @ts-expect-error error
  return generate_metadata_product({ id: idString });
}

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const idString = Array.isArray(id) ? (id[0] as string) : '';

  const { product } = await getProduct(idString);
  if (!product) {
    redirect('/');
  }

  const jsonLd = jsonLdProduct(product);

  return (
    <>
      <Script
        id="jsonld_product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/\s+/g, ' ').trim(),
        }}
      />
      <ProductComponent product={product} />
    </>
  );
};

export default Page;
