'use client';
import { addCommas } from '@/lib/fun';
import React, { useState, useEffect, useCallback } from 'react';
import Image from '../common/Image';
import BaseDialog from '../common/BaseDialog';
import { useSearchCompare } from '@/hooks/product/useSearchCompare';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  title?: string;
  image: {
    link: string;
  };
  images?: { content: { path: string } }[];
  price: number | { price: number };
  special_price?: number;
  is_in_stock?: 0 | 1;
  brand?: {
    title: string;
  };
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  currentProductIds: number[];
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  currentProductIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useSearchCompare(
    debouncedQuery.length >= 3 ? debouncedQuery : ''
  );

  // Get total count from the first page
  const total = data?.pages?.[0]?.total || 0;

  // Flatten all pages of products
  const allProducts = data?.pages?.flatMap((page) => page?.products || []) || [];

  // Filter out already selected products
  const searchResults = allProducts.filter(
    (product: any) => !currentProductIds.includes(product.id)
  );

  // Calculate remaining products count
  const remainingCount = total - currentProductIds.length;

  // Handle product selection
  const handleProductSelect = (product: any) => {
    onSelectProduct(product);
    onClose();
    setSearchQuery('');
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setDebouncedQuery('');
  };

  // Infinite scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  return (
    <BaseDialog isOpen={isOpen} onClose={handleClose} title="افزودن محصول به مقایسه" size="5xl">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
        title="بستن"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی محصول..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-2 text-right font-reqular outline-none"
          />
          <button className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {/* Results Count */}
        {!isLoading && total > 0 && (
          <div className="font-yekan mt-3 font-medium text-sm text-gray-600">
            {searchQuery && searchQuery.length >= 3 ? (
              <span>
                نتایج جستجو: {searchResults.length} از {remainingCount} محصول
              </span>
            ) : searchQuery && searchQuery.length < 3 ? (
              <span className="text-orange-600">حداقل ۳ کاراکتر برای جستجو وارد کنید</span>
            ) : (
              <span>مجموع محصولات: {remainingCount} محصول</span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-h-[600px] overflow-y-auto" onScroll={handleScroll}>
        {isLoading ? (
          <div className="py-8 text-center">
            <svg
              className="mx-auto mb-4 h-8 w-8 animate-spin text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="font-yekan text-gray-500">در حال بارگذاری...</p>
          </div>
        ) : searchQuery && searchQuery.length < 3 ? (
          <div className="py-8 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-orange-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="font-yekan font-medium text-orange-600">
              حداقل ۳ کاراکتر برای جستجو وارد کنید
            </p>
            <p className="font-yekan mt-2 text-sm text-gray-400">
              {remainingCount} محصول برای مقایسه موجود است
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="py-8 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.647l-3 2.647A7.962 7.962 0 004 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="font-yekan text-gray-500">
              {searchQuery && searchQuery.length >= 3
                ? 'محصولی با این نام یافت نشد'
                : 'محصولی برای مقایسه یافت نشد'}
            </p>
            {total > 0 && !searchQuery && (
              <p className="font-yekan mt-2 text-sm text-gray-400">
                {remainingCount} محصول موجود است
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {searchResults.map((product: any) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="group relative flex h-full flex-1 cursor-pointer flex-col justify-between rounded-lg border border-gray-200 bg-white shadow transition-shadow hover:shadow-lg"
                >
                  <div className="p-4">
                    {/* Product Image */}
                    <div className="mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-lg">
                      <Image
                        src={(() => {
                          // Check if product has images array with small_image
                          if (product.images && product.images.length > 0) {
                            const smallImage = product.images.find(
                              (img: any) => img.content?.small_image === 1
                            );
                            if (smallImage?.content?.path) {
                              return smallImage.content.path;
                            }
                            // If no small_image found, use the first image
                            if (product.images[0]?.content?.path) {
                              return product.images[0].content.path;
                            }
                          }

                          // Fallback to old image structure
                          return product.image?.link || '/images/no-image.png';
                        })()}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        sizes="128px"
                      />
                    </div>

                    {/* Product Name */}
                    <h3 className="font-yekan mb-2 line-clamp-2 font-medium text-sm text-gray-800">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="text-left">
                      {product.special_price && product.special_price > 0 ? (
                        <div>
                          <span className="font-yekan font-bold text-lg text-red-600">
                            {addCommas(Number(product.special_price))} تومان
                          </span>
                          <span className="font-yekan block text-sm text-gray-500 line-through">
                            {addCommas(Number(product.price))} تومان
                          </span>
                        </div>
                      ) : (
                        <span className="font-yekan font-bold text-lg text-gray-800">
                          {product.price && product.price > 0
                            ? addCommas(Number(product.price)) + ' تومان'
                            : ''}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className="mt-2">
                      <span
                        className={`font-yekan rounded-full px-2 py-1 font-reqular text-xs ${
                          product.is_in_stock === 1
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.is_in_stock === 1 ? 'موجود' : 'ناموجود'}
                      </span>
                    </div>
                  </div>

                  {/* Add Button */}
                  {currentProductIds.length < 4 && (
                    <div className="p-4 pt-0">
                      <Link
                        href={`/compare/${[...currentProductIds, product.id].join('/')}`}
                        onClick={() => onClose()}
                        className="font-yekan block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-reqular text-sm text-white transition-colors hover:bg-blue-700"
                      >
                        افزودن به مقایسه
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Loading indicator for next page */}
            {isFetchingNextPage && (
              <div className="py-4 text-center">
                <svg
                  className="mx-auto mb-2 h-6 w-6 animate-spin text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="font-yekan text-sm text-gray-500">در حال بارگذاری محصولات بیشتر...</p>
              </div>
            )}

            {/* End of results indicator */}
            {!hasNextPage && searchResults.length > 0 && (
              <div className="py-4 text-center">
                <p className="font-yekan text-sm text-gray-400">
                  {searchQuery && searchQuery.length >= 3
                    ? 'تمام نتایج جستجو نمایش داده شد'
                    : 'تمام محصولات نمایش داده شد'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </BaseDialog>
  );
};

export default SearchModal;
