import type { Metadata } from "next";

/**
 * `/dashboard` alias. On server deployments next.config redirects it to `/`
 * before this page is reached; the static export (GitHub Pages), which cannot
 * redirect, serves the same Dashboard here with `/` as the canonical URL.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export { default } from "../page";
