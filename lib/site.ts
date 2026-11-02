import { pageUrl } from "@/lib/basePath";

/**
 * Public site facts shared by the landing page, legal pages, sitemap, and
 * structured data. Keep them true: directories and search engines read them.
 */
export const SITE_NAME = "NEXORA";
export const SITE_TAGLINE = "The executive command center for growing companies";
export const SITE_DESCRIPTION =
  "One command center for executives: KPIs, projects, tasks, daily reports, approvals, and AI operational intelligence.";

/** Absolute site origin (set at build time in next.config.mjs). */
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";

/** Absolute URL of a page, base path and trailing slash included. */
export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${pageUrl(path)}`;
}

/** Date shown on the privacy policy and terms (ISO). Change it with their text. */
export const LEGAL_UPDATED = "2026-11-02";

/**
 * Public contact address. Empty until the owner chooses one; pages only show a
 * contact line when it is set.
 */
export const CONTACT_EMAIL = "";

/** Public pages, for the sitemap. */
export const PUBLIC_PAGES = [
  "/",
  "/dashboard",
  "/team",
  "/projects",
  "/tasks",
  "/daily-reports",
  "/approvals",
  "/ai-intelligence",
  "/settings",
  "/privacy",
  "/terms",
] as const;
