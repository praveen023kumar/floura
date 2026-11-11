// File Path: /shared/api-config.ts
export const DEV_URL = "https://ais-dev-3da4gvffsthmd5aljhgdhg-302716256488.asia-east1.run.app";
// Resolves backend production URL dynamically from environment variables
const resolveProductionUrl = (): string => {
  // 1. Client-side Vite build-time environment variable (VITE_BACKEND_URL or VITE_APP_URL)
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.VITE_BACKEND_URL) return metaEnv.VITE_BACKEND_URL.trim().replace(/\/+$/, "");
    if (metaEnv?.VITE_APP_URL) return metaEnv.VITE_APP_URL.trim().replace(/\/+$/, "");
  } catch {}

  // 2. Node.js server-side runtime environment variable
  if (typeof process !== "undefined" && process.env) {
    if (process.env.VITE_BACKEND_URL) return process.env.VITE_BACKEND_URL.trim().replace(/\/+$/, "");
    if (process.env.APP_URL) return process.env.APP_URL.trim().replace(/\/+$/, "");
    if (process.env.BACKEND_URL) return process.env.BACKEND_URL.trim().replace(/\/+$/, "");
  }

  // 3. Fallback default
  return "https://floura.kydigit.com";
};

export const PRODUCTION_URL = resolveProductionUrl();

/**
 * Resolves an API path given a base server URL.
 */
export function getApiUrlShared(baseServerUrl: string, path: string): string {
  const base = baseServerUrl ? baseServerUrl.trim().replace(/\/+$/, "") : "";
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanedPath}`;
}
