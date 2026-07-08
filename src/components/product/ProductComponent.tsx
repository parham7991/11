import React from 'react';
import BackPrevPage from '../common/BackPrevPage';
import Breadcrumbs from '../common/Breadcrumbs';
import ExchangeOfViews from './ExchangeOfViews';
import Preview from './Preview';
import Title from './Title';
import Colors from './Colors';
import ShortAttribute from './ShortAttribute';
import Factor from './Factor';
import OptionSites from './OptionSites';
import ProductDetails from './ProductDetails';
import Carousel from '../common/Carousel';
import { Product } from '@/types/Home';
import AttributeAsambleOnline from './AttributeAsambleOnline';
import Image from '../common/Image';
import { IoShieldCheckmark } from 'react-icons/io5';
import { HiOutlineTruck } from 'react-icons/hi2';
import Link from '../Link';
import { replaceEmbeddedObjects } from '@/seo/common';

// تابع برای حذف تگ‌های خالی از HTML
function removeEmptyTags(html: string): string {
  if (!html) return html;

  let cleanedHtml = html;

  // حذف تگ‌های خالی به صورت بازگشتی تا زمانی که دیگر تگ خالی وجود نداشته باشد
  let previousHtml = '';
  while (previousHtml !== cleanedHtml) {
    previousHtml = cleanedHtml;
    // حذف تگ‌های خالی (مثل <p></p>, <div></div>, <span></span> و غیره)
    // که می‌توانند دارای whitespace باشند
    cleanedHtml = cleanedHtml.replace(/<(\w+)[^>]*>[\s\n\r\t]*<\/\1>/gi, '');
    // حذف تگ‌های self-closing خالی (مثل <br/>, <hr/> و غیره در اینجا نادیده می‌شوند)
  }

  // حذف whitespace اضافی
  cleanedHtml = cleanedHtml.trim();

  // اگر فقط whitespace باقی مانده، رشته خالی برگردان
  if (!cleanedHtml || cleanedHtml.replace(/<[^>]+>/g, '').trim() === '') {
    return '';
  }

  return cleanedHtml;
}

