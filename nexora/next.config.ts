import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Defaults from create-next-app 16.4: every route is prerendered into a static
  // shell, and <Link> prefetches that shell. NEXORA's Phase 1 data layer is
  // static, so all eight modules prerender fully at build time.
  cacheComponents: true,
  partialPrefetching: true,
  // Compile-time checking of every <Link href> against the real route tree.
  typedRoutes: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
