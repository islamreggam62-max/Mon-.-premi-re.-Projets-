import type { MetadataRoute } from "next";
import { LEGAL_UPDATED, PUBLIC_PAGES, absoluteUrl } from "@/lib/site";

// Generated once at build time; required by the static export (GitHub Pages).
export const dynamic = "force-static";

/** Public pages for search engines and directory crawlers. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((path) => ({
    url: absoluteUrl(path),
    lastModified: LEGAL_UPDATED,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/dashboard" ? 0.8 : 0.5,
  }));
}
