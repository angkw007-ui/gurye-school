// =====================================================
// 구례중 주간계획 - 서비스 워커 (v4)
// =====================================================

// 캐시 이름을 변경하여 서비스 워커 업데이트를 트리거합니다.
// 코드를 수정할 때마다 버전을 올려주세요 (예: v4 -> v5)
const CACHE_NAME = 'gurye-middle-v4';

// 캐시할 핵심 로컬 리소스 목록입니다.
// 앱의 기본 뼈대를 구성하는 파일들입니다.
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 1. 서비스 워커 설치 (Install)
self.addEventListener('install', event => {
  console.log('[Service Worker] 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 핵심 리소스 캐싱:', LOCAL_ASSETS);
        // addAll은 하나라도 실패하면 전체가 실패하므로, 개별적으로 처리하여 안정성을 높일 수 있습니다.
        // 하지만 현재 구조에서는 addAll도 충분합니다.
        return cache.addAll(LOCAL_ASSETS);
      })
      .catch(err => {
        // 설치 단계에서 캐싱 실패는 심각한 문제일 수 있으므로 로그를 남깁니다.
        console.error('[Service Worker] 캐시 열기 또는 파일 추가 실패:', err);
      })
  );
  // 새로운 서비스 워커가 설치되면 즉시 활성화되도록 합니다.
  self.skipWaiting();
});

// 2. 서비스 워커 활성화 (Activate)
self.addEventListener('activate', event => {
  console.log('[Service Worker] 활성화 중...');
  event.waitUntil(
    caches.keys().then(keys => {
      // 현재 캐시 이름(CACHE_NAME)과 다른 모든 '구버전' 캐시를 삭제합니다.
      const oldCaches = keys.filter(key => key !== CACHE_NAME);
      if (oldCaches.length > 0) {
        console.log('[Service Worker] 구버전 캐시 삭제:', oldCaches);
      }
      return Promise.all(oldCaches.map(key => caches.delete(key)));
    })
  );
  // 서비스 워커가 페이지 제어권을 즉시 가져오도록 합니다.
  self.clients.claim();
});

// 3. 네트워크 요청 가로채기 (Fetch)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 구글 스크립트 API 요청은 항상 네트워크를 통해 최신 데이터를 가져옵니다. (캐시 안함)
  // CORS 문제 등을 피하기 위해 외부 CDN, 폰트 등도 네트워크 우선으로 처리합니다.
  if (url.hostname === 'script.google.com' || 
      url.hostname === 'script.googleusercontent.com' ||
      url.hostname.endsWith('googleapis.com') ||
      url.hostname.startsWith('cdn.') ||
      url.hostname.startsWith('fonts.')) {
    // 네트워크 요청으로 바로 응답합니다.
    event.respondWith(fetch(event.request));
    return;
  }

  // 그 외의 모든 로컬 리소스 요청은 '캐시 우선' 전략을 사용합니다.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 캐시에 응답이 있으면 즉시 반환합니다.
      if (cachedResponse) {
        return cachedResponse;
      }
      // 캐시에 없으면 네트워크로 요청하고, 성공하면 캐시에 저장하지는 않습니다. (필요 시 추가 가능)
      // 오프라인 상태에서 캐시에 없는 리소스 요청 시 실패할 수 있습니다.
      return fetch(event.request);
    })
  );
});
