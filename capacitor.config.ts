/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor/status-bar" />
import type { CapacitorConfig } from "@capacitor/cli";

/**
 * NEXORA Android app (Google Play). Capacitor packages the static export in
 * `out/` (`npm run build`), then `npx cap sync android` copies it into the
 * Android project.
 */
const NAVY = "#060913";

const config: CapacitorConfig = {
  appId: "com.nexora.executiveos",
  appName: "NEXORA",
  webDir: "out",
  // Behind the web page while it loads, so there is no white flash.
  backgroundColor: NAVY,
  server: {
    androidScheme: "https",
    // Open straight into the product, like the installed web app. The page is
    // named by its file: the local server answers every path without a file
    // extension with the landing page (see lib/native.ts).
    appStartPath: "/dashboard/index.html",
  },
  android: {
    backgroundColor: NAVY,
    allowMixedContent: false,
    // Chrome remote debugging stays off in release builds.
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: NAVY,
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    // Android 15+ draws the app edge to edge and ignores a status bar color;
    // the window background (android/app/src/main/res) is navy instead.
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: NAVY,
    },
    // Light status and navigation bar icons on the dark UI; the WebView stays
    // inside the system bars (viewport-fit is "auto" in app/layout.tsx).
    SystemBars: {
      style: "DARK",
      insetsHandling: "css",
    },
  },
};

export default config;
