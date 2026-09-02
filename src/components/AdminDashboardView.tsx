// File Path: /src/components/AdminDashboardView.tsx
import { useState, useEffect } from "react";
import { 
  LogOut, 
  Sun, 
  Moon, 
  RefreshCw, 
  Search, 
  Filter, 
  Sparkles, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Star, 
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  UserPlus,
  Shield,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../utils/api";
import flouraLogo from "../assets/images/floura_logo.webp";
import Avatar from "./Avatar";

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  category: string;
  title?: string;
  message: string;
  rating: number;
  imageUrl?: string;
  status: "Pending" | "In Progress" | "Resolved" | "Spam";
  createdAt: string;
}

interface AdminUserItem {
  email: string;
  name: string;
  role: "superadmin" | "admin";
  permissions: string[];
  createdAt: string;
}

interface AdminDashboardViewProps {
  user: { name: string; email: string; avatar: string; token?: string; role?: string; permissions?: string[] };
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function AdminDashboardView({ user, onLogout, darkMode, setDarkMode }: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "feedbacks" | "admins">("overview");
  
  // Data States
  const [registeredUsersCount, setRegisteredUsersCount] = useState<number>(0);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  
  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // New Admin Provisioning Form States
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "superadmin">("admin");
  const [newAdminPerms, setNewAdminPerms] = useState<string[]>(["feedbacks"]);
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const headers = {
        "Authorization": `Bearer ${user.token || ""}`,
        "Content-Type": "application/json"
      };

      // 1. Fetch Users Count (if has permission)
      const canViewUsers = user.role === "superadmin" || user.permissions?.includes("users") || user.permissions?.includes("setup");
      if (canViewUsers) {
        const usersRes = await fetch(getApiUrl("/api/admin/users/count"), { headers });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setRegisteredUsersCount(usersData.count);
        }
      }

      // 2. Fetch Feedbacks (if has permission)
      const canViewFeedbacks = user.role === "superadmin" || user.permissions?.includes("feedbacks");
      if (canViewFeedbacks) {
        const feedbacksRes = await fetch(getApiUrl("/api/admin/feedbacks"), { headers });
        if (feedbacksRes.ok) {
          const feedbacksData = await feedbacksRes.json();
          setFeedbacks(feedbacksData.feedbacks || []);
        }
      }

