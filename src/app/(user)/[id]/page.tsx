import { request } from '@/lib/client';
import { Metadata } from 'next';
import React from 'react';
import HomePage from '@/components/home/HomePage';
import { normalizePersianText } from '@/seo/common';

type Props = {
  params: Promise<{ id: string }>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await request({ url: `/page?url_key=${id}` });

  const seo = data.seo ? data.seo : null;
  if (seo) {
    return {
      title: normalizePersianText(seo?.meta_title),
      description: normalizePersianText(seo.meta_description),
      keywords: normalizePersianText(
        Array.isArray(seo?.meta_keywords)
          ? seo?.meta_keywords.map((item: { value: string }) => item.value)?.join(',')
          : ''
      ),
      openGraph: {
        title: normalizePersianText(seo?.meta_title),
        description: normalizePersianText(seo.meta_description),
      },
      twitter: {
        title: normalizePersianText(seo?.meta_title),
        description: normalizePersianText(seo.meta_description),
      },
    };
  } else {
    return {};
  }
}
const Page = async ({ params }: Props) => {
  const { id } = await params;
  const data = await request({ url: `/page?url_key=${id}` });
  const page = data?.page;
  return (
    <div className="mt-10">
      <HomePage showMag={false} showDescription={false} page={page} />
    </div>
  );
};

export default Page;
