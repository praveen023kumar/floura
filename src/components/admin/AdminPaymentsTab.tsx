// File Path: /src/components/admin/AdminPaymentsTab.tsx
import { useState } from "react";
import {
  Plus,
  Search,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  CreditCard
} from "lucide-react";
import { PaymentLogItem } from "./types";

interface AdminPaymentsTabProps {
  paymentLogs: PaymentLogItem[];
  onOpenPaymentModal: () => void;
  formatDate: (dateStr: string) => string;
}

export default function AdminPaymentsTab({
  paymentLogs,
  onOpenPaymentModal,
  formatDate
}: AdminPaymentsTabProps) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");

  const successLogs = paymentLogs.filter((p) => (p.status || "success") === "success");
  const failedLogs = paymentLogs.filter((p) => p.status === "failed");
  const totalRevenue = successLogs.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const filteredLogs = paymentLogs.filter((p) => {
    // 1. Status Filter
    const currentStatus = p.status || "success";
    if (statusFilter !== "all" && currentStatus !== statusFilter) {
      return false;
    }

    // 2. Search Text
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      p.user_email?.toLowerCase().includes(q) ||
      p.user_name?.toLowerCase().includes(q) ||
      p.reference_id?.toLowerCase().includes(q) ||
      p.razorpay_order_id?.toLowerCase().includes(q) ||
      p.payment_method?.toLowerCase().includes(q) ||
      p.failure_reason?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Collected Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Revenue Received
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">From {successLogs.length} verified subscriptions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Successful Payments */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Payments Received
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {successLogs.length}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Successful renewals & signups</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Failed / Incomplete Payments */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Failed / Abandoned
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {failedLogs.length}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Dismissed or declined checkouts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Payment Transaction Logs
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Online Razorpay payments, manual UPI transfers, and failed transaction attempts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search email, UTR, reason..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Manual Payment Button */}
            <button
              onClick={onOpenPaymentModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shrink-0 shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Payment</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === "all"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100/60 dark:bg-zinc-800/60"
            }`}
          >
            All Logs ({paymentLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("success")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === "success"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/20"
                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 bg-zinc-100/60 dark:bg-zinc-800/60"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Received / Success ({successLogs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("failed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === "failed"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-600/20"
                : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 bg-zinc-100/60 dark:bg-zinc-800/60"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed / Cancelled ({failedLogs.length})</span>
          </button>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Reference / Order ID</th>
                <th className="py-3 px-3">Notes / Failure Reason</th>
                <th className="py-3 px-3 text-right">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No payment transactions match this view</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {searchText ? "Try clearing your search query" : "No logs available for this status filter."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((p) => {
                  const isSuccess = (p.status || "success") === "success";
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition ${
                        !isSuccess ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-3 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(p.createdAt)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3" />
                            Received
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {p.user_name || p.user_email}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono">{p.user_email}</p>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 font-mono font-bold text-sm">
                        <span className={isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400 line-through"}>
                          ₹{p.amount}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-3">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-medium text-[11px] text-zinc-700 dark:text-zinc-300">
                          {p.months} {p.months === 1 ? "Month" : "Months"}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                        {p.payment_method}
                      </td>

                      {/* Reference / Order ID */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 max-w-[150px] truncate" title={p.reference_id || p.razorpay_order_id}>
                        {p.reference_id || p.razorpay_order_id || "—"}
                      </td>

                      {/* Notes / Failure Reason */}
                      <td className="py-3.5 px-3 text-[11px] max-w-xs">
                        {isSuccess ? (
                          <span className="text-zinc-500 truncate block" title={p.notes}>
                            {p.notes || "—"}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-medium truncate block" title={p.failure_reason || p.notes}>
                            {p.failure_reason || p.notes || "Payment failed or cancelled"}
                          </span>
                        )}
                      </td>

                      {/* Recorded By */}
                      <td className="py-3.5 px-3 text-right text-[11px] text-zinc-400 font-mono">
                        {p.recorded_by}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
