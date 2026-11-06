// File Path: /src/data/versions.ts

export type PlatformId = "android" | "pwa";

export interface PlatformDownload {
  id: PlatformId;
  name: string;
  osName: string;
  badge?: string;
  fileType: string;
  fileName: string;
  fileSize: string;
  downloadUrl: string;
  secondaryDownloadUrl?: string;
  secondaryDownloadLabel?: string;
  architecture: string;
  minOs: string;
  sha256?: string;
  iconName: "Smartphone" | "Globe";
  directDownload: boolean;
  instructions: {
    platform: string;
    steps: string[];
  }[];
}

export interface AppVersion {
  version: string;
  releaseDate: string;
  isLatest: boolean;
  status: "Stable" | "Beta";
  summary: string;
  highlights: string[];
  features: string[];
  improvements: string[];
  fixes: string[];
  platforms: PlatformDownload[];
}

export const APP_VERSIONS: AppVersion[] = [
  {
    version: "v1.0.0",
    releaseDate: "Production Release",
    isLatest: true,
    status: "Stable",
    summary: "Official production release of Floura Bakery Management System with offline-first SQLite WASM and local IndexedDB sync engine, custom cake order management, recipe calculator, direct Android standalone APK download, and multi-device PWA installation.",
    highlights: [
      "Direct website APK download for Android (6.0 MB) — no Google Play account required",
      "Progressive Web App (PWA) support for iPhone, iPad, Mac, and Windows desktops",
      "Offline-first architecture powered by SQLite WASM and browser IndexedDB",
      "Custom cake order tracking with flavor, weight, tiers, and payment ledger",
    ],
    features: [
      "Standalone Android APK (6.0 MB) built with Cordova for offline kitchen use",
      "PWA Home Screen installation with full-screen offline mode on iOS & Desktop",
      "Custom cake order management with photo attachments and delivery schedule",
      "Customer profiles with contact details, order history, and notes",
      "Ingredient inventory tracking with low-stock alerts and supplier costs",
      "Daily kitchen preparation checklist with recurring tasks",
      "Public recipe scaling calculator with batch yields and baker's ratios",
    ],
    improvements: [
      "Lightweight 6.0 MB APK footprint with instant startup",
      "High-contrast dark mode and responsive layout for phones, tablets, and desktops",
      "Automatic local data persistence ensuring zero data loss during network dropouts",
    ],
    fixes: [
      "Optimized order detail view refresh and status updates",
      "Enhanced local customer sync timestamp consistency during reconnections",
    ],
    platforms: [
      {
        id: "android",
        name: "Android Standalone App",
        osName: "Android Phone & Tablet",
        badge: "Direct APK • 6.0 MB",
        fileType: ".apk",
        fileName: "floura-v1.0.0.apk",
        fileSize: "6.0 MB",
        downloadUrl: "/downloads/floura-v1.0.0.apk",
        secondaryDownloadUrl: "/downloads/floura-latest.apk",
        secondaryDownloadLabel: "Latest APK Mirror",
        architecture: "Universal Android Package (APK)",
        minOs: "Android 8.0 (Oreo) or later",
        sha256: "426e0a3c7924f8c43032f45463d066d67685e036e49b4ed33c7fb51589167f6e",
        iconName: "Smartphone",
        directDownload: true,
        instructions: [
          {
            platform: "Android Installation",
            steps: [
              "Tap 'Download .apk' to download the installation package directly to your phone.",
              "When download finishes, tap the notification or open your Downloads folder.",
              "If prompted by Android, toggle 'Allow from this source'.",
              "Tap 'Install' and launch Floura to begin managing your bakery."
            ]
          }
        ]
      },
      {
        id: "pwa",
        name: "Web App (PWA)",
        osName: "iOS, Mac, Windows & Linux",
        badge: "Install via Browser",
        fileType: "Progressive Web App",
        fileName: "Floura PWA",
        fileSize: "Instant (<1 MB)",
        downloadUrl: "/dashboard",
        architecture: "Chrome, Safari, Edge, Firefox",
        minOs: "Any Modern Browser",
        iconName: "Globe",
        directDownload: false,
        instructions: [
          {
            platform: "iOS / iPadOS (Safari)",
            steps: [
              "Open floura.app in Safari on your iPhone or iPad.",
              "Tap the 'Share' icon (square with arrow pointing up) at the bottom.",
              "Scroll down and tap 'Add to Home Screen'.",
              "Tap 'Add' in the top-right corner. Floura will now appear on your home screen as a standalone offline app."
            ]
          },
          {
            platform: "Desktop (Mac & Windows via Chrome/Edge)",
            steps: [
              "Open floura.app in Google Chrome or Microsoft Edge.",
              "Click the 'Install Floura' icon in the right side of the address bar, or click 'Install App' in our menu.",
              "Click 'Install'. Floura is now pinned to your Dock / Taskbar and runs in its own window offline."
            ]
          }
        ]
      }
    ]
  }
];

export function getLatestVersion(): AppVersion {
  return APP_VERSIONS[0];
}

export function detectUserPlatform(): PlatformId {
  if (typeof window === "undefined" || !navigator) return "android";
  const userAgent = navigator.userAgent || "";
  if (/android/i.test(userAgent)) return "android";
  return "pwa";
}
