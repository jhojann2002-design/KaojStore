// =========================================================================
// SERVICE WORKER - KAOJ STORE PWA (Cache Optimizado & Soporte Offline)
// =========================================================================
const CACHE_NAME = 'kaoj-store-v7';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/kaoj-logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/favicon.svg'
];

const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Instalación del Service Worker: cachear recursos esenciales locales y CDN
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Cachear assets locales
      try {
        await cache.addAll(STATIC_ASSETS);
      } catch (err) {
        console.warn('Error cacheando assets locales:', err);
      }
      // Cachear assets de CDN
      for (const url of CDN_ASSETS) {
        try {
          const resp = await fetch(url, { mode: 'cors' });
          if (resp && resp.status === 200) {
            await cache.put(url, resp);
          }
        } catch (err) {
          // Ignorar fallas de red durante install para no bloquear el registro
        }
      }
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker: limpiar cachés obsoletos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepción de peticiones (Network First con fallback a Cache para app, Cache First para CDNs)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Ignorar peticiones dinámicas de Supabase o WhatsApp para asegurar datos frescos
  if (
    url.includes('supabase.co') ||
    url.includes('wa.me') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Para librerías CDN externas y fuentes: Cache First con fallback a Network
  if (
    url.includes('unpkg.com') ||
    url.includes('cdn.jsdelivr.net') ||
    url.includes('cdn.tailwindcss.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Para recursos de la tienda (index.html, manifest, imágenes locales): Network First
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
