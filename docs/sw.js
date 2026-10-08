// Service worker: permite usar FORJA sin conexión e instalarla como app.
// Estrategia "stale-while-revalidate": responde desde la caché al instante y
// actualiza en segundo plano (la versión nueva se ve en la siguiente apertura).
const CACHE = 'forja-v1';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/app.js', 'js/store.js', 'js/engine.js', 'js/actions.js', 'js/ui.js', 'js/icons.js', 'js/avatar.js', 'js/charts.js', 'js/rest.js',
  'js/data/exercises.js', 'js/data/skills.js', 'js/data/game.js',
  'js/views/onboarding.js', 'js/views/home.js', 'js/views/train.js', 'js/views/summary.js',
  'js/views/skills.js', 'js/views/progress.js', 'js/views/profile.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: sameOrigin });
      const network = fetch(req)
        .then(res => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        e.waitUntil(network);
        return cached;
      }
      const res = await network;
      if (res) return res;
      // sin conexión y sin caché: para navegación devolvemos la app
      if (req.mode === 'navigate') return cache.match('index.html');
      return new Response('', { status: 504 });
    })
  );
});
