// File Path: /src/components/OrdersList.tsx
import React, { useMemo, memo } from "react";
import { memoWithData } from "../utils/memo";
import { type Order } from "../types";

import { formatPrice, formatDate, getCurrencySymbol, getOrderSeqId } from "../utils/format";
import { getStatusColors } from "../utils/orderStatus";
import { calculatePaidAmount, getPaymentStatus } from "../../shared/calculations";
import {
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  X,
  Check,
  Pencil,
  Clock,
  Hash,
  LayoutList,
  CalendarDays,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useOrders } from "../hooks/useOrders";
import { CompleteOrderModal } from "./CompleteOrderModal";

interface OrdersListProps {
  onAddOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => Promise<any>;
  onUpdateOrder?: (order: Order) => Promise<any>;
  onUpdateOrderStatus: (id: string, status: Order["status"]) => void;
  onNavigate?: (path: string | number) => void;
}

function OrdersList({
  onAddOrder,
  onUpdateOrder,
  onUpdateOrderStatus,
  onNavigate,
}: OrdersListProps) {
  const [viewTab, setViewTab] = React.useState<"list" | "calendar">("list");

  // Calendar state
  const today = new Date();
  const [calMonth, setCalMonth] = React.useState(today.getMonth());
  const [calYear, setCalYear] = React.useState(today.getFullYear());

  const {
    loading,
    orders,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    completingOrder,
    setCompletingOrder,
    profitAmount,
    setProfitAmount,
    costGoingText,
    setCostGoingText,
    difficultiesText,
    setDifficultiesText,
    ordersCurrentPage,
    setOrdersCurrentPage,
    ordersItemsPerPage,
    setOrdersItemsPerPage,
    paginatedOrders,
    ordersTotalPages,
    filteredCount,
    filteredOrders,
    sortBy,
    setSortBy,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    paymentFilter,
    setPaymentFilter,
    handleSetViewMode,
    handleStartEdit,
    handleCompleteOrderSave,
  } = useOrders({
    onAddOrder,
    onUpdateOrder,
    onUpdateOrderStatus,
    initialViewMode: "list",
    onViewModeChange: (mode) => onNavigate?.(mode === "form" ? "/orders/new" : "/orders"),
    calMonth,
    calYear,
    viewTab,
  });

  const orderStats = React.useMemo(() => {
    let active = 0;
    let pending = 0;
    let inProgress = 0;
    let ready = 0;
    for (const o of orders || []) {
      if (o.status === "Pending") pending++;
      if (["Ordered Ingredients", "Processing", "Decorating"].includes(o.status)) inProgress++;
      if (o.status === "Ready for Pickup") ready++;
      if (!["Completed", "Cancelled"].includes(o.status)) active++;
    }
    return { active, pending, inProgress, ready, total: (orders || []).length };
  }, [orders]);

  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [calSelectedDate, setCalSelectedDate] = React.useState<string | null>(null);

  const activeFilterCount = viewTab === "list"
    ? (filter !== "active" ? 1 : 0) + (dateFilter !== "all" ? 1 : 0) + (paymentFilter !== "all" ? 1 : 0)
    : (filter !== "active" ? 1 : 0) + (paymentFilter !== "all" ? 1 : 0);

  const statusOptions = [
    { value: "active", label: "Active Orders" },
    { value: "all", label: "All Orders" },
    { value: "Pending", label: "Pending" },
    { value: "Ordered Ingredients", label: "Ordered Ingredients" },
    { value: "Processing", label: "Processing" },
    { value: "Decorating", label: "Decorating" },
    { value: "Ready for Pickup", label: "Ready for Pickup" },
    { value: "archived", label: "Past Orders (Completed / Cancelled)" },
    { value: "Completed", label: "Completed only" },
    { value: "Cancelled", label: "Cancelled only" },
  ] as const;
  const dateFilterOptions = [
    { value: "all", label: "All Dates" },
    { value: "future", label: "Future" },
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "custom", label: "Custom Range" }
  ] as const;
  const sortOptions = [
    { value: "delivery-soonest", label: "Delivery: Soonest first" },
    { value: "delivery-latest", label: "Delivery: Latest first" },
    { value: "created-newest", label: "Created: Newest first" },
    { value: "created-oldest", label: "Created: Oldest first" },
    { value: "amount-highest", label: "Amount: High to Low" },
    { value: "amount-lowest", label: "Amount: Low to High" }
  ] as const;

  const paymentStatusOptions = [
    { value: "all", label: "All Payments" },
    { value: "Partially Paid", label: "Partially" },
    { value: "Unpaid", label: "No Payment" },
    { value: "Fully Paid", label: "Completed" },
  ] as const;

  const clearAllFilters = () => {
    setFilter("active");
    setDateFilter("all");
    setSearchTerm("");
    setCustomStartDate("");
    setCustomEndDate("");
    setPaymentFilter("all");
  };

  // ── Calendar helpers ──────────────────────────────────────────────────────────
  const STATUS_DOT: Record<Order["status"], string> = {
    "Pending": "bg-amber-400",
    "Ordered Ingredients": "bg-orange-400",
    "Processing": "bg-sky-400",
    "Decorating": "bg-pink-400",
    "Ready for Pickup": "bg-teal-400",
    "Completed": "bg-emerald-400",
    "Cancelled": "bg-zinc-400",
  };

  // All non-deleted orders mapped by deliveryDate key "YYYY-MM-DD"
  // NOTE: allOrdersForCalendar was previously computed but unused — removed.
  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const o of filteredOrders) {
      const key = (o.deliveryDate || o.eventDate || "").slice(0, 10);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(o);
    }
    return map;
  }, [filteredOrders]);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = new Date(calYear, calMonth, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    for (let i = 0; i < startDow; i++) days.push(null);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(calYear, calMonth, d));
    return days;
  }, [calMonth, calYear]);

  const calMonthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const calDayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  // Now actually rendered below the calendar grid (previously computed but never used).
  const ordersOnSelectedDate = calSelectedDate ? (ordersByDate[calSelectedDate] ?? []) : [];

  const ordersInActiveMonth = useMemo(() => {
    const yearMonthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    return filteredOrders.filter(o => {
      const dateStr = o.deliveryDate || o.eventDate;
      return dateStr && dateStr.startsWith(yearMonthPrefix);
    }).sort((a, b) => {
      const dateA = a.deliveryDate || a.eventDate || "";
      const dateB = b.deliveryDate || b.eventDate || "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.deliveryTime || "").localeCompare(b.deliveryTime || "");
    });
  }, [filteredOrders, calMonth, calYear]);

  const renderFilterGroups = () => (
    <div className="space-y-6">
      {/* Status facet */}
      <div>
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2.5">
          Order Status
        </h3>
        <div className="space-y-0.5" role="radiogroup" aria-label="Filter orders by status">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={filter === opt.value}
              onClick={() => setFilter(opt.value)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand ${
                filter === opt.value
                  ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                filter === opt.value ? "border-primary-brand dark:border-orange-400" : "border-zinc-300 dark:border-zinc-600"
              }`}>
                {filter === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />}
              </span>
              {opt.value === "archived" ? (
                <span className="flex items-center gap-1">
                  {opt.label}
                </span>
              ) : opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Status facet */}
      <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2.5">
          Payment Status
        </h3>
        <div className="space-y-0.5" role="radiogroup" aria-label="Filter orders by payment status">
          {paymentStatusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={paymentFilter === opt.value}
              onClick={() => setPaymentFilter(opt.value)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand ${
                paymentFilter === opt.value
                  ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                paymentFilter === opt.value ? "border-primary-brand dark:border-orange-400" : "border-zinc-300 dark:border-zinc-600"
              }`}>
                {paymentFilter === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {viewTab === "list" && (
        <>
          {/* Delivery date facet */}
          <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2.5">
              Delivery Date
            </h3>
            <div className="space-y-0.5" role="radiogroup" aria-label="Filter orders by delivery date">
              {dateFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={dateFilter === opt.value}
                  onClick={() => setDateFilter(opt.value)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand ${
                    dateFilter === opt.value
                      ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    dateFilter === opt.value ? "border-primary-brand dark:border-orange-400" : "border-zinc-300 dark:border-zinc-600"
                  }`}>
                    {dateFilter === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>

            {dateFilter === "custom" && (
              <div className="mt-3 pl-2 space-y-2.5 border-l-2 border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans">Start</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs px-2.5 py-1.5 rounded-lg outline-none text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-primary-brand"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans">End</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs px-2.5 py-1.5 rounded-lg outline-none text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-primary-brand"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Clear range
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sort facet */}
          <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2.5">
              Sort By
            </h3>
            <div className="space-y-0.5" role="radiogroup" aria-label="Sort orders">
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
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-2xl font-bold font-serif text-primary-brand dark:text-orange-400 truncate">
              Client Event Orders
            </h2>
            <span className="text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 shrink-0">
              {filteredCount} {filteredCount === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
          <p className="hidden sm:block text-xs text-zinc-550 font-sans mt-0.5">
            Track special cake reservations and pick-up milestones.
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
            onClick={() => handleSetViewMode("form")}
            className="w-10 h-10 rounded-full bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
            title="New Order"
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
                aria-label="Filter and sort orders"
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
                  setFilter("active");
                  setDateFilter("all");
                  setPaymentFilter("all");
                  setSearchTerm("");
                }}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  filter === "active"
                    ? "bg-zinc-100 dark:bg-zinc-800 ring-1.5 ring-zinc-400 dark:ring-zinc-600 shadow-2xs"
                    : "bg-zinc-50/80 dark:bg-zinc-800/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                    Active
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 dark:bg-zinc-300 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 leading-none">
                  {orderStats.active}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilter("Pending")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  filter === "Pending"
                    ? "bg-amber-100/80 dark:bg-amber-950/40 ring-1.5 ring-amber-400 shadow-2xs"
                    : "bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-700/80 dark:text-amber-300/80 uppercase tracking-wider truncate">
                    Pending
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-amber-600 dark:text-amber-400 tracking-tight mt-1 leading-none">
                  {orderStats.pending}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilter("Processing")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  filter === "Processing"
                    ? "bg-sky-100/80 dark:bg-sky-950/40 ring-1.5 ring-sky-400 shadow-2xs"
                    : "bg-sky-50/60 dark:bg-sky-950/20 hover:bg-sky-100/60 dark:hover:bg-sky-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-sky-700/80 dark:text-sky-300/80 uppercase tracking-wider truncate">
                    In Progress
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-sky-600 dark:text-sky-400 tracking-tight mt-1 leading-none">
                  {orderStats.inProgress}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilter("Ready for Pickup")}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  filter === "Ready for Pickup"
                    ? "bg-teal-100/80 dark:bg-teal-950/40 ring-1.5 ring-teal-400 shadow-2xs"
                    : "bg-teal-50/60 dark:bg-teal-950/20 hover:bg-teal-100/60 dark:hover:bg-teal-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-teal-700/80 dark:text-teal-300/80 uppercase tracking-wider truncate">
                    Ready
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-teal-600 dark:text-teal-400 tracking-tight mt-1 leading-none">
                  {orderStats.ready}
                </div>
              </button>
            </div>

            {/* Control row: search & view toggle */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-550" />
                <input
                  type="text"
                  placeholder="Search orders (ID, customer name, flavor, event type)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-755 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1 shrink-0 self-start sm:self-auto">
                <button
                  id="orders-view-list-btn"
                  type="button"
                  onClick={() => setViewTab("list")}
                  aria-pressed={viewTab === "list"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewTab === "list"
                      ? "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" aria-hidden="true" />
                  List
                </button>
                <button
                  id="orders-view-calendar-btn"
                  type="button"
                  onClick={() => {
                    setViewTab("calendar");
                    setSearchTerm("");
                    setDateFilter("all");
                  }}
                  aria-pressed={viewTab === "calendar"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewTab === "calendar"
                      ? "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                  Calendar
                </button>
              </div>
            </div>

            {/* Active filter chips */}
            {((viewTab === "list" && (filter !== "active" || dateFilter !== "all" || searchTerm.trim())) || (viewTab === "calendar" && filter !== "active")) && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4 animate-fade-in">
                {filter !== "active" && (
                  <button
                    type="button"
                    onClick={() => setFilter("active")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {statusOptions.find((o) => o.value === filter)?.label ?? filter}
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {viewTab === "list" && dateFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setDateFilter("all")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {dateFilterOptions.find((d) => d.value === dateFilter)?.label}
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

        {/* ── LIST VIEW ─────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {viewTab === "list" && (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
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
                ) : paginatedOrders.length > 0 ? (
                  paginatedOrders.map((o) => {
                    const statusInfo = getStatusColors(o.status);
                    const paidAmt = calculatePaidAmount(o.paymentHistory);
                    const pmtStatus = o.paymentStatus || getPaymentStatus(o.totalAmount, paidAmt);
                    return (
                      <div
                        key={o.id}
                        onClick={() => onNavigate?.(`/orders/${o.id}`)}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 sm:p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer text-left group space-y-2.5"
                      >
                        {/* Row 1: Customer Avatar, Name, ID & Flavor, and Status Pill */}
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-serif text-xs font-bold shrink-0 ${statusInfo.accentBg}`}>
                              {o.customerName ? o.customerName.charAt(0).toUpperCase() : "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-primary-brand dark:group-hover:text-orange-400 transition-colors truncate">
                                {o.customerName || "Unnamed Client"}
                              </h4>
                              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1 truncate mt-0.5">
                                <span className="font-bold text-zinc-600 dark:text-zinc-300 shrink-0">#{getOrderSeqId(o.id, orders)}</span>
                                <span className="shrink-0">•</span>
                                <span className="truncate text-zinc-500 dark:text-zinc-400">{o.cakeFlavor || "Custom Cake"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Compact Status Pill */}
                          <div className="relative shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
                            <select
                              id={`status-select-${o.id}`}
                              aria-label={`Update status for ${o.customerName}'s order`}
                              value={o.status}
                              onChange={(e) => {
                                const val = e.target.value as Order["status"];
                                if (val === "Completed") {
                                  setCompletingOrder(o);
                                } else {
                                  onUpdateOrderStatus(o.id, val);
                                }
                              }}
                              className={`text-[9px] sm:text-[10px] pl-2 pr-5 py-0.5 sm:py-1 rounded-full font-bold uppercase tracking-wider outline-none cursor-pointer border border-transparent transition-all hover:opacity-90 appearance-none bg-no-repeat w-[86px] sm:w-auto truncate ${statusInfo.bg}`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Ordered Ingredients">Ingredients</option>
                              <option value="Processing">Processing</option>
                              <option value="Decorating">Decorating</option>
                              <option value="Ready for Pickup">Ready</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 pointer-events-none opacity-70" />
                          </div>
                        </div>

                        {/* Row 2: Metrics and Actions */}
                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/60">
                          <div className="grid grid-cols-3 gap-2 sm:gap-4 flex-1 min-w-0">
                            <div className="min-w-0">
                              <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold truncate">
                                DELIVERY
                              </span>
                              <div className="flex items-center gap-1 min-w-0 mt-0.5">
                                <span className="text-[11px] sm:text-xs font-bold text-zinc-850 dark:text-zinc-150 font-sans truncate block">
                                  {o.deliveryDate || o.eventDate ? formatDate(o.deliveryDate || o.eventDate) : "—"}
                                </span>
                                {o.deliveryTime && (
                                  <span className="hidden md:inline-flex items-center gap-0.5 text-[8px] font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded">
                                    {o.deliveryTime}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold truncate">
                                PAYMENT
                              </span>
                              <span className="text-[11px] sm:text-xs font-bold font-sans mt-0.5 block truncate">
                                {pmtStatus === "Fully Paid" ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Paid
                                  </span>
                                ) : pmtStatus === "Partially Paid" ? (
                                  <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Partial
                                  </span>
                                ) : (
                                  <span className="text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" /> Unpaid
                                  </span>
                                )}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold truncate">
                                AMOUNT
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-primary-brand dark:text-orange-400 font-serif block mt-0.5 truncate">
                                {formatPrice(o.totalAmount)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              aria-label={`Modify ${o.customerName}'s order`}
                              onClick={() => handleStartEdit(o)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Modify order"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {o.status !== "Completed" && o.status !== "Cancelled" ? (
                              <button
                                id={`next-phase-btn-${o.id}`}
                                onClick={() => {
                                  const stages: Order["status"][] = ["Pending", "Ordered Ingredients", "Processing", "Decorating", "Ready for Pickup", "Completed"];
                                  const nextIdx = stages.indexOf(o.status) + 1;
                                  if (nextIdx < stages.length) {
                                    let nextStatus = stages[nextIdx];
                                    if (nextStatus === "Completed") {
                                      setCompletingOrder(o);
                                    } else {
                                      onUpdateOrderStatus(o.id, nextStatus);
                                    }
                                  }
                                }}
                                className="hidden sm:inline-flex items-center gap-1 bg-primary-brand hover:bg-opacity-95 text-white py-1 px-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-xs whitespace-nowrap"
                              >
                                <span>Next</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : null}

                            <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-650 group-hover:text-primary-brand dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm">
                    <Search className="w-12 h-12 text-zinc-350 dark:text-zinc-700 mx-auto mb-3 opacity-60" />
                    <p className="font-bold text-zinc-500 dark:text-zinc-450">No Orders Discovered</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1 max-w-[280px] text-center font-sans">
                      There are no orders matching your selected filters or search keyword.
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      {(filter !== "active" || dateFilter !== "all" || searchTerm) && (
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
                        onClick={() => handleSetViewMode("form")}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-400 dark:hover:bg-orange-500 text-white transition-colors cursor-pointer"
                      >
                        New order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── CALENDAR VIEW ──────────────────────────────────────────────────────── */}
          {viewTab === "calendar" && (
            <motion.div
              key="calendar-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {/* Month navigation header */}
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-700/60">
                  <button
                    id="cal-prev-month-btn"
                    type="button"
                    aria-label="Previous month"
                    onClick={() => {
                      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                      else setCalMonth(m => m - 1);
                      setCalSelectedDate(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-brand"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-sans">
                      {calMonthNames[calMonth]} {calYear}
                    </h3>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {Object.values(ordersByDate).reduce((s, arr) => s + arr.length, 0)} deliveries this view
                    </p>
                  </div>
                  <button
                    id="cal-next-month-btn"
                    type="button"
                    aria-label="Next month"
                    onClick={() => {
                      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                      else setCalMonth(m => m + 1);
                      setCalSelectedDate(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-brand"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-700/60">
                  {calDayNames.map(d => (
                    <div key={d} className="py-2 text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    if (!day) {
                      return <div key={`empty-${idx}`} className="min-h-[72px] border-b border-r border-zinc-100 dark:border-zinc-700/40 last:border-r-0" />;
                    }
                    const dateKey = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,"0")}-${String(day.getDate()).padStart(2,"0")}`;
                    const dayOrders = ordersByDate[dateKey] ?? [];
                    const isToday = dateKey === todayStr;
                    const isSelected = dateKey === calSelectedDate;
                    // Get up to 3 unique statuses for dots
                    const uniqueStatuses = [...new Set(dayOrders.map(o => o.status))].slice(0, 3) as Order["status"][];

                    return (
                      <button
                        key={dateKey}
                        id={`cal-day-${dateKey}`}
                        type="button"
                        aria-label={`${day.getDate()} ${calMonthNames[calMonth]}, ${dayOrders.length} order${dayOrders.length !== 1 ? "s" : ""}`}
                        aria-pressed={isSelected}
                        // Guard: only togglable when the day actually has orders (matches the
                        // "cursor-default" visual state below — previously this still fired
                        // setCalSelectedDate for empty days).
                        onClick={() => {
                          if (dayOrders.length === 0) return;
                          setCalSelectedDate(isSelected ? null : dateKey);
                        }}
                        className={`group relative min-h-[72px] p-1.5 border-b border-r border-zinc-100 dark:border-zinc-700/40 last:border-r-0 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-brand ${
                          isSelected
                            ? "bg-primary-brand-light dark:bg-primary-brand-dark/20"
                            : dayOrders.length > 0
                              ? "hover:bg-zinc-50 dark:hover:bg-zinc-700/40 cursor-pointer"
                              : "cursor-default"
                        }`}
                      >
                        {/* Date number */}
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          isToday
                            ? "bg-primary-brand text-white"
                            : isSelected
                              ? "bg-primary-brand/20 text-primary-brand dark:text-orange-400"
                              : "text-zinc-700 dark:text-zinc-300"
                        }`}>
                          {day.getDate()}
                        </span>

                        {/* Order count badge */}
                        {dayOrders.length > 0 && (
                          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-brand dark:bg-orange-400 text-white text-[9px] font-bold flex items-center justify-center">
                            {dayOrders.length}
                          </span>
                        )}

                        {/* Status dots */}
                        {uniqueStatuses.length > 0 && (
                          <div className="flex items-center gap-0.5 mt-1.5 flex-wrap">
                            {uniqueStatuses.map((st) => (
                              <span
                                key={st}
                                className={`w-2 h-2 rounded-full ${STATUS_DOT[st]}`}
                                title={st}
                              />
                            ))}
                          </div>
                        )}

                        {/* First order customer name preview on larger screens */}
                        {dayOrders.length > 0 && (
                          <p className="hidden sm:block text-[9px] text-zinc-500 dark:text-zinc-400 font-medium leading-tight mt-1 truncate pr-4">
                            {dayOrders[0].customerName}
                            {dayOrders.length > 1 && ` +${dayOrders.length - 1}`}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected-day detail panel — this is the piece that was previously
                  computed (ordersOnSelectedDate) but never rendered anywhere. */}
              <AnimatePresence>
                {calSelectedDate && ordersOnSelectedDate.length > 0 && (
                  <motion.div
                    key="selected-day-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-150 dark:border-zinc-700/60 bg-zinc-50/70 dark:bg-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary-brand animate-pulse" />
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                          {new Date(calSelectedDate + "T00:00:00").toLocaleDateString(undefined, {
                            weekday: "long", month: "long", day: "numeric"
                          })}
                        </h4>
                        <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded-full">
                          {ordersOnSelectedDate.length} {ordersOnSelectedDate.length === 1 ? "order" : "orders"}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label="Close day details"
                        onClick={() => setCalSelectedDate(null)}
                        className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
                      {ordersOnSelectedDate.map((o) => {
                        const si = getStatusColors(o.status);
                        const paidAmt = calculatePaidAmount(o.paymentHistory);
                        const pmtStatus = o.paymentStatus || getPaymentStatus(o.totalAmount, paidAmt);
                        const d = new Date((o.deliveryDate || o.eventDate) + "T00:00:00");
                        const weekdayStr = isNaN(d.getTime()) ? "---" : d.toLocaleDateString(undefined, { weekday: "short" });
                        const dayNum = isNaN(d.getTime()) ? "--" : d.getDate();
                        return (
                          <div
                            key={o.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onNavigate?.(`/orders/${o.id}`)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate?.(`/orders/${o.id}`); } }}
                            aria-label={`Open ${o.customerName || "Walk-in Guest"}'s order`}
                            className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-brand"
                          >
                            {/* Modern Calendar Tile */}
                            <div className="flex flex-col items-center justify-center bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 rounded-xl w-10 h-10 sm:w-11 sm:h-11 shrink-0 text-center shadow-2xs">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary-brand dark:text-orange-400 leading-none">
                                {weekdayStr}
                              </span>
                              <span className="text-sm sm:text-base font-extrabold text-zinc-800 dark:text-zinc-100 font-sans leading-none mt-1">
                                {dayNum}
                              </span>
                            </div>

                            {/* Order Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-primary-brand dark:group-hover:text-orange-400 transition-colors">
                                  {o.customerName || "Walk-in Guest"}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 shrink-0">
                                  #{getOrderSeqId(o.id, orders)}
                                </span>
                              </div>

                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-medium">
                                {o.cakeFlavor || "Custom Cake"}{o.eventType ? ` · ${o.eventType}` : ""}
                              </p>

                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {o.deliveryTime && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded">
                                    <Clock className="w-2.5 h-2.5" />
                                    {o.deliveryTime}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold">
                                  {pmtStatus === "Fully Paid" ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Paid
                                    </span>
                                  ) : pmtStatus === "Partially Paid" ? (
                                    <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Partial
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" /> Unpaid
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Status & Price */}
                            <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${si.bg}`}>
                                {o.status}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm font-serif font-bold text-primary-brand dark:text-orange-400">
                                  {formatPrice(o.totalAmount)}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-primary-brand dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Full Month order list (Active view month) */}
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm mt-6">
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-zinc-150 dark:border-zinc-700/60 bg-zinc-50/70 dark:bg-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary-brand/10 dark:bg-orange-400/10 flex items-center justify-center text-primary-brand dark:text-orange-400">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans leading-tight">
                        Deliveries in {calMonthNames[calMonth]} {calYear}
                      </h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                        {ordersInActiveMonth.length} delivery{ordersInActiveMonth.length !== 1 ? " slots" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Orders list for active month */}
                {ordersInActiveMonth.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                      <Package className="w-4.5 h-4.5 text-zinc-400" />
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">No deliveries scheduled for this month.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
                    {ordersInActiveMonth.map((o) => {
                      const si = getStatusColors(o.status);
                      const paidAmt = calculatePaidAmount(o.paymentHistory);
                      const pmtStatus = o.paymentStatus || getPaymentStatus(o.totalAmount, paidAmt);
                      const d = new Date((o.deliveryDate || o.eventDate) + "T00:00:00");
                      const weekdayStr = isNaN(d.getTime()) ? "---" : d.toLocaleDateString(undefined, { weekday: "short" });
                      const dayNum = isNaN(d.getTime()) ? "--" : d.getDate();
                      return (
                        <div
                          key={o.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onNavigate?.(`/orders/${o.id}`)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate?.(`/orders/${o.id}`); } }}
                          aria-label={`Open ${o.customerName || "Walk-in Guest"}'s order`}
                          className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-brand"
                        >
                          {/* Modern Calendar Tile */}
                          <div className="flex flex-col items-center justify-center bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 rounded-xl w-10 h-10 sm:w-11 sm:h-11 shrink-0 text-center shadow-2xs">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary-brand dark:text-orange-400 leading-none">
                              {weekdayStr}
                            </span>
                            <span className="text-sm sm:text-base font-extrabold text-zinc-800 dark:text-zinc-100 font-sans leading-none mt-1">
                              {dayNum}
                            </span>
                          </div>

                          {/* Order Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-primary-brand dark:group-hover:text-orange-400 transition-colors">
                                {o.customerName || "Walk-in Guest"}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 shrink-0">
                                #{getOrderSeqId(o.id, orders)}
                              </span>
                            </div>

                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-medium">
                              {o.cakeFlavor || "Custom Cake"}{o.eventType ? ` · ${o.eventType}` : ""}
                            </p>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {o.deliveryTime && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded">
                                  <Clock className="w-2.5 h-2.5" />
                                  {o.deliveryTime}
                                </span>
                              )}
                              <span className="text-[10px] font-bold">
                                {pmtStatus === "Fully Paid" ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Paid
                                  </span>
                                ) : pmtStatus === "Partially Paid" ? (
                                  <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Partial
                                  </span>
                                ) : (
                                  <span className="text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" /> Unpaid
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Status & Price */}
                          <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${si.bg}`}>
                              {o.status}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs sm:text-sm font-serif font-bold text-primary-brand dark:text-orange-400">
                                {formatPrice(o.totalAmount)}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-primary-brand dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 p-3 bg-zinc-50/70 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 text-[11px]">
                {(Object.entries(STATUS_DOT) as [Order["status"], string][]).filter(([s]) => s !== "Cancelled").map(([status, dot]) => (
                  <span key={status} className="flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">
                    <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                    {status}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination controls for Orders */}
        {viewTab === "list" && filteredCount > 0 && (
          <div className="flex flex-row items-center justify-between gap-3 pt-5 mt-6 border-t border-zinc-200/60 dark:border-zinc-800/80 w-full">
            {/* Showing details */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
              <span className="hidden sm:inline">Showing </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{(ordersCurrentPage - 1) * ordersItemsPerPage + 1}</span>–
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{Math.min(ordersCurrentPage * ordersItemsPerPage, filteredCount)}</span> of{" "}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredCount}</span>
              <span className="hidden sm:inline"> orders</span>
              <span className="sm:hidden"> orders</span>
            </div>

            {/* Page buttons and Desktop Select container */}
            <div className="flex items-center gap-3">
              {/* Page buttons */}
              <div className="flex items-center bg-zinc-50 dark:bg-zinc-900/60 p-0.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
                <button
                  onClick={() => setOrdersCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={ordersCurrentPage === 1}
                  aria-label="Previous page"
                  className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary-brand"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                {Array.from({ length: ordersTotalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (ordersTotalPages > 4) {
                    const isCurrent = ordersCurrentPage === pageNum;
                    const isFirstOrLast = pageNum === 1 || pageNum === ordersTotalPages;
                    const isNear = Math.abs(pageNum - ordersCurrentPage) <= 1;

                    if (!isCurrent && !isFirstOrLast && !isNear) {
                      if (pageNum === 2 || pageNum === ordersTotalPages - 1) {
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
                      onClick={() => setOrdersCurrentPage(pageNum)}
                      aria-label={`Page ${pageNum}`}
                      aria-current={ordersCurrentPage === pageNum ? "page" : undefined}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary-brand ${
                        ordersCurrentPage === pageNum
                          ? "bg-primary-brand text-white shadow-sm"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setOrdersCurrentPage(prev => Math.min(prev + 1, ordersTotalPages))}
                  disabled={ordersCurrentPage === ordersTotalPages || ordersTotalPages === 0}
                  aria-label="Next page"
                  className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary-brand"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Desktop show select */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Show</span>
                <select
                  aria-label="Orders per page"
                  value={ordersItemsPerPage}
                  onChange={(e) => {
                    setOrdersItemsPerPage(Number(e.target.value));
                    setOrdersCurrentPage(1);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-medium outline-none focus:ring-1 focus:ring-primary-brand/35 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
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

      {/* ----------------- ORDER COMPLETION & PROFIT ANALYTICS MODAL ----------------- */}
      <CompleteOrderModal
        completingOrder={completingOrder}
        profitAmount={profitAmount}
        setProfitAmount={setProfitAmount}
        costGoingText={costGoingText}
        setCostGoingText={setCostGoingText}
        difficultiesText={difficultiesText}
        setDifficultiesText={setDifficultiesText}
        onSave={handleCompleteOrderSave}
        onClose={() => setCompletingOrder(null)}
      />
    </div>
  );
}

export default memoWithData(OrdersList);