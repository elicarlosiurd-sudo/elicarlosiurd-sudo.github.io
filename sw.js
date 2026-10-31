importScripts('./release.js', './precache.js');
const CACHE_NAME = self.VITALIA_APP_VERSION;
const APP_SHELL = self.VITALIA_PRECACHE;
const ROOT = new URL('./', self.location.href);
const SHELL_PATHS = new Set(APP_SHELL.map(path => new URL(path, ROOT).pathname));
function cacheKey(request) {
  const url = new URL(typeof request === 'string' ? request : request.url, ROOT);
  if (url.pathname === ROOT.pathname) url.pathname += 'index.html';
  url.search = '?v=' + CACHE_NAME;
  return url.href;
}
self.addEventListener('install', event => {
  // Preserve the old release if downloading the new shell fails.
  event.waitUntil((async () => {
    const responses = await Promise.all(APP_SHELL.map(async path => {
      const response = await fetch(new URL(path, ROOT), {cache:'no-store'});
      if (!response.ok) throw new Error('Release asset unavailable');
      const bytes = await response.clone().arrayBuffer();
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte => byte.toString(16).padStart(2,'0')).join('');
      if (digest !== self.VITALIA_INTEGRITY[path]) throw new Error('Release asset integrity mismatch');
      return [path,response];
    }));
    // Verify the whole release before writing any assets, including same-version checks.
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(responses.map(([path,response]) => cache.put(new URL(path,ROOT),response)));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('vitalia-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()).then(async () => {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.postMessage({ type: 'VITALIA_RELEASE_READY', version: CACHE_NAME }));
  }));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'VITALIA_SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'VITALIA_CLEAR_CACHE') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('vitalia-')).map(key => caches.delete(key)))).then(async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach(client => client.postMessage({ type: 'VITALIA_CACHE_CLEARED' }));
    }));
  }
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin) return;
  const navigation = request.mode === 'navigate';
  // Only public application assets; never API responses or user data.
  if (!navigation && !SHELL_PATHS.has(url.pathname) && !url.pathname.includes('/vendor/') && !url.pathname.includes('/assets/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const key = navigation && !SHELL_PATHS.has(url.pathname) ? cacheKey('./index.html') : cacheKey(request);
    const cached = await cache.match(key);
    if (cached) return cached;
    try {
      const response = await fetch(request, { cache: 'no-store' });
      if (response.ok && response.type !== 'opaque') await cache.put(key, response.clone());
      return response;
    } catch (_) {
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
