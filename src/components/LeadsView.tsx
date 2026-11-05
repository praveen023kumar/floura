// File Path: /src/components/LeadsView.tsx
import React, { useState } from "react";
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
  X
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

  return (
    <div className="space-y-6">
      {/* Header Segments */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-50">
              Lead Management
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-primary-brand dark:text-pink-400 border border-pink-200 dark:border-pink-850">
              CRM
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track customer inquiries from Instagram, WhatsApp & phone. Nurture prospects and convert to orders.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-brand hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Lead / Inquiry</span>
        </button>
      </div>

      {/* Follow-up Attention Alert */}
      {(stats.overdueFollowUps > 0 || stats.followUpsDueToday > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {stats.overdueFollowUps > 0 && (
                <strong className="text-rose-600 dark:text-rose-400 mr-2 font-bold">
                  ⚠️ {stats.overdueFollowUps} overdue follow-up{stats.overdueFollowUps > 1 ? "s" : ""}
                </strong>
              )}
              {stats.followUpsDueToday > 0 && (
                <strong className="text-amber-700 dark:text-amber-400 font-bold">
                  🔔 {stats.followUpsDueToday} follow-up{stats.followUpsDueToday > 1 ? "s" : ""} scheduled for today
                </strong>
              )}
            </span>
          </div>
          <button
            onClick={() => setSortBy("nextContact-soonest")}
            className="text-[11px] font-bold text-primary-brand dark:text-pink-400 hover:underline cursor-pointer ml-auto"
          >
            Sort by Follow-up Due &rarr;
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Inquiries
          </span>
          <span className="text-xl font-bold font-serif text-zinc-800 dark:text-zinc-100 mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
            In Discussion
          </span>
          <span className="text-xl font-bold font-serif text-amber-600 dark:text-amber-400 mt-1 block">
            {stats.inDiscussion}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs">
          <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider block">
            Quotes Sent
          </span>
          <span className="text-xl font-bold font-serif text-purple-600 dark:text-purple-400 mt-1 block">
            {stats.quotationSent}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block">
            Converted
          </span>
          <span className="text-xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mt-1 block">
            {stats.converted}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by prospect name, WhatsApp, Instagram handle, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-brand"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as any)}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand cursor-pointer"
            >
              <option value="All">All Channels</option>
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand cursor-pointer"
            >
              <option value="lastSpoke-newest">Last Spoke: Recent First</option>
              <option value="nextContact-soonest">Next Follow-up: Soonest First</option>
              <option value="updated-newest">Updated: Recent First</option>
              <option value="created-newest">Created: Recent First</option>
              <option value="budget-highest">Budget: High to Low</option>
              <option value="name-az">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter("All")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === "All"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            All Inquiries ({stats.total})
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
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-primary-brand text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads List / Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
          Loading inquiries...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800/50 p-12 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700/60 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-primary-brand dark:text-pink-400 mx-auto flex items-center justify-center">
            <Instagram className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            No leads found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "All" || channelFilter !== "All"
              ? "No inquiries match your current search and filter criteria."
              : "Capture prospects who message you on Instagram or WhatsApp to easily follow up and turn them into paying cake orders."}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-brand text-white text-xs font-bold shadow-xs hover:bg-pink-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Lead</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLeads.map((lead) => {
            const badge = getChannelBadge(lead.channel);
            const ChannelIcon = badge.icon;
            const statusConfig = STATUS_COLORS[lead.status] || STATUS_COLORS["New Inquiry"];

            return (
              <motion.div
                key={lead.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-200/90 dark:border-zinc-700/70 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Top Bar: Channel Badge + Status Dropdown */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.bg}`}
                    >
                      <ChannelIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{lead.channel}</span>
                    </span>

                    {/* Status updater */}
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateLead(lead.id, { status: e.target.value as LeadStatus })}
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-brand ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Prospect Name & Handles */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                      <span>{lead.name}</span>
                      {lead.estimatedBudget !== undefined && lead.estimatedBudget > 0 && (
                        <span className="text-xs font-mono font-bold text-primary-brand dark:text-pink-400">
                          {formatPrice(lead.estimatedBudget)}
                        </span>
                      )}
                    </h3>

                    {/* Contact Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {lead.instagramHandle && (
                        <button
                          onClick={() => openInstagram(lead.instagramHandle)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer bg-pink-50/50 dark:bg-pink-950/30 px-2 py-0.5 rounded-md"
                          title="Open Instagram Profile"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>@{lead.instagramHandle}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      )}

                      {lead.whatsappNumber && (
                        <button
                          onClick={() => openWhatsApp(lead.whatsappNumber, lead.name)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer bg-emerald-50/50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{lead.whatsappNumber}</span>
                        </button>
                      )}

                      {lead.phone && !lead.whatsappNumber && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50/50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{lead.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Notes Snippet */}
                  {lead.notes && (
                    <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 line-clamp-2">
                      {lead.notes}
                    </p>
                  )}

                  {/* Last Spoke & Next Contact Indicators */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Last spoke: <strong>{formatRelativeDays(lead.lastSpokeDate)}</strong></span>
                      </span>
                      <button
                        onClick={() => handleUpdateLead(lead.id, { lastSpokeDate: new Date().toISOString().split("T")[0] })}
                        className="text-[10px] font-bold text-primary-brand dark:text-pink-400 hover:underline cursor-pointer"
                        title="Update last spoke date to today"
                      >
                        Spoke Today
                      </button>
                    </div>

                    {/* Next Follow-up Indicator */}
                    {lead.nextContactDate ? (
                      (() => {
                        const badge = formatNextContactBadge(lead.nextContactDate);
                        if (!badge) return null;
                        return (
                          <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${badge.badgeClass}`}>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
                              <span>{badge.text}</span>
                            </span>
                            {badge.subtext && <span className="text-[10px] font-semibold opacity-80">{badge.subtext}</span>}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                        <span className="text-[10px] italic">No next follow-up scheduled</span>
                        <button
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 2);
                            handleUpdateLead(lead.id, { nextContactDate: d.toISOString().split("T")[0] });
                          }}
                          className="text-[10px] font-bold text-zinc-500 hover:text-primary-brand dark:hover:text-pink-400 cursor-pointer"
                          title="Schedule follow-up for 2 days from now"
                        >
                          + Set in 2 Days
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp Quick Chat */}
                    {lead.whatsappNumber && (
                      <button
                        onClick={() => openWhatsApp(lead.whatsappNumber, lead.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Open WhatsApp chat with pre-written inquiry greeting"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    )}

                    {/* Instagram Profile */}
                    {lead.instagramHandle && (
                      <button
                        onClick={() => openInstagram(lead.instagramHandle)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Open Instagram Profile"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>Instagram</span>
                      </button>
                    )}

                    {/* Convert to Customer */}
                    {lead.status !== "Converted" && (
                      <button
                        onClick={() => openConvertModal(lead)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                        title="Add to Customer directory"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="hidden sm:inline">Convert</span>
                      </button>
                    )}
                  </div>

                  {/* Edit and Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(lead)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
                      title="Edit Lead"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
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
              </motion.div>
            );
          })}
        </div>
      )}

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
