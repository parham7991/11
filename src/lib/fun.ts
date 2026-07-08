import { StaticImageData } from 'next/image';
import { AWS_BUCKET, BASE_URL_IMAGE, payload_key, secret_key } from './variable';
import jwt from 'jsonwebtoken';

// افزودن فاصله بین حروف camelCase
export function addSpacesToCamelCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// اضافه کردن کاما به اعداد
export const addCommas = (num: number | string) => {
  if (num.toString() === '0') {
    return '0';
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// حذف حروف و علائم غیر عددی
export const removeNumNumeric = (num: number | string | boolean) => {
  if (num?.toString() === '0') {
    return '0';
  }
  return num ? num.toString().replace(/[^0-9]/g, '') : '0';
};

// تایپ دسته‌بندی‌ها
interface Item {
  id: number;
  name: string;
  position?: number;
  sub_category?: Item[];
  status?: boolean;
}

interface TransformedItem {
  id: number;
  title: string;
  url: string;
  position?: number;
  is_parent?: boolean;
  from_parent?: number;
  children?: TransformedItem[];
  status?: boolean;
}

// تبدیل داده‌ها به ساختار موردنیاز
export function transformData(data: Item[]): TransformedItem[] {
  return data.map((item) => {
    const children: TransformedItem[] | undefined = item.sub_category?.flatMap((child) => {
      const transformedChild: TransformedItem = {
        id: child.id,
        title: child.name,
        position: child.position,
        url: `/category/${child.id}`,
        is_parent: true,
        status: child.status,
      };

      const grandChildren =
        child.sub_category?.map((grandChild) => ({
          id: grandChild.id,
          title: grandChild.name,
          position: grandChild.position,
          status: grandChild.status,
          url: `/category/${grandChild.id}`,
        })) || [];

      return [transformedChild, ...grandChildren];
    });

    return {
      id: item.id,
      title: item.name,
      url: `/category/${item.id}`,
      position: item.position,
      children,
      status: item.status,
    };
  });
}
export const getFinalSrc = (src?: string | StaticImageData): string | StaticImageData | null => {
  if (!src) return null;

  const BASE_URL = `${BASE_URL_IMAGE}/${AWS_BUCKET}`;

  if (typeof src === 'string') {
    // جایگزینی دامنه media.magenfa.ir
const replacedSrc = src.replace(/media\.magenfa\.ir/gi, 'media.iwcs.ir');

    if (replacedSrc.startsWith("http")) {
      return replacedSrc;
    }

    return `${BASE_URL}/${replacedSrc.replace(/^\/+/, "")}`;
  }

  return src;
};




// ساخت توکن JWT
export const generateToken = () => {
  return jwt.sign({ key: payload_key }, secret_key, { expiresIn: '7d' });
};

// محاسبه درصد تخفیف
export const discountCalculation = (
  special_price: string | number,
  price: string | number
): number => {
  const originalPrice = Number(price);
  const discountedPrice = Number(special_price);

  if (
    isNaN(originalPrice) ||
    isNaN(discountedPrice) ||
    originalPrice <= 0 ||
    discountedPrice <= 0 ||
    discountedPrice >= originalPrice
  ) {
    return 0;
  }

  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discount);
};

// تبدیل ارقام فارسی به انگلیسی
export function toEnglishDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

// تعریف شیء عمومی با مقادیر تایپ شده
type AnyObject = Record<string, string | number | boolean | null | undefined>;

// حذف فیلدهای خالی از یک شیء
export function removeEmptyFields<T extends AnyObject>(obj: T): Partial<T> {
  const cleanedEntries = Object.entries(obj)
    .filter(([n, value]) => {
      console.log(n);
      return value !== '' && value !== null && value !== undefined;
    })
    // @ts-expect-error error
    .map<[string, string | number | boolean]>(([key, value]) => {
      if (typeof value === 'string') {
        value = toEnglishDigits(value);
      }
      return [key, value];
    });

  return Object.fromEntries(cleanedEntries) as Partial<T>;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
