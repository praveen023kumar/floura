// File Path: /src/utils/api.ts
/**
 * Centralized API URL resolver utility.
 */

import { PRODUCTION_URL } from "../../shared/api-config";

export const isCordova = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    (window as any).cordova !== undefined ||
    window.location.protocol === "file:"
  );
};

export const isElectron = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    (window as any).electron !== undefined ||
    Boolean((window as any).process?.versions?.electron) ||
    (typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("electron"))
  );
};

export const isNativeApp = (): boolean => {
  return (
    typeof window !== "undefined" &&
    ((window as any).ReactNativeWebView !== undefined ||
      isCordova() ||
      isElectron())
  );
};

export const getBackendBaseUrl = (): string => {
  if (typeof window === "undefined") return "";

  // 1. Check if a build-time environment variable is set
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // 2. If running inside a Native App wrapper, return production backend URL to avoid broken relative fetches on file://
  if (isNativeApp()) {
    return PRODUCTION_URL;
  }
  return "";
};

export const getApiUrl = (path: string = ""): string => {
  const base = getBackendBaseUrl();
  if (!path) return base;
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanedPath}`;
};

/**
 * Returns a persistent unique device identifier for single-device session locking.
 */
export const getDeviceId = (): string => {
  if (typeof window === "undefined") return "browser_device";
  try {
    let id = localStorage.getItem("floura_device_id");
    if (!id) {
      id = "dev_" + (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).substring(2) + Date.now().toString(36));
      localStorage.setItem("floura_device_id", id);
    }
    return id;
  } catch {
    return "browser_device";
  }
};
