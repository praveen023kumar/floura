// File Path: /src/components/LoginView.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, XCircle, X, ArrowLeft, Mail, KeyRound, ArrowRight, RotateCcw, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import bakeryLoginBanner from "../assets/images/bakery_login_banner_1783080828078.webp";
import LegalModal from "./LegalModal";
import flouraLogo from "../assets/images/floura_logo.png";
import { isCordova, isElectron } from "../utils/api";
import { useLogin } from "../hooks/useLogin";

interface LoginViewProps {
  onLogin: (user: { name: string; email: string; avatar: string; token: string; isNew?: boolean }) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const showBackButton = !isCordova() && !isElectron();
  const {
    ownerEmail,
    setOwnerEmail,
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

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendOtp();
  };

  const onOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyOtp();
  };

  return (
    <div id="login-viewport" className="min-h-screen w-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* LEFT SECTION (Hero banner panel) */}
      <div id="login-hero-banner" className="relative w-full h-[35vh] md:h-screen md:w-[50%] lg:w-[55%] xl:w-[60%] overflow-hidden shrink-0">
        <img 
          src={bakeryLoginBanner} 
          alt="Premium Floura Bakery" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none"
        />
        {/* Dark warm overlay vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-black/30 flex flex-col justify-end p-6 md:p-12 lg:p-16 text-left">
          <div className="max-w-xl">
            <motion.h2 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="font-serif text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-md italic"
            >
              Bake Sweet Memories
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-sans text-sm md:text-lg lg:text-xl font-bold text-rose-300 dark:text-rose-200 mt-1 sm:mt-2 tracking-wide drop-shadow-sm flex items-center gap-1.5"
            >
              Anywhere, Everywhere! ✨
            </motion.p>
            {/* Elegant description blurb */}
            <p className="hidden md:block text-xs lg:text-sm text-zinc-300 font-sans font-medium leading-relaxed max-w-md mt-4 border-l-2 border-primary-brand pl-3 italic">
              "Organize your custom cake specifications, schedule automated reminders, track ingredient stocks, and analyze captured kitchen profit margins in India's premium baking command center."
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION (Clean login form panel) */}
      <div id="login-form-container" className="w-full md:w-[50%] lg:w-[45%] xl:w-[40%] flex-grow relative bg-white dark:bg-zinc-900 rounded-t-[40px] md:rounded-t-none -mt-10 md:mt-0 px-6 pt-12 pb-10 md:py-16 md:px-12 lg:px-16 shadow-2xl md:shadow-none border-t md:border-t-0 md:border-l border-zinc-100/50 dark:border-zinc-850 flex flex-col justify-center items-center z-10">
        
        {/* Top Home link */}
        {showBackButton && (
          <Link
            to="/"
            className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-primary-brand dark:hover:text-pink-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        )}
        
        {/* Rounded Brand Badge */}
        <div 
          id="brand-circular-badge" 
          className="absolute -top-10 left-1/2 -translate-x-1/2 md:static md:translate-x-0 w-20 h-20 bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-750 rounded-full flex items-center justify-center z-20 transition-all hover:scale-105 shrink-0 overflow-hidden p-0.5"
        >
          <img 
            src={flouraLogo} 
            alt="Floura Logo" 
            referrerPolicy="no-referrer"
            className="w-full h-full rounded-full object-cover select-none" 
          />
        </div>

        <div id="brand-form-wrapper" className="w-full max-w-[360px] text-center flex flex-col items-center mt-2 md:mt-6">
          {/* Main Titles */}
          <h1 className="font-serif text-2xl lg:text-3xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight">
            Sign In to Floura
          </h1>
          <p className="font-sans text-xs lg:text-sm font-semibold text-zinc-500 dark:text-zinc-400 max-w-[280px] mt-2 mb-6">
            Access your personalized kitchen workspace & orders securely
          </p>

          {/* Secure Email OTP Login Block */}
          <div className="w-full">
            {!isOtpSent ? (
              /* Step 1: Enter Email & Request OTP */
              <form onSubmit={onEmailSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Store Owner Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      type="email"
                      placeholder="owner@mybakery.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      required
                      disabled={isSendingOtp}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-primary-brand focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    A 6-digit verification code will be sent to your email.
                  </p>
                </div>

                <button
                  id="btn-send-otp"
                  type="submit"
                  disabled={isSendingOtp || !ownerEmail.trim() || !ownerEmail.includes("@")}
                  className="w-full flex items-center justify-center gap-2.5 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-bold text-xs uppercase tracking-wider"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter 6-digit OTP & Verify */
              <form onSubmit={onOtpSubmit} className="space-y-4 text-left">
                <div className="p-3 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-900/40 rounded-xl flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px] block">Sent to</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs font-mono">{ownerEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetOtp}
                    className="text-xs text-primary-brand dark:text-orange-400 font-bold hover:underline shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Spam/Junk folder guidance callout */}
                <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Can't find the email?</strong> Please check your <strong>Spam</strong> or <strong>Junk</strong> folder and click <em>"Report not spam"</em>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-center text-lg font-mono font-black tracking-[0.4em] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 outline-none focus:ring-2 focus:ring-primary-brand focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  id="btn-verify-otp"
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                  className="w-full flex items-center justify-center gap-2.5 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-bold text-xs uppercase tracking-wider"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Enter Workspace</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                    Didn't get the code?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={isSendingOtp || otpCountdown > 0}
                    className="flex items-center gap-1 font-bold text-primary-brand dark:text-orange-400 hover:underline disabled:opacity-40 cursor-pointer text-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend Code"}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium pt-5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-brand dark:text-orange-400" />
              <span>Direct Secure Workspace Authentication</span>
            </div>
          </div>

          {/* Terms & Agreement footer text */}
          <p className="mt-8 text-[10px] text-zinc-500 dark:text-zinc-400 text-center leading-normal max-w-[280px]">
            By continuing you agree to Floura's{" "}
            <button 
              onClick={(e) => { e.preventDefault(); setActiveModal("terms"); }}
              className="underline hover:text-primary-brand dark:hover:text-orange-400 font-semibold inline-block cursor-pointer focus:outline-none"
            >
              Terms & Conditions
            </button>,{" "}
            <button 
              onClick={(e) => { e.preventDefault(); setActiveModal("privacy"); }}
              className="underline hover:text-primary-brand dark:hover:text-orange-400 font-semibold inline-block cursor-pointer focus:outline-none"
            >
              Privacy Policy
            </button> &{" "}
            <button 
              onClick={(e) => { e.preventDefault(); setActiveModal("disclaimer"); }}
              className="underline hover:text-primary-brand dark:hover:text-orange-400 font-semibold inline-block cursor-pointer focus:outline-none"
            >
              Disclaimer
            </button>
          </p>
        </div>

      </div>

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
