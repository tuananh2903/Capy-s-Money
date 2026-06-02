const CACHE_NAME = "capy-money-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  (event as any).waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  (event as any).waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch resources
self.addEventListener("fetch", (event) => {
  const fetchEvent = event as any;
  // Bỏ qua cache các request tới Supabase / external API
  if (fetchEvent.request.url.includes("supabase.co") || fetchEvent.request.url.includes("accounts.google.com")) {
    return;
  }
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(fetchEvent.request).then((response) => {
        // Chỉ cache các request thành công và cùng origin
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(fetchEvent.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Fallback offline (nếu request trang chính)
        if (fetchEvent.request.mode === 'navigate') {
          return caches.match('/index.html') as Promise<Response>;
        }
      });
    })
  );
});
