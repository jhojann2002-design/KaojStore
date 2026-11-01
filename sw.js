// =========================================================================
// SERVICE WORKER - KAOJ STORE PWA
// =========================================================================
const CACHE_NAME = 'kaoj-store-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación del Service Worker: cachear recursos esenciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
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

// Intercepción de peticiones (Network First con fallback a Cache)
self.addEventListener('fetch', event => {
  // Ignorar peticiones a Supabase o externas para asegurar datos frescos
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('wa.me') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clonar y guardar copia fresca en caché para assets locales
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si no hay internet, responder desde el caché
        return caches.match(event.request);
      })
  );
});
