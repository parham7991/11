'use client';
import { Product } from '@/types/Home';
import React, { useState } from 'react';
import Button from '../common/Button';
import { useAttributeAsambleOnline } from '@/hooks/product/useAttributeAsambleOnline';
import Link from 'next/link';
import { Skeleton } from '@heroui/react';
import Image from 'next/image';
import { getFinalSrc } from '@/lib/fun';
import { getCachedImageSrc } from '@/lib/image-cache';

type Props = {
  product: Product;
};

type AssemblyPartImageProps = {
  src?: string | null;
  alt: string;
};

const AssemblyPartImage = ({ src, alt }: AssemblyPartImageProps) => {
  const [hasError, setHasError] = useState(false);
  const finalSrc = !hasError && src ? src : '/images/no-image.png';

  return (
    <Image
      src={finalSrc}
      alt={alt}
      title={alt}
      width={36}
      height={36}
      sizes="36px"
      quality={75}
      className="h-9 w-9 object-contain mix-blend-multiply"
      loading="lazy"
      unoptimized={false}
      onError={() => setHasError(true)}
    />
  );
};

const AttributeAsambleOnline = ({ product }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading } = useAttributeAsambleOnline({
    enabled: product?.attribute_name === 'کیس های اسمبل شده',
  });
  const attributes = data?.items ?? [];
  const displayedAttributes = showAll ? attributes : attributes.slice(0, 6);

  if (isLoading)
    return (
      <div className="mt-3 grid w-full gap-3 lg:grid-cols-3">
        {new Array(6).fill(6).map((_, idx) => (
          <Skeleton key={idx} className="w-full rounded-lg">
            <div className="h-14 w-full rounded-lg bg-default-300" />
          </Skeleton>
        ))}
      </div>
    );

  if (attributes.length < 1) return null;

  return (
    <div>
      <div className="mt-3 grid w-full gap-3 md:grid-cols-2 lg:grid-cols-3">
        {displayedAttributes?.map(
          (item: { name?: string; value?: string; image: string; id: number }, idx: number) => {
            if (!item.name) return null;

            const imageUrl = getFinalSrc(item.image) as string | null;
            const cachedImageUrl = imageUrl ? (getCachedImageSrc(imageUrl) as string) : null;

            return (
              <Link
                prefetch={false}
                href={`/product/${item.id}`}
                target="_blank"
                key={item.id || idx}
                className="flex w-full items-start gap-2 rounded-lg bg-gray-100 p-2 font-medium transition-all hover:bg-gray-200"
              >
                <div className="assembly-image-pad relative flex h-[40px] w-[60px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <AssemblyPartImage
                    src={cachedImageUrl}
                    alt={`تصویر ${item.name || 'قطعه'} - ${product?.name || 'محصول'}`}
                  />
                </div>
                <p className="w-full text-wrap text-[12px] text-gray-400 underline">{item.name}</p>
              </Link>
            );
          }
        )}
      </div>

      {attributes.length > 6 && (
        <div className="mt-10 flex items-center">
          <div className="h-px w-full bg-gray-300" />
          <Button className="!min-w-fit border !px-2" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'نمایش کمتر' : 'مشاهده همه قطعات'}
          </Button>
          <div className="h-px w-full bg-gray-300" />
        </div>
      )}
    </div>
  );
};

export default AttributeAsambleOnline;
