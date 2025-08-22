// Define a name for the cache
const CACHE_NAME = 'rov-checklist-cache-v1';

// List all the files and assets you want to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/home.html',
  '/styles.css',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

// 1. Installation: Open a cache and add the files to it
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Fetch: Intercept network requests
self.addEventListener('fetch', event => {
  event.respondWith(
    // Try to find a matching request in the cache first
    caches.match(event.request)
      .then(response => {
        // If a cached version is found, return it
        if (response) {
          return response;
        }
        // Otherwise, fetch the request from the network
        return fetch(event.request);
      })
  );
});

// 3. Activation: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
