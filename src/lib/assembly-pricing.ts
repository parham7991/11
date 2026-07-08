type PriceLike = number | string | null | undefined;

type PriceObject = {
  old_price?: PriceLike;
  price?: PriceLike;
  special_price?: PriceLike;
  final_price?: PriceLike;
  discount_price?: PriceLike;
  sale_price?: PriceLike;
  original_price?: PriceLike;
  regular_price?: PriceLike;
};

export type AssemblyPriceItem = {
  price?: PriceLike | PriceObject;
  product_price?: PriceLike | PriceObject;
  old_price?: PriceLike;
  original_price?: PriceLike;
  regular_price?: PriceLike;
  special_price?: PriceLike;
  discount_price?: PriceLike;
  final_price?: PriceLike;
  sale_price?: PriceLike;
  qty?: PriceLike;
  quantity?: PriceLike;
  count?: PriceLike;
  product?: AssemblyPriceItem;
  [key: string]: unknown;
};

export type AssemblyPricing = {
  originalTotal: number;
  finalTotal: number;
};

export const toPriceNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const normalized = value
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
      .replace(/[,٬\s]/g, '');

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const firstPositivePrice = (...values: unknown[]) => {
  for (const value of values) {
    const numberValue = toPriceNumber(value);
    if (numberValue > 0) return numberValue;
  }

  return 0;
};

const asPriceObject = (value: unknown): PriceObject => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as PriceObject;
  }

  return {};
};

export const getAssemblyItemOriginalPrice = (item: AssemblyPriceItem) => {
  const price = asPriceObject(item?.price);
  const productPrice = asPriceObject(item?.product_price);
  const nestedProduct = item?.product || {};
  const nestedPrice = asPriceObject(nestedProduct?.price);
  const nestedProductPrice = asPriceObject(nestedProduct?.product_price);

  return firstPositivePrice(
    item?.old_price,
    item?.original_price,
    item?.regular_price,
    price?.old_price,
    price?.original_price,
    price?.regular_price,
    productPrice?.old_price,
    productPrice?.original_price,
    productPrice?.regular_price,
    nestedProduct?.old_price,
    nestedProduct?.original_price,
    nestedProduct?.regular_price,
    nestedPrice?.old_price,
    nestedPrice?.original_price,
    nestedPrice?.regular_price,
    nestedProductPrice?.old_price,
    nestedProductPrice?.original_price,
    nestedProductPrice?.regular_price,
    typeof item?.price === 'object' ? undefined : item?.price,
    typeof item?.product_price === 'object' ? undefined : item?.product_price,
    typeof nestedProduct?.price === 'object' ? undefined : nestedProduct?.price,
    typeof nestedProduct?.product_price === 'object' ? undefined : nestedProduct?.product_price,
    price?.price,
    productPrice?.price,
    nestedPrice?.price,
    nestedProductPrice?.price
  );
};

export const getAssemblyItemFinalPrice = (item: AssemblyPriceItem) => {
  const price = asPriceObject(item?.price);
  const productPrice = asPriceObject(item?.product_price);
  const nestedProduct = item?.product || {};
  const nestedPrice = asPriceObject(nestedProduct?.price);
  const nestedProductPrice = asPriceObject(nestedProduct?.product_price);
  const originalPrice = getAssemblyItemOriginalPrice(item);

  return (
    firstPositivePrice(
      item?.special_price,
      item?.discount_price,
      item?.final_price,
      item?.sale_price,
      price?.special_price,
      price?.discount_price,
      price?.final_price,
      price?.sale_price,
      price?.price,
      productPrice?.special_price,
      productPrice?.discount_price,
      productPrice?.final_price,
      productPrice?.sale_price,
      productPrice?.price,
      nestedProduct?.special_price,
      nestedProduct?.discount_price,
      nestedProduct?.final_price,
      nestedProduct?.sale_price,
      nestedPrice?.special_price,
      nestedPrice?.discount_price,
      nestedPrice?.final_price,
      nestedPrice?.sale_price,
      nestedPrice?.price,
      nestedProductPrice?.special_price,
      nestedProductPrice?.discount_price,
      nestedProductPrice?.final_price,
      nestedProductPrice?.sale_price,
      nestedProductPrice?.price,
      typeof item?.price === 'object' ? undefined : item?.price,
      typeof item?.product_price === 'object' ? undefined : item?.product_price
    ) || originalPrice
  );
};

export const getAssemblyItemQty = (item: AssemblyPriceItem) => {
  const qty = firstPositivePrice(item?.qty, item?.quantity, item?.count);
  return qty > 0 ? qty : 1;
};

export const calculateAssemblyPricing = (items?: AssemblyPriceItem[]): AssemblyPricing | null => {
  if (!Array.isArray(items) || items.length === 0) return null;

  const pricing = items.reduce<AssemblyPricing>(
    (acc, item) => {
      const qty = getAssemblyItemQty(item);
      const originalPrice = getAssemblyItemOriginalPrice(item);
      const finalPrice = getAssemblyItemFinalPrice(item);

      return {
        originalTotal: acc.originalTotal + originalPrice * qty,
        finalTotal: acc.finalTotal + finalPrice * qty,
      };
    },
    { originalTotal: 0, finalTotal: 0 }
  );

  if (pricing.originalTotal <= 0 && pricing.finalTotal <= 0) return null;

  return {
    originalTotal: pricing.originalTotal || pricing.finalTotal,
    finalTotal: pricing.finalTotal || pricing.originalTotal,
  };
};

export const formatPriceWithComma = (value: number) => Math.round(value).toLocaleString('en-US');
