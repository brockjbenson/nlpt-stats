const CACHE_NAME = "nlptstats-cache-v1";
const urlsToCache = [
  "/",
  "/members",
  "/poy",
  "/nlpi",
  "/stats/2025",
  "/_next/static/",
];

// Install event: Cache specified pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event: Prioritize network for navigation requests
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ensure all navigation requests go to the network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.redirected) {
            return Response.redirect(response.url, response.status);
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For non-navigation requests, check cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request);
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
  console.log("Notification click received.");
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
});
