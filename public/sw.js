// public/sw.js
// Service worker minimo per rendere Offside installabile come app (PWA).
// Non mette in cache l'app in modo aggressivo: le pagine e soprattutto le chiamate a /api/
// vanno sempre in rete quando possibile, per non rischiare mai di mostrare dati di squadra
// o giocatori non aggiornati. Serve solo a mostrare l'ultima schermata salvata invece
// dell'errore del browser quando sei del tutto offline.

const CACHE_NAME = 'offside-shell-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Le chiamate API non vanno mai intercettate: devono sempre arrivare al server.
  if (request.url.includes('/api/')) return;

  // Solo per la navigazione (apertura o refresh della pagina): prova la rete,
  // e se sei offline mostra l'ultima shell salvata invece dell'errore del browser.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
