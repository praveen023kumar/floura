import React from "react";
import { X, Phone, Mail, ToggleRight, ToggleLeft, Plus, Receipt, CreditCard, Calendar } from "lucide-react";
import { motion } from "motion/react";
import Avatar from "../Avatar";
import { RegisteredUserItem, PaymentLogItem } from "./types";

interface AdminUserLogModalProps {
  user: RegisteredUserItem | null;
  onClose: () => void;
  onOpenPaymentModal: (email: string) => void;
  onOpenSetExpiryModal?: (user: RegisteredUserItem) => void;
  onToggleUserStatus: (email: string, currentStatus: number) => void;
  isTogglingStatus: boolean;
  paymentLogs: PaymentLogItem[];
  formatDate: (dateStr: string) => string;
}

export default function AdminUserLogModal({
  user,
  onClose,
  onOpenPaymentModal,
  onOpenSetExpiryModal,
  onToggleUserStatus,
  isTogglingStatus,
  paymentLogs,
  formatDate
}: AdminUserLogModalProps) {
  if (!user) return null;

  const now = Date.now();
  const expiryTime = user.subscription_expires_at
    ? new Date(user.subscription_expires_at).getTime()
    : 0;
  const isExpired = expiryTime ? now > expiryTime : false;
  const daysLeft = expiryTime
    ? Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24))
    : 0;
  const userPayments = paymentLogs.filter(
    (p) => p.user_email?.toLowerCase() === user.email?.toLowerCase()
  );
  const totalPaid = userPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-left"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Avatar
                avatarKey={user.avatar || "chef"}
                name={user.name}
                className="w-14 h-14 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0"
              />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {user.name}
                  </h3>
                  {user.is_active === 1 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                  {user.email}
                </p>
                {user.bakery_name && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                    🍰 {user.bakery_name}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action & Contact Row */}
          <div className="mt-4 pt-4 border-t border-zinc-150/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="flex items-center gap-1.5 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  {user.phone}
                </a>
              )}
              <a
                href={`mailto:${user.email}`}
                className="flex items-center gap-1.5 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                Send Email
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleUserStatus(user.email, user.is_active)}
                disabled={isTogglingStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  user.is_active === 1
                    ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200/60 dark:border-rose-800/40"
                    : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-800/40"
                }`}
              >
                {user.is_active === 1 ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" /> Deactivate
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-rose-500" /> Activate
                  </>
                )}
              </button>
              {onOpenSetExpiryModal && (
                <button
                  onClick={() => onOpenSetExpiryModal(user)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  title="Manually set or change subscription expiry date"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Set Expiry</span>
                </button>
              )}
              <button
                onClick={() => onOpenPaymentModal(user.email)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Payment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* Summary Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-150 dark:border-zinc-800">
              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Plan Status
              </span>
              <div className="mt-1">
                {isExpired ? (
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Expired ({Math.abs(daysLeft)}d ago)
                  </span>
                ) : user.subscription_status === "trial" ? (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Trial ({daysLeft}d left)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Active ({daysLeft}d left)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-150 dark:border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Expires On
                  </span>
                  {onOpenSetExpiryModal && (
                    <button
                      type="button"
                      onClick={() => onOpenSetExpiryModal(user)}
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {user.subscription_expires_at
                    ? formatDate(user.subscription_expires_at)
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-150 dark:border-zinc-800">
              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Orders Count
              </span>
              <p className="mt-1 text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono">
                {user.orders_count || 0}
              </p>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-150 dark:border-zinc-800">
              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <p className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{totalPaid}
              </p>
            </div>
          </div>

          {/* Payment Transaction Logs Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Payment & Validity Extension Logs ({userPayments.length})
                </h4>
              </div>
              <button
                onClick={() => onOpenPaymentModal(user.email)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Payment</span>
              </button>
            </div>

            {userPayments.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <CreditCard className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  No payment transactions recorded for this bakery yet.
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Click "+ Add Payment" to record a payment and extend validity.
                </p>
                <button
                  onClick={() => onOpenPaymentModal(user.email)}
                  className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Payment</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-150 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Reference (UTR)</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {userPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                          {formatDate(p.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{p.amount}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {p.months} {p.months === 1 ? "Mo" : "Mos"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                          {p.payment_method}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                          {p.reference_id || "—"}
                        </td>
                        <td
                          className="py-2.5 px-3 text-zinc-500 text-[11px] max-w-[140px] truncate"
                          title={p.notes}
                        >
                          {p.notes || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[10px] text-zinc-400">
                          {p.recorded_by}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Close Log View
          </button>
        </div>
      </motion.div>
    </div>
  );
}
