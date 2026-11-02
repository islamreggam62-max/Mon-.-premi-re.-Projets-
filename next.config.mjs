import { execSync } from "node:child_process";

/**
 * Two build targets share this config:
 * - default: a Node server (`next start`, Vercel) with redirects and headers;
 * - GITHUB_PAGES=true: a static export served from
 *   https://<owner>.github.io/<repo>/ — so it needs a basePath and trailing
 *   slashes, and cannot use server redirects or headers.
 */
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? process.env.PAGES_BASE_PATH ?? "/Mon-.-premi-re.-Projets-" : "";

/** Build version for the service worker cache. Deterministic across build workers. */
function appVersion() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (sha) return sha.slice(0, 12);
  try {
    return execSync("git rev-parse --short=12 HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "local";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion(),
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_TRAILING_SLASH: isPages ? "1" : "0",
  },
  // The dev-only Next.js indicator defaults to bottom-left, where it covers the
  // collapsed sidebar's "Expand sidebar" control. Production is unaffected.
  devIndicators: {
    position: "bottom-right",
  },
  ...(isPages
    ? {
        output: "export",
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        // `/` is the canonical Dashboard URL; `/dashboard` is kept as an alias.
        // (The static export serves app/dashboard/page.tsx instead.)
        async redirects() {
          return [{ source: "/dashboard", destination: "/", permanent: false }];
        },
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
              ],
            },
            {
              // The browser must always revalidate the worker so updates roll out.
              source: "/sw.js",
              headers: [
                { key: "Content-Type", value: "application/javascript; charset=utf-8" },
                { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
