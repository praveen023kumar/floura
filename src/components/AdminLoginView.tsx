// File Path: /src/components/AdminLoginView.tsx
import { useState } from "react";
import { RefreshCw, XCircle, X, Lock, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import flouraLogo from "../assets/images/floura_logo.jpg";
import bakeryLoginBanner from "../assets/images/bakery_login_banner_1783080828078.jpg";
import { getApiUrl } from "../utils/api";

interface AdminLoginViewProps {
  onLogin: (user: { name: string; email: string; avatar: string; token: string; role: string; permissions: string[] }) => void;
}

export default function AdminLoginView({ onLogin }: AdminLoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [errorToast, setErrorToast] = useState("");

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthenticating(true);
    setErrorToast("");

    try {
      const response = await fetch(getApiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Admin verification check failed.");
      }

      const data = await response.json();
      onLogin({
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar,
        token: data.token,
        role: data.user.role,
        permissions: data.user.permissions
      });
    } catch (err: any) {
      console.error("[Admin Portal Login Exception]:", err);
      setErrorToast("Access Denied: " + err.message);
    } finally {
      setAuthenticating(false);
    }
  };

  const prefillSuperadminCreds = () => {
    setEmail("superadmin@floura.com");
    setPassword("FlouraAdmin#SuperSecure!2026");
  };

  return (
    <div id="admin-login-viewport" className="min-h-screen w-screen flex flex-col md:flex-row bg-zinc-950 transition-colors duration-300">
      
      {/* LEFT PANEL (Banner info) */}
      <div className="relative w-full h-[30vh] md:h-screen md:w-[50%] lg:w-[55%] xl:w-[60%] overflow-hidden shrink-0">
        <img 
          src={bakeryLoginBanner} 
          alt="Secure Admin Center" 
          className="w-full h-full object-cover select-none brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-black/40 flex flex-col justify-end p-6 md:p-12 lg:p-16 text-left">
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md flex items-center gap-3">
              Floura Control Center <Lock className="w-6 h-6 text-orange-400 stroke-[2.5]" />
            </h2>
            <p className="font-sans text-xs md:text-sm font-semibold text-orange-300 mt-2 tracking-wide drop-shadow-sm">
              Secure Operations, Logs, & System Policies
            </p>
            <p className="hidden md:block text-[11px] lg:text-xs text-zinc-400 font-sans font-medium leading-relaxed max-w-md mt-4 border-l-2 border-orange-500 pl-3">
              "This portal is strictly restricted to authorized administrative users. All system sessions are dynamically recorded, encrypted, and governed by role-based access control guidelines."
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (Form) */}
      <div className="w-full md:w-[50%] lg:w-[45%] xl:w-[40%] flex-grow relative bg-zinc-900 rounded-t-[40px] md:rounded-t-none -mt-10 md:mt-0 px-6 pt-12 pb-10 md:py-16 md:px-12 lg:px-16 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col justify-center items-center z-10 text-white">
        
        {/* Logo badge */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 md:static md:translate-x-0 w-20 h-20 bg-zinc-800 shadow-xl border border-zinc-700 rounded-full flex items-center justify-center z-20 shrink-0 overflow-hidden p-0.5 mb-6">
          <img 
            src={flouraLogo} 
            alt="Floura Logo" 
            className="w-full h-full rounded-full object-cover select-none" 
          />
        </div>

        <div className="w-full max-w-[340px] text-center flex flex-col items-center">
          <h1 className="font-serif text-2xl font-black text-zinc-100 tracking-tight leading-tight flex items-center gap-2">
            Admin Portal Sign-In
          </h1>
          <p className="font-sans text-xs font-semibold text-zinc-400 max-w-[280px] mt-2 mb-8">
            Access secure admin statistics, review feedback lists, and provision credentials.
          </p>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left w-full">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Admin Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@floura.com"
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Secure Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authenticating}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-655 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-sans"
            >
              {authenticating ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-white" />
                  <span className="text-xs uppercase tracking-wider font-bold font-sans">Verify Credentials</span>
                </>
              )}
            </button>

            {/* Mock admin auto fill trigger */}
            <button
              type="button"
              onClick={prefillSuperadminCreds}
              className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 font-semibold transition-colors mt-2 focus:outline-none cursor-pointer"
            >
              ⚡ Click to auto-fill mockup superadmin credentials
            </button>
          </form>
        </div>

      </div>

      {/* error toast message */}
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

    </div>
  );
}
