// File Path: /src/utils/auth.ts
/**
 * Authentication and Session Security Utilities
 */

/**
 * Checks whether an HTTP response error represents an invalid/expired workspace signature
 * that requires re-authentication.
 */
export function isAuthSignatureError(status: number, errData: any): boolean {
  if (status === 401 || status === 403) {
    if (errData?.code === "INVALID_WORKSPACE_SIGNATURE") return true;
    if (errData?.code === "SINGLE_DEVICE_CONFLICT") return true;
    const errText = String(errData?.error || errData?.message || "").toLowerCase();
    if (
      errText.includes("invalid security workspace signature") ||
      errText.includes("re-authenticate") ||
      errText.includes("workspace signature") ||
      errText.includes("another device") ||
      errText.includes("session terminated") ||
      errText.includes("single_device_conflict")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Triggers re-authentication redirection across the application.
 * Stores return path in sessionStorage and dispatches a global event.
 */
export function triggerReauth(returnTo: string = window.location.pathname, reason?: string) {
  try {
    if (typeof window !== "undefined") {
      const defaultReason = "Access Denied: Invalid security workspace signature. Please re-authenticate.";
      const activeReason = reason || defaultReason;
      
      sessionStorage.setItem("floura_reauth_reason", activeReason);
      sessionStorage.setItem("floura_reauth_return_to", returnTo);
      
      window.dispatchEvent(
        new CustomEvent("floura_reauth_required", {
          detail: { returnTo, reason: activeReason }
        })
      );

      // Reliable navigation fallback in case event listener hasn't caught it or route is still unchanged
      setTimeout(() => {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/reauthenticate")) {
          window.location.href = `/reauthenticate?returnTo=${encodeURIComponent(returnTo)}`;
        }
      }, 50);
    }
  } catch (e) {
    console.error("Failed to dispatch reauth event:", e);
  }
}
