/*
 * Webhook Catcher — minimal app-shell service worker.
 *
 * Scope is intentionally narrow and conservative: a buggy SW can break the whole
 * app, so this only caches the static app shell and immutable static assets.
 *
 * It NEVER caches:
 *   - /api/* (especially /api/webhook/* ingest and any user data routes)
 *   - non-GET requests
 *   - cross-origin requests
 *   - requests with auth headers / credentials concerns
 *
 * Webhook data is live and per-user, so it stays network-only. Offline support
 * is limited to the app shell.
 */

const VERSION = "v1";
const SHELL_CACHE = `wcat-shell-${VERSION}`;
const ASSET_CACHE = `wcat-assets-${VERSION}`;

// Minimal precache. Keep this tiny and stable — only things guaranteed to exist.
const SHELL_ASSETS = [
  "/favicon.ico",
  "/site.webmanifest",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll is atomic; if any asset 404s the whole install fails, so cache
      // each individually and ignore failures to stay resilient.
      .then((cache) =>
        Promise.all(
          SHELL_ASSETS.map((url) =>
            cache.add(url).catch(() => undefined),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("wcat-") && !keep.has(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Decide whether a request is safe to cache.
function isCacheableStaticAsset(url) {
  // Next.js build output (hashed, immutable) and our /public static files.
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (/\.(?:css|js|woff2?|png|jpe?g|svg|gif|ico|webp|avif)$/.test(url.pathname)) {
    return true;
  }
  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests. Everything else (POST, cross-origin,
  // etc.) falls through to the network untouched.
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Never touch API routes — webhook ingest and all data are live + private.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations (HTML documents): network-first, fall back to a cached shell
  // only when offline so the app can boot. We do NOT persist per-page HTML
  // long-term — we cache the last successful navigation as a generic shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() =>
          caches
            .open(SHELL_CACHE)
            .then((cache) => cache.match("/"))
            .then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (isCacheableStaticAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached);
          return cached || network;
        }),
      ),
    );
    return;
  }

  // Anything else: leave it to the network (no caching).
});
