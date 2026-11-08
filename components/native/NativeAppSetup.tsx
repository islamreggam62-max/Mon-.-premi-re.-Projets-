"use client";

import { useEffect } from "react";
import { isNativeApp, PAGE_FILE, pageFileFor } from "@/lib/native";

/**
 * Android app only. Pages open by their file (`/dashboard/index.html`, see
 * lib/native.ts); once the page is up, the address drops the file name so the
 * active menu item and later navigation see the clean route (`/dashboard/`).
 * Next.js keeps usePathname() in sync with history.replaceState.
 */
export function NativeAppSetup() {
  useEffect(() => {
    if (!isNativeApp()) return;
    document.documentElement.dataset.nativeApp = "android";
    const { pathname, search, hash } = window.location;
    if (pathname.endsWith(`/${PAGE_FILE}`)) {
      window.history.replaceState(null, "", pathname.slice(0, -PAGE_FILE.length) + search + hash);
    }
  }, []);

  return null;
}

/**
 * Android app only, rendered by the landing page ("/"). The local server answers
 * any unknown path with the landing page's HTML, so if this page mounts at
 * another address (a reload of /approvals/, for example), reopen that page by its
 * file. Runs once, on the landing page's first mount only.
 */
export function NativeRouteGuard() {
  useEffect(() => {
    if (!isNativeApp()) return;
    const { pathname, search, hash } = window.location;
    if (pathname === "/" || pathname.endsWith(`/${PAGE_FILE}`)) return;
    window.location.replace(pageFileFor(pathname) + search + hash);
  }, []);

  return null;
}
