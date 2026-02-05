const CACHE_NAME = "qrhtml-v1";

const ASSETS = [
  "/",
  "/index.html",
  // "/overview.html",
  // "/qr-zip.html",
  // "/tiny-qr.html",
  // "/special.html",
  "/regsw.js",
  "/manifest.json",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin || event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) {
      const date = cached.headers.get('date');
      if (date && navigator.onLine) try {
        const resp = await fetch(event.request.url, {
          headers: {
            'if-modified-since': date
          }
        });
        if (resp.status === 304) return cached;
        await caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
        return resp;
      } catch {}
      return cached // fallback when offline
    }
    
    const resp = await fetch(event.request);
    await caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
    return resp;
  })());
});