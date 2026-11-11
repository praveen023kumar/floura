import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, RefreshCw, XCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import bakeryLoginBanner from "../assets/images/bakery_login_banner_1783080828078.webp";
import flouraLogo from "../assets/images/floura_logo.png";
import { getApiUrl, getDeviceId } from "../utils/api";
import LegalModal from "./LegalModal";

interface DemoLoginViewProps {
  onLogin: (user: { name: string; email: string; avatar: string; token: string; isNew?: boolean }) => void;
}

export default function DemoLoginView({ onLogin }: DemoLoginViewProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "disclaimer" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Please enter both username/email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(getApiUrl("/api/auth/demo-login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": getDeviceId()
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          deviceId: getDeviceId()
        })
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.error || "Authentication failed. Please verify credentials.");
      }

      onLogin({
        ...data.user,
        token: data.token,
        isNew: data.isNew
      });

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("[Demo Login] Error:", err);
      setErrorMsg(err.message || "Failed to log in with test credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* LEFT PANEL: Hero Banner */}
      <div className="relative w-full h-[28vh] md:h-screen md:w-[48%] lg:w-[52%] overflow-hidden shrink-0">
        <img
          src={bakeryLoginBanner}
          alt="Premium Floura Bakery"
          className="w-full h-full object-cover object-center select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-zinc-950/80 via-zinc-950/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 text-white hidden md:block">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider mb-3 border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Demo Workspace
          </div>
          <h2 className="text-2xl lg:text-3xl font-serif font-black tracking-tight leading-tight">
            Razorpay Compliance & Auditor Portal
          </h2>
          <p className="text-xs text-white/80 max-w-md mt-2">
            Secure, end-to-end sandbox access for payment gateway review and platform verification.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Form Container */}
      <div className="flex-1 w-full relative bg-white dark:bg-zinc-900 px-6 py-8 md:py-12 md:px-10 lg:px-14 flex flex-col justify-center items-center z-10 overflow-y-auto">
        {/* Top Back Link */}
        <Link
          to="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-primary-brand dark:hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        {/* Brand Circular Badge */}
        <div className="w-16 h-16 bg-white dark:bg-zinc-800 shadow-lg border border-zinc-150 dark:border-zinc-750 rounded-full flex items-center justify-center mb-4 transition-all hover:scale-105 shrink-0 overflow-hidden p-0.5">
          <img
            src={flouraLogo}
            alt="Floura Logo"
            className="w-full h-full rounded-full object-cover select-none"
          />
        </div>

        <div className="w-full max-w-[380px] text-center flex flex-col items-center">
          <h1 className="font-serif text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
            Reviewer Sign In
          </h1>
          <p className="font-sans text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 mb-8">
            Enter your reviewer credentials to access the compliance test workspace
          </p>

          {/* Error Banner */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 text-left"
            >
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 text-left mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@kydigit.com"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary-brand dark:focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 text-left mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter 8-digit password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary-brand dark:focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-bold text-xs uppercase tracking-wider mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Demo Workspace</span>
              )}
            </button>
          </form>

          {/* Alternative login link */}
          <div className="mt-6 pt-5 border-t border-zinc-150 dark:border-zinc-800 w-full flex flex-col items-center gap-2">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              Want to sign in as a regular bakery owner?
            </span>
            <Link
              to="/login"
              className="text-xs font-bold text-primary-brand dark:text-orange-400 hover:underline"
            >
              Sign In with Google SSO →
            </Link>
          </div>

          {/* Legal Links */}
          <div className="mt-8 flex items-center justify-center gap-3 text-[10px] text-zinc-400 dark:text-zinc-500">
            <button
              type="button"
              onClick={() => setActiveModal("terms")}
              className="hover:underline cursor-pointer"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveModal("disclaimer")}
              className="hover:underline cursor-pointer"
            >
              Refund Policy
            </button>
          </div>
        </div>
      </div>

      <LegalModal isOpen={activeModal !== null} type={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
