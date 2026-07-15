const CACHE_NAME = 'vitalia-v230e2-main-split';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './reset.html',
  './config/observability.qa.json?v=vitalia-v230e2-main-split',
  './js/core/observability-boot.js?v=vitalia-v230e2-main-split',
  './js/core/supabase-client.js?v=vitalia-v230e2-main-split',
  './js/core/storage-keys.js?v=vitalia-v230e2-main-split',
  './js/core/errors.js?v=vitalia-v230e2-main-split',
  './js/core/i18n.js?v=vitalia-v230e2-main-split',
  './js/modules/sleep.js?v=vitalia-v230e2-main-split',
  './js/modules/supplements.js?v=vitalia-v230e2-main-split',
  './js/modules/notifications.js?v=vitalia-v230e2-main-split',
  './js/modules/labs.js?v=vitalia-v230e2-main-split',
  './js/modules/longevity.js?v=vitalia-v230e2-main-split',
  './js/modules/mental.js?v=vitalia-v230e2-main-split',
  './js/modules/microbiome.js?v=vitalia-v230e2-main-split',
  './js/modules/shopping.js?v=vitalia-v230e2-main-split',
  './js/modules/wearables.js?v=vitalia-v230e2-main-split',
  './js/modules/athlete.js?v=vitalia-v230e2-main-split',
  './js/modules/diagnostic.js?v=vitalia-v230e2-main-split',
  './js/modules/progress.js?v=vitalia-v230e2-main-split',
  './js/modules/coach.js?v=vitalia-v230e2-main-split',
  './js/core/app-core.js?v=vitalia-v230e2-main-split',
  './js/modules/recipes-data.js?v=vitalia-v230e2-main-split',
  './js/modules/auth.js?v=vitalia-v230e2-main-split',
  './js/core/router.js?v=vitalia-v230e2-main-split',
  './js/modules/screens.js?v=vitalia-v230e2-main-split',
  './js/core/boot.js?v=vitalia-v230e2-main-split',
  './styles/theme.css',
  './styles/base.css',
  './styles/components.css',
  './styles/utilities.css',
  './styles/bodytwin.css'
];

function forceUtf8Html(response) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return Promise.resolve(response);
  return response.blob().then(blob => {
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/html; charset=UTF-8');
    headers.set('Cache-Control', 'no-cache');
    return new Response(blob, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  });
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => caches.open(CACHE_NAME))
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'VITALIA_SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (!event.data || event.data.type !== 'VITALIA_CLEAR_CACHE') return;

  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => clients.forEach(client => client.postMessage({ type: 'VITALIA_CACHE_CLEARED' })))
  );
});

function isRecipeJsonRequest(url) {
  return /^receitas_(pt|en|es|ru)\.json$/.test(url.pathname.split('/').pop() || '');
}

function isRuntimeCachedAsset(url) {
  return isRecipeJsonRequest(url) || url.pathname.includes('/vendor/');
}

function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then(cache =>
    cache.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      }).catch(error => {
        if (cached) return cached;
        throw error;
      });
      return cached || network;
    })
  );
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isRuntimeCachedAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  if (request.mode === 'navigate' || acceptsHtml || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request, { cache: 'reload' })
        .then(response => forceUtf8Html(response))
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached ? forceUtf8Html(cached) : caches.match('./index.html').then(fallback => fallback ? forceUtf8Html(fallback) : fallback)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
