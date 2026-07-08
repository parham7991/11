import { Product } from '@/types/Home';
import { useState } from 'react';

const ProductAttributesTable = ({ product }: { product: Product }) => {
  const [showAll, setShowAll] = useState(false);

  // فیلتر ویژگی‌ها: حذف "برچسب محصول" و فیلتر محصولات اسمبل شده
  let filteredAttributes = product?.attributes?.filter((attr) => attr.title !== 'برچسب محصول');

  // فیلتر ویژگی‌ها برای حذف مقادیر عددی اگر محصول اسمبل شده باشد
  filteredAttributes =
    product?.attribute_name === 'کیس های اسمبل شده'
      ? filteredAttributes?.filter((attr) => isNaN(Number(attr.value)))
      : filteredAttributes;

  const visibleAttributes = showAll ? filteredAttributes : filteredAttributes?.slice(0, 5);

  return (
    <div className="w-full">
      <table className="product-attributes shop_attributes mt-5 w-full lg:mt-10">
        <tbody>
          {visibleAttributes?.map((attribute, idx) => (
            <tr
              key={idx}
              className={`product-attributes-item product-attributes-item--attribute overflow-hidden rounded-lg ${
                idx % 2 === 0 ? 'bg-gray-100' : ''
              } rounded-lg`}
            >
              <th className="product-attributes-item__label w-[200px] p-2 py-3 text-start align-top font-medium text-sm text-zinc-400 lg:py-4 lg:text-[14px]">
                <span className="wd-attr-name">{attribute.title}</span>
              </th>
              <td className="product-attributes-item__value p-2 py-3 font-light text-[14px] text-zinc-900 lg:py-4">
                {attribute.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredAttributes?.length > 5 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="font-medium text-sm text-blue-600 hover:underline"
          >
            {showAll ? 'مشاهده کمتر' : 'مشاهده بیشتر'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductAttributesTable;
