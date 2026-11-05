import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LogOut, 
  Sun, 
  Moon, 
  RefreshCw, 
  Sparkles, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Shield, 
  Receipt, 
  X, 
  Menu, 
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../utils/api";
import flouraLogo from "../assets/images/floura_logo.webp";
import Avatar from "./Avatar";

// Modular Admin Sub-Components
import { 
  AdminUser, 
  RegisteredUserItem, 
  PaymentLogItem, 
  FeedbackItem, 
  AdminUserItem 
} from "./admin/types";
import AdminOverviewTab from "./admin/AdminOverviewTab";
import AdminRegisteredUsersTab from "./admin/AdminRegisteredUsersTab";
import AdminPaymentsTab from "./admin/AdminPaymentsTab";
import AdminFeedbacksTab from "./admin/AdminFeedbacksTab";
import AdminAccountsTab from "./admin/AdminAccountsTab";
import AdminPaymentModal from "./admin/AdminPaymentModal";
import AdminSetExpiryModal from "./admin/AdminSetExpiryModal";
import AdminUserLogModal from "./admin/AdminUserLogModal";
import AdminPublicRecipesTab from "./admin/AdminPublicRecipesTab";

interface AdminDashboardViewProps {
  user: AdminUser;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function AdminDashboardView({ user, onLogout, darkMode, setDarkMode }: AdminDashboardViewProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tab path routing
  const getActiveTabFromPath = (path: string): "overview" | "registered_users" | "payments" | "feedbacks" | "admins" | "public_recipes" => {
    if (path.startsWith("/admin/users") || path.startsWith("/admin/registered-users")) return "registered_users";
    if (path.startsWith("/admin/payments")) return "payments";
    if (path.startsWith("/admin/feedbacks")) return "feedbacks";
    if (path.startsWith("/admin/admins") || path.startsWith("/admin/accounts")) return "admins";
    if (path.startsWith("/admin/public-recipes")) return "public_recipes";
    return "overview";
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };
  
  // Data States
  const [registeredUsersCount, setRegisteredUsersCount] = useState<number>(0);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserItem[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLogItem[]>([]);
  
  // Payment Modal States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [paymentMonths, setPaymentMonths] = useState<number>(1);
  const [paymentAmount, setPaymentAmount] = useState<number>(99);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentRefId, setPaymentRefId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [togglingUserEmail, setTogglingUserEmail] = useState<string | null>(null);

  // Set Expiry Modal States
  const [setExpiryModalOpen, setSetExpiryModalOpen] = useState(false);
  const [selectedUserForExpiry, setSelectedUserForExpiry] = useState<RegisteredUserItem | null>(null);
  const [expirySubmitting, setExpirySubmitting] = useState(false);

  // User Profile & Activity Log View State
  const [selectedUserForLog, setSelectedUserForLog] = useState<RegisteredUserItem | null>(null);
  
  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Permissions & Roles
  const isSuperadmin = user.role === "superadmin";
  const hasUsersAccess = isSuperadmin || user.permissions?.includes("users") || user.permissions?.includes("setup");
  const hasFeedbacksAccess = isSuperadmin || user.permissions?.includes("feedbacks");

  // Load Core Admin Data
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${user.token || ""}`
      };

      // 1. Fetch Users Count
      if (hasUsersAccess) {
        const usersRes = await fetch(getApiUrl("/api/admin/users/count"), { headers });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setRegisteredUsersCount(usersData.count);
        }
      }

      // 2. Fetch Feedbacks
      if (hasFeedbacksAccess) {
        const feedbacksRes = await fetch(getApiUrl("/api/admin/feedbacks"), { headers });
        if (feedbacksRes.ok) {
          const feedbacksData = await feedbacksRes.json();
          setFeedbacks(feedbacksData.feedbacks || []);
        }
      }

      // 3. Fetch Admin Users list
      if (hasUsersAccess) {
        const adminUsersRes = await fetch(getApiUrl("/api/admin/users"), { headers });
        if (adminUsersRes.ok) {
          const adminUsersData = await adminUsersRes.json();
          setAdminUsers(adminUsersData.users || []);
        }
      }

      // 4. Fetch Registered Users list & Payment Logs
      if (hasUsersAccess) {
        try {
          const regRes = await fetch(getApiUrl("/api/admin/registered-users"), { headers });
          if (regRes.ok) {
            const regData = await regRes.json();
            setRegisteredUsers(regData.users || []);
          } else {
            console.error("Fetch registered users returned non-200:", regRes.status);
          }
        } catch (e) {
          console.error("Fetch registered users error:", e);
        }

        try {
          const payRes = await fetch(getApiUrl("/api/admin/payments"), { headers });
          if (payRes.ok) {
            const payData = await payRes.json();
            setPaymentLogs(payData.payments || []);
          }
        } catch (e) {
          console.error("Fetch payment logs error:", e);
        }
      }

    } catch (err: any) {
      console.error("[Admin Data Fetch Error]:", err);
      showToast(err.message || "Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.role, user.permissions]);

  // Toggle User Active Status
  const handleToggleUserStatus = async (targetEmail: string, currentIsActive: number) => {
    setTogglingUserEmail(targetEmail);
    const newStatus = currentIsActive === 1 ? false : true;
    try {
      const res = await fetch(getApiUrl(`/api/admin/registered-users/${encodeURIComponent(targetEmail)}/status`), {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${user.token || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isActive: newStatus })
      });
      const text = await res.text();
      let errData: any = null;
      try { errData = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok) {
        throw new Error(errData?.error || text || "Failed to update user status");
      }
      setRegisteredUsers(prev => prev.map(u => u.email === targetEmail ? { ...u, is_active: newStatus ? 1 : 0 } : u));
      setSelectedUserForLog(prev => (prev && prev.email === targetEmail) ? { ...prev, is_active: newStatus ? 1 : 0 } : prev);
      showToast(`User ${newStatus ? "activated" : "deactivated"} successfully.`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to toggle user status", "error");
    } finally {
      setTogglingUserEmail(null);
    }
  };

  // Open Payment Modal
  const openPaymentModal = (email?: string) => {
    setSelectedUserEmail(email || (registeredUsers[0]?.email || ""));
    setPaymentMonths(1);
    setPaymentAmount(99);
    setPaymentMethod("UPI");
    setPaymentRefId("");
    setPaymentNotes("");
    setCustomExpiryDate("");
    setPaymentModalOpen(true);
  };

  const handleMonthsChange = (m: number) => {
    setPaymentMonths(m);
    setPaymentAmount(m * 99);
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserEmail) {
      showToast("Please select a registered user", "error");
      return;
    }
    setPaymentSubmitting(true);
    try {
      const res = await fetch(getApiUrl("/api/admin/payments"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userEmail: selectedUserEmail,
          amount: paymentAmount,
          currency: "INR",
          months: paymentMonths,
          paymentMethod,
          referenceId: paymentRefId,
          notes: paymentNotes,
          customExpiry: customExpiryDate || undefined
        })
      });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok) {
        throw new Error(data?.error || text || "Failed to record payment");
      }
      showToast(`Payment of ₹${paymentAmount} recorded! Expiry extended.`, "success");
      setPaymentModalOpen(false);

      // Keep user log view updated in realtime
      if (selectedUserForLog && selectedUserForLog.email.toLowerCase() === selectedUserEmail.toLowerCase()) {
        setSelectedUserForLog(prev => prev ? {
          ...prev,
          is_active: 1,
          subscription_status: "active",
          subscription_expires_at: data?.newExpiry || prev.subscription_expires_at,
          last_payment_date: new Date().toISOString()
        } : null);
      }

      // Refresh data
      loadData(true);
    } catch (err: any) {
      showToast(err.message || "Payment logging failed", "error");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Set / Update Expiry Date Directly
  const handleSaveExpiry = async (email: string, expiryDate: string, subscriptionStatus: string) => {
    setExpirySubmitting(true);
    try {
      // Send to /api/admin/registered-users/expiry via POST with full body for maximum proxy compatibility
      let res = await fetch(getApiUrl(`/api/admin/registered-users/expiry`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          userEmail: email,
          expiryDate,
          subscriptionStatus,
          isActive: 1
        })
      });

      // If the POST route was not found (e.g. legacy server route), fallback to PUT /:email/expiry
      if (res.status === 404 || res.status === 405) {
        res = await fetch(getApiUrl(`/api/admin/registered-users/${encodeURIComponent(email)}/expiry`), {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${user.token || ""}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            userEmail: email,
            expiryDate,
            subscriptionStatus,
            isActive: 1
          })
        });
      }

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Non-JSON response
      }

      if (!res.ok) {
        throw new Error(data?.error || text || `Server error (${res.status})`);
      }

      const finalExpiry = data?.newExpiry || expiryDate;
      showToast(`Subscription expiry updated to ${formatDate(finalExpiry)}`, "success");
      setSetExpiryModalOpen(false);

      // Keep user log view updated in realtime
      if (selectedUserForLog && selectedUserForLog.email.toLowerCase() === email.toLowerCase()) {
        setSelectedUserForLog(prev => prev ? {
          ...prev,
          is_active: 1,
          subscription_status: subscriptionStatus,
          subscription_expires_at: finalExpiry
        } : null);
      }

      // Update registered users array locally for instant UI update
      setRegisteredUsers(prev => prev.map(u => {
        if (u.email.toLowerCase() === email.toLowerCase()) {
          return {
            ...u,
            is_active: 1,
            subscription_status: subscriptionStatus,
            subscription_expires_at: finalExpiry
          };
        }
        return u;
      }));

      // Reload fresh data from server
      loadData(true);
    } catch (err: any) {
      showToast(err.message || "Failed to update expiry", "error");
    } finally {
      setExpirySubmitting(false);
    }
  };

  // Feedback Status Update
  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    setUpdatingId(feedbackId);
    try {
      const response = await fetch(getApiUrl(`/api/admin/feedbacks/${feedbackId}/status`), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${user.token || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update feedback status.");
      }

      setFeedbacks(prev => prev.map(item => item.id === feedbackId ? { ...item, status: newStatus as any } : item));
      showToast(`Feedback marked as ${newStatus}`);
    } catch (err: any) {
      console.error("[Feedback Update Error]:", err);
      showToast(err.message || "Update failed. Please retry.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Provision New Administrator
  const handleProvisionAdmin = async (adminData: {
    name: string;
    email: string;
    password: string;
    role: "admin" | "superadmin";
    permissions: string[];
  }) => {
    try {
      const response = await fetch(getApiUrl("/api/admin/users"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(adminData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to provision administrator account.");
      }

      showToast(`Successfully provisioned admin account for ${adminData.name}`);
      loadData(true);
    } catch (err: any) {
      console.error("[Admin Provisioning Error]:", err);
      showToast(err.message || "Provisioning account failed.", "error");
      throw err;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  // Navigation Items for Sidemenu
  const navItems = [
    {
      id: "overview" as const,
      label: "Dashboard Overview",
      path: "/admin/overview",
      icon: LayoutDashboard,
      show: true
    },
    {
      id: "registered_users" as const,
      label: "Registered Users",
      path: "/admin/users",
      icon: Users,
      show: hasUsersAccess
    },
    {
      id: "payments" as const,
      label: "Payment Logs",
      path: "/admin/payments",
      icon: Receipt,
      show: hasUsersAccess
    },
    {
      id: "feedbacks" as const,
      label: "Feedback Manager",
      path: "/admin/feedbacks",
      icon: MessageSquare,
      show: hasFeedbacksAccess
    },
    {
      id: "admins" as const,
      label: "Admin Accounts",
      path: "/admin/admins",
      icon: Shield,
      show: hasUsersAccess
    },
    {
      id: "public_recipes" as const,
      label: "SEO Public Recipes",
      path: "/admin/public-recipes",
      icon: Sparkles,
      show: true
    }
  ];

  const pageMeta = {
    overview: {
      title: "Dashboard Overview",
      subtitle: "System growth metrics, health diagnostics, and platform activity"
    },
    registered_users: {
      title: "Registered Bakery Workspaces",
      subtitle: `Manage ${registeredUsers.length} customer bakery workspaces, subscription expiry, and logs`
    },
    payments: {
      title: "Payment Transaction Logs",
      subtitle: `Recorded subscription payments & validity extensions (${paymentLogs.length} entries)`
    },
    feedbacks: {
      title: "Customer Feedback Manager",
      subtitle: `Review guest bug reports, suggestions, and feature requests (${feedbacks.length} items)`
    },
    admins: {
      title: "System Administrators",
      subtitle: `Provision administrator nodes and configure access permissions (${adminUsers.length} admins)`
    },
    public_recipes: {
      title: "SEO Public Recipe Builder",
      subtitle: "Formulate interactive yield scaling, ingredients, and search engine metadata"
    }
  }[activeTab] || {
    title: "Dashboard Overview",
    subtitle: "System growth metrics, health diagnostics, and platform activity"
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col lg:flex-row font-sans transition-colors duration-200">
      
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEMENU (Responsive: Fixed Drawer on Mobile, Sticky Sidebar on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out select-none shadow-2xl lg:shadow-none lg:static lg:h-screen lg:sticky lg:top-0 lg:translate-x-0 shrink-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-zinc-150/80 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <img 
              src={flouraLogo} 
              alt="Floura Logo" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs" 
            />
            <div className="flex flex-col text-left">
              <h1 className="font-serif text-sm font-black text-zinc-900 dark:text-white leading-none flex items-center gap-1.5">
                Floura <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 rounded-md font-bold uppercase tracking-wider">Portal</span>
              </h1>
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-1 tracking-wider">
                {isSuperadmin ? "Superadmin Node" : "Administrator Node"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-left">
            Navigation Menu
          </div>

          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "public_recipes" 
              ? location.pathname.startsWith("/admin/public-recipes") 
              : activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left group ${
                  isActive
                    ? "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 font-black shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? "text-orange-600 dark:text-orange-400" : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidemenu Footer: Admin Info & Quick Actions */}
        <div className="p-4 border-t border-zinc-150/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
          {/* Admin User Details */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white dark:bg-zinc-800/70 border border-zinc-150 dark:border-zinc-700/60 shadow-xs">
            <Avatar avatarKey={user.avatar} name={user.name} className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-zinc-400 truncate font-mono mt-0.5">{user.email}</p>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 capitalize shrink-0">
              {user.role}
            </span>
          </div>

          {/* Quick Buttons: Sync, Theme, Logout */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Refresh core data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
              <span className="text-[11px] font-bold">Sync</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 px-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition cursor-pointer shadow-xs"
              title="Toggle color theme"
            >
              {darkMode ? <Moon className="w-4 h-4 text-yellow-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 px-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shadow-xs"
              title="Logout from admin portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Sticky Topbar */}
        <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-8 h-16 flex items-center justify-between transition-colors">
          {/* Left: Mobile hamburger + Active Breadcrumb/Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-left">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                {pageMeta.title}
              </h2>
              <p className="hidden sm:block text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-md">
                {pageMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Refresh Server Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition cursor-pointer shadow-xs"
              title="Toggle Accessibility Color Theme"
            >
              {darkMode ? <Moon className="w-4 h-4 text-yellow-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shadow-xs"
              title="Logout Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-grow w-full mx-auto px-4 sm:px-8 py-6">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="w-12 h-12 rounded-full border-3 border-orange-500 border-t-transparent flex items-center justify-center mb-4"
              />
              <p className="text-sm font-serif font-semibold text-zinc-600 dark:text-zinc-300">
                Retrieving administrative records...
              </p>
              <p className="text-xs text-zinc-400 mt-1">Connecting to secure SQLite core db</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TAB 1: Overview */}
              {activeTab === "overview" && (
                <AdminOverviewTab
                  user={user}
                  registeredUsersCount={registeredUsersCount}
                  feedbacks={feedbacks}
                  hasUsersAccess={hasUsersAccess}
                  hasFeedbacksAccess={hasFeedbacksAccess}
                  onNavigate={handleNavigate}
                />
              )}

              {/* TAB 2: Registered Users */}
              {activeTab === "registered_users" && hasUsersAccess && (
                <AdminRegisteredUsersTab
                  registeredUsers={registeredUsers}
                  onOpenPaymentModal={openPaymentModal}
                  onViewUserLog={(selectedUser) => setSelectedUserForLog(selectedUser)}
                  onOpenSetExpiryModal={(selectedUser) => {
                    setSelectedUserForExpiry(selectedUser);
                    setSetExpiryModalOpen(true);
                  }}
                  onToggleUserStatus={handleToggleUserStatus}
                  togglingUserEmail={togglingUserEmail}
                  formatDate={formatDate}
                />
              )}

              {/* TAB 3: Payment Logs */}
              {activeTab === "payments" && hasUsersAccess && (
                <AdminPaymentsTab
                  paymentLogs={paymentLogs}
                  onOpenPaymentModal={() => openPaymentModal()}
                  formatDate={formatDate}
                />
              )}

              {/* TAB 4: Feedbacks */}
              {activeTab === "feedbacks" && hasFeedbacksAccess && (
                <AdminFeedbacksTab
                  feedbacks={feedbacks}
                  onStatusChange={handleStatusChange}
                  updatingId={updatingId}
                  onRefresh={() => loadData(true)}
                  refreshing={refreshing}
                  formatDate={formatDate}
                />
              )}

              {/* TAB 5: Admin Accounts */}
              {activeTab === "admins" && hasUsersAccess && (
                <AdminAccountsTab
                  adminUsers={adminUsers}
                  isSuperadmin={isSuperadmin}
                  onProvisionAdmin={handleProvisionAdmin}
                  formatDate={formatDate}
                />
              )}

              {/* TAB 6: SEO Public Recipes */}
              {activeTab === "public_recipes" && (
                <AdminPublicRecipesTab onNavigate={handleNavigate} />
              )}
            </div>
          )}
        </main>
      </div>

      {/* USER PROFILE & LOGS MODAL */}
      <AdminUserLogModal
        user={selectedUserForLog}
        onClose={() => setSelectedUserForLog(null)}
        onOpenPaymentModal={(email) => openPaymentModal(email)}
        onOpenSetExpiryModal={(u) => {
          setSelectedUserForExpiry(u);
          setSetExpiryModalOpen(true);
        }}
        onToggleUserStatus={handleToggleUserStatus}
        isTogglingStatus={togglingUserEmail === selectedUserForLog?.email}
        paymentLogs={paymentLogs}
        formatDate={formatDate}
      />

      {/* RECORD PAYMENT MODAL */}
      <AdminPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        registeredUsers={registeredUsers}
        selectedUserEmail={selectedUserEmail}
        onSelectUserEmail={setSelectedUserEmail}
        paymentMonths={paymentMonths}
        onMonthsChange={handleMonthsChange}
        paymentAmount={paymentAmount}
        onAmountChange={setPaymentAmount}
        paymentMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
        paymentRefId={paymentRefId}
        onRefIdChange={setPaymentRefId}
        paymentNotes={paymentNotes}
        onNotesChange={setPaymentNotes}
        customExpiryDate={customExpiryDate}
        onCustomExpiryChange={setCustomExpiryDate}
        isSubmitting={paymentSubmitting}
        onSubmit={handleSubmitPayment}
        formatDate={formatDate}
      />

      {/* SET SUBSCRIPTION EXPIRY MODAL */}
      <AdminSetExpiryModal
        isOpen={setExpiryModalOpen}
        onClose={() => setSetExpiryModalOpen(false)}
        user={selectedUserForExpiry}
        onSaveExpiry={handleSaveExpiry}
        isSubmitting={expirySubmitting}
        formatDate={formatDate}
      />

      {/* Floating System Success Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            className={`fixed bottom-10 left-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl font-sans text-xs font-bold flex items-center gap-2.5 text-white ${
              toast.type === "success" ? "bg-emerald-500 border border-emerald-600" : "bg-rose-500 border border-rose-600"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4.5 h-4.5 text-white" /> : <AlertCircle className="w-4.5 h-4.5 text-white" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
