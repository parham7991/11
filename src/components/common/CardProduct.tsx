import { Product } from '@/types/Home';
import Link from 'next/link';
import React from 'react';
import Image from './Image';
import { discountCalculation, toEnglishDigits, addCommas } from '@/lib/fun';
import Logo from '@/../public/images/no-image.png';
import OutImage from '@/../public/images/images-removebg-preview.png';

type Props = {
  product: Product;
  className?: string;
  classImage?: string;
  classAction?: string;
  classItmsBottom?: string;
  imageQuality?: number;
  imageSizes?: string;
  isSpical?: boolean;
};

const CardProduct = ({
  product,
  className,
  classAction,
  classItmsBottom,
  classImage = 'w-[85px] !h-[85px] lg:w-[162px] lg:h-[191px] mx-auto',
  imageQuality = 75,
  imageSizes = '(max-width: 768px) 85px, 162px',
  isSpical,
}: Props) => {
  const isOutOfStock = product?.price === 0 || product?.is_in_stock === 0;
  const shouldHighlightOutOfStock = Boolean(isSpical && isOutOfStock);
  const discount = product?.special_price
    ? discountCalculation(Number(product?.special_price), Number(product?.price!))
    : null;

  // تبدیل نام محصول: اعداد فارسی → انگلیسی
  const productName = product.name ? toEnglishDigits(product.name) : '';

  return (
    <div
      className={`group relative flex h-full flex-1 flex-col justify-between overflow-hidden border-gray-200 shadow ${className}`}
    >
      <div
        className={`absolute left-2 right-2 top-2 z-[5] flex items-start justify-between ${classAction}`}
      >
        <div className="flex flex-col" style={{ gap: '8px' }}>
          {/* fav */}
          <button className="block h-4 w-4 lg:h-5 lg:w-5">
            <svg viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14.5835 0.474243C13.6451 0.488839 12.7272 0.750787 11.9224 1.23364C11.1177 1.71648 10.4546 2.40313 10.0001 3.22424C9.54566 2.40313 8.88257 1.71648 8.07783 1.23364C7.27308 0.750787 6.35517 0.488839 5.41679 0.474243C3.92091 0.539235 2.51155 1.19362 1.49661 2.29444C0.481678 3.39525 -0.0563308 4.85301 0.000128002 6.34924C0.000128002 10.1384 3.98846 14.2767 7.33346 17.0826C8.08031 17.7102 9.02459 18.0543 10.0001 18.0543C10.9757 18.0543 11.9199 17.7102 12.6668 17.0826C16.0118 14.2767 20.0001 10.1384 20.0001 6.34924C20.0566 4.85301 19.5186 3.39525 18.5036 2.29444C17.4887 1.19362 16.0793 0.539235 14.5835 0.474243ZM11.596 15.8076C11.1493 16.1837 10.5841 16.39 10.0001 16.39C9.41617 16.39 8.85098 16.1837 8.40429 15.8076C4.12263 12.2151 1.66679 8.76841 1.66679 6.34924C1.60983 5.29484 1.9721 4.26068 2.6746 3.47233C3.37709 2.68397 4.36282 2.20537 5.41679 2.14091C6.47077 2.20537 7.45649 2.68397 8.15899 3.47233C8.86149 4.26068 9.22376 5.29484 9.16679 6.34924C9.16679 6.57026 9.25459 6.78222 9.41087 6.9385C9.56715 7.09478 9.77911 7.18258 10.0001 7.18258C10.2211 7.18258 10.4331 7.09478 10.5894 6.9385C10.7457 6.78222 10.8335 6.57026 10.8335 6.34924C10.7765 5.29484 11.1388 4.26068 11.8413 3.47233C12.5438 2.68397 13.5295 2.20537 14.5835 2.14091C15.6374 2.20537 16.6232 2.68397 17.3257 3.47233C18.0282 4.26068 18.3904 5.29484 18.3335 6.34924C18.3335 8.76841 15.8776 12.2151 11.596 15.8042V15.8076Z"
                fill="#0F1014"
              />
            </svg>
          </button>
          <Link
            rel="follow"
            target="_blank"
            prefetch={false}
            href={`/compare/${product.id}`}
            className="block h-4 w-4 lg:h-5 lg:w-5"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.1665 3.33331L1.6665 5.83331L4.1665 8.33331"
                stroke="#0F1014"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15.833 11.6666L18.333 14.1666L15.833 16.6666"
                stroke="#0F1014"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.6665 5.83331H18.3332"
                stroke="#0F1014"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.6665 14.1666H18.3332"
                stroke="#0F1014"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
        {product?.special_price && product?.is_in_stock !== 0 ? (
          <div className="discount-badge z-[6] flex h-fit w-fit items-center gap-0.5 rounded-lg bg-gradient-to-l from-rose-500 to-red-600 px-2 py-0.5 font-bold text-[13px] text-white shadow-md lg:px-2.5 lg:text-[15px]">
            <span>{discount}</span>
            <span>%</span>
          </div>
        ) : null}
      </div>
      <Link
        target="_blank"
        prefetch={false}
        className="flex h-full w-full flex-col justify-between"
        href={`/product/${product.id}`}
      >
        <div className="product-card-image-pad relative px-1 pr-2 pt-6 lg:px-3">
          {shouldHighlightOutOfStock && (
            <img
              className="absolute left-1/2 z-50 mx-auto -translate-x-1/2"
              src={OutImage.src}
              alt="out"
            />
          )}
          {Array.isArray(product.images) || product?.image?.link ? (
            <Image
              src={
                Array.isArray(product.images)
                  ? product?.images[0]?.content?.path
                  : product?.image?.link
              }
              alt={
                Array.isArray(product.images)
                  ? // @ts-expect-error error
                    product?.images[0]?.content?.title || product?.name || ''
                  : // @ts-expect-error error
                    product?.image?.title || product?.name || ''
              }
              className={[
                classImage,
                'product-image-pad',
                shouldHighlightOutOfStock ? 'blur-sm' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              imgClass="object-contain"
              sizes={imageSizes}
              quality={imageQuality}
              showLoader={true}
            />
          ) : (
            <span className={`product-image-pad flex items-center justify-center ${classImage}`}>
              <img height={100} width={100} src={Logo.src} />
            </span>
          )}

          <p className="product-name line-clamp-2 min-h-[3.5rem] pt-3 text-[13px] font-[500] leading-7 text-[#1e293b] lg:text-[15px]">
            {productName}
          </p>
        </div>
        <div
          className={`flex h-fit w-full items-center justify-between px-2 pb-3 lg:px-5 ${classItmsBottom}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-main lg:h-10 lg:w-10">
            <>
              <svg
                className="h-4 w-4 lg:h-6 lg:w-6"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_1704_6967)">
                  <path
                    d="M5.83317 20.7197C6.75365 20.7197 7.49984 19.9735 7.49984 19.053C7.49984 18.1326 6.75365 17.3864 5.83317 17.3864C4.9127 17.3864 4.1665 18.1326 4.1665 19.053C4.1665 19.9735 4.9127 20.7197 5.83317 20.7197Z"
                    fill="white"
                  />
                  <path
                    d="M14.1667 20.7197C15.0871 20.7197 15.8333 19.9735 15.8333 19.053C15.8333 18.1326 15.0871 17.3864 14.1667 17.3864C13.2462 17.3864 12.5 18.1326 12.5 19.053C12.5 19.9735 13.2462 20.7197 14.1667 20.7197Z"
                    fill="white"
                  />
                  <path
                    d="M19.1668 3.21973H17.5002V1.55306C17.5002 1.33205 17.4124 1.12008 17.2561 0.963804C17.0998 0.807524 16.8878 0.719727 16.6668 0.719727C16.4458 0.719727 16.2339 0.807524 16.0776 0.963804C15.9213 1.12008 15.8335 1.33205 15.8335 1.55306V3.21973H14.1668C13.9458 3.21973 13.7339 3.30752 13.5776 3.4638C13.4213 3.62008 13.3335 3.83205 13.3335 4.05306C13.3335 4.27407 13.4213 4.48603 13.5776 4.64232C13.7339 4.7986 13.9458 4.88639 14.1668 4.88639H15.8335V6.55306C15.8335 6.77407 15.9213 6.98603 16.0776 7.14232C16.2339 7.2986 16.4458 7.38639 16.6668 7.38639C16.8878 7.38639 17.0998 7.2986 17.2561 7.14232C17.4124 6.98603 17.5002 6.77407 17.5002 6.55306V4.88639H19.1668C19.3878 4.88639 19.5998 4.7986 19.7561 4.64232C19.9124 4.48603 20.0002 4.27407 20.0002 4.05306C20.0002 3.83205 19.9124 3.62008 19.7561 3.4638C19.5998 3.30752 19.3878 3.21973 19.1668 3.21973Z"
                    fill="white"
                  />
                  <path
                    d="M18.1425 8.82473C18.0348 8.80456 17.9241 8.80599 17.8169 8.82892C17.7097 8.85185 17.6081 8.89582 17.518 8.9583C17.428 9.02078 17.3512 9.10051 17.2922 9.19288C17.2331 9.28524 17.193 9.38841 17.1742 9.49639C17.0702 10.0732 16.767 10.5951 16.3173 10.9711C15.8677 11.347 15.3003 11.553 14.7142 11.5531H4.515L3.73167 4.88639H10.8333C11.0543 4.88639 11.2663 4.7986 11.4226 4.64232C11.5789 4.48603 11.6667 4.27407 11.6667 4.05306C11.6667 3.83205 11.5789 3.62008 11.4226 3.4638C11.2663 3.30752 11.0543 3.21973 10.8333 3.21973H3.535L3.5 2.92639C3.42818 2.31856 3.13588 1.75819 2.67849 1.35148C2.2211 0.944772 1.6304 0.719987 1.01833 0.719727L0.833333 0.719727C0.61232 0.719727 0.400358 0.807524 0.244078 0.963804C0.0877974 1.12008 0 1.33205 0 1.55306C0 1.77407 0.0877974 1.98604 0.244078 2.14232C0.400358 2.2986 0.61232 2.38639 0.833333 2.38639H1.01833C1.22244 2.38642 1.41945 2.46136 1.57198 2.59699C1.72451 2.73262 1.82195 2.91952 1.84583 3.12223L2.9925 12.8722C3.11154 13.8862 3.59873 14.8212 4.36159 15.4997C5.12445 16.1783 6.10988 16.5531 7.13083 16.5531H15.8333C16.0543 16.5531 16.2663 16.4653 16.4226 16.309C16.5789 16.1527 16.6667 15.9407 16.6667 15.7197C16.6667 15.4987 16.5789 15.2867 16.4226 15.1305C16.2663 14.9742 16.0543 14.8864 15.8333 14.8864H7.13083C6.61377 14.8865 6.10939 14.7263 5.68718 14.4278C5.26496 14.1293 4.94569 13.7072 4.77333 13.2197H14.7142C15.691 13.2198 16.6367 12.8767 17.3863 12.2504C18.1358 11.6241 18.6415 10.7543 18.815 9.79306C18.8345 9.68532 18.8325 9.57479 18.8092 9.46781C18.786 9.36082 18.7419 9.25947 18.6794 9.16954C18.6169 9.07961 18.5374 9.00287 18.4453 8.94371C18.3531 8.88454 18.2503 8.84411 18.1425 8.82473Z"
                    fill="white"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1704_6967">
                    <rect width="20" height="20" fill="white" transform="translate(0 0.719727)" />
                  </clipPath>
                </defs>
              </svg>
            </>
          </span>
          <div className="flex flex-col items-end gap-1">
            {product.special_price && product?.price !== 0 && product?.is_in_stock !== 0 ? (
              <p className="original-price flex w-fit items-center justify-center rounded bg-red-100 px-2 py-0.5 font-medium text-[12px] text-red-500 line-through decoration-red-400 decoration-2 lg:text-[14px]">
                {addCommas(Number(product.price))}
              </p>
            ) : null}
            {product?.price === 0 || product?.is_in_stock === 0 ? (
              isSpical ? null : (
                <p className="font-medium text-red-500">ناموجود</p>
              )
            ) : (
              <div className="flex items-center justify-center gap-px lg:gap-1">
                <p className="final-price font-bold text-[15px] text-emerald-600 lg:text-[17px]">
                  {addCommas(Number(product.special_price ? product.special_price : product.price))}
                </p>
                <p className="final-price font-bold text-[11px] text-emerald-600 lg:text-[13px]">
                  تومان
                </p>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CardProduct;
