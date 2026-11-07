/* Service worker for levetidsberegner.dk. Generated into dist/sw.js by scripts/build-sw.mjs; the
   placeholders below are filled in per build. Hand-written (no Workbox) so the order of the rules is explicit.

   It replaces the Workbox worker of the old SPA build at the same URL and scope (/sw.js, /):
   - install never fails (each file is cached on its own), so a failed download can never leave the old
     worker in charge,
   - activate deletes every other cache, including the old worker's workbox-precache-* cache with its
     index.html fallback, takes control of open tabs at once and, on that first switch only, reloads them,
   - pages are fetched from the network first; the copy cached at install is only used offline or when the
     network does not answer within NETWORK_TIMEOUT_MS. There is no SPA fallback: unknown paths go to the
     network and get the server's real 404. */
const CACHE = 'levetid-__VERSION__';
// Pages (clean paths) and the files they need. Precached together, so an offline page always finds the
// scripts and styles it names.
const PAGES = __PAGES__;
const FILES = __FILES__;
const NETWORK_TIMEOUT_MS = 3000;

const PAGE_SET = new Set(PAGES);
const FILE_SET = new Set(FILES);
const pageKey = (path) => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(
        [...PAGES, ...FILES].map((url) =>
          fetch(new Request(url, { cache: 'reload' })).then((res) => {
            if (res.ok && !res.redirected) return cache.put(url, res);
            return undefined;
          }),
        ),
      ),
    ),
  );
});

// Tabs that the SPA's worker served from its precache are still running the old app. When that cache is
// found (first activation after the SPA), they are reloaded once so they show the new site; later deploys
// leave open tabs alone.
const LEGACY_CACHE = /^workbox-/;

self.addEventListener('activate', (event) => {
  const switched = (async () => {
    const keys = await caches.keys();
    const fromSpa = keys.some((key) => LEGACY_CACHE.test(key));
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
    return fromSpa;
  })();
  event.waitUntil(switched);
  // Not inside waitUntil: the reload's own request is only handled once activation has finished.
  switched.then(async (fromSpa) => {
    if (!fromSpa) return;
    const tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach((tab) => tab.navigate(tab.url).catch(() => undefined));
  });
});

function fromCache(key) {
  return caches.open(CACHE).then((cache) => cache.match(key));
}

// Network first; after NETWORK_TIMEOUT_MS the cached copy is used if there is one, otherwise the network
// keeps going. A network error falls back to the cache.
function networkFirst(request, key) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (res) => {
      if (!settled && res) {
        settled = true;
        resolve(res);
      }
      return res;
    };
    const network = fetch(request);
    const timer = setTimeout(() => fromCache(key).then(done), NETWORK_TIMEOUT_MS);
    network
      .then((res) => {
        clearTimeout(timer);
        done(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        fromCache(key).then((res) => {
          if (!done(res) && !settled) reject(err);
        });
      });
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    const key = pageKey(url.pathname);
    if (PAGE_SET.has(key)) event.respondWith(networkFirst(request, key));
    return;
  }

  // Hashed build files, fonts and icons from this build: cache first.
  if (FILE_SET.has(url.pathname)) {
    event.respondWith(fromCache(url.pathname).then((res) => res || fetch(request)));
  }
});
