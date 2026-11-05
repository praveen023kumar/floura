import React, { useState } from "react";
import { UserPlus, Shield, RefreshCw, AlertCircle } from "lucide-react";
import Avatar from "../Avatar";
import { AdminUserItem } from "./types";

interface AdminAccountsTabProps {
  adminUsers: AdminUserItem[];
  isSuperadmin: boolean;
  onProvisionAdmin: (data: {
    name: string;
    email: string;
    password: string;
    role: "admin" | "superadmin";
    permissions: string[];
  }) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

export default function AdminAccountsTab({
  adminUsers,
  isSuperadmin,
  onProvisionAdmin,
  formatDate
}: AdminAccountsTabProps) {
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "superadmin">("admin");
  const [newAdminPerms, setNewAdminPerms] = useState<string[]>(["feedbacks"]);
  const [submitting, setSubmitting] = useState(false);

  const togglePermission = (perm: string) => {
    if (newAdminPerms.includes(perm)) {
      setNewAdminPerms(newAdminPerms.filter((p) => p !== perm));
    } else {
      setNewAdminPerms([...newAdminPerms, perm]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onProvisionAdmin({
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        role: newAdminRole,
        permissions: newAdminPerms
      });
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminRole("admin");
      setNewAdminPerms(["feedbacks"]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      {/* Left Side: Create Admin Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-6 h-fit shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <UserPlus className="w-5 h-5 text-orange-500" />
          <h3 className="font-serif text-lg font-bold text-zinc-800 dark:text-zinc-100">
            Provision Admin Account
          </h3>
        </div>

        {isSuperadmin ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                Administrator Name
              </label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-105 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@floura.com"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-105 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                Complicated Password
              </label>
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Min 8 characters & symbols"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-105 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                System Role
              </label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-105 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="admin">Administrator (Scope limited)</option>
                <option value="superadmin">Super-Administrator (Unrestricted)</option>
              </select>
            </div>

            {/* Permissions Selection (Only applicable for standard admins) */}
            {newAdminRole === "admin" && (
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">
                  Granted Permissions
                </label>

                <div className="space-y-2 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-3 bg-zinc-50 dark:bg-zinc-950/20">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-755 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={newAdminPerms.includes("feedbacks")}
                      onChange={() => togglePermission("feedbacks")}
                      className="w-4 h-4 accent-orange-500 rounded border-zinc-300 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Feedbacks view & update status</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-755 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={newAdminPerms.includes("users")}
                      onChange={() => togglePermission("users")}
                      className="w-4 h-4 accent-orange-500 rounded border-zinc-300 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Admin users provision manager</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-755 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={newAdminPerms.includes("setup")}
                      onChange={() => togglePermission("setup")}
                      className="w-4 h-4 accent-orange-500 rounded border-zinc-300 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Setup Configuration pages access</span>
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-sans"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-bold">
                    Register Administrator
                  </span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="py-6 text-center bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-650 dark:text-zinc-300">Superadmin Only</p>
            <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
              Only Super-Administrators have credentials to provision new admin nodes.
            </p>
          </div>
        )}
      </div>

      {/* Right Side: List Admins */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-left">
            <Shield className="w-5 h-5 text-orange-500" />
            <h3 className="font-serif text-lg font-bold text-zinc-850 dark:text-zinc-100">
              Registered System Nodes
            </h3>
          </div>

          <div className="space-y-3">
            {adminUsers.map((u) => {
              const isSuper = u.role === "superadmin";
              return (
                <div
                  key={u.email}
                  className="p-5 bg-white dark:bg-zinc-950/20 border border-zinc-150/80 dark:border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Avatar avatarKey="chef" name={u.name} className="w-8 h-8 shrink-0" />
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {u.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                            isSuper
                              ? "bg-purple-50 text-purple-750 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50"
                              : "bg-blue-50 text-blue-755 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50"
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </div>
                      <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  {/* Permissions & Created At */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 md:text-right md:justify-end">
                    {isSuper ? (
                      <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-0.5 rounded-md">
                        Full System Privileges
                      </span>
                    ) : (
                      u.permissions.map((p) => (
                        <span
                          key={p}
                          className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-950/20"
                        >
                          {p}
                        </span>
                      ))
                    )}
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold block w-full mt-0.5">
                      Registered: {formatDate(u.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
