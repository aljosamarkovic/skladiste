const CACHE_NAME = 'bascarsija-skladiste-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(()=>{})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const fresh = await fetch(req);
        // cache same-origin basic responses
        if (fresh && fresh.ok && fresh.type === 'basic') cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        // fallback to app shell for navigations
        if (req.mode === 'navigate') {
          const shell = await cache.match('./index.html') || await cache.match('./');
          if (shell) return shell;
        }
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })()
  );
});
