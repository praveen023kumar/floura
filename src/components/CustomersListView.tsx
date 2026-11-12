import React, { useState, useMemo, useEffect, memo } from "react";
import { memoWithData } from "../utils/memo";
import { type Customer } from "../types";
import { formatDate } from "../utils/format";
import { useCustomers } from "../hooks/useCustomers";
import { useQuery } from "@tanstack/react-query";
import { localDb } from "../db";
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  MessageCircle,
  Edit,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  UserPlus,
  Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Avatar from "./Avatar";

interface CustomersListViewProps {
  locationState?: any;
  onNavigate?: (path: string | number, state?: any) => void;
}

function CustomersListView({ locationState, onNavigate }: CustomersListViewProps) {
  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    paginatedCustomers,
    filteredCount,
    customerOrderCounts,
    customersCurrentPage,
    setCustomersCurrentPage,
    customersItemsPerPage,
    setCustomersItemsPerPage,
    customersTotalPages,
    handleCall,
    handleSMS,
    handleWhatsApp,
    isLoading: loading,
  } = useCustomers();

  const { data: customerCounts } = useQuery({
    queryKey: ["customers", "metrics_counts"],
    queryFn: async () => {
      try {
        const all = await localDb.customers.query(
          "SELECT type, count(*) as count FROM customers WHERE isDeleted = 0 GROUP BY type"
        );
        let total = 0;
        let frequent = 0;
        let corporate = 0;
        let standard = 0;
        (all || []).forEach((row: any) => {
          total += row.count;
          if (row.type === "Frequent") frequent = row.count;
          else if (row.type === "Corporate") corporate = row.count;
          else standard += row.count;
        });
        return { total, frequent, corporate, standard };
      } catch {
        return { total: 0, frequent: 0, corporate: 0, standard: 0 };
      }
    }
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFilterCount = (filterType !== "All" ? 1 : 0) + (sortBy !== "updated-newest" ? 1 : 0);

  const clearAllFilters = () => {
    setFilterType("All");
    setSortBy("updated-newest");
    setSearchTerm("");
  };

  const customerTypeOptions = [
    { value: "All", label: "All Customers" },
    { value: "Frequent", label: "Frequent" },
    { value: "New", label: "New" },
    { value: "Corporate", label: "Corporate" },
  ] as const;

  const sortOptions = [
    { value: "updated-newest", label: "Recently Updated" },
    { value: "member-newest", label: "Member Since: Newest" },
    { value: "member-oldest", label: "Member Since: Oldest" },
    { value: "orders-highest", label: "Orders: High to Low" },
    { value: "orders-lowest", label: "Orders: Low to High" },
    { value: "name-az", label: "Name: A to Z" },
  ] as const;

  const renderFilterGroups = () => (
    <div className="space-y-6">
      {/* Customer Type facet */}
      <div>
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2.5">
          Customer Type
        </h3>
        <div className="space-y-0.5" role="radiogroup" aria-label="Filter customers by type">
          {customerTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={filterType === opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand ${
                filterType === opt.value
                  ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                filterType === opt.value ? "border-primary-brand dark:border-orange-400" : "border-zinc-300 dark:border-zinc-600"
              }`}>
                {filterType === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort facet */}
      <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2.5">
          Sort By
        </h3>
        <div className="space-y-0.5" role="radiogroup" aria-label="Sort customers">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={sortBy === opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand ${
                sortBy === opt.value
                  ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                sortBy === opt.value ? "border-primary-brand dark:border-orange-400" : "border-zinc-300 dark:border-zinc-600"
              }`}>
                {sortBy === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />}
              </span>
              {opt.label}
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
            <h2 className="text-lg sm:text-2xl font-bold font-serif text-primary-brand dark:text-orange-400 truncate">
              Client Database
            </h2>
            <span className="text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 shrink-0">
              {filteredCount} {filteredCount === 1 ? 'Client' : 'Clients'}
            </span>
          </div>
          <p className="hidden sm:block text-xs text-zinc-550 font-sans mt-0.5">
            Track client loyalties and coordinate messaging triggers easily.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden relative flex items-center justify-center bg-white dark:bg-zinc-800 w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary-brand shrink-0"
            title="Filters"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-brand dark:bg-orange-400 text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("/leads")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-pink-200 dark:border-pink-900/40 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 text-primary-brand dark:text-pink-400 text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0"
            title="Lead Management (CRM)"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leads & Inquiries</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("/customers/new")}
            className="w-10 h-10 rounded-full bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
            title="Add Customer"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop side menu */}
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
                transition={{ type: "tween", duration: 0.25 }}
                role="dialog"
                aria-modal="true"
                aria-label="Filter and sort customers"
                className="lg:hidden fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs bg-white dark:bg-zinc-800 shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-700 shrink-0">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-sans">Filters & Sort</h3>
                  <button
                    type="button"
                    aria-label="Close filters"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-brand"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
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
                    className="flex-1 py-2.5 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-400 dark:hover:bg-orange-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Show results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800 shadow-xs flex flex-col min-h-[350px]">
            {/* ── STATS TILES ── */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setFilterType("All");
                  setSearchTerm("");
                }}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  filterType === "All"
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
                  {customerCounts?.total ?? filteredCount}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterType("Frequent")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  filterType === "Frequent"
                    ? "bg-pink-100/80 dark:bg-pink-950/40 ring-1.5 ring-pink-400 shadow-2xs"
                    : "bg-pink-50/60 dark:bg-pink-950/20 hover:bg-pink-100/60 dark:hover:bg-pink-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-pink-700/80 dark:text-pink-300/80 uppercase tracking-wider truncate">
                    Frequent
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-pink-600 dark:text-pink-400 tracking-tight mt-1 leading-none">
                  {customerCounts?.frequent ?? 0}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterType("Corporate")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  filterType === "Corporate"
                    ? "bg-purple-100/80 dark:bg-purple-950/40 ring-1.5 ring-purple-400 shadow-2xs"
                    : "bg-purple-50/60 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-purple-700/80 dark:text-purple-300/80 uppercase tracking-wider truncate">
                    Corporate
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-purple-600 dark:text-purple-400 tracking-tight mt-1 leading-none">
                  {customerCounts?.corporate ?? 0}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterType("New")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  filterType === "New"
                    ? "bg-blue-100/80 dark:bg-blue-950/40 ring-1.5 ring-blue-400 shadow-2xs"
                    : "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-700/80 dark:text-blue-300/80 uppercase tracking-wider truncate">
                    New / Std
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-blue-600 dark:text-blue-400 tracking-tight mt-1 leading-none">
                  {customerCounts?.standard ?? 0}
                </div>
              </button>
            </div>

            {/* Search row */}
            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-550" />
                <input
                  type="text"
                  placeholder="Search customers (ID, name, contact number)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-755 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-500 font-medium"
                />
              </div>
            </div>

            {/* Active filter chips */}
            {(filterType !== "All" || sortBy !== "updated-newest" || searchTerm.trim()) && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4 animate-fade-in">
                {filterType !== "All" && (
                  <button
                    type="button"
                    onClick={() => setFilterType("All")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {filterType} Customers
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {sortBy !== "updated-newest" && (
                  <button
                    type="button"
                    onClick={() => setSortBy("updated-newest")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {sortOptions.find((o) => o.value === sortBy)?.label}
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Search: "{searchTerm}"
                    <X className="w-3 h-3" aria-hidden="true" />
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

            {/* Compact cards list */}
            <div className="space-y-3 flex-1">
              {loading ? (
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
              ) : paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate?.(`/customers/${c.id}`)}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer text-left group"
                  >
                    {/* Row 1: Avatar, Name and Type Badge */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          avatarKey=""
                          name={c.name}
                          useIconFallback={true}
                          className="w-9 h-9 rounded-xl border border-zinc-150 shadow-xs shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-primary-brand dark:group-hover:text-orange-400 transition-colors truncate">
                            {c.name}
                          </h4>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                            {c.id} • {c.mobile}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          c.type === "Frequent"
                            ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
                            : c.type === "Corporate"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {c.type}
                      </span>
                    </div>

                    {/* Row 2: Metrics and Actions */}
                    <div className="mt-3 pt-2 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/60">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 flex-1">
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                            TOTAL ORDERS
                          </span>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                            {c.totalOrders} Orders
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                            MEMBER SINCE
                          </span>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                            {formatDate(c.memberSince)}
                          </span>
                        </div>

                        <div className="hidden sm:block">
                          <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                            ORDER HISTORY
                          </span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                            {customerOrderCounts[c.id] || 0} Records
                          </span>
                        </div>
                      </div>

                      {/* Quick contact actions + edit */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleCall(c.name, c.mobile)}
                          title="Call"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-primary-brand hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWhatsApp(c.name, c.mobile)}
                          title="WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate?.("/customers/new", { state: { customer: c } })}
                          title="Modify profile"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm">
                  <Inbox className="w-12 h-12 text-zinc-350 dark:text-zinc-700 mx-auto mb-3 opacity-60" />
                  <p className="font-bold text-zinc-500 dark:text-zinc-450">No Customers Discovered</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1 max-w-[280px] text-center font-sans">
                    There are no customer records matching your selected filter or search keyword.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination controls for Customers */}
            {filteredCount > 0 && (
              <div className="flex flex-row items-center justify-between gap-3 pt-5 mt-6 border-t border-zinc-150/60 dark:border-zinc-800/80 w-full">
                {/* Showing details */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                  <span className="hidden sm:inline">Showing </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{(customersCurrentPage - 1) * customersItemsPerPage + 1}</span>–
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{Math.min(customersCurrentPage * customersItemsPerPage, filteredCount)}</span> of{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredCount}</span>
                  <span className="hidden sm:inline"> clients</span>
                  <span className="sm:hidden"> clients</span>
                </div>

                {/* Page buttons and Desktop Select container */}
                <div className="flex items-center gap-3">
                  {/* Page buttons */}
                  <div className="flex items-center bg-zinc-50 dark:bg-zinc-900/60 p-0.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800/80 shadow-sm">
                    <button
                      onClick={() => setCustomersCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={customersCurrentPage === 1}
                      className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: customersTotalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (customersTotalPages > 4) {
                        const isCurrent = customersCurrentPage === pageNum;
                        const isFirstOrLast = pageNum === 1 || pageNum === customersTotalPages;
                        const isNear = Math.abs(pageNum - customersCurrentPage) <= 1;

                        if (!isCurrent && !isFirstOrLast && !isNear) {
                          if (pageNum === 2 || pageNum === customersTotalPages - 1) {
                            return (
                              <span key={pageNum} className="w-6 h-6 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-[10px] font-semibold">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCustomersCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            customersCurrentPage === pageNum
                              ? "bg-primary-brand text-white shadow-sm"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCustomersCurrentPage(prev => Math.min(prev + 1, customersTotalPages))}
                      disabled={customersCurrentPage === customersTotalPages || customersTotalPages === 0}
                      className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Desktop show select */}
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Show</span>
                    <select
                      value={customersItemsPerPage}
                      onChange={(e) => {
                        setCustomersItemsPerPage(Number(e.target.value));
                        setCustomersCurrentPage(1);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-605 dark:text-zinc-300 font-medium outline-none focus:ring-1 focus:ring-primary-brand/35 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all"
                    >
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memoWithData(CustomersListView);
