import type { MetadataRoute } from "next";
import { pageUrl, withBase } from "@/lib/basePath";

// Generated once at build time; required by the static export (GitHub Pages).
export const dynamic = "force-static";

/** Web app manifest: makes NEXORA installable as a standalone app (desktop, Android, iOS). */
export default function manifest(): MetadataRoute.Manifest {
  const shortcutIcon = [{ src: withBase("/icons/icon-192.png"), sizes: "192x192" }];
  return {
    id: pageUrl("/"),
    name: "NEXORA — Executive Business Operating System",
    short_name: "NEXORA",
    description:
      "Executive command center for projects, tasks, daily reports, approvals, and AI operational intelligence.",
    start_url: pageUrl("/"),
    scope: pageUrl("/"),
    display: "standalone",
    orientation: "any",
    background_color: "#060913",
    theme_color: "#060913",
    lang: "en",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      { src: withBase("/icons/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withBase("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: withBase("/icons/maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: withBase("/icons/icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Approvals", short_name: "Approvals", url: pageUrl("/approvals"), icons: shortcutIcon },
      { name: "Daily Reports", short_name: "Reports", url: pageUrl("/daily-reports"), icons: shortcutIcon },
      { name: "Tasks", short_name: "Tasks", url: pageUrl("/tasks"), icons: shortcutIcon },
    ],
    screenshots: [
      {
        src: withBase("/screenshots/wide.png"),
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "Executive command center with KPIs and department health",
      },
      {
        src: withBase("/screenshots/narrow.png"),
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "NEXORA dashboard on mobile",
      },
    ],
  };
}
