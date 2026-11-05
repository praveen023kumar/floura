import { Users, MessageSquare, Clock, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { AdminUser, FeedbackItem } from "./types";

interface AdminOverviewTabProps {
  user: AdminUser;
  registeredUsersCount: number;
  feedbacks: FeedbackItem[];
  hasUsersAccess: boolean;
  hasFeedbacksAccess: boolean;
  onNavigate: (path: string) => void;
}

export default function AdminOverviewTab({
  user,
  registeredUsersCount,
  feedbacks,
  hasUsersAccess,
  hasFeedbacksAccess,
  onNavigate
}: AdminOverviewTabProps) {
  const totalFeedbacks = feedbacks.length;
  const pendingFeedbacks = feedbacks.filter((f) => f.status === "Pending").length;
  const resolvedFeedbacks = feedbacks.filter((f) => f.status === "Resolved").length;

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="flex flex-col text-left mb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-sans">
          Welcome to the Control Center, {user.name.split(" ")[0]}!
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium mt-1">
          Monitor user registration growth, manage system feedback, track subscriptions, and configure administrative access levels.
        </p>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Registered Users */}
        <div
          onClick={() => onNavigate("/admin/users")}
          className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between h-[130px] cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50 dark:bg-orange-950/50 shrink-0">
                <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-tight">
                Registered Bakers
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="space-y-1 mt-3">
            <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              {registeredUsersCount} Users
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
              Active workspace accounts
            </p>
          </div>
        </div>

        {/* Feedbacks Total */}
        <div
          onClick={() => onNavigate("/admin/feedbacks")}
          className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between h-[130px] cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 shrink-0">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-tight">
                Total Feedbacks
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="space-y-1 mt-3">
            <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              {totalFeedbacks} Submissions
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
              Guest comments & reports
            </p>
          </div>
        </div>

        {/* Feedbacks Pending */}
        {(() => {
          const pendingPercent = totalFeedbacks > 0 ? Math.round((pendingFeedbacks / totalFeedbacks) * 100) : 0;
          return (
            <div
              onClick={() => onNavigate("/admin/feedbacks")}
              className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between h-[130px] cursor-pointer group text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/50 shrink-0">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-tight">
                    Pending Review
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition" />
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
            <div
              onClick={() => onNavigate("/admin/feedbacks")}
              className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between h-[130px] cursor-pointer group text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-tight">
                    Resolved & Closed
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition" />
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
                    <span className="text-amber-500">
                      {pendingFeedbacks} / {totalFeedbacks || 1} (
                      {Math.round((pendingFeedbacks / (totalFeedbacks || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${(pendingFeedbacks / (totalFeedbacks || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-zinc-500">Resolved & Closed</span>
                    <span className="text-emerald-500">
                      {resolvedFeedbacks} / {totalFeedbacks || 1} (
                      {Math.round((resolvedFeedbacks / (totalFeedbacks || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(resolvedFeedbacks / (totalFeedbacks || 1)) * 100}%` }}
                    />
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
                <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Engine
                </span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                  SQLite 3.x
                </span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150/50 dark:border-zinc-850">
                <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Users Schema
                </span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 block font-mono">
                  admin_users
                </span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150/50 dark:border-zinc-850">
                <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Feedback Schema
                </span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 block font-mono">
                  feedbacks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action and Overview guide */}
        <div className="space-y-6">
          <div className="bg-gradient-to-tr from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-3xl p-6 border border-zinc-800 relative overflow-hidden text-left shadow-lg">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
            <Sparkles className="w-8 h-8 text-orange-400 mb-4 animate-pulse" />
            <h3 className="text-xl font-bold tracking-tight text-white mb-2">Oversee Floura</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium mb-6">
              Monitor user registration growth, review submitted feedback to address bugs, and provision system administrator permissions dynamically.
            </p>
            <div className="flex gap-3">
              {hasFeedbacksAccess && (
                <button
                  onClick={() => onNavigate("/admin/feedbacks")}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Feedbacks
                </button>
              )}
              {hasUsersAccess && (
                <button
                  onClick={() => onNavigate("/admin/admins")}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer border border-zinc-700"
                >
                  Admin Provisioning
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
