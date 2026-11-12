import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  Instagram,
  UserCheck,
  Calendar,
  Edit2,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { useLeads } from "../hooks/useLeads";
import { type Lead, type LeadChannel, type LeadStatus } from "../types";
import { formatPrice, getCurrencySymbol, formatDate } from "../utils/format";

interface LeadsViewProps {
  onSync?: () => void;
  bakeryName?: string;
}

const CHANNELS: LeadChannel[] = [
  "Instagram",
  "WhatsApp",
  "Phone Call",
  "Walk-in",
  "Facebook",
  "Website",
  "Other"
];

const STATUSES: LeadStatus[] = [
  "New Inquiry",
  "In Discussion",
  "Quotation Sent",
  "Converted",
  "Lost"
];

const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; dot: string; border: string }> = {
  "New Inquiry": {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-800/40"
  },
  "In Discussion": {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800/40"
  },
  "Quotation Sent": {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-400",
    dot: "bg-purple-500",
    border: "border-purple-200 dark:border-purple-800/40"
  },
  "Converted": {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800/40"
  },
  "Lost": {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-400",
    border: "border-zinc-200 dark:border-zinc-700"
  }
};

const getChannelBadge = (channel: LeadChannel) => {
  switch (channel) {
    case "Instagram":
      return {
        icon: Instagram,
        bg: "bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/30"
      };
    case "WhatsApp":
      return {
        icon: MessageCircle,
        bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30"
      };
    case "Phone Call":
      return {
        icon: Phone,
        bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/30"
      };
    default:
      return {
        icon: Sparkles,
        bg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
      };
  }
};

