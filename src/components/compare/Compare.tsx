'use client';

import React, { useState } from 'react';
import SearchModal from '@/components/compare/SearchModal';
import DesktopComparisonTable from '@/components/compare/DesktopComparisonTable';
import MobileComparisonView from '@/components/compare/MobileComparisonView';

interface CompareProductsProps {
  selectedProducts: any[];
  attributes: any[];
  allProducts: any[];
  currentProductIds: number[];
}
const Compare = ({
  selectedProducts,
  attributes,
  allProducts,
  currentProductIds,
}: CompareProductsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getProductName = (product: any) => {
    return product.name || 'نامشخص';
  };

  const getProductPrice = (product: any) => {
    return product.special_price || product.price;
  };

  const getOriginalPrice = (product: any) => {
    if (product.special_price && product.price > product.special_price) {
      return product.price;
    }
    return null;
  };

  const isInStock = (product: any) => {
    return product.is_in_stock !== 0;
  };

  // Get attribute value for a specific product and attribute
  const getAttributeValue = (product: any, attributeTitle: string) => {
    const attr = product.attributes?.find((a: any) => a.title === attributeTitle);
    return attr ? attr.value : '-';
  };

  // Handle product selection from modal
  const handleProductSelect = (selectedProduct: any) => {
    // Redirect to new comparison URL with the selected product
    const newProductIds = [selectedProduct.id, ...currentProductIds];
    const newUrl = `/compare/${newProductIds.join('/')}`;
    window.location.href = newUrl;
  };

  // Handle product removal
  const handleRemoveProduct = (productId: number) => {
    const remainingProductIds = currentProductIds.filter((id) => id !== productId);

    if (remainingProductIds.length === 0) {
      // If no products left, redirect to home or show message
      window.location.href = '/';
    } else {
      // Redirect to new comparison URL without the removed product
      const newUrl = `/compare/${remainingProductIds.join('/')}`;
      window.location.href = newUrl;
    }
  };

  if (selectedProducts.length === 0) {
    return (
      <div className="container_page mx-auto mt-10">
        <div className="py-8 text-center">
          <p className="font-yekan text-gray-500">محصولی برای مقایسه یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container_page mx-auto lg:mt-10">
      <DesktopComparisonTable
        selectedProducts={selectedProducts}
        attributes={attributes}
        onRemoveProduct={handleRemoveProduct}
        onAddProduct={() => setIsModalOpen(true)}
        getProductPrice={getProductPrice}
        getOriginalPrice={getOriginalPrice}
        isInStock={isInStock}
        getAttributeValue={getAttributeValue}
      />

      <MobileComparisonView
        selectedProducts={selectedProducts}
        attributes={attributes}
        onRemoveProduct={handleRemoveProduct}
        onAddProduct={() => setIsModalOpen(true)}
        getProductPrice={getProductPrice}
        getOriginalPrice={getOriginalPrice}
        isInStock={isInStock}
        getAttributeValue={getAttributeValue}
      />

      {isModalOpen && (
        <SearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectProduct={handleProductSelect}
          currentProductIds={currentProductIds}
        />
      )}
    </div>
  );
};

export default Compare;
