import { useState } from "react";
import { Plus, Search, Receipt } from "lucide-react";
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

  const filteredLogs = paymentLogs.filter((p) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      p.user_email?.toLowerCase().includes(q) ||
      p.user_name?.toLowerCase().includes(q) ||
      p.reference_id?.toLowerCase().includes(q) ||
      p.payment_method?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Payment Transaction Logs
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Recorded user subscription payments & validity extensions (₹99 / month)
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search email, UTR, method..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={onOpenPaymentModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shrink-0 shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record New Payment</span>
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Reference / UTR</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3 text-right">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No payment transactions recorded yet</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {searchText ? "No entries match your search filter" : "Click \"+ Record New Payment\" to log one"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-3 text-zinc-500 font-mono text-[11px]">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {p.user_name || p.user_email}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono">{p.user_email}</p>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{p.amount}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-medium text-[11px]">
                        {p.months} {p.months === 1 ? "Month" : "Months"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                      {p.payment_method}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                      {p.reference_id || "—"}
                    </td>
                    <td className="py-3.5 px-3 text-zinc-500 text-[11px] max-w-xs truncate" title={p.notes}>
                      {p.notes || "—"}
                    </td>
                    <td className="py-3.5 px-3 text-right text-[11px] text-zinc-400 font-mono">
                      {p.recorded_by}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
