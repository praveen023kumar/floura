import { useState } from "react";
import { Search, Plus, Eye, Phone, Mail, ToggleRight, ToggleLeft, Users, CreditCard, Calendar } from "lucide-react";
import Avatar from "../Avatar";
import { RegisteredUserItem } from "./types";

interface AdminRegisteredUsersTabProps {
  registeredUsers: RegisteredUserItem[];
  onOpenPaymentModal: (email?: string) => void;
  onViewUserLog: (user: RegisteredUserItem) => void;
  onOpenSetExpiryModal: (user: RegisteredUserItem) => void;
  onToggleUserStatus: (email: string, currentStatus: number) => void;
  togglingUserEmail: string | null;
  formatDate: (dateStr: string) => string;
}

export default function AdminRegisteredUsersTab({
  registeredUsers,
  onOpenPaymentModal,
  onViewUserLog,
  onOpenSetExpiryModal,
  onToggleUserStatus,
  togglingUserEmail,
  formatDate
}: AdminRegisteredUsersTabProps) {
  const [searchText, setSearchText] = useState("");

  const filtered = registeredUsers.filter((u) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.bakery_name?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
        {/* Header with Search and Record Payment CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Registered Bakery Workspaces
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select any customer row to record a payment, inspect validity logs, or manage active state
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user, email, bakery..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Record Payment CTA Button */}
            <button
              onClick={() => onOpenPaymentModal()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white flex items-center gap-1.5 transition shrink-0 shadow-sm shadow-emerald-600/20 cursor-pointer"
              title="Record subscription payment for a registered user"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-3">User & Bakery</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Registered</th>
                <th className="py-3 px-3 text-center">Orders</th>
                <th className="py-3 px-3">Subscription Expiry</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                      No registered bakery workspaces found
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {searchText
                        ? "No accounts match your search filter"
                        : "Customer accounts will automatically appear here once registered"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const now = Date.now();
                  const expiryTime = u.subscription_expires_at
                    ? new Date(u.subscription_expires_at).getTime()
                    : 0;
                  const isExpired = expiryTime ? now > expiryTime : false;
                  const isDeactivated = u.is_active === 0;
                  const daysLeft = expiryTime
                    ? Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24))
                    : 0;

                  return (
                    <tr
                      key={u.email}
                      onClick={() => onOpenPaymentModal(u.email)}
                      className="hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition cursor-pointer group"
                      title="Click row to capture payment & extend expiry for this user"
                    >
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            avatarKey={u.avatar || "chef"}
                            name={u.name}
                            className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 group-hover:scale-105 transition"
                          />
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono">{u.email}</p>
                            {u.bakery_name && (
                              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                                🍰 {u.bakery_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                          {u.phone ? (
                            <a
                              href={`tel:${u.phone}`}
                              className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-300 hover:text-rose-600"
                            >
                              <Phone className="w-3 h-3 text-zinc-400" /> {u.phone}
                            </a>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">No phone</span>
                          )}
                          <a
                            href={`mailto:${u.email}`}
                            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-rose-600"
                          >
                            <Mail className="w-2.5 h-2.5" /> Email user
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          {u.orders_count || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div
                          className="space-y-1 group/expiry cursor-pointer inline-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSetExpiryModal(u);
                          }}
                          title="Click to set/change expiry date"
                        >
                          <div className="flex items-center gap-1.5">
                            <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 group-hover/expiry:text-amber-600 dark:group-hover/expiry:text-amber-400 group-hover/expiry:underline transition">
                              {u.subscription_expires_at
                                ? formatDate(u.subscription_expires_at)
                                : "N/A"}
                            </p>
                            <Calendar className="w-3 h-3 text-zinc-400 group-hover/expiry:text-amber-500 transition" />
                          </div>
                          <div>
                            {isDeactivated ? (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                                Deactivated
                              </span>
                            ) : isExpired ? (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                                Expired ({Math.abs(daysLeft)}d ago)
                              </span>
                            ) : u.subscription_status === "trial" ? (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                                Trial ({daysLeft}d left)
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                                Active ({daysLeft}d left)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleUserStatus(u.email, u.is_active);
                          }}
                          disabled={togglingUserEmail === u.email}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            u.is_active === 1
                              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                              : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100"
                          }`}
                        >
                          {u.is_active === 1 ? (
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-rose-500" />
                          )}
                          <span>{u.is_active === 1 ? "Active" : "Disabled"}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onViewUserLog(u)}
                            className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center gap-1 cursor-pointer"
                            title="View full user details and activity logs"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                            <span>Log</span>
                          </button>
                          <button
                            onClick={() => onOpenSetExpiryModal(u)}
                            className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200/80 dark:border-amber-800/80 transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Set custom expiry date for this user"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Set Expiry</span>
                          </button>
                          <button
                            onClick={() => onOpenPaymentModal(u.email)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200/80 dark:border-emerald-800/80 transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Capture payment for this user"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Payment</span>
                          </button>
                        </div>
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
