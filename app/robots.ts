import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";
import { withBase } from "@/lib/basePath";

// Generated once at build time; required by the static export (GitHub Pages).
export const dynamic = "force-static";

/**
 * Crawlers read robots.txt only at the domain root, so this file takes effect
 * once the site has its own domain; under a GitHub Pages sub-path it is inert,
 * and the sitemap can be submitted to search engines directly.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_ORIGIN}${withBase("/sitemap.xml")}`,
  };
}
