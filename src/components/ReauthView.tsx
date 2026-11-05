// File Path: /src/components/ReauthView.tsx
import React, { useState } from "react";
import { 
  ShieldAlert, 
  LogOut, 
  Mail, 
  RefreshCw, 
  XCircle, 
  X, 
  Sparkles, 
  Lock 
} from "lucide-react";
import { motion } from "motion/react";
import flouraLogo from "../assets/images/floura_logo.png";
import { useLogin } from "../hooks/useLogin";
import LegalModal from "./LegalModal";

interface ReauthViewProps {
  user: {
    name?: string;
    email?: string;
    avatar?: string;
    token?: string;
    [key: string]: any;
  } | null;
  onLogin: (user: any) => void;
  onLogout: () => void;
  darkMode: boolean;
}

export default function ReauthView({
  user,
  onLogin,
  onLogout,
  darkMode
}: ReauthViewProps) {
  const {
    authenticating,
    toastMessage,
    errorToast,
    setErrorToast,
    activeModal,
    setActiveModal,
    handleGoogleSignIn
  } = useLogin({ onLogin });

  const activeEmail = 
    user?.email || 
    (typeof window !== "undefined" ? window.localStorage?.getItem("patisserie_last_synced_email") : "") ||
    "your registered email";

  const savedReason = 
    (typeof window !== "undefined" ? window.sessionStorage?.getItem("floura_reauth_reason") : null) ||
    "Access Denied: Invalid security workspace signature. Please re-authenticate.";

  return (
    <div className={`min-h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${
      darkMode ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border ${
          darkMode 
            ? "bg-zinc-900/95 border-zinc-800" 
            : "bg-white border-zinc-150 shadow-rose-950/5"
        } flex flex-col items-center text-center`}
      >
        {/* Brand Logo & Security Icon */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-750 flex items-center justify-center p-0.5 overflow-hidden">
            <img 
              src={flouraLogo} 
              alt="Floura Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full rounded-full object-cover select-none" 
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-900">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-zinc-850 dark:text-zinc-100 mb-1">
          Re-Authentication Required
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-6">
          Floura Workspace Security Protection
        </p>

        {/* Error Callout Banner matching user screenshot */}
        <div className="w-full p-3.5 mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-left flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs font-bold leading-relaxed">
            ⚠️ {savedReason}
          </div>
        </div>

        {/* Account Info Box */}
        <div className={`w-full p-4 mb-6 rounded-2xl border text-left flex items-center justify-between ${
          darkMode ? "bg-zinc-800/40 border-zinc-800" : "bg-zinc-50 border-zinc-200/80"
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                Primary Account ID
              </p>
              <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
                {activeEmail}
              </p>
            </div>
          </div>
          <span className="shrink-0 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
            Locked
          </span>
        </div>

        {/* Explanation */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6 font-medium">
          Your active security workspace signature is no longer synchronized with the cloud database. Please sign in again with Google to refresh your credentials and safely access your recipes, orders, and customer records.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          {/* Sign In Again with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={authenticating}
            className="w-full flex items-center justify-center gap-3 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-bold text-xs uppercase tracking-wider"
          >
            {authenticating ? (
              <>
                <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-0.5 shrink-0 shadow-xs">
                  <svg className="w-full h-full" viewBox="0 0 48 48">
                    <path
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      fill="#EA4335"
                    />
                    <path
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      fill="#4285F4"
                    />
                    <path
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      fill="#34A853"
                    />
                  </svg>
                </div>
                <span>Sign In Again with Google</span>
              </>
            )}
          </button>

          {/* Sign Out / Switch Account */}
          <button
            type="button"
            onClick={onLogout}
            disabled={authenticating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-98"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Use Another Account</span>
          </button>
        </div>

        {/* Security Assurance Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-6">
          <Sparkles className="w-3.5 h-3.5 text-primary-brand dark:text-orange-400 animate-pulse" />
          <span>Encrypted Session Re-synchronization</span>
        </div>
      </motion.div>

      {/* Persistent loading feedback toasts */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-primary-brand dark:bg-orange-500 text-white px-5 py-2.5 rounded-full shadow-lg font-sans text-xs font-bold animate-pulse flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-5 py-3 rounded-2xl shadow-xl font-sans text-xs font-semibold max-w-sm flex items-center justify-between gap-3 border border-rose-600">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-white shrink-0" />
            <span className="whitespace-pre-wrap leading-relaxed text-left text-[11px]">{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast("")} className="text-white hover:text-rose-100 p-0.5 cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <LegalModal 
        isOpen={activeModal !== null} 
        type={activeModal} 
        onClose={() => setActiveModal(null)} 
      />
    </div>
  );
}
