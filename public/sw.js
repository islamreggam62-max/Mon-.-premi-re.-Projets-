/*
 * NEXORA service worker — offline support for the installed app.
 *
 * - Pages: network first (always fresh when online), cached copy when offline,
 *   then the /offline page as a last resort.
 * - Hashed build assets (/_next/static) and icons: cache first (immutable URLs).
 * - RSC payloads and anything cross-origin pass straight through.
 *
 * The cache is versioned by the ?v= query the page registers with (the build's
 * commit), so every deployment installs a new worker and drops the old cache.
 * Nothing here calls an API or stores user data: the demo is fully static.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE = `nexora-${VERSION}`;

const PAGES = [
  "/",
  "/team",
  "/projects",
  "/tasks",
  "/daily-reports",
  "/approvals",
  "/ai-intelligence",
  "/settings",
  "/offline",
];
const STATIC = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/icon.svg",
];

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(STATIC);

  // Cache every page, then every hashed asset those pages reference, so each
  // module renders and hydrates offline — not just the one first visited.
  const assets = new Set();
  await Promise.all(
    PAGES.map(async (path) => {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) return;
      await cache.put(path, response.clone());
      const html = await response.text();
      for (const match of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assets.add(match[0]);
    }),
  );
  await Promise.all(
    [...assets].map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch {
        /* a missing asset only affects that page offline */
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("nexora-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isImmutable(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // React Server Component payloads: never cache. If one fails offline, Next.js
  // falls back to a full navigation, which the branch below serves from cache.
  if (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1") return;

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(url.pathname, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(url.pathname);
          if (cached) return cached;
          if (url.pathname === "/offline") return Response.error();
          // Redirect (not rewrite) so the URL matches the cached /offline HTML;
          // serving it under another path would break React hydration.
          const from = encodeURIComponent(url.pathname + url.search);
          return Response.redirect(`/offline?from=${from}`, 302);
        }),
    );
    return;
  }

  // Everything else (manifest, screenshots…): network first, cache fallback.
  event.respondWith(fetch(request).catch(async () => (await caches.match(request)) || Response.error()));
});
