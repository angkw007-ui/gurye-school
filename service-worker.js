// 구례중 주간계획 Service Worker v1.0
const CACHE_NAME = 'gurye-middle-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json'
];

// 설치: 핵심 파일 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 요청 처리: Network First (온라인 우선, 오프라인 시 캐시)
self.addEventListener('fetch', (event) => {
  // GAS API 요청은 캐시하지 않음
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공 시 캐시 업데이트
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 오프라인 시 캐시에서 반환
        return caches.match(event.request);
      })
  );
});
