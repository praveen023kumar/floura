import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldAlert, 
  LogOut, 
  Mail, 
  RefreshCw, 
  XCircle, 
  X, 
  Sparkles, 
  Lock,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  ArrowRight
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
    otpCode,
    setOtpCode,
    isOtpSent,
    isSendingOtp,
    isVerifyingOtp,
    otpCountdown,
    authenticating,
    toastMessage,
    errorToast,
    setErrorToast,
    activeModal,
    setActiveModal,
    handleSendOtp,
    handleVerifyOtp,
    handleResetOtp,
  } = useLogin({ onLogin });

  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const userEmail = user?.email || "";

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage?.removeItem("floura_reauth_reason");
        window.sessionStorage?.removeItem("floura_reauth_return_to");
      }
    } catch {}
    try {
      await onLogout?.();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    navigate("/", { replace: true });
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/reauthenticate")) {
        window.location.href = "/";
      }
    }, 100);
  };

  let fallbackEmail = "";
  try {
    const rawSaved = typeof window !== "undefined" ? window.localStorage?.getItem("patisserie_user") : null;
    if (rawSaved) {
      const parsed = JSON.parse(rawSaved);
      if (parsed?.email) fallbackEmail = parsed.email;
    }
  } catch {}

  const activeEmail = 
    user?.email || 
    fallbackEmail ||
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
          Your active security workspace signature is no longer synchronized with the cloud database. Verify your email to refresh your credentials and safely access your recipes, orders, and customer records.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          {!isOtpSent ? (
            <button
              type="button"
              onClick={() => handleSendOtp(activeEmail)}
              disabled={authenticating}
              className="w-full flex items-center justify-center gap-2.5 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-bold text-xs uppercase tracking-wider"
            >
              {isSendingOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Send Code to {activeEmail}</span>
                </>
              )}
            </button>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(otpCode, activeEmail); }} className="space-y-3">
              <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-2.5 leading-relaxed text-left">
                Code sent! Please check your <strong>Inbox</strong> and <strong>Spam / Junk</strong> folder for your 6-digit verification code.
              </p>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  required
                  autoFocus
                  disabled={isVerifyingOtp}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-center text-lg font-mono font-black tracking-[0.4em] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 outline-none focus:ring-2 focus:ring-primary-brand"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                className="w-full flex items-center justify-center gap-2.5 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-bold text-xs uppercase tracking-wider"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Reconnect</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={handleResetOtp}
                  className="text-zinc-500 hover:underline text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOtp(activeEmail)}
                  disabled={isSendingOtp || otpCountdown > 0}
                  className="text-primary-brand dark:text-orange-400 font-bold hover:underline disabled:opacity-40 text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend Code"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Sign Out / Switch Account */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={authenticating || signingOut}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {signingOut ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out / Use Another Account</span>
              </>
            )}
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
