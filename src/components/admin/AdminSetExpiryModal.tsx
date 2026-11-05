import React, { useState, useEffect } from "react";
import { Calendar, X, RefreshCw, Check, Clock, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Avatar from "../Avatar";
import { RegisteredUserItem } from "./types";

interface AdminSetExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: RegisteredUserItem | null;
  onSaveExpiry: (email: string, expiryDate: string, subscriptionStatus: string) => Promise<void>;
  isSubmitting: boolean;
  formatDate: (dateStr: string) => string;
}

export default function AdminSetExpiryModal({
  isOpen,
  onClose,
  user,
  onSaveExpiry,
  isSubmitting,
  formatDate,
}: AdminSetExpiryModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [planStatus, setPlanStatus] = useState<string>("active");

  useEffect(() => {
    if (user) {
      setPlanStatus(user.subscription_status || "active");
      if (user.subscription_expires_at) {
        try {
          const d = new Date(user.subscription_expires_at);
          if (!isNaN(d.getTime())) {
            setSelectedDate(d.toISOString().split("T")[0]);
            return;
          }
        } catch {
          // ignore
        }
      }
      // Default to 30 days from today if not set
      const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      setSelectedDate(defaultDate.toISOString().split("T")[0]);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const now = Date.now();
  const currentExpiryTime = user.subscription_expires_at
    ? new Date(user.subscription_expires_at).getTime()
    : 0;
  const isCurrentExpired = currentExpiryTime ? now > currentExpiryTime : false;
  const currentDaysLeft = currentExpiryTime
    ? Math.ceil((currentExpiryTime - now) / (1000 * 60 * 60 * 24))
    : 0;

  // Calculate days for the newly selected date
  const newExpiryTime = selectedDate ? new Date(selectedDate).getTime() : 0;
  const newDaysLeft = newExpiryTime
    ? Math.ceil((newExpiryTime - now) / (1000 * 60 * 60 * 24))
    : 0;
  const isNewExpired = newExpiryTime ? now > newExpiryTime : false;

  const applyDurationFromNow = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const extendFromCurrentExpiry = (days: number) => {
    const base = currentExpiryTime && currentExpiryTime > now ? currentExpiryTime : now;
    const d = new Date(base + days * 24 * 60 * 60 * 1000);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    // Set expiry to end of selected day (23:59:59) in local time
    const [y, m, d] = selectedDate.split("-").map(Number);
    const targetDate = new Date(y, m - 1, d, 23, 59, 59);
    await onSaveExpiry(user.email, targetDate.toISOString(), planStatus);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-left"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-white">
                Set Subscription Expiry
              </h3>
              <p className="text-[11px] text-zinc-400">
                Manually adjust expiry date and plan status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* User info card */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 space-y-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                avatarKey={user.avatar || "chef"}
                name={user.name}
                className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  {user.email}
                </p>
                {user.bakery_name && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold truncate">
                    🍰 {user.bakery_name}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Current Expiry:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {user.subscription_expires_at
                  ? formatDate(user.subscription_expires_at)
                  : "N/A"}{" "}
                <span
                  className={
                    isCurrentExpired
                      ? "text-rose-600 dark:text-rose-400 font-bold"
                      : "text-emerald-500 font-bold"
                  }
                >
                  ({isCurrentExpired ? `${Math.abs(currentDaysLeft)}d ago` : `${currentDaysLeft}d left`})
                </span>
              </span>
            </div>
          </div>

          {/* Quick preset extensions */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Quick Shortcuts
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => extendFromCurrentExpiry(7)}
                className="px-2 py-1.5 text-[11px] font-bold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                title="Add 7 days to expiry"
              >
                +7 Days
              </button>
              <button
                type="button"
                onClick={() => extendFromCurrentExpiry(30)}
                className="px-2 py-1.5 text-[11px] font-bold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                title="Add 30 days (1 month)"
              >
                +1 Month
              </button>
              <button
                type="button"
                onClick={() => extendFromCurrentExpiry(90)}
                className="px-2 py-1.5 text-[11px] font-bold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                title="Add 90 days (3 months)"
              >
                +3 Months
              </button>
              <button
                type="button"
                onClick={() => extendFromCurrentExpiry(365)}
                className="px-2 py-1.5 text-[11px] font-bold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                title="Add 365 days (1 year)"
              >
                +1 Year
              </button>
            </div>
          </div>

          {/* Date Picker Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Select Expiry Date *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Plan Status dropdown */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Subscription Plan Status
            </label>
            <select
              value={planStatus}
              onChange={(e) => setPlanStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="active">Active (Paid Pro)</option>
              <option value="trial">Trial (Free 30-Day Trial)</option>
            </select>
          </div>

          {/* Live Preview Strip */}
          {selectedDate && (
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>New Expiry Preview:</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                Valid until <strong className="font-extrabold text-zinc-900 dark:text-white">{formatDate(selectedDate)}</strong>
                {" "}
                <span
                  className={
                    isNewExpired
                      ? "text-rose-600 dark:text-rose-400 font-bold"
                      : "text-emerald-600 dark:text-emerald-400 font-bold"
                  }
                >
                  ({isNewExpired ? "Expired" : `${newDaysLeft} days remaining`})
                </span>
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDate}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save Expiry Date</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