type Props = {
  product: Product;
};
const ProductComponent = ({ product }: Props) => {
  // تمیز کردن short_description از تگ‌های خالی و embedded objects
  const cleanedShortDescription = product?.short_description
    ? replaceEmbeddedObjects(removeEmptyTags(product.short_description))
    : null;

  // بررسی وجود "ارسال فوری" در اتریبیوت‌ها (هم در short_attributes و هم attributes)
  // ابتدا بررسی می‌کنیم که آیا "برچسب محصول" با value "ارسال فوری" وجود دارد
  // اگر پیدا نشد، بررسی می‌کنیم که آیا هر اتریبیوتی value "ارسال فوری" دارد
  const hasFastShipping =
    product?.short_attributes?.some((attr) => {
      const title = attr.title?.trim();
      const value = attr.value?.trim();
      return (
        (title === 'برچسب محصول' && value === 'ارسال فوری') ||
        (title === 'برچسب محصول' && value?.includes('ارسال فوری')) ||
        value === 'ارسال فوری'
      );
    }) ||
    product?.attributes?.some((attr) => {
      const title = attr.title?.trim();
      const value = attr.value?.trim();
      return (
        (title === 'برچسب محصول' && value === 'ارسال فوری') ||
        (title === 'برچسب محصول' && value?.includes('ارسال فوری')) ||
        value === 'ارسال فوری'
      );
    });
  return (
    <>
      <BackPrevPage url="/" title={product?.name} />
      <div className="product-page-shell container_page bg-white">
        <div className="pt-4">
          {product?.seo?.breadcrumbs && <Breadcrumbs breadcrumbs={product?.seo?.breadcrumbs} />}

          {
            <>
              {/* <Title name={product?.name} en_name={product.en_name} className='lg:hidden' /> */}
              <ExchangeOfViews product={product} className="lg:!hidden" />
              <div className="mt-4 flex w-full flex-col md:flex-row lg:mt-10 lg:gap-10">
                {/* @ts-expect-error error */}
                <Preview product={product} images={product?.images} />

                <div className="flex w-full flex-1 flex-col">
                  <Title
                    name={product?.name}
                    en_name={product?.en_name}
                    className="hidden lg:block"
                  />
                  <ExchangeOfViews product={product} className="!hidden lg:!flex" />
                  <div className="flex w-full flex-col justify-between gap-10 lg:flex-row">
                    <div className="mt-5 flex w-full flex-col gap-4 lg:mt-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="whitespace-nowrap font-reqular text-zinc-400">
                            شناسه محصول:
                          </p>
                          <p className="font-medium">{product?.id ? product?.id : ''}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {hasFastShipping && (
                            <Link
                              href="/Terms"
                              className="flex items-center gap-1.5 rounded-full bg-main px-3 py-1.5 shadow-sm"
                            >
                              <HiOutlineTruck className="h-4 w-4 text-white" strokeWidth={2} />
                              <span className="font-medium text-[12px] text-white lg:text-[14px]">
                                ارسال فوری
                              </span>
                            </Link>
                          )}
                          {product?.brand && (
                            <Link href={`/brand/${product?.brand?.title}`}>
                              <Image
                                alt={`لوگوی برند ${product?.brand?.title || ''} - ${product?.name || 'محصول'}`}
                                className="h-14 w-14 lg:h-24 lg:w-24"
                                src={product?.brand?.logo}
                              />
                            </Link>
                          )}
                        </div>
                      </div>
                      {cleanedShortDescription ? (
                        <>
                          <h3 className="text-right font-medium text-base text-black">
                            توضیح کوتاه :
                          </h3>
                          <p
                            className="overflow-hidden !font-light leading-8 text-gray-800 [&_*]:!m-0 [&_*]:!p-0"
                            dangerouslySetInnerHTML={{ __html: cleanedShortDescription }}
                          ></p>
                        </>
                      ) : null}
                      {product?.is_in_stock === 0 ? null : (
                        <>
                          {/* @ts-expect-error error */}
                          <Colors options={product?.options} />
                        </>
                      )}
                      {product?.short_attributes?.length >= 1 && (
                        <ShortAttribute
                          attribute_name={product?.attribute_name!}
                          short_attributes={product?.short_attributes}
                        />
                      )}
                      {product?.warranty ? (
                        <div className="justify-cenetr mb-3 flex w-fit items-center gap-3 rounded-xl bg-main p-2 font-medium text-white">
                          <div className="flex items-center gap-1">
                            <IoShieldCheckmark />
                            <p className="text-[12px] lg:text-[14px]">گارانتی:</p>
                          </div>
                          <p className="text-[12px] lg:text-[14px]">{product.warranty}</p>
                        </div>
                      ) : null}
                      <AttributeAsambleOnline product={product} />
                    </div>
                    <Factor className="!hidden lg:!flex" product={product} />
                  </div>
                </div>
              </div>

              <OptionSites />
              <ProductDetails product={product} />
              {Array.isArray(product?.tags) &&
              product.tags.filter((tag) => tag.has_index === true).length > 0 ? (
                <div className="product-tags-section mt-6 rounded-xl p-4 text-center lg:p-6">
                  <h2 className="mb-3 border-b border-gray-200 pb-2 text-right font-bold text-xl text-gray-800">
                    تگ‌های مرتبط با محصول
                  </h2>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {product.tags
                      .filter((tag) => tag.has_index === true)
                      .map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/tags/${tag.slug || tag.id}`}
                          className="rounded-full bg-blue-500 px-3 py-1 font-medium text-[12px] text-white transition hover:bg-blue-600 lg:text-[14px]"
                        >
                          {tag.name}
                        </Link>
                      ))}
                  </div>
                </div>
              ) : null}
              {product?.related?.length >= 1 && (
                <Carousel
                  products={product.related}
                  className="mt-4 lg:mt-16"
                  title="کالاهای مشابه"
                  noContainer={true}
                />
              )}
              <Factor className="flex lg:hidden" product={product} />
            </>
          }
        </div>
      </div>
    </>
  );
};

export default ProductComponent;
