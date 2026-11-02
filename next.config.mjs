import { execSync } from "node:child_process";

/**
 * Build version for the service worker cache: the deploy's commit when the host
 * provides it, else the local git commit. Deterministic across build workers.
 */
function appVersion() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12);
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
  },
  // The dev-only Next.js indicator defaults to bottom-left, where it covers the
  // collapsed sidebar's "Expand sidebar" control. Production is unaffected.
  devIndicators: {
    position: "bottom-right",
  },
  // `/` is the canonical Dashboard URL; `/dashboard` is kept as an alias.
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
};

export default nextConfig;