const formatRelativeDays = (dateStr?: string) => {
  if (!dateStr) return "Not recorded";
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1) return `${diffDays} days ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
};

const formatNextContactBadge = (dateStr?: string) => {
  if (!dateStr) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      return {
        text: daysOverdue === 1 ? "Follow-up 1 day overdue" : `Follow-up ${daysOverdue} days overdue`,
        subtext: formatDate(dateStr),
        badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
        dotClass: "bg-rose-500",
        isOverdue: true
      };
    }
    if (diffDays === 0) {
      return {
        text: "Follow-up due Today",
        subtext: formatDate(dateStr),
        badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 animate-pulse",
        dotClass: "bg-amber-500",
        isToday: true
      };
    }
    if (diffDays === 1) {
      return {
        text: "Follow-up Tomorrow",
        subtext: formatDate(dateStr),
        badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
        dotClass: "bg-blue-500",
        isUpcoming: true
      };
    }
    return {
      text: `Next follow-up: ${formatDate(dateStr)}`,
      subtext: `in ${diffDays} days`,
      badgeClass: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
      dotClass: "bg-zinc-400",
      isUpcoming: true
    };
  } catch {
    return {
      text: `Next follow-up: ${dateStr}`,
      subtext: "",
      badgeClass: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
      dotClass: "bg-zinc-400",
      isUpcoming: true
    };
  }
};

export default function LeadsView({ onSync, bakeryName }: LeadsViewProps) {
  const {
    filteredLeads,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    channelFilter,
    setChannelFilter,
    sortBy,
    setSortBy,
    isModalOpen,
    setIsModalOpen,
    editingLead,
    setEditingLead,
    stats,
    handleAddLead,
    handleUpdateLead,
    handleDeleteLead,
    handleConvertToCustomer,
  } = useLeads({ onSyncNeeded: onSync });

  // Form local states for Modal
  const [formData, setFormData] = useState<{
    name: string;
    channel: LeadChannel;
    instagramHandle: string;
    whatsappNumber: string;
    phone: string;
    lastSpokeDate: string;
    nextContactDate: string;
    status: LeadStatus;
    notes: string;
    estimatedBudget: string;
  }>({
    name: "",
    channel: "Instagram",
    instagramHandle: "",
    whatsappNumber: "",
    phone: "",
    lastSpokeDate: new Date().toISOString().split("T")[0],
    nextContactDate: "",
    status: "New Inquiry",
    notes: "",
    estimatedBudget: "",
  });

  const openAddModal = () => {
    setEditingLead(null);
    setFormData({
      name: "",
      channel: "Instagram",
      instagramHandle: "",
      whatsappNumber: "",
      phone: "",
      lastSpokeDate: new Date().toISOString().split("T")[0],
      nextContactDate: "",
      status: "New Inquiry",
      notes: "",
      estimatedBudget: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      channel: lead.channel,
      instagramHandle: lead.instagramHandle || "",
      whatsappNumber: lead.whatsappNumber || "",
      phone: lead.phone || "",
      lastSpokeDate: lead.lastSpokeDate || new Date().toISOString().split("T")[0],
      nextContactDate: lead.nextContactDate || "",
      status: lead.status,
      notes: lead.notes || "",
      estimatedBudget: lead.estimatedBudget !== undefined ? String(lead.estimatedBudget) : "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name.trim(),
      channel: formData.channel,
      instagramHandle: formData.instagramHandle.trim().replace(/^@/, ""),
      whatsappNumber: formData.whatsappNumber.trim().replace(/[^0-9]/g, ""),
      phone: formData.phone.trim(),
      lastSpokeDate: formData.lastSpokeDate,
      nextContactDate: formData.nextContactDate || undefined,
      status: formData.status,
      notes: formData.notes.trim(),
      estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
    };

    if (editingLead) {
      await handleUpdateLead(editingLead.id, payload);
    } else {
      await handleAddLead(payload);
    }

    setIsModalOpen(false);
  };

  const openWhatsApp = (whatsappNum?: string, name?: string) => {
    if (!whatsappNum) return;
    const cleanNum = whatsappNum.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(`Hi ${name || ""}, thank you for reaching out to ${bakeryName || "our bakery"}! How can we assist you with your cake inquiry?`);
    window.open(`https://wa.me/${cleanNum}?text=${msg}`, "_blank");
  };

  const openInstagram = (handle?: string) => {
    if (!handle) return;
    const cleanHandle = handle.replace(/^@/, "").trim();
    window.open(`https://instagram.com/${cleanHandle}`, "_blank");
  };

  // Convert to Customer Confirmation Modal state
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [confirmMobile, setConfirmMobile] = useState("");
  const [confirmMobileError, setConfirmMobileError] = useState("");

  const openConvertModal = (lead: Lead) => {
    setConvertingLead(lead);
    setConfirmMobile(lead.whatsappNumber || lead.phone || "");
    setConfirmMobileError("");
  };

  const handleConfirmConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;
    const clean = confirmMobile.trim().replace(/[^0-9+]/g, "");
    if (!clean) {
      setConfirmMobileError("Please enter a valid mobile number.");
      return;
    }
    const success = await handleConvertToCustomer(convertingLead, clean);
    if (success) {
      setConvertingLead(null);
    }
  };

  // Filter & Pagination state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [leadsCurrentPage, setLeadsCurrentPage] = useState(1);
  const [leadsItemsPerPage, setLeadsItemsPerPage] = useState(10);

  useEffect(() => {
    setLeadsCurrentPage(1);
  }, [searchTerm, statusFilter, channelFilter, sortBy]);

  const activeFilterCount =
    (statusFilter !== "All" ? 1 : 0) +
    (channelFilter !== "All" ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter("All");
    setChannelFilter("All");
    setSearchTerm("");
    setSortBy("lastSpoke-newest");
  };

  const paginatedLeads = filteredLeads.slice(
    (leadsCurrentPage - 1) * leadsItemsPerPage,
    leadsCurrentPage * leadsItemsPerPage
  );
  const leadsTotalPages = Math.ceil(filteredLeads.length / leadsItemsPerPage) || 1;

  const renderFilterGroups = () => (
    <div className="space-y-6">
      {/* Status Filter */}
      <div>
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2.5">
          Inquiry Status
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === "All"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <span>All Inquiries</span>
            <span className="text-[10px] font-bold opacity-70">{stats.total}</span>
          </button>
          {STATUSES.map((st) => {
            const count =
              st === "New Inquiry"
                ? stats.newInquiries
                : st === "In Discussion"
                ? stats.inDiscussion
                : st === "Quotation Sent"
                ? stats.quotationSent
                : st === "Converted"
                ? stats.converted
                : stats.lost;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary-brand text-white shadow-xs"
                    : "text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[st]?.dot || 'bg-zinc-400'}`} />
                  <span>{st}</span>
                </div>
                <span className="text-[10px] font-bold opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel Filter */}
      <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2.5">
          Channel
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setChannelFilter("All")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              channelFilter === "All"
                ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                : "text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <span>All Channels</span>
          </button>
          {CHANNELS.map((ch) => {
            const isSelected = channelFilter === ch;
            return (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 font-bold"
                    : "text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{ch}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort By */}
      <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2.5">
          Sort By
        </h3>
        <div className="space-y-1">
          {[
            { id: "lastSpoke-newest", label: "Last Spoke: Recent First" },
            { id: "nextContact-soonest", label: "Follow-up: Soonest First" },
            { id: "updated-newest", label: "Updated: Recent First" },
            { id: "created-newest", label: "Created: Recent First" },
            { id: "budget-highest", label: "Budget: High to Low" },
            { id: "name-az", label: "Name: A to Z" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSortBy(s.id as any)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                sortBy === s.id
                  ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 font-bold"
                  : "text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-2xl font-bold font-serif text-primary-brand dark:text-orange-400 truncate">
              Lead Management
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-primary-brand dark:text-pink-400 border border-pink-200 dark:border-pink-850 shrink-0">
              CRM
            </span>
            <span className="text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 shrink-0">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'Inquiry' : 'Inquiries'}
            </span>
          </div>
          <p className="hidden sm:block text-xs text-zinc-550 font-sans mt-0.5">
            Track customer inquiries from Instagram, WhatsApp & phone. Nurture prospects and convert to orders.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary-brand text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-brand hover:bg-opacity-95 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* ── MAIN 12-COL LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Filter Desk */}
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4 flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-808 dark:text-zinc-105 uppercase tracking-wider">
              Filter Desk
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[10px] font-bold text-primary-brand dark:text-orange-400 hover:underline cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
          {renderFilterGroups()}
        </aside>

        {/* Mobile / tablet slide-in filter drawer */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              <motion.div
                key="filter-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFiltersOpen(false)}
                className="lg:hidden fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50"
              />
              <motion.div
                key="filter-drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="lg:hidden fixed inset-y-0 left-0 w-[300px] bg-white dark:bg-zinc-850 z-50 shadow-2xl flex flex-col border-r border-zinc-200 dark:border-zinc-700"
              >
                <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-700 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-sans">
                      Filter Leads
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-5 py-4 overflow-y-auto custom-scrollbar flex-1">
                  {renderFilterGroups()}
                </div>
                <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-700 shrink-0 flex gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 py-2.5 bg-primary-brand hover:bg-opacity-95 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Show results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Right Main Content */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800 shadow-xs flex flex-col min-h-[350px]">
            {/* Follow-up Attention Alert */}
            {(stats.overdueFollowUps > 0 || stats.followUpsDueToday > 0) && (
              <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 px-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    {stats.overdueFollowUps > 0 && (
                      <strong className="text-rose-600 dark:text-rose-400 mr-2 font-bold">
                        ⚠️ {stats.overdueFollowUps} overdue follow-up{stats.overdueFollowUps > 1 ? "s" : ""}
                      </strong>
                    )}
                    {stats.followUpsDueToday > 0 && (
                      <strong className="text-amber-700 dark:text-amber-400 font-bold">
                        🔔 {stats.followUpsDueToday} due today
                      </strong>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSortBy("nextContact-soonest")}
                  className="text-[10px] font-bold text-primary-brand dark:text-pink-400 hover:underline cursor-pointer ml-auto"
                >
                  Sort by Due &rarr;
                </button>
              </div>
            )}

            {/* ── STATS TILES ── */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
              <button
                type="button"
                onClick={() => setStatusFilter("All")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  statusFilter === "All"
                    ? "bg-zinc-100 dark:bg-zinc-800 ring-1.5 ring-zinc-400 dark:ring-zinc-600 shadow-2xs"
                    : "bg-zinc-50/80 dark:bg-zinc-800/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                    Total
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 dark:bg-zinc-300 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 leading-none">
                  {stats.total}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("In Discussion")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  statusFilter === "In Discussion"
                    ? "bg-amber-100/80 dark:bg-amber-950/40 ring-1.5 ring-amber-400 shadow-2xs"
                    : "bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-700/80 dark:text-amber-300/80 uppercase tracking-wider truncate">
                    In Discussion
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-amber-600 dark:text-amber-400 tracking-tight mt-1 leading-none">
                  {stats.inDiscussion}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("Quotation Sent")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  statusFilter === "Quotation Sent"
                    ? "bg-purple-100/80 dark:bg-purple-950/40 ring-1.5 ring-purple-400 shadow-2xs"
                    : "bg-purple-50/60 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-purple-700/80 dark:text-purple-300/80 uppercase tracking-wider truncate">
                    Quotes Sent
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-purple-600 dark:text-purple-400 tracking-tight mt-1 leading-none">
                  {stats.quotationSent}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("Converted")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  statusFilter === "Converted"
                    ? "bg-emerald-100/80 dark:bg-emerald-950/40 ring-1.5 ring-emerald-400 shadow-2xs"
                    : "bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700/80 dark:text-emerald-300/80 uppercase tracking-wider truncate">
                    Converted
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 leading-none">
                  {stats.converted}
                </div>
              </button>
            </div>

            {/* Search input */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-550" />
              <input
                type="text"
                placeholder="Search leads (prospect name, WhatsApp, Instagram handle, notes)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-755 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand font-medium"
              />
            </div>

            {/* Active filter chips */}
            {(statusFilter !== "All" || channelFilter !== "All" || searchTerm.trim()) && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4 animate-fade-in">
                {statusFilter !== "All" && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("All")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Status: {statusFilter}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {channelFilter !== "All" && (
                  <button
                    type="button"
                    onClick={() => setChannelFilter("All")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Channel: {channelFilter}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Search: "{searchTerm}"
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 hover:text-zinc-600 dark:hover:text-zinc-300 uppercase tracking-wider cursor-pointer transition-colors ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Compact Leads Cards List */}
            <div className="space-y-3 flex-1">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 animate-pulse space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div>
                    </div>
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-850 rounded w-1/5"></div>
                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div className="h-8 bg-zinc-100 dark:bg-zinc-850 rounded"></div>
                      <div className="h-8 bg-zinc-100 dark:bg-zinc-850 rounded"></div>
                      <div className="h-8 bg-zinc-100 dark:bg-zinc-850 rounded"></div>
                    </div>
                  </div>
                ))
              ) : paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => {
                  const badge = getChannelBadge(lead.channel);
                  const ChannelIcon = badge.icon;
                  const statusConfig = STATUS_COLORS[lead.status] || STATUS_COLORS["New Inquiry"];
                  const nextContact = formatNextContactBadge(lead.nextContactDate);

                  return (
                    <div
                      key={lead.id}
                      className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left group"
                    >
                      {/* Row 1: Channel + Name & Status Dropdown */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}
                            title={`Channel: ${lead.channel}`}
                          >
                            <ChannelIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-primary-brand dark:group-hover:text-orange-400 transition-colors truncate">
                              {lead.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {lead.instagramHandle && (
                                <button
                                  type="button"
                                  onClick={() => openInstagram(lead.instagramHandle)}
                                  className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  @{lead.instagramHandle}
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </button>
                              )}
                              {lead.whatsappNumber && (
                                <button
                                  type="button"
                                  onClick={() => openWhatsApp(lead.whatsappNumber, lead.name)}
                                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  {lead.whatsappNumber}
                                </button>
                              )}
                              {lead.phone && !lead.whatsappNumber && (
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                >
                                  {lead.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status dropdown */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateLead(lead.id, { status: e.target.value as LeadStatus })}
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-brand ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            {STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Notes snippet if present */}
                      {lead.notes && (
                        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-150 dark:border-zinc-800/80 line-clamp-1 font-sans">
                          {lead.notes}
                        </p>
                      )}

                      {/* Row 2: Metrics and Actions */}
                      <div className="mt-3 pt-2 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/60">
                        <div className="grid grid-cols-3 gap-3 sm:gap-6 flex-1">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                              LAST SPOKE
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans truncate block">
                              {formatRelativeDays(lead.lastSpokeDate)}
                            </span>
                          </div>

                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                              NEXT FOLLOW-UP
                            </span>
                            <div className="mt-0.5">
                              {nextContact ? (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${nextContact.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${nextContact.dotClass}`} />
                                  <span className="truncate max-w-[120px]">{nextContact.text}</span>
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 italic">
                                  Not set
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                              EST. BUDGET
                            </span>
                            <span className="text-sm font-bold text-primary-brand dark:text-orange-400 font-serif">
                              {lead.estimatedBudget !== undefined && lead.estimatedBudget > 0
                                ? formatPrice(lead.estimatedBudget)
                                : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {lead.whatsappNumber && (
                            <button
                              type="button"
                              onClick={() => openWhatsApp(lead.whatsappNumber, lead.name)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {lead.instagramHandle && (
                            <button
                              type="button"
                              onClick={() => openInstagram(lead.instagramHandle)}
                              className="p-1.5 rounded-lg text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors cursor-pointer"
                              title="Instagram Profile"
                            >
                              <Instagram className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {lead.status !== "Converted" && (
                            <button
                              type="button"
                              onClick={() => openConvertModal(lead)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              title="Convert to Customer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edit Lead"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove inquiry for "${lead.name}"?`)) {
                                handleDeleteLead(lead.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm">
                  <Search className="w-12 h-12 text-zinc-350 dark:text-zinc-700 mx-auto mb-3 opacity-60" />
                  <p className="font-bold text-zinc-500 dark:text-zinc-450">No Leads Discovered</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1 max-w-[280px] text-center font-sans">
                    There are no leads matching your selected filters or search keyword.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    {(statusFilter !== "All" || channelFilter !== "All" || searchTerm) && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-750 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Clear filters
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary-brand hover:bg-opacity-95 text-white transition-colors cursor-pointer"
                    >
                      New Lead
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination controls for Leads */}
            {filteredLeads.length > 0 && (
              <div className="flex flex-row items-center justify-between gap-3 pt-5 mt-6 border-t border-zinc-200/60 dark:border-zinc-800/80 w-full">
                {/* Showing details */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                  <span className="hidden sm:inline">Showing </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{(leadsCurrentPage - 1) * leadsItemsPerPage + 1}</span>–
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{Math.min(leadsCurrentPage * leadsItemsPerPage, filteredLeads.length)}</span> of{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredLeads.length}</span>
                  <span className="hidden sm:inline"> inquiries</span>
                  <span className="sm:hidden"> leads</span>
                </div>

                {/* Page buttons and Desktop Select container */}
                <div className="flex items-center gap-3">
                  {/* Page buttons */}
                  <div className="flex items-center bg-zinc-50 dark:bg-zinc-900/60 p-0.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setLeadsCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={leadsCurrentPage === 1}
                      aria-label="Previous page"
                      className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: leadsTotalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (leadsTotalPages > 4) {
                        const isCurrent = leadsCurrentPage === pageNum;
                        const isFirst = pageNum === 1;
                        const isLast = pageNum === leadsTotalPages;
                        const isAdjacent = Math.abs(pageNum - leadsCurrentPage) <= 1;

                        if (!isCurrent && !isFirst && !isLast && !isAdjacent) {
                          if (pageNum === 2 || pageNum === leadsTotalPages - 1) {
                            return <span key={pageNum} className="px-1 text-[10px] text-zinc-400">...</span>;
                          }
                          return null;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setLeadsCurrentPage(pageNum)}
                          aria-label={`Page ${pageNum}`}
                          className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                            leadsCurrentPage === pageNum
                              ? "bg-primary-brand text-white shadow-xs"
                              : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setLeadsCurrentPage(prev => Math.min(prev + 1, leadsTotalPages))}
                      disabled={leadsCurrentPage === leadsTotalPages || leadsTotalPages === 0}
                      aria-label="Next page"
                      className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Desktop show select */}
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Show</span>
                    <select
                      aria-label="Leads per page"
                      value={leadsItemsPerPage}
                      onChange={(e) => {
                        setLeadsItemsPerPage(Number(e.target.value));
                        setLeadsCurrentPage(1);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-medium outline-none focus:ring-1 focus:ring-primary-brand/35 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    >
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Lead Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800 mb-5">
                <div>
                  <h2 className="text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100">
                    {editingLead ? "Edit Lead Inquiry" : "New Customer Inquiry"}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Capture contact details and inquiry requirements
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Prospect Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand"
                  />
                </div>

                {/* Channel & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Lead Channel / Platform
                    </label>
                    <select
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value as LeadChannel })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand"
                    >
                      {CHANNELS.map((ch) => (
                        <option key={ch} value={ch}>
                          {ch}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Inquiry Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Instagram Handle & WhatsApp Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                      <Instagram className="w-3.5 h-3.5 text-pink-500" />
                      <span>Instagram Handle</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">@</span>
                      <input
                        type="text"
                        placeholder="username"
                        value={formData.instagramHandle}
                        onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                        className="w-full pl-7 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>WhatsApp Number</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 919876543210"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand"
                    />
                  </div>
                </div>

                {/* Regular Phone & Estimated Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Regular Phone (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Estimated Budget ({getCurrencySymbol()})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                        {getCurrencySymbol()}
                      </span>
                      <input
                        type="number"
                        step="1"
                        placeholder="e.g. 1500"
                        value={formData.estimatedBudget}
                        onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                        className="w-full pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand"
                      />
                    </div>
                  </div>
                </div>

                {/* Last Spoke Date & Next Contact / Follow-up Date */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Last Spoke Date</span>
                      </label>
                      <input
                        type="date"
                        value={formData.lastSpokeDate}
                        onChange={(e) => setFormData({ ...formData, lastSpokeDate: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-primary-brand dark:text-pink-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Next Contact Date</span>
                        </span>
                        {formData.nextContactDate && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, nextContactDate: "" })}
                            className="text-[10px] text-zinc-400 hover:text-rose-500 font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </label>
                      <input
                        type="date"
                        value={formData.nextContactDate}
                        onChange={(e) => setFormData({ ...formData, nextContactDate: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons for Next Contact Date */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">Quick set follow-up:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        setFormData({ ...formData, nextContactDate: d.toISOString().split("T")[0] });
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-primary-brand hover:text-white transition-colors cursor-pointer"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 3);
                        setFormData({ ...formData, nextContactDate: d.toISOString().split("T")[0] });
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-primary-brand hover:text-white transition-colors cursor-pointer"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        setFormData({ ...formData, nextContactDate: d.toISOString().split("T")[0] });
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-primary-brand hover:text-white transition-colors cursor-pointer"
                    >
                      +1 Week
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Inquiry Notes & Cake Requirements
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Inquired about 2-tier Belgian Chocolate cake for daughter's 5th birthday on Saturday, wants eggless with unicorn theme."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-brand resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-brand hover:bg-pink-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {editingLead ? "Save Changes" : "Create Lead"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Convert to Customer Confirmation Modal */}
      <AnimatePresence>
        {convertingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/40">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-zinc-100">
                      Move to Customer Directory
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Confirm mobile number to create customer account
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConvertingLead(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Prospect Card summary */}
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-700/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                    {convertingLead.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    {convertingLead.channel}
                  </span>
                </div>
                {convertingLead.instagramHandle && (
                  <p className="text-zinc-500 flex items-center gap-1 text-[11px]">
                    <Instagram className="w-3 h-3 text-pink-500" />
                    <span>@{convertingLead.instagramHandle}</span>
                  </p>
                )}
                {convertingLead.notes && (
                  <p className="text-zinc-500 dark:text-zinc-400 line-clamp-1 italic text-[11px]">
                    "{convertingLead.notes}"
                  </p>
                )}
              </div>

              <form onSubmit={handleConfirmConvert} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Customer Mobile Number *</span>
                  </label>
                  <input
                    required
                    autoFocus
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={confirmMobile}
                    onChange={(e) => {
                      setConfirmMobile(e.target.value);
                      if (confirmMobileError) setConfirmMobileError("");
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {confirmMobileError && (
                    <p className="text-[11px] text-rose-500 font-bold mt-1">
                      {confirmMobileError}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                    This phone number will be used for order invoices, WhatsApp debriefs, and customer history.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConvertingLead(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Confirm & Move</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
