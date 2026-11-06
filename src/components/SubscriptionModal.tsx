// File Path: /src/components/SubscriptionModal.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Zap,
  ArrowRight
} from "lucide-react";
import {
  SUBSCRIPTION_PLANS,
  initiateRazorpayPayment,
  fetchPaymentConfig,
  SubscriptionPlan
} from "../utils/razorpay";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  currentExpiry?: string | null;
  onSubscriptionUpdated?: (data: { newExpiry: string; status: string }) => void;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  user,
  currentExpiry,
  onSubscriptionUpdated
}: SubscriptionModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("3_months");
  const [customMonths, setCustomMonths] = useState<number>(1);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      fetchPaymentConfig().then((cfg) => {
        if (cfg?.plans && cfg.plans.length > 0) {
          setPlans(cfg.plans);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const activeMonths = isCustom ? customMonths : selectedPlan.months;
  const activeAmount = isCustom ? customMonths * 99 : selectedPlan.price;

  // Calculate prospective new expiry
  const now = Date.now();
  const currentExpiryTime = currentExpiry ? new Date(currentExpiry).getTime() : 0;
  const baseTime = currentExpiryTime > now ? currentExpiryTime : now;
  const prospectiveExpiry = new Date(baseTime + activeMonths * 30 * 24 * 60 * 60 * 1000);

  const formattedCurrentExpiry = currentExpiry
    ? new Date(currentExpiry).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "Expired / Inactive";

  const formattedNewExpiry = prospectiveExpiry.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const handlePay = () => {
    if (!user?.email) {
      setErrorMsg("Please log in to renew your subscription.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    initiateRazorpayPayment({
      userEmail: user.email,
      userName: user.name || "Bakery Owner",
      userPhone: user.phone || "",
      planId: isCustom ? undefined : selectedPlanId,
      customMonths: isCustom ? customMonths : undefined,
      customAmount: isCustom ? activeAmount : undefined,
      onSuccess: (res) => {
        setLoading(false);
        setSuccessMsg(res.message || "Subscription validity successfully extended!");
        onSubscriptionUpdated?.({
          newExpiry: res.newExpiry,
          status: "active"
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      },
      onError: (errMsg) => {
        setLoading(false);
        setErrorMsg(errMsg);
      },
      onDismiss: () => {
        setLoading(false);
      }
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Extend Bakery Pro Validity
              </h2>
              <p className="text-xs text-zinc-400">
                Seamless online renewal powered by Razorpay
              </p>
            </div>
          </div>

          {/* Current vs New Expiry Strip */}
          <div className="mt-5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Current Expiry
              </span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {formattedCurrentExpiry}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0 mx-2" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-primary-brand dark:text-orange-400 uppercase tracking-wider block">
                New Validity
              </span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {formattedNewExpiry}
              </span>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="mt-5 space-y-2">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Select Subscription Plan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {plans.map((p) => {
                const isSelected = !isCustom && selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedPlanId(p.id);
                    }}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? "border-primary-brand bg-primary-brand-light/40 dark:bg-primary-brand-dark/20 dark:border-orange-400 shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                    }`}
                  >
                    {p.discount > 0 && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-primary-brand dark:bg-orange-500 text-white shadow-xs">
                        SAVE {p.discount}%
                      </span>
                    )}
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                      {p.name}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg font-black text-primary-brand dark:text-orange-400">
                        ₹{p.price}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        ({p.months * 30} days)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Months Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-xs font-semibold text-primary-brand dark:text-orange-400 hover:text-primary-brand-dark dark:hover:text-orange-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                {isCustom ? "Choose from standard plans" : "Or pick custom number of months"}
              </button>

              {isCustom && (
                <div className="mt-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={36}
                      value={customMonths}
                      onChange={(e) => setCustomMonths(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-center"
                    />
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                      Months (@ ₹99/mo)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block text-[10px]">Total Amount</span>
                    <span className="text-base font-bold text-primary-brand dark:text-orange-400">
                      ₹{activeAmount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Unlimited Cake Orders
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Recipe Batch Scaler
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Ingredient Low-Stock Alerts
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Offline Sync & Encryption
            </span>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs text-center font-bold">
              {successMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-5 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="flex-2 py-3 px-4 rounded-xl font-bold text-xs bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 active:scale-98 text-white shadow-lg shadow-primary-brand/25 dark:shadow-orange-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{activeAmount} with Razorpay</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Security Badges */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-bit SSL Encrypted
            </span>
            <span>•</span>
            <span>UPI, Cards, NetBanking</span>
            <span>•</span>
            <span>Instant Activation</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
