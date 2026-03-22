const CACHE_NAME = 'pkmk-cache-v1';

// Daftar asset statis untuk fallback (opsional)
const urlsToCache = [
  '/',
  '/manifest.json',
  '/SIGMA Logo_192.png',
  '/SIGMA Logo_512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tidak masalah kalau gagal fetch di awal
      return cache.addAll(urlsToCache).catch((err) => {
         console.log('Cache failed for some files, proceeding anyway...', err);
      });
    })
  );
  // Langsung mengambil kontrol setelah instalasi
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya simpan asset lokal (sama origin) ke cache untuk PWA
  if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Bikin duplikat respons untuk dimasukkan ke cache
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
               cache.put(event.request, responseToCache);
            });
          }
           return response;
        })
        .catch(() => {
          // Jika gagal (offline), kembalikan versi cache
          return caches.match(event.request);
        })
    );
  }
});
