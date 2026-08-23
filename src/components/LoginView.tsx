// File Path: /src/components/LoginView.tsx
import { useState } from "react";
import { RefreshCw, XCircle, X, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import bakeryLoginBanner from "../assets/images/bakery_login_banner_1783080828078.webp";
import LegalModal from "./LegalModal";
import flouraLogo from "../assets/images/floura_logo.webp";
import { getApiUrl } from "../utils/api";
import { useLogin } from "../hooks/useLogin";

interface LoginViewProps {
  onLogin: (user: { name: string; email: string; avatar: string; token: string; isNew?: boolean }) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const {
    authenticating,
    toastMessage,
    errorToast,
    setErrorToast,
    activeModal,
    setActiveModal,
    handleGoogleSignIn,
  } = useLogin({ onLogin });


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
            Sign In to Floura!
          </h1>
          <p className="font-sans text-xs lg:text-sm font-semibold text-zinc-500 dark:text-zinc-400 max-w-[280px] mt-2 mb-8">
            Access your personalized premium kitchen workspace & logs securely
          </p>

          {/* Secure Google Login Block */}
          <div className="w-full space-y-4">
            <button
              id="btn-login-google"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authenticating}
              className="group w-full flex items-center justify-center gap-3.5 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {authenticating ? (
                <RefreshCw className="w-5 h-5 text-white animate-spin shrink-0" />
              ) : (
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 shrink-0 shadow-sm">
                  <svg className="w-full h-full" viewBox="0 0 48 48">
                    <path
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      fill="#EA4335"
                    ></path>
                    <path
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      fill="#34A853"
                    ></path>
                  </svg>
                </div>
              )}
              <span className="font-bold text-xs uppercase tracking-wider font-sans">
                {authenticating ? "Verifying..." : "Sign In with Google"}
              </span>
            </button>
            
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium pt-1">
              <Sparkles className="w-3.5 h-3.5 text-primary-brand dark:text-orange-400 animate-pulse" />
              <span>100% Secure Google Cloud Authentication</span>
            </div>
          </div>

          {/* Terms & Agreement footer text */}
          <p className="mt-12 text-[10px] text-zinc-500 dark:text-zinc-400 text-center leading-normal max-w-[280px]">
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
