import { useState, useEffect } from "react";
import { auth, googleProvider, signInWithPopup } from "../firebase";
import { getApiUrl, isNativeApp } from "../utils/api";

export interface UseLoginProps {
  onLogin: (user: { name: string; email: string; avatar: string; token: string; isNew?: boolean }) => void;
}

export function useLogin({ onLogin }: UseLoginProps) {
  const [authenticating, setAuthenticating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorToast, setErrorToast] = useState("");
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "disclaimer" | null>(null);
  const [pollingState, setPollingState] = useState<string | null>(null);

  // Poll for external auth completion if a polling session is active
  useEffect(() => {
    if (!pollingState) return;

    let attempts = 0;
    const maxAttempts = 150;
    let consecutiveErrors = 0;

    const intervalId = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(intervalId);
        setAuthenticating(false);
        setToastMessage("");
        setPollingState(null);
        setErrorToast("Google authentication timed out. Please try signing in again.");
        return;
      }

      const url = getApiUrl(`/api/auth/external-poll?state=${pollingState}`);
      try {
        const response = await fetch(url);
        if (response.ok) {
          consecutiveErrors = 0;
          const data = await response.json();
          if (data.status === "completed") {
            clearInterval(intervalId);
            setToastMessage("Loading secure workspace...");
            setPollingState(null);
            
            setTimeout(() => {
              onLogin({
                name: data.user.name,
                email: data.user.email,
                avatar: data.user.avatar,
                token: data.token,
                isNew: data.isNew
              });
            }, 800);
          } else if (data.status === "error") {
            clearInterval(intervalId);
            setAuthenticating(false);
            setToastMessage("");
            setPollingState(null);
            setErrorToast("Google Authentication failed: " + (data.error || "Unknown error"));
          }
        } else {
          consecutiveErrors++;
          if (consecutiveErrors >= 5) {
            clearInterval(intervalId);
            setAuthenticating(false);
            setToastMessage("");
            setPollingState(null);
            setErrorToast(
              "Connection Error: Server returned status (" + response.status + ") for URL:\n" + url + "\n\n" +
              "Please check your server health and try again."
            );
          }
        }
      } catch (err: any) {
        console.error("[Auth Poll] Exception during auth polling:", err);
        consecutiveErrors++;
        if (consecutiveErrors >= 5) {
          clearInterval(intervalId);
          setAuthenticating(false);
          setToastMessage("");
          setPollingState(null);
          setErrorToast(
            "Connection Error: Unable to reach the server.\n\n" +
            "Attempted URL:\n" + url + "\n\n" +
            "Error details: " + (err.message || err) + "\n\n" +
            "Please check that the server is running and accessible."
          );
        }
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [pollingState, onLogin]);

  // Listen for custom "handleOpenURL" events triggered by custom URL schemes
  useEffect(() => {
    let foregroundInterval: any = null;
    const handleDeepLink = async (e: Event) => {
      const url = (e as CustomEvent).detail;
      console.log("[Auth Debug] Received deep link event:", url);
      
      let state: string | null = null;
      try {
        // Restrict state to alphanumeric and underscores to ignore trailing slash/hash
        const match = url.match(/[?&]state=([a-zA-Z0-9_]+)/);
        if (match && match[1]) {
          state = match[1];
        }
      } catch (err) {
        console.error("Error parsing deep link state:", err);
      }

      if (state) {
        console.log("[Auth Debug] Parsed state from deep link:", state);
        setPollingState(state);
        setAuthenticating(true);
        setToastMessage("Verifying secure login...");

        if (foregroundInterval) {
          clearInterval(foregroundInterval);
        }

        let attempts = 0;
        const maxAttempts = 15;
        let consecutiveErrors = 0;
        
        foregroundInterval = setInterval(async () => {
          attempts++;
          if (attempts > maxAttempts) {
            if (foregroundInterval) clearInterval(foregroundInterval);
            console.log("[Auth Debug] Active foreground deep-link poll timed out, fallback to background check.");
            return;
          }
          
          const requestUrl = getApiUrl(`/api/auth/external-poll?state=${state}`);
          try {
            const response = await fetch(requestUrl);
            if (response.ok) {
              consecutiveErrors = 0;
              const data = await response.json();
              if (data.status === "completed") {
                if (foregroundInterval) clearInterval(foregroundInterval);
                setToastMessage("Loading secure workspace...");
                setPollingState(null);
                setTimeout(() => {
                  onLogin({
                    name: data.user.name,
                    email: data.user.email,
                    avatar: data.user.avatar,
                    token: data.token,
                    isNew: data.isNew
                  });
                }, 800);
              } else if (data.status === "error") {
                if (foregroundInterval) clearInterval(foregroundInterval);
                setAuthenticating(false);
                setToastMessage("");
                setPollingState(null);
                setErrorToast("Google Authentication failed: " + (data.error || "Unknown error"));
              }
            } else {
              consecutiveErrors++;
              if (consecutiveErrors >= 5) {
                if (foregroundInterval) clearInterval(foregroundInterval);
                setAuthenticating(false);
                setToastMessage("");
                setPollingState(null);
                setErrorToast(
                  "Connection Error: Server returned status (" + response.status + ") for URL:\n" + requestUrl + "\n\n" +
                  "Please check your server health and try again."
                );
              }
            }
          } catch (err: any) {
            console.error("[Auth Poll] Foreground poll exception:", err);
            consecutiveErrors++;
            if (consecutiveErrors >= 5) {
              if (foregroundInterval) clearInterval(foregroundInterval);
              setAuthenticating(false);
              setToastMessage("");
              setPollingState(null);
              setErrorToast(
                "Connection Error: Unable to reach the server.\n\n" +
                "Attempted URL:\n" + requestUrl + "\n\n" +
                "Error details: " + (err.message || err) + "\n\n" +
                "Please verify that the server is running and accessible."
              );
            }
          }
        }, 1000);
      }
    };

    window.addEventListener("handleOpenURL", handleDeepLink);
    return () => {
      window.removeEventListener("handleOpenURL", handleDeepLink);
      if (foregroundInterval) {
        clearInterval(foregroundInterval);
      }
    };
  }, [onLogin]);

  const handleGoogleSignIn = async () => {
    setAuthenticating(true);

    if (isNativeApp()) {
      const state = "floura_" + Math.random().toString(36).substring(2) + Date.now();
      const startUrl = getApiUrl(`/api/auth/external-start?state=${state}`);

      setToastMessage("Opening your system browser...");
      
      try {
        const win = window as any;
        if (win.ReactNativeWebView !== undefined) {
          console.log("[Auth Debug] Launching secure external browser auth flow via React Native WebView message:", startUrl);
          win.ReactNativeWebView.postMessage(JSON.stringify({ type: "open_url", url: startUrl }));
        } else if (win.cordova !== undefined) {
          console.log("[Auth Debug] Launching secure external browser auth flow via Cordova browser:", startUrl);
          const iab = win.cordova.InAppBrowser || win.SafariViewController;
          if (iab) {
            iab.open(startUrl, "_system");
          } else {
            window.open(startUrl, "_system");
          }
        } else {
          console.log("[Auth Debug] Launching secure external browser auth flow via window.open system:", startUrl);
          window.open(startUrl, "_system");
        }
        
        setTimeout(() => {
          setToastMessage("Please complete Sign-In in your browser...");
        }, 1500);

        setPollingState(state);
      } catch (err: any) {
        console.error("[Auth Debug] Failed to invoke native browser launcher:", err);
        window.open(startUrl, "_blank");
        setPollingState(state);
        setTimeout(() => {
          setToastMessage("Please complete Sign-In in your browser...");
        }, 1500);
      }
    } else {
      setToastMessage("Opening Google Sign-In...");
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const googleUser = result.user;
        
        if (!googleUser.email) {
          throw new Error("No email found in your Google profile.");
        }

        const emailLower = googleUser.email.toLowerCase().trim();

        setToastMessage("Verifying workspace credentials...");
        
        const displayName = googleUser.displayName || "";
        let formattedName = displayName;
        if (displayName && !displayName.toLowerCase().startsWith("chef ")) {
          formattedName = "Chef " + displayName;
        }

        const response = await fetch(getApiUrl("/api/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailLower,
            name: formattedName || undefined,
            avatar: googleUser.photoURL || undefined,
            isGoogle: true
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Workspace verification failed.");
        }

        const data = await response.json();
        setToastMessage("Loading secure workspace...");
        
        setTimeout(() => {
          onLogin({
            name: data.user.name,
            email: data.user.email,
            avatar: data.user.avatar,
            token: data.token,
            isNew: data.isNew
          });
        }, 800);
      } catch (err: any) {
        console.error("[Auth Debug] Google Login flow failed with exception:", err);
        let userMessage = err.message || String(err);
        if (err.code === "auth/popup-closed-by-user" || (err.message && err.message.includes("popup-closed-by-user"))) {
          userMessage = "Sign-in cancelled. The login popup was closed before completion.";
        } else if (err.code === "auth/network-request-failed" || (err.message && err.message.includes("network-request-failed"))) {
          userMessage = "Network error. Please check your internet connection and try again.";
        } else {
          userMessage = "Access Denied: " + userMessage + "\n\nPlease check your connection and try logging in again.";
        }
        setErrorToast(userMessage);
        setAuthenticating(false);
        setToastMessage("");
      }
    }
  };

  return {
    authenticating,
    toastMessage,
    errorToast,
    setErrorToast,
    activeModal,
    setActiveModal,
    handleGoogleSignIn,
  };
}
