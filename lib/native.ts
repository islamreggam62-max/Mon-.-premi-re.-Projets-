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

/**
 * Android app only: saves a backup in the app's private cache and opens the
 * Android share menu, so the user sends it to Drive, email, a chat, or Files.
 * Resolves "cancelled" when the menu is closed without choosing an app.
 */
export async function shareBackupFile(fileName: string, json: string): Promise<"shared" | "cancelled"> {
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const { uri } = await Filesystem.writeFile({ path: fileName, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
  try {
    await Share.share({ title: fileName, files: [uri], dialogTitle: "Save or send your NEXORA backup" });
    return "shared";
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message)) return "cancelled";
    throw error;
  }
}