      // 3. Fetch Admin Users list (if has permission)
      const canViewAdmins = user.role === "superadmin" || user.permissions?.includes("users");
      if (canViewAdmins) {
        const adminUsersRes = await fetch(getApiUrl("/api/admin/users"), { headers });
        if (adminUsersRes.ok) {
          const adminUsersData = await adminUsersRes.json();
          setAdminUsers(adminUsersData.users || []);
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
        throw new Error(errData.error || "Failed to update feedback status");
      }

      // Update local state
      setFeedbacks(prev => 
        prev.map(item => item.id === feedbackId ? { ...item, status: newStatus as any } : item)
      );
      showToast(`Status updated to "${newStatus}"`);
    } catch (err: any) {
      console.error("[Admin Status Update Error]:", err);
      showToast(err.message || "Status update failed", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProvisionAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminName || !newAdminPassword || !newAdminRole) return;
    setAdminSubmitting(true);

    try {
      const response = await fetch(getApiUrl("/api/admin/users"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: newAdminEmail,
          name: newAdminName,
          password: newAdminPassword,
          role: newAdminRole,
          permissions: newAdminPerms
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to provision administrator account.");
      }

      showToast(`Successfully provisioned admin account for ${newAdminName}`);
      
      // Reset form states
      setNewAdminEmail("");
      setNewAdminName("");
      setNewAdminPassword("");
      setNewAdminRole("admin");
      setNewAdminPerms(["feedbacks"]);
      
      // Reload database values
      loadData(true);
    } catch (err: any) {
      console.error("[Admin Provisioning Error]:", err);
      showToast(err.message || "Provisioning account failed.", "error");
    } finally {
      setAdminSubmitting(false);
    }
  };

  const togglePermission = (perm: string) => {
    if (newAdminPerms.includes(perm)) {
      setNewAdminPerms(prev => prev.filter(p => p !== perm));
    } else {
      setNewAdminPerms(prev => [...prev, perm]);
    }
  };

  // Filter and Search Computations
  const filteredFeedbacks = feedbacks.filter(item => {
    const matchesSearch = 
      (item.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (item.email || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (item.message || "").toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Summary Metrics
  const totalFeedbacks = feedbacks.length;
  const pendingFeedbacks = feedbacks.filter(item => item.status === "Pending").length;
  const resolvedFeedbacks = feedbacks.filter(item => item.status === "Resolved").length;

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

  const isSuperadmin = user.role === "superadmin";
  const hasUsersAccess = isSuperadmin || user.permissions?.includes("users");
  const hasFeedbacksAccess = isSuperadmin || user.permissions?.includes("feedbacks");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Admin Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors duration-200">
        <div className="w-full mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <img 
              src={flouraLogo} 
              alt="Floura Logo" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-zinc-150/80 dark:border-zinc-800 shadow-xs select-none" 
            />
            <div className="flex flex-col text-left">
              <h1 className="font-serif text-sm font-black text-zinc-800 dark:text-zinc-100 leading-none flex items-center gap-1.5">
                Floura Control Center <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 rounded-full font-bold">Portal</span>
              </h1>
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-1 tracking-wider">
                {isSuperadmin ? "Super-Administrator Node" : "Administrator Node"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Action */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200/80 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-655 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
              title="Refresh Server Data"
            >
              <RefreshCw className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200/80 bg-white dark:bg-zinc-850 dark:border-zinc-700 text-zinc-655 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
              title="Toggle Accessibility Color Theme"
            >
              {darkMode ? (
                <Moon className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500/10" />
              ) : (
                <Sun className="w-4.5 h-4.5 text-amber-500 fill-amber-500/10" />
              )}
            </button>

            {/* Divider */}
            <span className="h-6 w-[1.5px] bg-zinc-200/80 dark:bg-zinc-700 mx-1"></span>

            {/* Admin User Profile */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 group text-left">
                <Avatar avatarKey={user.avatar} name={user.name} className="w-9 h-9" />
                <div className="hidden md:flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium capitalize">{user.role}</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Logout Portal"
                className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow w-full mx-auto px-4 sm:px-6 py-8">
        
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

            {/* Welcome message */}
            <div className="flex flex-col text-left mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-sans">
                Welcome to the Control Center, {user.name.split(" ")[0]}!
              </h1>
              <p className="text-zinc-505 dark:text-zinc-400 text-sm font-medium mt-1">
                Monitor user registration growth, manage system feedback, and configure administrative access levels.
              </p>
            </div>
            
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Registered Users */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between h-[130px]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50 dark:bg-orange-950/50 shrink-0">
                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-tight">
                    Registered Bakers
                  </span>
                </div>
                <div className="space-y-1 mt-3">
                  <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {registeredUsersCount} Users
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">Active workspace accounts</p>
                </div>
              </div>

              {/* Feedbacks Total */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between h-[130px]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-tight">
                    Total Feedbacks
                  </span>
                </div>
                <div className="space-y-1 mt-3">
                  <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {totalFeedbacks} Submissions
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">Guest comments & reports</p>
                </div>
              </div>

              {/* Feedbacks Pending */}
              {(() => {
                const pendingPercent = totalFeedbacks > 0 ? Math.round((pendingFeedbacks / totalFeedbacks) * 100) : 0;
                return (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between h-[130px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/50 shrink-0">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-tight">
                        Pending Review
                      </span>
                    </div>
                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                          {pendingFeedbacks} Items
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                          {pendingPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-amber-500 transition-all duration-550"
                          style={{ width: `${pendingPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Feedbacks Resolved */}
              {(() => {
                const resolvedPercent = totalFeedbacks > 0 ? Math.round((resolvedFeedbacks / totalFeedbacks) * 100) : 0;
                return (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between h-[130px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-tight">
                        Resolved & Closed
                      </span>
                    </div>
                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                          {resolvedFeedbacks} Fixed
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                          {resolvedPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-emerald-500 transition-all duration-550"
                          style={{ width: `${resolvedPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Main Tabs Selection */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-5 py-2.5 rounded-xl font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-white dark:bg-zinc-800 text-orange-605 dark:text-orange-400 shadow-xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Dashboard Overview
              </button>
              {hasFeedbacksAccess && (
                <button
                  onClick={() => setActiveTab("feedbacks")}
                  className={`px-5 py-2.5 rounded-xl font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === "feedbacks"
                      ? "bg-white dark:bg-zinc-800 text-orange-605 dark:text-orange-400 shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Feedback Manager ({filteredFeedbacks.length})
                </button>
              )}
              {hasUsersAccess && (
                <button
                  onClick={() => setActiveTab("admins")}
                  className={`px-5 py-2.5 rounded-xl font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === "admins"
                      ? "bg-white dark:bg-zinc-800 text-orange-605 dark:text-orange-400 shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Admin Accounts ({adminUsers.length})
                </button>
              )}
              <a
                href="/admin/public-recipes"
                className="px-5 py-2.5 rounded-xl font-sans text-xs font-bold transition-all duration-200 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white shadow-xs flex items-center gap-1.5"
              >
                <span>+ Public SEO Recipes</span>
              </a>
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: System Metrics Status */}
                <div className="lg:col-span-2 space-y-6">
                  {hasFeedbacksAccess && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-6">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans mb-1 text-left">
                        Feedback Distribution
                      </h3>
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium mb-6 text-left">
                        Visual status breakdown of comments and bug reports submitted by users.
                      </p>
                      
                      <div className="space-y-4 py-2">
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-zinc-500">Pending Review</span>
                            <span className="text-amber-505">{pendingFeedbacks} / {totalFeedbacks || 1} ({Math.round((pendingFeedbacks / (totalFeedbacks || 1)) * 100)}%)</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(pendingFeedbacks / (totalFeedbacks || 1)) * 100}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-zinc-500">Resolved & Closed</span>
                            <span className="text-emerald-500">{resolvedFeedbacks} / {totalFeedbacks || 1} ({Math.round((resolvedFeedbacks / (totalFeedbacks || 1)) * 100)}%)</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(resolvedFeedbacks / (totalFeedbacks || 1)) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Database Diagnostics */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-6 text-left">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans mb-1">
                      Database Diagnostics
                    </h3>
                    <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium mb-6">
                      Core SQLite database engine statistics and schema properties.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150/50 dark:border-zinc-850">
                        <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Engine</span>
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">SQLite 3.x</span>
                      </div>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150/50 dark:border-zinc-850">
                        <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest">Users Schema</span>
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 block font-mono">admin_users</span>
                      </div>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150/50 dark:border-zinc-850">
                        <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest">Feedback Schema</span>
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 block font-mono">feedbacks</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Quick Action and Overview guide */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-tr from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-3xl p-6 border border-zinc-800 relative overflow-hidden text-left shadow-lg">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                    <Sparkles className="w-8 h-8 text-orange-400 mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold tracking-tight text-white mb-2">Oversee Floura</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium mb-6">
                      Monitor user registration growth, review submitted feedback to address bugs, and provision system administrator permissions dynamically.
                    </p>
                    <div className="flex gap-3">
                      {hasFeedbacksAccess && (
                        <button
                          onClick={() => setActiveTab("feedbacks")}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Feedbacks
                        </button>
                      )}
                      {hasUsersAccess && (
                        <button
                          onClick={() => setActiveTab("admins")}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer border border-zinc-700"
                        >
                          Admin Provisioning
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: Feedback Manager */}
            {activeTab === "feedbacks" && hasFeedbacksAccess && (
              <div className="space-y-6">
                
                {/* Search, Filters, Stats */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  
                  {/* Search input */}
                  <div className="relative flex-grow max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search feedback by name, email or message..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>

                  {/* Filter select Dropdowns */}
                  <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
                    
                    {/* Category Filter */}
                    <div className="flex items-center gap-2 text-left relative w-full sm:w-auto">
                      <Filter className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full sm:w-auto appearance-none pl-8 pr-8 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-350 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="All">All Categories 💡</option>
                        <option value="Suggestion">Suggestions</option>
                        <option value="Bug Report">Bug Reports</option>
                        <option value="Compliment">Compliments</option>
                        <option value="Question">Questions</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 text-left relative w-full sm:w-auto">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-350 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="All">All Statuses 🚦</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Spam">Spam</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={() => loadData(false)}
                      disabled={loading || refreshing}
                      className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center w-9 h-9"
                      title="Refresh feedback submissions list"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading || refreshing ? "animate-spin text-orange-500" : ""}`} />
                    </button>

                  </div>
                </div>

                {/* Feedbacks Grid List */}
                <div className="space-y-4 text-left">
                  {filteredFeedbacks.length === 0 ? (
                    <div className="py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
                      <AlertTriangle className="w-10 h-10 text-zinc-300 dark:text-zinc-650 mb-3" />
                      <h4 className="font-serif text-lg font-bold text-zinc-700 dark:text-zinc-300">No feedbacks found</h4>
                      <p className="text-xs text-zinc-400 mt-1 max-w-[280px]">
                        We couldn't find any feedbacks matching your search keywords and selected filters.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredFeedbacks.map((item) => {
                        
                        let categoryBadge = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
                        if (item.category === "Bug Report") categoryBadge = "bg-red-50 text-red-750 dark:bg-red-950/30 dark:text-red-400 border border-red-100/50 dark:border-red-900/30";
                        else if (item.category === "Suggestion") categoryBadge = "bg-blue-50 text-blue-750 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30";
                        else if (item.category === "Compliment") categoryBadge = "bg-emerald-50 text-emerald-750 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30";
                        else if (item.category === "Question") categoryBadge = "bg-purple-50 text-purple-750 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30";

                        let statusColor = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
                        if (item.status === "Pending") statusColor = "bg-amber-100 text-amber-805 dark:bg-amber-950/40 dark:text-amber-400";
                        else if (item.status === "In Progress") statusColor = "bg-blue-100 text-blue-805 dark:bg-blue-950/40 dark:text-blue-400";
                        else if (item.status === "Resolved") statusColor = "bg-emerald-100 text-emerald-805 dark:bg-emerald-950/40 dark:text-emerald-400";
                        else if (item.status === "Spam") statusColor = "bg-rose-100 text-rose-805 dark:bg-rose-950/40 dark:text-rose-400";

                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md dark:hover:shadow-zinc-950/20"
                          >
                            <div className="flex-grow space-y-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${categoryBadge}`}>
                                  {item.category}
                                </span>

                                <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold ml-auto sm:ml-2">
                                  {formatDate(item.createdAt)}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-left">
                                {item.title && (
                                  <h4 className="font-serif text-base font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                                    {item.title}
                                  </h4>
                                )}

                                <p className="text-zinc-700 dark:text-zinc-200 font-sans text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                                  "{item.message}"
                                </p>
                              </div>

                              {item.imageUrl && (
                                <div className="mt-2 text-left">
                                  <a 
                                    href={item.imageUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-block relative rounded-2xl overflow-hidden border border-zinc-150 dark:border-zinc-800 hover:opacity-90 transition-opacity"
                                  >
                                    <img 
                                      src={item.imageUrl} 
                                      alt="Feedback attachment" 
                                      className="max-w-[200px] max-h-[140px] object-cover" 
                                    />
                                  </a>
                                </div>
                              )}

                              <div className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-850 w-fit">
                                <div className="w-7 h-7 rounded-full bg-zinc-250 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-600 dark:text-zinc-350 uppercase shrink-0">
                                  {(item.name || "A")[0]}
                                </div>
                                <div className="text-[10px] leading-tight">
                                  <span className="block font-bold text-zinc-700 dark:text-zinc-300">{item.name || "Anonymous Guest"}</span>
                                  <span className="block text-zinc-400 dark:text-zinc-500 font-semibold">{item.email || "No email provided"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex flex-col items-start md:items-end gap-2.5 min-w-[140px] border-t md:border-t-0 pt-4 md:pt-0 border-zinc-105 dark:border-zinc-850 w-full md:w-auto">
                              
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Current Status:</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColor}`}>
                                  {item.status}
                                </span>
                              </div>

                              <div className="relative w-full">
                                <select
                                  value={item.status}
                                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                  disabled={updatingId === item.id}
                                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-105 text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-50 transition-all"
                                >
                                  <option value="Pending">Pending Review ⏳</option>
                                  <option value="In Progress">In Progress ⚙️</option>
                                  <option value="Resolved">Resolved ✓</option>
                                  <option value="Spam">Spam/Ignore ✗</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>

                              {updatingId === item.id && (
                                <span className="text-[9px] font-bold text-orange-500 animate-pulse flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin" /> Saving changes...
                                </span>
                              )}

                            </div>

                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT: Admin Accounts Provisioning */}
            {activeTab === "admins" && hasUsersAccess && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                
                {/* Left Side: Create Admin Form */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-6 h-fit shadow-xs">
                  <div className="flex items-center gap-2.5 mb-4">
                    <UserPlus className="w-5 h-5 text-orange-500" />
                    <h3 className="font-serif text-lg font-bold text-zinc-800 dark:text-zinc-100">Provision Admin Account</h3>
                  </div>

                  {isSuperadmin ? (
                    <form onSubmit={handleProvisionAdmin} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Administrator Name</label>
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
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Email Address</label>
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
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Complicated Password</label>
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
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">System Role</label>
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
                          <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Granted Permissions</label>
                          
                          <div className="space-y-2 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-3 bg-zinc-50 dark:bg-zinc-950/20">
                            
                            {/* Feedbacks Checkbox */}
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-755 dark:text-zinc-300">
                              <input 
                                type="checkbox" 
                                checked={newAdminPerms.includes("feedbacks")}
                                onChange={() => togglePermission("feedbacks")}
                                className="w-4 h-4 accent-orange-500 rounded border-zinc-300 focus:ring-orange-500 cursor-pointer"
                              />
                              <span>Feedbacks view & update status</span>
                            </label>

                            {/* Users Checkbox */}
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-755 dark:text-zinc-300">
                              <input 
                                type="checkbox" 
                                checked={newAdminPerms.includes("users")}
                                onChange={() => togglePermission("users")}
                                className="w-4 h-4 accent-orange-500 rounded border-zinc-300 focus:ring-orange-500 cursor-pointer"
                              />
                              <span>Admin users provision manager</span>
                            </label>

                            {/* Setup Pages Checkbox */}
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
                        disabled={adminSubmitting}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-sans"
                      >
                        {adminSubmitting ? (
                          <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-bold">Register Administrator</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="py-6 text-center bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
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
                      <h3 className="font-serif text-lg font-bold text-zinc-850 dark:text-zinc-100">Registered System Nodes</h3>
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
                                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{u.name}</span>
                                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                                    isSuper 
                                      ? "bg-purple-50 text-purple-750 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50" 
                                      : "bg-blue-50 text-blue-755 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50"
                                  }`}>
                                    {u.role.toUpperCase()}
                                  </span>
                                </div>
                                <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">{u.email}</span>
                              </div>
                            </div>

                            {/* Permissions & Created At */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0 md:text-right md:justify-end">
                              {isSuper ? (
                                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-0.5 rounded-md">
                                  Full System Privileges
                                </span>
                              ) : (
                                u.permissions.map(p => (
                                  <span key={p} className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-950/20">
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
            )}

          </div>
        )}

      </main>

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
