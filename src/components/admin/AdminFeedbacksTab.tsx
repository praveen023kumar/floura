import { useState } from "react";
import { Search, ChevronDown, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { FeedbackItem } from "./types";

interface AdminFeedbacksTabProps {
  feedbacks: FeedbackItem[];
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
  updatingId: string | null;
  onRefresh: () => void;
  refreshing: boolean;
  formatDate: (dateStr: string) => string;
}

export default function AdminFeedbacksTab({
  feedbacks,
  onStatusChange,
  updatingId,
  onRefresh,
  refreshing,
  formatDate
}: AdminFeedbacksTabProps) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filteredFeedbacks = feedbacks.filter((item) => {
    const matchesSearch =
      (item.title && item.title.toLowerCase().includes(searchText.toLowerCase())) ||
      item.message.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.email && item.email.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.name && item.name.toLowerCase().includes(searchText.toLowerCase()));

    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
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
            placeholder="Search keywords, email, or guest..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs font-semibold placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-2 text-left relative w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-350 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="All">All Categories 📁</option>
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
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center w-9 h-9"
            title="Refresh feedback submissions list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Feedbacks Grid List */}
      <div className="space-y-4 text-left">
        {filteredFeedbacks.length === 0 ? (
          <div className="py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-zinc-300 dark:text-zinc-650 mb-3" />
            <h4 className="font-serif text-lg font-bold text-zinc-700 dark:text-zinc-300">
              No feedbacks found
            </h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-[280px]">
              We couldn't find any feedbacks matching your search keywords and selected filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFeedbacks.map((item) => {
              let categoryBadge = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
              if (item.category === "Bug Report") {
                categoryBadge =
                  "bg-red-50 text-red-750 dark:bg-red-950/30 dark:text-red-400 border border-red-100/50 dark:border-red-900/30";
              } else if (item.category === "Suggestion") {
                categoryBadge =
                  "bg-blue-50 text-blue-750 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30";
              } else if (item.category === "Compliment") {
                categoryBadge =
                  "bg-emerald-50 text-emerald-750 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30";
              } else if (item.category === "Question") {
                categoryBadge =
                  "bg-purple-50 text-purple-750 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30";
              }

              let statusColor = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
              if (item.status === "Pending") {
                statusColor = "bg-amber-100 text-amber-805 dark:bg-amber-950/40 dark:text-amber-400";
              } else if (item.status === "In Progress") {
                statusColor = "bg-blue-100 text-blue-805 dark:bg-blue-950/40 dark:text-blue-400";
              } else if (item.status === "Resolved") {
                statusColor = "bg-emerald-100 text-emerald-805 dark:bg-emerald-950/40 dark:text-emerald-400";
              } else if (item.status === "Spam") {
                statusColor = "bg-rose-100 text-rose-805 dark:bg-rose-950/40 dark:text-rose-400";
              }

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
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${categoryBadge}`}
                      >
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
                        <span className="block font-bold text-zinc-700 dark:text-zinc-300">
                          {item.name || "Anonymous Guest"}
                        </span>
                        <span className="block text-zinc-400 dark:text-zinc-500 font-semibold">
                          {item.email || "No email provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-start md:items-end gap-2.5 min-w-[140px] border-t md:border-t-0 pt-4 md:pt-0 border-zinc-105 dark:border-zinc-850 w-full md:w-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                        Current Status:
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColor}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="relative w-full">
                      <select
                        value={item.status}
                        onChange={(e) => onStatusChange(item.id, e.target.value)}
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
  );
}
