const CACHE_NAME = 'tahajjud-v1.1.4-offline';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './assets/css/styles.css?v=1.1.3',
  './assets/js/app.js?v=1.1.3',
  './assets/js/config.json',
  './data/benefits.json',
  './data/adhkar.json',
  './data/learning.json',
  './data/resources.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات التي لا تبدأ بـ http لتجنب مشاكل إضافات المتصفح و Live Server
  if (!event.request.url.startsWith('http')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // تخزين أي بيانات يتم جلبها (مثل سور القرآن) تلقائياً لتعمل بدون نت لاحقاً
        caches.open(CACHE_NAME).then((cache) => { cache.put(event.request, networkResponse.clone()); });
        return networkResponse;
      }).catch(() => { /* صمت عند عدم وجود إنترنت */ });
      
      // إرجاع النسخة المخزنة فوراً إن وجدت، وإلا انتظر تحميلها
      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
