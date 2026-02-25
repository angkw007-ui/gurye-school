const CACHE_NAME = 'gurye-middle-v3';

// 캐시할 로컬 파일만 (외부 CDN 제외 → CORS 오류 방지)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 외부 URL(http/https)은 캐시하지 않음
      return cache.addAll(LOCAL_ASSETS).catch(err => {
        console.log('일부 파일 캐시 실패 (무시):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // 외부 URL(CDN, API 등)은 캐시 없이 네트워크 직접 요청
  if (url.startsWith('https://cdn.') || 
      url.startsWith('https://fonts.') || 
      url.includes('googleapis.com') ||
      url.includes('google.com') ||
      url.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 로컬 파일은 캐시 우선
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
