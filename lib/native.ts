/**
 * Detects the NEXORA Android app (Capacitor). Capacitor's native bridge defines
 * `window.Capacitor` before the page's scripts run, so no import of
 * @capacitor/core is needed in the web bundle. Call it in effects or event
 * handlers only: on the server, and during the first render, it returns false.
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === "function" && cap.isNativePlatform();
}

/**
 * The app's local server answers every page path without a file extension with
 * the root `index.html`, so a page is opened by its file instead
 * (`/approvals/index.html`) and the address is cleaned afterwards.
 */
export const PAGE_FILE = "index.html";

/** "/approvals/" or "/approvals" -> "/approvals/index.html". */
export function pageFileFor(pathname: string): string {
  return `${pathname.endsWith("/") ? pathname : `${pathname}/`}${PAGE_FILE}`;
}
