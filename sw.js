/* ELMD WORLD PWA — offline shell only. External shops/videos always use the internet. */
const CACHE_NAME = 'elmd-world-pwa-v1-1-20261116';
const PRECACHE = [
  './app.html', './index.html', './giggle-abc.html',
  './manifest.webmanifest', './pwa-icon.svg',
  './pwa-icon-192.png', './pwa-icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('elmd-world-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy))); }
        return response;
      }).catch(async () => {
        const cached = await caches.match(request, {ignoreSearch: true});
        if (cached) return cached;
        return (await caches.match('./app.html')) || Response.error();
      })
    );
    return;
  }
  event.respondWith(
    caches.match(request, {ignoreSearch: true}).then(cached => cached || fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
      }
      return response;
    }))
  );
});
