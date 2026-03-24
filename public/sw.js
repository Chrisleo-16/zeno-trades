// public/sw.js
// This file runs INSIDE the service worker — NOT in the browser window.
// It must live at public/sw.js so Next.js serves it at /sw.js

const CACHE_NAME = 'apex-trading-v1';

const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Install: precache essential shell ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll fails if ANY request fails — use individual adds so one
      // missing icon doesn't break the whole install
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Failed to cache:', url, err);
          })
        )
      );
    })
  );
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

// ── Activate: delete stale caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ── Fetch: network-first with cache fallback ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (Anthropic API, Supabase, etc.)
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Skip Next.js internals and HMR
  if (
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/_next/static/chunks/webpack')
  ) return;

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache valid responses (not opaque, not errors)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Network failed — try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Final fallback for navigate requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }

    // Return a basic offline response
    return new Response('Offline — no cached version available.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// ── Messages from the client ──────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});