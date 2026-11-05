// File Path: /src/components/SubscriptionBlockedView.tsx
import { useState } from "react";
import { 
  ShieldAlert, 
  CreditCard, 
  RefreshCw, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  Mail, 
  PhoneCall,
  Calendar
} from "lucide-react";
import { motion } from "motion/react";
import { getApiUrl, getDeviceId } from "../utils/api";
import flouraLogo from "../assets/images/floura_logo.webp";

interface SubscriptionBlockedViewProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    token?: string;
    is_active?: number;
    subscription_status?: string;
    subscription_expires_at?: string;
    last_payment_date?: string;
  };
  onRefreshStatus: () => void;
  onLogout: () => void;
  darkMode: boolean;
}

export default function SubscriptionBlockedView({
  user,
  onRefreshStatus,
  onLogout,
  darkMode
}: SubscriptionBlockedViewProps) {
  const [checking, setChecking] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const UPI_ID = "kydigit@upi"; // Replace or customize as needed
  const SUPPORT_EMAIL = "hello@kydigit.com";

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/subscription-status?userEmail=${encodeURIComponent(user.email)}`, {
        headers: {
          "Authorization": `Bearer ${user.token || ""}`,
          "x-device-id": getDeviceId()
        }
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        if (!data.is_expired && data.is_active !== 0) {
          setMessage({ text: "Payment verified! Your account is active.", type: "success" });
          setTimeout(() => {
            onRefreshStatus();
          }, 800);
          return;
        } else {
          setMessage({
            text: "Your account is still awaiting payment confirmation. If you already paid, please allow a moment for manual verification.",
            type: "info"
          });
        }
      } else {
        setMessage({ text: data.error || "Unable to verify subscription status.", type: "error" });
      }
    } catch {
      setMessage({ text: "Network connection error while checking status.", type: "error" });
    } finally {
      setChecking(false);
    }
  };

  const formattedExpiry = user.subscription_expires_at 
    ? new Date(user.subscription_expires_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : "Expired";

  const isDeactivated = user.is_active === 0;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${
      darkMode ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
    }`}>
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border ${
          darkMode 
            ? "bg-zinc-900/90 border-zinc-800" 
            : "bg-white border-zinc-200/80 shadow-rose-950/5"
        }`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <img src={flouraLogo} alt="Floura" className="w-10 h-10 object-contain rounded-xl" />
            <div>
              <h1 className="font-serif font-black text-xl tracking-tight text-rose-700 dark:text-rose-400">Floura</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Bakery & Order Management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Status Alert Banner */}
        <div className="mt-6 p-4 rounded-2xl flex items-start gap-3.5 border bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400">
          <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h2 className="font-bold">
              {isDeactivated ? "Account Deactivated" : "Free Trial / Plan Expired"}
            </h2>
            <p className="mt-1 text-xs opacity-90 leading-relaxed">
              {isDeactivated 
                ? "Your account access has been suspended. Please complete your subscription payment or contact admin to restore your bakery workspace."
                : `Your 30-day free trial expired on ${formattedExpiry}. To keep accessing your cake orders, recipes, and customers, please renew your subscription.`
              }
            </p>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
              Bakery Pro Plan
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-rose-100">
              <Sparkles className="w-3.5 h-3.5" /> All Features Included
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">₹99</span>
            <span className="text-sm font-medium text-rose-100">/ month INR</span>
          </div>

          <ul className="mt-4 space-y-1.5 text-xs text-rose-50">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Unlimited Custom Cake & Pastry Orders
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Recipe Costing & Auto-Batch Scaler
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Ingredient Inventory & Low-Stock Alerts
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Offline-First Mobile & Web Access
            </li>
          </ul>
        </div>

        {/* Payment Instructions */}
        <div className={`mt-6 p-4 rounded-2xl border ${
          darkMode ? "bg-zinc-800/60 border-zinc-700/60" : "bg-zinc-50 border-zinc-200"
        }`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            How to Pay & Activate
          </h3>
          
          <div className="space-y-3 text-xs">
            {/* Registered Account Email - Moved to Top */}
            <div 
              onClick={handleCopyEmail}
              className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 cursor-pointer hover:bg-rose-500/15 transition-all group active:scale-[0.99]"
              title="Click to copy registered email"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-rose-700 dark:text-rose-400">Registered Account Email</p>
                  <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyEmail();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ml-2"
                title="Copy Registered Email"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                <span className="text-[11px]">{copiedEmail ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div 
              onClick={handleCopyUpi}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-rose-400 dark:hover:border-rose-500/60 hover:shadow-xs transition-all group active:scale-[0.99]"
              title="Click to copy UPI ID"
            >
              <div>
                <p className="text-[10px] text-zinc-500">Pay via UPI (GPay / PhonePe / Paytm):</p>
                <p className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400 group-hover:underline">{UPI_ID}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyUpi();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 font-semibold transition-all cursor-pointer active:scale-95"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                <span className="text-[11px]">{copiedUpi ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              After transferring <strong>₹99</strong> (or multiple months), include your registered email in the UPI note. Our team will verify and your account will automatically activate.
            </p>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Floura%20Subscription%20Activation%20-%20${encodeURIComponent(user.email)}`}
                className="flex items-center gap-1.5 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer hover:underline"
                title="Send support email"
              >
                <Mail className="w-3.5 h-3.5 text-rose-500" /> Support: {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-medium text-center ${
            message.type === "success" 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : message.type === "error"
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          }`}>
            {message.text}
          </div>
        )}

        {/* Action Button: Check Status */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 active:scale-98 text-white shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Subscription Status..." : "I Have Paid / Refresh Status"}
          </button>
          <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500">
            Status updates instantly once payment is logged by the admin team.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
