const CACHE_NAME = "nlptstats-cache-v2";
const STATIC_ASSETS = [
  "/favicon.ico",
  "/manifest.json",
  "/icons/nlpt-192.png",
  "/icons/nlpt-512.png",
];

// Install event: Precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Activate the new service worker immediately
});

// Fetch event: Serve cached assets & API data
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Ignore requests to external APIs
  if (!requestUrl.origin.includes(self.location.origin)) {
    return;
  }

  // Use Network-First for API requests (cache API responses)
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone()); // Cache API response
            return response;
          });
        })
        .catch(() => caches.match(event.request)) // Fallback to cached API response
    );
    return;
  }

  // Use Cache-First strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request)
          .then((response) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
          .catch(() => caches.match("/offline.html")) // Show offline page if network fails
      );
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/icon.png",
      badge: "/badge.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("https://nlptstats.com"));
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim(); // Ensure clients use the new service worker
});
