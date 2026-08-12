// File Path: /shared/api-config.ts
export const DEV_URL = "https://ais-dev-3da4gvffsthmd5aljhgdhg-302716256488.asia-east1.run.app";
export const PRODUCTION_URL = "http://192.168.31.55:3000";

/**
 * Resolves an API path given a base server URL.
 */
export function getApiUrlShared(baseServerUrl: string, path: string): string {
  const base = baseServerUrl ? baseServerUrl.trim().replace(/\/+$/, "") : "";
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanedPath}`;
}
