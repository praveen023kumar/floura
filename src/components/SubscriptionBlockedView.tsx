// File Path: /src/components/SubscriptionBlockedView.tsx
import { useState, useEffect } from "react";
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
import {
  initiateRazorpayPayment,
  SUBSCRIPTION_PLANS,
  fetchPaymentConfig,
  SubscriptionPlan
} from "../utils/razorpay";

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
  const [plans, setPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("1_month");
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showManualUpi, setShowManualUpi] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    fetchPaymentConfig().then((cfg) => {
      if (cfg?.plans && cfg.plans.length > 0) {
        setPlans(cfg.plans);
      }
    });
  }, []);

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

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleRazorpayPay = () => {
    setPaying(true);
    setMessage(null);

    initiateRazorpayPayment({
      userEmail: user.email,
      userName: user.name || "Bakery Owner",
      planId: selectedPlanId,
      onSuccess: (data) => {
        setPaying(false);
        setMessage({ text: data.message || "Payment verified! Activating workspace...", type: "success" });
        try {
          const saved = localStorage.getItem("patisserie_user");
          if (saved) {
            const parsed = JSON.parse(saved);
            localStorage.setItem(
              "patisserie_user",
              JSON.stringify({
                ...parsed,
                subscription_expires_at: data.newExpiry,
                subscription_status: "active",
                is_active: 1
              })
            );
          }
        } catch {}
        setTimeout(() => {
          onRefreshStatus();
        }, 1200);
      },
      onError: (err) => {
        setPaying(false);
        setMessage({ text: err, type: "error" });
      },
      onDismiss: () => {
        setPaying(false);
      }
    });
  };

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
              <h1 className="font-serif font-black text-xl tracking-tight text-primary-brand dark:text-orange-400">Floura</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Bakery & Order Management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-primary-brand dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
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

        {/* Plan Selector Tabs */}
        <div className="mt-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Choose Subscription Duration
          </span>
          <div className="grid grid-cols-3 gap-2">
            {plans.slice(0, 3).map((p) => {
              const isSelected = selectedPlanId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer relative ${
                    isSelected
                      ? "border-primary-brand bg-primary-brand-light/40 dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-300 font-bold shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {p.discount > 0 && (
                    <span className="absolute -top-2 right-1 px-1 py-0.2 rounded-full text-[8px] font-black bg-primary-brand dark:bg-orange-500 text-white shadow-xs">
                      -{p.discount}%
                    </span>
                  )}
                  <p className="text-[11px] leading-tight">{p.name}</p>
                  <p className="text-xs font-black text-primary-brand dark:text-orange-400 mt-0.5">₹{p.price}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Card */}
        <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-primary-brand to-primary-brand-dark text-white shadow-lg shadow-primary-brand/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
              Bakery Pro Plan
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-pink-100">
              <Sparkles className="w-3.5 h-3.5" /> All Features Included
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">₹{selectedPlan.price}</span>
            <span className="text-sm font-medium text-pink-100">
              for {selectedPlan.months * 30} days INR
            </span>
          </div>

          <ul className="mt-4 space-y-1.5 text-xs text-pink-50">
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

        {/* Primary CTA: Razorpay Instant Payment */}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleRazorpayPay}
            disabled={paying}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 active:scale-98 text-white shadow-lg shadow-primary-brand/25 dark:shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Opening Razorpay Checkout...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{selectedPlan.price} & Activate Instantly</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-zinc-400">
            UPI (GPay / PhonePe / Paytm), Credit & Debit Cards, NetBanking supported.
          </p>
        </div>

        {/* Collapsible Manual UPI Instructions */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowManualUpi(!showManualUpi)}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
          >
            {showManualUpi ? "Hide Manual UPI details" : "Or pay manually via UPI transfer"}
          </button>
        </div>

        {showManualUpi && (
          <div className={`mt-3 p-4 rounded-2xl border ${
            darkMode ? "bg-zinc-800/60 border-zinc-700/60" : "bg-zinc-50 border-zinc-200"
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-primary-brand dark:text-orange-400" />
              Manual UPI Transfer Details
            </h3>
            
            <div className="space-y-3 text-xs">
              <div 
                onClick={handleCopyEmail}
                className="flex items-center justify-between p-2.5 rounded-xl bg-primary-brand-light/40 dark:bg-primary-brand-dark/20 border border-primary-brand/20 cursor-pointer hover:bg-primary-brand-light/60 transition-all group active:scale-[0.99]"
                title="Click to copy registered email"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-primary-brand-light dark:bg-primary-brand-dark/40 text-primary-brand dark:text-orange-400 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-primary-brand dark:text-orange-400">Registered Account Email</p>
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
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-primary-brand dark:hover:border-orange-500/60 hover:shadow-xs transition-all group active:scale-[0.99]"
                title="Click to copy UPI ID"
              >
                <div>
                  <p className="text-[10px] text-zinc-500">UPI ID:</p>
                  <p className="font-mono font-bold text-sm text-primary-brand dark:text-orange-400 group-hover:underline">{UPI_ID}</p>
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
                After transferring ₹{selectedPlan.price}, include your email in the UPI note. Then click the verification button below.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={checking}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 text-white flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
                  {checking ? "Checking..." : "I Have Paid / Refresh Status"}
                </button>
              </div>
            </div>
          </div>
        )}

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
      </motion.div>
    </div>
  );
}
