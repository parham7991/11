'use client';
import React, { useState } from 'react';
import Image from '../common/Image';
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/styles.min.css';

import { Comparison_Icon, Share_Icon } from '../common/Icon';
import BaseDialog from '../common/BaseDialog';
import Button from '../common/Button';
import { BASEURL_SITE } from '@/lib/variable';
import { Product } from '@/types/Home';
import { addToast } from '@heroui/react';
import { getFinalSrc } from '@/lib/fun';
import Link from 'next/link';

type Props = {
  product: Product;
  images:
    | {
        content: {
          base_image: number;
          path: string;
          row: number;
          title?: string;
        };
      }[]
    | null;
};
const Preview = ({ images, product }: Props) => {
  // const { data, isSuccess } = useGetWishlistUser();
  const [openShare, setOpenShare] = useState(false);
  // const { isPending, mutate } = useAddWidhlist();
  const [selected, setSelected] = useState(0);
  const onToggleShare = () => setOpenShare(!openShare);

  const onCopy = () => {
    setOpenShare(false);
    navigator.clipboard.writeText(`${BASEURL_SITE}/product/${product.id}`);
    addToast({
      title: `لینک محصول با موفقیت کپی شد`,
      color: 'success',
      classNames: {
        base: '!z-[9999]',
      },
    });
  };
  const findBaseImage = images?.find((item) => item.content.base_image === 1);
  const galleyImages = images
    ?.filter((item) => item.content.base_image !== 1)
    .sort((a, b) => a.content.row - b.content.row);
  const fullGallery = [
    ...(findBaseImage?.content ? [findBaseImage] : []),
    ...(Array.isArray(galleyImages) ? galleyImages : []),
  ];
  const mainImagePath = fullGallery?.[selected]?.content?.path ?? '';
  const mainImageTitle = fullGallery?.[selected]?.content?.title || '';
  const mainImageAlt = mainImageTitle
    ? `${mainImageTitle} - ${product?.name || 'محصول'}`
    : product?.name || 'تصویر محصول';
  const hasImages = fullGallery && fullGallery.length > 0;

  const handlePrevImage = () => {
    if (hasImages) {
      setSelected((prev) => (prev === 0 ? fullGallery.length - 1 : prev - 1));
    }
  };

  const handleNextImage = () => {
    if (hasImages) {
      setSelected((prev) => (prev === fullGallery.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <div className="product-gallery-shell mt-5 h-fit w-full rounded-lg border border-gray-100 p-2 lg:w-fit">
      {/* preview */}
      <div className="product-image-stage relative flex h-96 w-full items-center justify-center rounded-2xl border-zinc-100 lg:w-[24rem] lg:min-w-[24rem] lg:items-start lg:border-2">
        {/* دکمه قبلی - سمت راست */}
        {hasImages && fullGallery.length > 1 && (
          <button
            onClick={handlePrevImage}
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:bg-blue-50 active:scale-95 lg:h-12 lg:w-12"
            aria-label="عکس قبلی"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-700"
            >
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* preview image */}
        <div className="relative -mt-12 h-[300px] w-[300px] lg:mt-1 lg:h-[350px] lg:w-[350px]">
          {hasImages && (
            <InnerImageZoom
              src={getFinalSrc(mainImagePath) as string}
              // alt={mainImageAlt as string}
              className="h-full w-full"
              zoomSrc={getFinalSrc(mainImagePath) as string}
            />
          )}
        </div>

        {/* دکمه بعدی - سمت چپ */}
        {hasImages && fullGallery.length > 1 && (
          <button
            onClick={handleNextImage}
            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:bg-blue-50 active:scale-95 lg:h-12 lg:w-12"
            aria-label="عکس بعدی"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-700"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {/* share */}
        <div className="absolute -right-3 -top-12 flex h-10 w-32 items-center justify-start gap-3 rounded-lg px-2 lg:-top-14">
          <Link className="block h-5 w-5" href={`/compare/${product.id}`}>
            <Comparison_Icon className="h-5 w-5 cursor-pointer text-black hover:text-blue-500" />
          </Link>
          <Button onClick={() => onToggleShare()} className="w-fit min-w-fit">
            <Share_Icon />
          </Button>
          {/* <Button
            isLoading={isPending}
            onClick={() =>
              data?.response
                ? mutate({
                    method: "DELETE",
                    data: { product_id: product.id },
                  })
                : mutate({
                    method: "POST",
                    data: { product_id: product.id },
                  })
            }
            className="!w-fit min-w-fit"
          >
            {data?.response && isSuccess ? (
              <span className="text-main">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 512 512"
                  height="25px"
                  width="25px"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M256 448a32 32 0 0 1-18-5.57c-78.59-53.35-112.62-89.93-131.39-112.8-40-48.75-59.15-98.8-58.61-153C48.63 114.52 98.46 64 159.08 64c44.08 0 74.61 24.83 92.39 45.51a6 6 0 0 0 9.06 0C278.31 88.81 308.84 64 352.92 64c60.62 0 110.45 50.52 111.08 112.64.54 54.21-18.63 104.26-58.61 153-18.77 22.87-52.8 59.45-131.39 112.8a32 32 0 0 1-18 5.56z"></path>
                </svg>
              </span>
            ) : (
              <span className="text-main">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 24 24"
                  height="25px"
                  width="25px"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="Heart">
                    <path d="M12,20.043a.977.977,0,0,1-.7-.288L4.63,13.08A5.343,5.343,0,0,1,6.053,4.513,5.266,5.266,0,0,1,12,5.371a5.272,5.272,0,0,1,5.947-.858A5.343,5.343,0,0,1,19.37,13.08l-6.676,6.675A.977.977,0,0,1,12,20.043ZM8.355,4.963A4.015,4.015,0,0,0,6.511,5.4,4.4,4.4,0,0,0,4.122,8.643a4.345,4.345,0,0,0,1.215,3.73l6.675,6.675,6.651-6.675a4.345,4.345,0,0,0,1.215-3.73A4.4,4.4,0,0,0,17.489,5.4a4.338,4.338,0,0,0-4.968.852h0a.744.744,0,0,1-1.042,0A4.474,4.474,0,0,0,8.355,4.963Z"></path>
                  </g>
                </svg>
              </span>
            )}
          </Button> */}
        </div>
      </div>
      {/* images */}
      <div className="mt-4 flex items-center gap-3 !overflow-auto px-1 scrollbar-hide lg:w-[24rem]">
        {hasImages &&
          fullGallery.map((path, idx) => (
            <button
              onClick={() => setSelected(idx)}
              key={idx}
              className={`product-thumb-stage flex h-14 w-full min-w-[80px] max-w-[80px] cursor-pointer items-center justify-center rounded-xl border bg-neutral-50 transition-all duration-200 lg:h-16 ${
                selected === idx ? 'border-blue-500 bg-blue-500 bg-opacity-30' : 'border-zinc-100'
              }`}
            >
              <Image
                src={path?.content?.path as string}
                alt={
                  path?.content?.title
                    ? `${path.content.title} - ${product?.name || 'محصول'}`
                    : product?.name || 'تصویر محصول'
                }
                className="h-10 w-10 !scale-100 !object-contain mix-blend-multiply"
              />
            </button>
          ))}
      </div>

      <BaseDialog isOpen={openShare} title="اشتراک‌گذاری" size="md" onClose={onToggleShare}>
        <div className="flex flex-col items-center justify-center">
          <span>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.4"
                d="M24.0007 5.33331C17.014 5.33331 11.334 11.0133 11.334 18C11.334 24.8533 16.694 30.4 23.6807 30.64C23.894 30.6133 24.1073 30.6133 24.2673 30.64C24.3207 30.64 24.3473 30.64 24.4007 30.64C24.4273 30.64 24.4273 30.64 24.454 30.64C31.2807 30.4 36.6407 24.8533 36.6673 18C36.6673 11.0133 30.9873 5.33331 24.0007 5.33331Z"
                fill="#386BF9"
              />
              <path
                d="M37.5466 37.7333C30.1066 32.7733 17.9732 32.7733 10.4799 37.7333C7.09323 40 5.22656 43.0666 5.22656 46.3466C5.22656 49.6266 7.09323 52.6666 10.4532 54.9066C14.1866 57.4133 19.0932 58.6666 23.9999 58.6666C28.9066 58.6666 33.8132 57.4133 37.5466 54.9066C40.9066 52.64 42.7732 49.6 42.7732 46.2933C42.7466 43.0133 40.9066 39.9733 37.5466 37.7333Z"
                fill="#386BF9"
              />
              <path
                opacity="0.4"
                d="M53.307 19.5733C53.7336 24.7467 50.0536 29.28 44.9603 29.8933C44.9336 29.8933 44.9336 29.8933 44.907 29.8933H44.827C44.667 29.8933 44.507 29.8933 44.3736 29.9467C41.787 30.08 39.4136 29.2533 37.627 27.7333C40.3736 25.28 41.947 21.6 41.627 17.6C41.4403 15.44 40.6936 13.4667 39.5736 11.7867C40.587 11.28 41.7603 10.96 42.9603 10.8533C48.187 10.4 52.8536 14.2933 53.307 19.5733Z"
                fill="#386BF9"
              />
              <path
                d="M58.64 44.24C58.4266 46.8267 56.7733 49.0667 54 50.5867C51.3333 52.0533 47.9733 52.7467 44.64 52.6667C46.56 50.9333 47.68 48.7733 47.8933 46.48C48.16 43.1733 46.5866 40 43.44 37.4667C41.6533 36.0533 39.5733 34.9333 37.3066 34.1067C43.2 32.4 50.6133 33.5467 55.1733 37.2267C57.6266 39.2 58.88 41.68 58.64 44.24Z"
                fill="#386BF9"
              />
            </svg>
          </span>
          <p className="mt-[20px] font-medium text-[16px] text-[#0C0C0C]">
            این کالا را با دوستان خود به اشتراک بگذارید!
          </p>
          <Button onClick={onCopy} className="mt-5 border border-dashed text-main">
            <span>
              <svg
                width="25"
                height="24"
                viewBox="0 0 25 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.6 22.75H7.4C3.49 22.75 1.75 21.01 1.75 17.1V12.9C1.75 8.99 3.49 7.25 7.4 7.25H11.6C15.51 7.25 17.25 8.99 17.25 12.9V17.1C17.25 21.01 15.51 22.75 11.6 22.75ZM7.4 8.75C4.3 8.75 3.25 9.8 3.25 12.9V17.1C3.25 20.2 4.3 21.25 7.4 21.25H11.6C14.7 21.25 15.75 20.2 15.75 17.1V12.9C15.75 9.8 14.7 8.75 11.6 8.75H7.4Z"
                  fill="#386BF9"
                />
                <path
                  d="M17.6 16.75H16.5C16.09 16.75 15.75 16.41 15.75 16V12.9C15.75 9.8 14.7 8.75 11.6 8.75H8.5C8.09 8.75 7.75 8.41 7.75 8V6.9C7.75 2.99 9.49 1.25 13.4 1.25H17.6C21.51 1.25 23.25 2.99 23.25 6.9V11.1C23.25 15.01 21.51 16.75 17.6 16.75ZM17.25 15.25H17.6C20.7 15.25 21.75 14.2 21.75 11.1V6.9C21.75 3.8 20.7 2.75 17.6 2.75H13.4C10.3 2.75 9.25 3.8 9.25 6.9V7.25H11.6C15.51 7.25 17.25 8.99 17.25 12.9V15.25Z"
                  fill="#386BF9"
                />
              </svg>
            </span>
            <span>کپی لینک</span>
          </Button>
        </div>
      </BaseDialog>
    </div>
  );
};

export default Preview;
