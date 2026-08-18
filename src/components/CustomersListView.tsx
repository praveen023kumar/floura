// File Path: /src/components/CustomersListView.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { type Customer } from "../types";
import { formatDate } from "../utils/format";
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
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function CustomersListView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Frequent" | "New" | "Corporate">("All");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"updated-newest" | "member-newest" | "member-oldest" | "orders-highest" | "orders-lowest" | "name-az">("updated-newest");

  const activeFilterCount = (filterType !== "All" ? 1 : 0) + (sortBy !== "updated-newest" ? 1 : 0);

  const clearAllFilters = () => {
    setFilterType("All");
    setSortBy("updated-newest");
    setSearchTerm("");
  };

  const [paginatedCustomers, setPaginatedCustomers] = useState<Customer[]>([]);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [customerOrderCounts, setCustomerOrderCounts] = useState<{ [id: string]: number }>({});

  const [customersCurrentPage, setCustomersCurrentPage] = useState<number>(1);
  const [customersItemsPerPage, setCustomersItemsPerPage] = useState<number>(10);

  // Sync refresh trigger on local DB updates
  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  // Handle router state for search
  useEffect(() => {
    const state = location.state as { searchCustomerName?: string; fromOrderId?: string } | null;
    if (state?.searchCustomerName) {
      async function findAndSelect() {
        try {
          const allCust = await localDb.customers.toArray();
          const match = allCust.find(c => c.name.toLowerCase() === state!.searchCustomerName!.toLowerCase() && c.isDeleted !== 1);
          if (match) {
            navigate(`/customers/${match.id}${state!.fromOrderId ? `?fromOrderId=${state!.fromOrderId}` : ""}`, { replace: true });
          } else {
            setSearchTerm(state!.searchCustomerName!);
          }
        } catch (err) {
          console.error("Failed to auto-select customer in CustomersListView:", err);
        }
      }
      findAndSelect();
    }
  }, [location.state, navigate]);

  // Load and filter customers
  useEffect(() => {
    async function loadCustomers() {
      try {
        const startIndex = (customersCurrentPage - 1) * customersItemsPerPage;

        // Retrieve all active decrypted customer records
        const allCust = await localDb.customers.filter(c => c.isDeleted !== 1).toArray();

        // Filter customer records in memory
        const matched = allCust.filter(c => {
          if (filterType !== "All" && c.type !== filterType) return false;
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
              c.name.toLowerCase().includes(term) ||
              c.id.toLowerCase().includes(term) ||
              c.mobile.includes(term)
            );
          }
          return true;
        });

        // Sort customer records in memory
        matched.sort((a, b) => {
          if (sortBy === "member-newest") {
            return new Date(b.memberSince || 0).getTime() - new Date(a.memberSince || 0).getTime();
          } else if (sortBy === "member-oldest") {
            return new Date(a.memberSince || 0).getTime() - new Date(b.memberSince || 0).getTime();
          } else if (sortBy === "orders-highest") {
            return (b.totalOrders || 0) - (a.totalOrders || 0);
          } else if (sortBy === "orders-lowest") {
            return (a.totalOrders || 0) - (b.totalOrders || 0);
          } else if (sortBy === "name-az") {
            return a.name.localeCompare(b.name);
          } else { // "updated-newest" (default)
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bTime - aTime;
          }
        });

        setFilteredCount(matched.length);
        setPaginatedCustomers(matched.slice(startIndex, startIndex + customersItemsPerPage));
      } catch (err) {
        console.error("Failed to query customers from localDb:", err);
      }
    }
    loadCustomers();
  }, [refreshTrigger, searchTerm, filterType, sortBy, customersCurrentPage, customersItemsPerPage]);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setCustomersCurrentPage(1);
  }, [searchTerm, filterType, sortBy]);

  // Fetch counts of orders for list customers
  useEffect(() => {
    async function fetchCounts() {
      if (paginatedCustomers.length === 0) return;
      try {
        const counts: { [id: string]: number } = {};
        
        // Load all active decrypted orders
        const allOrders = await localDb.orders.filter(o => o.isDeleted !== 1).toArray();
        
        for (const c of paginatedCustomers) {
          counts[c.id] = allOrders.filter(o => o.customerId === c.id).length;
        }
        setCustomerOrderCounts(counts);
      } catch (err) {
        console.error("Failed to fetch customer order counts:", err);
      }
    }
    fetchCounts();
  }, [paginatedCustomers, refreshTrigger]);

  const customersTotalPages = useMemo(() => {
    return Math.ceil(filteredCount / customersItemsPerPage);
  }, [filteredCount, customersItemsPerPage]);

  const handleCall = (name: string, num: string) => {
    if (!num) {
      window.showToast?.("No phone number available for this customer.", "error");
      return;
    }
    window.showToast?.(`Dialing ${name} (${num})...`, "success");
    window.location.href = `tel:${num}`;
  };

  const handleSMS = (name: string, num: string) => {
    if (!num) {
      window.showToast?.("No phone number available for this customer.", "error");
      return;
    }
    window.showToast?.(`Opening SMS window for ${name}...`, "success");
    window.location.href = `sms:${num}`;
  };

  const handleWhatsApp = (name: string, num: string) => {
    if (!num) {
      window.showToast?.("No phone number available for this customer.", "error");
      return;
    }
    const cleanNum = num.replace(/\D/g, "");
    if (!cleanNum) {
      window.showToast?.("Invalid phone number format for WhatsApp.", "error");
      return;
    }
    window.showToast?.(`Opening WhatsApp chat with ${name}...`, "success");
    window.open(`https://wa.me/${cleanNum}`, "_blank");
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
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-primary-brand dark:text-orange-400 truncate">
            Client Database
          </h2>
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
            onClick={() => navigate("/customers/new")}
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
        <div className="lg:col-span-9 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {/* Search row */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search customers (ID, name, contact number)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-400"
              />
            </div>

            {/* Active filter chips */}
            {(filterType !== "All" || sortBy !== "updated-newest") && (
              <div className="flex flex-wrap items-center gap-1.5">
                {filterType !== "All" && (
                  <button
                    type="button"
                    onClick={() => setFilterType("All")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {filterType} Customers
                    <X className="w-3 h-3" aria-hidden="true" />
                    <span className="sr-only">Remove type filter</span>
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
                    <span className="sr-only">Remove sort option</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 uppercase tracking-wider cursor-pointer transition-colors ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Profile database matching exact screenshots profiles */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[600px] pr-1.5 custom-scrollbar">
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700/60 shadow-sm flex flex-col gap-4 text-left hover:translate-y-[-2px] transition-transform duration-250 select-none"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-700 shrink-0 border border-zinc-150 shadow-sm">
                          <img
                            src={
                              c.name === "Amara Bennett"
                                ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDvK-VSYM6ttAvU1bQXLmi73g7r7BjZdgoXpdKSkHYZ1g0ZY5xMX01iazAnRo1Kt0S_bdJGFeyASi3Ip1BaewMWXmh87UaPieW0r94Hl270EPIl-_n_72yuZDAlMRFUOWQ2O6oRfwxv-JkYkPmzCSqvX47Q3LqjKPsO4pcg8z6NTfVdFjz2FBTewxhPGyWQNvo-cF0OJMRFo7AFkkxSNWjuQq6yiKBlHkczPxB2E-n18AJjwZS6P9y981d0x2BBPFXalmJTEfm526ZJ"
                                : c.name === "Julian Thorne"
                                ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCj9ksb_nWgm3VZm5cs68O1bNLb-icNtltnNe0PIaaYOp0JAmkjXPgGE8g552PW8ontBTlK2do5G9RoaToHYlZXVW3_y_uZLie933eIu58Ol3jUhMmNUNhd66vGbBw759LTR1aDaCekC21tGqvHuoFQ2fC0x9MrJWvAjrPpYbv8IplhvUeXK3G48KLeQQ25ZG1AOm9zzo2Rq83KSHxHEUXXxCJ0zF5OIYDjdM4V4VK5LJHwE-Dtem1Dq0d3wYka22WQ5IlR9ZBkC91e"
                                : c.name === "Sophie Laurent"
                                ? "https://lh3.googleusercontent.com/aida-public/AB6AXuD3fRKXMsxoORcPTki9B8GeFlRQabcWEMOZSTuU8GSE4KEZ92fB5c8s2pUYN_sbmxszTYaXy4T3M182Q1MQAFc6oUkQIKd4xYR412OscimC8Rkvs2XE_-D03BBSzV1x_U4kjJz47U5LeGSlFe9yWJu4759Mq5GUcjX-F3E1YRgbbu2KG1iQQ4QnpsmDVTPXziJNFjl4mT-IY5tQsFC0g1b5xcEZqQAn7wI67RXuWkd4Bb6FXeIfUWl2lX5zDQmVYttd2K4s93UhHamb"
                                : c.name === "David Chen"
                                ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAO_WNwNsr-58WQE8m0OkygFVqzFl7hSipi2DaAgdnGRIOwo_ZFMsw4E2NgMTTvwP2QMuXyShhgR3ve9WsRsmh6hoAct1lGLFK3aEnso3rEzGif5wu9CUQbTba9x7Ey6fs6j6zKEOM_ITNIXJO7FgOycG1ilDbGDLaMpWBRneDpo9xxUveTlssiTjvcaREvxvpc3ca_4Xg8GyBiNFS5vhV8_rXNyGpxRs6mZEFnLGeUFHdGr3v1TDU6_WwQtWcnC1ZUUozss_NrwGpw"
                                : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(c.name)}`
                            }
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-serif font-bold text-sm text-zinc-800 dark:text-zinc-200">{c.name}</h3>
                            <span className="text-[9px] bg-zinc-100 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400 font-mono px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {c.id}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-zinc-400 mt-0.5">{c.mobile}</p>
                          <div className="mt-1">
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
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
                        </div>
                      </div>

                      <div className="flex gap-1 items-center">
                        <button
                          type="button"
                          onClick={() => navigate("/customers/new", { state: { customer: c } })}
                          title="Modify profile"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-primary-brand dark:hover:text-pink-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 cursor-pointer transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stat parameters matching screenshots row alignments */}
                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-100 dark:border-zinc-700/60 font-sans">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-tighter">Total Orders</span>
                        <p className="text-sm font-bold text-primary-brand dark:text-orange-400 font-serif mt-0.5">
                          {c.totalOrders} Orders
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-tighter">Member Since</span>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-0.5">
                          {formatDate(c.memberSince)}
                        </p>
                      </div>
                    </div>

                    {/* Real phone, SMS, and WhatsApp actions */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleCall(c.name, c.mobile)}
                        className="flex-1 bg-primary-brand text-white dark:bg-orange-400 py-2 rounded-full text-[11px] font-semibold flex items-center justify-center gap-1 hover:opacity-90 active:scale-95 shadow-xs cursor-pointer transition-all"
                        title="Call Customer"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </button>

                      <button
                        onClick={() => handleSMS(c.name, c.mobile)}
                        className="flex-1 bg-pink-50 text-pink-700 dark:bg-pink-950/25 dark:text-pink-300 py-2 rounded-full text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-pink-100 dark:hover:bg-pink-950/40 active:scale-95 cursor-pointer transition-all"
                        title="Send SMS"
                      >
                        <MessageSquare className="w-3 h-3" /> SMS
                      </button>

                      <button
                        onClick={() => handleWhatsApp(c.name, c.mobile)}
                        className="flex-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300 py-2 rounded-full text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 active:scale-95 cursor-pointer transition-all"
                        title="WhatsApp Chat"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </button>
                    </div>

                    {/* View Profile & History link */}
                    <div className="pt-3.5 text-center border-t border-zinc-100 dark:border-zinc-700/60 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/customers/${c.id}`);
                        }}
                        className="text-[11px] font-bold text-primary-brand hover:text-primary-brand-dark dark:text-orange-400 dark:hover:text-orange-350 flex items-center justify-center gap-1 w-full py-1.5 cursor-pointer hover:underline transition-all"
                      >
                        View Full Profile & Order History ({customerOrderCounts[c.id] || 0})
                        <span className="text-[10px]">&rarr;</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-zinc-400 text-sm">
                  No customers found matching search keywords.
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
