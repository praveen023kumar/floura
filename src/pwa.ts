/**
 * Floura PWA Registration & Lifecycle Manager
 */

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  // Avoid registering in Cordova native wrapper since Cordova has its own webview container
  if ((window as any).cordova) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] Service Worker registered successfully:", registration.scope);

        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("[PWA] New version available!");
                window.dispatchEvent(new CustomEvent("pwa-update-available"));
              } else {
                console.log("[PWA] Floura is cached and ready for offline use.");
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn("[PWA] Service Worker registration failed:", error);
      });
  });
}
