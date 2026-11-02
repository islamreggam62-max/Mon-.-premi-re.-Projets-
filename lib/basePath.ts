/**
 * Deployment base path ("" on a server deployment, "/<repo>" on GitHub Pages).
 * next/link and metadata add it automatically; use these helpers only for URLs
 * Next.js does not rewrite (manifest entries, service worker registration).
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const TRAILING_SLASH = process.env.NEXT_PUBLIC_TRAILING_SLASH === "1";

/**
 * The product's entry route. "/" is the public landing page.
 * (In-app links never point at "/": in the static export, Next.js resolves the
 * root route's prefetch payload to "<base>.txt", which 404s on GitHub Pages.)
 */
export const APP_HOME = "/dashboard";

/** A file URL under the base path, e.g. withBase("/icons/icon-192.png"). */
export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}

/** A page URL under the base path, with the export's trailing slash when needed. */
export function pageUrl(path: string): string {
  if (path === "/") return `${BASE_PATH}/`;
  return `${BASE_PATH}${path}${TRAILING_SLASH ? "/" : ""}`;
}
