import type { CapacitorConfig } from "@capacitor/cli";

// For testing against a local dev server: CAP_SERVER_URL=http://localhost:3000 npx cap sync ios
const serverUrl = process.env.CAP_SERVER_URL ?? "https://bitesync.io";

// The iPhone app is a native shell around the live site, so every web release
// reaches the app without a new App Store build. Native features (reminders,
// purchases, sharing) come from Capacitor plugins called by the web pages.
const config: CapacitorConfig = {
  appId: "io.bitesync.app",
  appName: "BiteSync",
  // Only the offline page ships inside the app; everything else loads from the site.
  webDir: "native/www",
  server: {
    // Capacitor keeps a page in the app only if its address starts with this
    // URL, so it must be the bare domain (with /today here, /login opened Safari).
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    appStartPath: "/today",
    errorPath: "offline.html",
  },
  // Lets the site tell in-app visits apart (lib/native/app.ts), e.g. to hide
  // web checkout, which Apple doesn't allow inside an iOS app.
  appendUserAgent: "BiteSyncApp",
  ios: {
    contentInset: "never",
  },
  plugins: {
    // Light status-bar text: app pages open with the deep-green header under it.
    StatusBar: {
      style: "DARK",
      overlaysWebView: true,
    },
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: "#0d2923",
      showSpinner: false,
    },
  },
};

export default config;
