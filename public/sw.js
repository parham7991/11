/* آفلند — Service Worker
 * استراتژی:
 *  - navigation ها: network-first (با fallback به کش و در نهایت صفحه آفلاین)
 *  - دارایی‌های استاتیک (_next/static, icons, images): cache-first
 *  - مسیرهای /api: فقط شبکه (بدون کش — اطلاعات کاربر/سبد خرید همیشه تازه)
 *  - cross-origin: دست‌نخورده رد می‌شود
 */

const VERSION = 'v1';
const CACHE_PREFIX = 'offland-';
const STATIC_CACHE = CACHE_PREFIX + 'static-' + VERSION;
const PAGE_CACHE = CACHE_PREFIX + 'pages-' + VERSION;
const RUNTIME_CACHE = CACHE_PREFIX + 'runtime-' + VERSION;
const ACTIVE_CACHES = [STATIC_CACHE, PAGE_CACHE, RUNTIME_CACHE];

const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [OFFLINE_URL, '/', '/pwa'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // allSettled: اگر یک آدرس در دسترس نبود، نصب کلاً شکست نخورد
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !ACTIVE_CACHES.includes(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    caches.open(RUNTIME_CACHE).then((cache) => {
      data.urls.forEach((url) => cache.add(url).catch(() => undefined));
    });
  }
});

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      const copy = response.clone();
      caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return Response.error();
  }
}

function handleStatic(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => cached);
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // cross-origin
  if (url.pathname.startsWith('/api/')) return; // همیشه شبکه

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(handleStatic(request));
    return;
  }

  // بقیه درخواست‌ها: network-first با fallback کش
  event.respondWith(handleNavigation(request));
});
