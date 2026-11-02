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
 * Public sales and contact address. Empty until the owner chooses one: while
 * empty, no page shows a contact line and the plans point to the live demo.
 * Once set, the plans become "Request this plan" emails and the privacy policy
 * says what happens to those emails.
 */
export const CONTACT_EMAIL = "islamreggam62@gmail.com";

/** mailto: link that opens a pre-filled subscription request. */
export function salesMailto(planName?: string): string {
  const subject = planName ? `NEXORA subscription: ${planName} plan` : "NEXORA subscription";
  const body = [
    "Hello,",
    "",
    `I would like to subscribe to NEXORA${planName ? ` (${planName} plan)` : ""}.`,
    "",
    "Company:",
    "Country:",
    "Number of users:",
    "",
  ].join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

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
