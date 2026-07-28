const CACHE = 'caja-diaria-v72';
const ASSETS = ['./', './index.html', './app.html', './manifest.json', './icon-192.png', './icon-512.png', './biletes.avif', './logo.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHTML = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // Red primero para el shell de la app: así los arreglos se ven apenas se recargue,
    // en vez de quedar pegado a lo último cacheado. cache:'no-store' evita que la
    // caché HTTP del navegador (GitHub Pages manda cache-control: max-age=600)
    // devuelva una copia vieja sin siquiera llegar a la red — sin esto, recargar
    // podía seguir mostrando la versión anterior hasta por 10 minutos después de
    // un deploy, aunque el fetch() ya "pedía red primero". Cache solo como
    // respaldo offline (ver más abajo, caches.match si falla la red).
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
