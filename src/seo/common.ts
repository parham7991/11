import type { Robots } from 'next/dist/lib/metadata/types/metadata-types';

export const getRobotsMeta = (robots?: Robots): Robots | undefined => {
  if (process.env.APP_ENV !== 'production' && process.env.APP_ENV !== 'development') {
    return {
      index: false,
      follow: false,
    };
  }
  if (robots) {
    return robots;
  } else {
    return {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': '-1',
    };
  }
};

export const normalizePersianText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/&zwnj;/gi, ' ')
    .replace(/\u200C/g, ' ')
    .replace(/\u200D/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const normalizeUrl = (
  baseUrl: string,
  path: string | null | undefined = undefined
): string => {
  if (!path) return baseUrl;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const pathWithoutTrailingSlash =
    cleanPath.endsWith('/') && cleanPath !== '/' ? cleanPath.slice(0, -1) : cleanPath;
  return pathWithoutTrailingSlash ? `${baseUrl}/${pathWithoutTrailingSlash}` : baseUrl;
};

/**
 * جایگزینی embedded objects با HTML5 alternatives
 * این تابع تگ‌های <object>, <embed>, <applet> را حذف یا جایگزین می‌کند
 */
export const replaceEmbeddedObjects = (html: string | null | undefined): string => {
  if (!html) return '';

  let cleanedHtml = html;

  // حذف تگ <applet> (deprecated در HTML5)
  cleanedHtml = cleanedHtml.replace(/<applet[^>]*>[\s\S]*?<\/applet>/gi, '');

  // جایگزینی <object> با HTML5 alternatives
  // اگر object حاوی تصویر است، با <img> جایگزین می‌شود
  cleanedHtml = cleanedHtml.replace(
    /<object[^>]*data=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg))["'][^>]*>[\s\S]*?<\/object>/gi,
    (match, imageUrl) => {
      // استخراج alt text اگر وجود دارد
      const altMatch = match.match(/alt=["']([^"']+)["']/i);
      const alt = altMatch ? altMatch[1] : '';
      return `<img src="${imageUrl}" alt="${alt}" loading="lazy" decoding="async" />`;
    }
  );

  // جایگزینی <object> با ویدیو با <video>
  cleanedHtml = cleanedHtml.replace(
    /<object[^>]*data=["']([^"']+\.(mp4|webm|ogg))["'][^>]*>[\s\S]*?<\/object>/gi,
    (match, videoUrl) => {
      return `<video src="${videoUrl}" controls preload="metadata"><p>مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.</p></video>`;
    }
  );

  // جایگزینی <object> با صدا با <audio>
  cleanedHtml = cleanedHtml.replace(
    /<object[^>]*data=["']([^"']+\.(mp3|wav|ogg|m4a))["'][^>]*>[\s\S]*?<\/object>/gi,
    (match, audioUrl) => {
      return `<audio src="${audioUrl}" controls preload="metadata"><p>مرورگر شما از پخش صدا پشتیبانی نمی‌کند.</p></audio>`;
    }
  );

  // حذف سایر <object> tags که نمی‌توانند جایگزین شوند
  cleanedHtml = cleanedHtml.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');

  // جایگزینی <embed> با تصویر با <img>
  cleanedHtml = cleanedHtml.replace(
    /<embed[^>]*src=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg))["'][^>]*>/gi,
    (match, imageUrl) => {
      const altMatch = match.match(/alt=["']([^"']+)["']/i);
      const alt = altMatch ? altMatch[1] : '';
      return `<img src="${imageUrl}" alt="${alt}" loading="lazy" decoding="async" />`;
    }
  );

  // جایگزینی <embed> با ویدیو با <video>
  cleanedHtml = cleanedHtml.replace(
    /<embed[^>]*src=["']([^"']+\.(mp4|webm|ogg))["'][^>]*>/gi,
    (match, videoUrl) => {
      return `<video src="${videoUrl}" controls preload="metadata"><p>مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.</p></video>`;
    }
  );

  // جایگزینی <embed> با صدا با <audio>
  cleanedHtml = cleanedHtml.replace(
    /<embed[^>]*src=["']([^"']+\.(mp3|wav|ogg|m4a))["'][^>]*>/gi,
    (match, audioUrl) => {
      return `<audio src="${audioUrl}" controls preload="metadata"><p>مرورگر شما از پخش صدا پشتیبانی نمی‌کند.</p></audio>`;
    }
  );

  // حذف سایر <embed> tags که نمی‌توانند جایگزین شوند
  cleanedHtml = cleanedHtml.replace(/<embed[^>]*>/gi, '');

  return cleanedHtml;
};

/**
 * Minify HTML: حذف whitespace و کامنت‌ها برای کاهش اندازه فایل
 */
export const minifyHTML = (html: string | null | undefined): string => {
  if (!html) return '';

  let minified = html;

  // حذف کامنت‌های HTML
  minified = minified.replace(/<!--[\s\S]*?-->/g, '');

  // حذف whitespace اضافی بین تگ‌ها
  minified = minified.replace(/>\s+</g, '><');

  // حذف whitespace اضافی در ابتدا و انتها
  minified = minified.trim();

  // حذف خطوط خالی
  minified = minified.replace(/\n\s*\n/g, '\n');

  return minified;
};
