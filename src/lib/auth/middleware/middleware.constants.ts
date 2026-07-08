export const pages = [
  '/',
  '/product',
  '/category',
  '/profile',
  '/cart',
  '/checkout',
  '/auth',
  '/result',
  '/category-list',
  '/mags',
  '/mag',
  '/compare',
  '/brand',
  '/short-news',
  '/tags',
  '/assemble',
  '/assemble-online',
];

export const noIndexPaths = [
  '/admin',
  '/auth',
  '/search',
  '/shop',
  '*/page/*',
  '/category-list',
  '/compare',
];

export const gonePaths = [
  '/product-tag/',
  '/shop/',
  '/benchmark/',
  '/brands/',
  '/برند/',
  '/%D8%A8%D8%B1%D9%86%D8%AF/',
] as string[];

export const protectedRoute = ['/checkout', '/admin', '/profile'];
