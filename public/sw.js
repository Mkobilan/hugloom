// Service Worker for HugLoom PWA
const CACHE_NAME = 'hugloom-v1';

// Install event - activate immediately
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip caching for chrome-extension and other non-http(s) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful responses (status 200)
                // Skip partial responses (206) and redirects
                if (response.status === 200) {
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }

                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request);
            })
    );
});
