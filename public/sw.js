// Service Worker for HugLoom PWA
const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `hugloom-v${CACHE_VERSION}`;

// Install event - activate immediately
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...', CACHE_VERSION);
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Message handler for update requests
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('Service Worker: Received SKIP_WAITING message');
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
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

    // Skip caching for POST, PUT, DELETE requests (only cache GET requests)
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
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
