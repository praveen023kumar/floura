import React from "react";
import { CreditCard, X, RefreshCw, Check, Calendar } from "lucide-react";
import { motion } from "motion/react";
import Avatar from "../Avatar";
import { RegisteredUserItem } from "./types";

interface AdminPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUsers: RegisteredUserItem[];
  selectedUserEmail: string;
  onSelectUserEmail: (email: string) => void;
  paymentMonths: number;
  onMonthsChange: (months: number) => void;
  paymentAmount: number;
  onAmountChange: (amount: number) => void;
  paymentMethod: string;
  onMethodChange: (method: string) => void;
  paymentRefId: string;
  onRefIdChange: (refId: string) => void;
  paymentNotes: string;
  onNotesChange: (notes: string) => void;
  customExpiryDate?: string;
  onCustomExpiryChange?: (date: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  formatDate: (dateStr: string) => string;
}

export default function AdminPaymentModal({
  isOpen,
  onClose,
  registeredUsers,
  selectedUserEmail,
  onSelectUserEmail,
  paymentMonths,
  onMonthsChange,
  paymentAmount,
  onAmountChange,
  paymentMethod,
  onMethodChange,
  paymentRefId,
  onRefIdChange,
  paymentNotes,
  onNotesChange,
  customExpiryDate,
  onCustomExpiryChange,
  isSubmitting,
  onSubmit,
  formatDate
}: AdminPaymentModalProps) {
  if (!isOpen) return null;

  const targetUser = registeredUsers.find(
    (u) => u.email.toLowerCase() === selectedUserEmail.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-left"
      >
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-white">
                Record User Payment
              </h3>
              <p className="text-[11px] text-zinc-400">
                Extend subscription validity & mark workspace active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {/* Target Customer Card */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Target Bakery Customer *
            </label>

            {targetUser ? (
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      avatarKey={targetUser.avatar || "chef"}
                      name={targetUser.name}
                      className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {targetUser.name}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono truncate">
                        {targetUser.email}
                      </p>
                      {targetUser.bakery_name && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold truncate mt-0.5">
                          🍰 {targetUser.bakery_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {registeredUsers.length > 1 && (
                    <select
                      value={selectedUserEmail}
                      onChange={(e) => onSelectUserEmail(e.target.value)}
                      className="text-[11px] font-semibold py-1 px-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer shrink-0 max-w-[130px]"
                      title="Switch user"
                    >
                      {registeredUsers.map((u) => (
                        <option key={u.email} value={u.email}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {(() => {
                  const now = Date.now();
                  const expiryTime = targetUser.subscription_expires_at
                    ? new Date(targetUser.subscription_expires_at).getTime()
                    : 0;
                  const isExpired = expiryTime ? now > expiryTime : false;
                  const daysLeft = expiryTime
                    ? Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24))
                    : 0;

                  return (
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Current Expiry:</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {targetUser.subscription_expires_at
                          ? formatDate(targetUser.subscription_expires_at)
                          : "N/A"}{" "}
                        <span
                          className={
                            isExpired
                              ? "text-rose-600 dark:text-rose-400 font-bold"
                              : "text-emerald-500 font-bold"
                          }
                        >
                          ({isExpired ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`})
                        </span>
                      </span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <select
                required
                value={selectedUserEmail}
                onChange={(e) => onSelectUserEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="" disabled>
                  Select a registered user...
                </option>
                {registeredUsers.map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.name} — {u.email} {u.bakery_name ? `(${u.bakery_name})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Duration (Months)
              </label>
              <select
                value={paymentMonths}
                onChange={(e) => onMonthsChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value={1}>1 Month (₹99)</option>
                <option value={2}>2 Months (₹198)</option>
                <option value={3}>3 Months (₹297)</option>
                <option value={6}>6 Months (₹594)</option>
                <option value={12}>12 Months (₹1188)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Total Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => onAmountChange(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Custom Expiry Date (Optional)
              </label>
              {customExpiryDate && (
                <button
                  type="button"
                  onClick={() => onCustomExpiryChange?.("")}
                  className="text-[10px] text-zinc-400 hover:text-red-500 font-semibold cursor-pointer"
                >
                  Clear (use months duration)
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="date"
                value={customExpiryDate || ""}
                onChange={(e) => onCustomExpiryChange?.(e.target.value)}
                placeholder="Leave blank to calculate from months"
                className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              {customExpiryDate
                ? `Overrides months duration: will set expiry exactly to ${formatDate(customExpiryDate)}`
                : "Leave blank to auto-calculate expiry from duration (months)."}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => onMethodChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
              <option value="Cash">Cash Payment</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Other">Other / Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Transaction / Reference ID (UTR)
            </label>
            <input
              type="text"
              value={paymentRefId}
              onChange={(e) => onRefIdChange(e.target.value)}
              placeholder="e.g. 423489123891"
              className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="e.g. Received via WhatsApp confirm"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Confirm & Extend Expiry</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
