'use client';
import { addCommas } from '@/lib/fun';

import React from 'react';
import ProductCard from './ProductCard';
import AddProductButton from './AddProductButton';
import AttributeSection from './AttributeSection';
import ProductInfoCard from './ProductInfoCard';

interface MobileComparisonViewProps {
  selectedProducts: any[];
  attributes: any[];
  onRemoveProduct: (productId: number) => void;
  onAddProduct: () => void;
  getProductPrice: (product: any) => number;
  getOriginalPrice: (product: any) => number | null;
  isInStock: (product: any) => boolean;
  getAttributeValue: (product: any, attributeTitle: string) => string;
}

const MobileComparisonView: React.FC<MobileComparisonViewProps> = ({
  selectedProducts,
  attributes,
  onRemoveProduct,
  onAddProduct,
  getProductPrice,
  getOriginalPrice,
  isInStock,
  getAttributeValue,
}) => {
  const priceIcon = (
    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
      />
    </svg>
  );

  const stockIcon = (
    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );

  const brandIcon = (
    <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );

  const attributeIcon = (
    <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  return (
    <div className="mt-6 space-y-4 lg:hidden">
      {/* Product Cards Header */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {selectedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onRemove={onRemoveProduct}
            showRemoveButton={true}
            size="mobile"
          />
        ))}

        {selectedProducts.length < 2 && <AddProductButton onClick={onAddProduct} size="mobile" />}
      </div>

      {/* Comparison Details */}
      {selectedProducts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h2 className="font-yekan font-semibold text-base text-gray-800">مقایسه مشخصات</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Price Section */}
            <AttributeSection title="قیمت" icon={priceIcon}>
              {selectedProducts.map((product) => (
                <ProductInfoCard key={product.id} product={product}>
                  {getOriginalPrice(product) ? (
                    <div>
                      <span className="font-yekan block font-bold text-sm text-red-600">
                        {addCommas(getProductPrice(product))} تومان
                      </span>
                      <span className="font-yekan font-light text-xs text-gray-500 line-through">
                        {addCommas(Number(getOriginalPrice(product)))} تومان
                      </span>
                    </div>
                  ) : (
                    <span className="font-yekan font-bold text-sm text-gray-800">
                      {addCommas(getProductPrice(product))} تومان
                    </span>
                  )}
                </ProductInfoCard>
              ))}
            </AttributeSection>

            {/* Stock Status Section */}
            <AttributeSection title="وضعیت موجودی" icon={stockIcon}>
              {selectedProducts.map((product) => (
                <ProductInfoCard key={product.id} product={product}>
                  <span
                    className={`font-yekan rounded-full px-3 py-1 font-medium text-xs ${
                      isInStock(product) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isInStock(product) ? 'موجود' : 'ناموجود'}
                  </span>
                </ProductInfoCard>
              ))}
            </AttributeSection>

            {/* Brand Section */}
            <AttributeSection title="برند" icon={brandIcon}>
              {selectedProducts.map((product) => (
                <ProductInfoCard key={product.id} product={product}>
                  <span className="font-yekan font-medium text-xs text-gray-800">
                    {product.brand?.title || 'نامشخص'}
                  </span>
                </ProductInfoCard>
              ))}
            </AttributeSection>

            {/* Product Attributes */}
            {attributes &&
              attributes.length > 0 &&
              attributes.map((attribute) => (
                <AttributeSection key={attribute.code} title={attribute.title} icon={attributeIcon}>
                  {selectedProducts.map((product) => (
                    <ProductInfoCard key={product.id} product={product}>
                      <span className="font-yekan font-medium text-xs text-gray-800">
                        {getAttributeValue(product, attribute.title)}
                      </span>
                    </ProductInfoCard>
                  ))}
                </AttributeSection>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileComparisonView;
