'use client';
import { addCommas } from '@/lib/fun';

import React from 'react';
import ProductCard from './ProductCard';
import AddProductButton from './AddProductButton';

interface DesktopComparisonTableProps {
  selectedProducts: any[];
  attributes: any[];
  onRemoveProduct: (productId: number) => void;
  onAddProduct: () => void;
  getProductPrice: (product: any) => number;
  getOriginalPrice: (product: any) => number | null;
  isInStock: (product: any) => boolean;
  getAttributeValue: (product: any, attributeTitle: string) => string;
}

const DesktopComparisonTable: React.FC<DesktopComparisonTableProps> = ({
  selectedProducts,
  attributes,
  onRemoveProduct,
  onAddProduct,
  getProductPrice,
  getOriginalPrice,
  isInStock,
  getAttributeValue,
}) => {
  return (
    <div className="mt-8 hidden lg:block">
      {selectedProducts.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="font-yekan w-[120px] px-4 py-4 text-right font-medium text-sm text-gray-800">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <svg
                        className="h-8 w-8 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-xs">مشخصات</span>
                    </div>
                  </th>
                  {selectedProducts.map((product) => (
                    <th
                      key={product.id}
                      className="font-yekan w-[200px] px-4 py-4 text-center font-medium text-gray-700"
                    >
                      <ProductCard
                        product={product}
                        onRemove={onRemoveProduct}
                        showRemoveButton={true}
                        size="desktop"
                      />
                    </th>
                  ))}
                  {selectedProducts.length < 4 && (
                    <th className="font-yekan w-[200px] px-4 py-4 text-center font-medium text-gray-700">
                      <AddProductButton onClick={onAddProduct} size="desktop" />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Price Row */}
                <tr className="bg-white">
                  <td className="font-yekan w-[120px] px-4 py-4 font-medium text-sm text-gray-800">
                    قیمت
                  </td>
                  {selectedProducts.map((product) => (
                    <td
                      key={product.id}
                      className="font-yekan min-w-[200px] bg-white px-4 py-4 text-center text-gray-600"
                    >
                      <div className="relative rounded-xl bg-white p-4 shadow-sm">
                        {getOriginalPrice(product) ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-yekan font-medium text-sm text-black">
                              {addCommas(getProductPrice(product))}
                            </span>
                            <span className="font-yekan font-light text-xs text-gray-500 line-through">
                              {addCommas(Number(getOriginalPrice(product)))}
                            </span>
                            <span className="font-yekan font-medium text-xs text-black">تومان</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-yekan font-medium text-sm text-black">
                              {addCommas(getProductPrice(product))}
                            </span>
                            <span className="font-yekan font-medium text-xs text-black">تومان</span>
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                  {selectedProducts.length < 4 && <td className="px-4 py-4"></td>}
                </tr>

                {/* Stock Status Row */}
                <tr className="bg-gray-50">
                  <td className="font-yekan w-[120px] px-4 py-4 font-medium text-sm text-gray-800">
                    وضعیت موجودی
                  </td>
                  {selectedProducts.map((product) => (
                    <td
                      key={product.id}
                      className="font-yekan min-w-[200px] bg-white px-4 py-4 text-center text-gray-600"
                    >
                      <div className="relative rounded-xl bg-white p-4 shadow-sm">
                        <span
                          className={`font-yekan rounded px-3 py-1 font-medium text-xs ${
                            isInStock(product)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isInStock(product) ? 'موجود' : 'ناموجود'}
                        </span>
                      </div>
                    </td>
                  ))}
                  {selectedProducts.length < 4 && <td className="px-4 py-4"></td>}
                </tr>

                {/* Product Attributes */}
                {attributes &&
                  attributes.length > 0 &&
                  attributes.map((attribute, index) => (
                    <tr
                      key={attribute.code}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="font-yekan w-[120px] px-4 py-4 font-medium text-sm text-gray-800">
                        {attribute.title}
                      </td>
                      {selectedProducts.map((product) => (
                        <td
                          key={product.id}
                          className="font-yekan min-w-[200px] bg-white px-4 py-4 text-center text-gray-600"
                        >
                          <div className="relative rounded-xl bg-white p-4 shadow-sm">
                            <span className="font-yekan font-light text-xs text-gray-700">
                              {getAttributeValue(product, attribute.title)}
                            </span>
                          </div>
                        </td>
                      ))}
                      {selectedProducts.length < 4 && <td className="px-4 py-4"></td>}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopComparisonTable;
