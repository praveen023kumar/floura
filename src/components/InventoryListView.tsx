// File Path: /src/components/InventoryListView.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type InventoryItem } from "../types";
import { localDb } from "../db";
import {
  AlertTriangle,
  Plus,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatPrice } from "../utils/format";

interface InventoryListViewProps {
  onUpdateInventoryItem?: (item: InventoryItem) => Promise<any>;
}

export default function InventoryListView({
  onUpdateInventoryItem,
}: InventoryListViewProps) {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const defaultCategories = useMemo(() => ["Dry Goods", "Dairy", "Spices & Flavoring", "Equipment"], []);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(defaultCategories);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [lowStockItemsList, setLowStockItemsList] = useState<InventoryItem[]>([]);

  const [paginatedInventory, setPaginatedInventory] = useState<InventoryItem[]>([]);
  const [filteredCount, setFilteredCount] = useState<number>(0);

  const [inventoryCurrentPage, setInventoryCurrentPage] = useState<number>(1);
  const [inventoryItemsPerPage, setInventoryItemsPerPage] = useState<number>(10);

  const activeFilterCount = (selectedCategory !== "All" ? 1 : 0) + (searchTerm.trim() ? 1 : 0) + (showOnlyLowStock ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSearchTerm("");
    setShowOnlyLowStock(false);
  };

  // Sync refresh trigger on local DB updates
  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  // Fetch metadata and category list
  useEffect(() => {
    async function fetchInventoryMetadata() {
      try {
        const [dbCats, lowStock] = await Promise.all([
          localDb.categories.filter(c => c.type === "inventory" && c.isDeleted !== 1).toArray(),
          localDb.inventory.filter(i => i.isDeleted !== 1 && i.quantity < i.minStockLevel).toArray()
        ]);
        
        const catNames = dbCats.map(c => c.name);
        const combinedCats = Array.from(new Set([...defaultCategories, ...catNames]));
        setDynamicCategories(combinedCats);

        setLowStockItemsList(lowStock);
        setLowStockCount(lowStock.length);
      } catch (err) {
        console.error("Failed to fetch inventory metadata from localDb:", err);
      }
    }
    fetchInventoryMetadata();
  }, [refreshTrigger, defaultCategories]);

  // Load paginated and filtered inventory items
  useEffect(() => {
    async function loadDbInventory() {
      try {
        const startIndex = (inventoryCurrentPage - 1) * inventoryItemsPerPage;
        let collection = localDb.inventory.orderBy("updatedAt").reverse();

        collection = collection.filter(i => {
          if (i.isDeleted === 1) return false;
          if (selectedCategory !== "All" && i.category !== selectedCategory) return false;
          if (showOnlyLowStock && !(i.quantity < i.minStockLevel)) return false;
          if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return (
              i.name.toLowerCase().includes(s) || 
              (i.supplier || "").toLowerCase().includes(s)
            );
          }
          return true;
        });

        const [totalCount, pageSlice] = await Promise.all([
          collection.count(),
          collection.offset(startIndex).limit(inventoryItemsPerPage).toArray()
        ]);

        setFilteredCount(totalCount);
        setPaginatedInventory(pageSlice);
      } catch (err) {
        console.error("Failed to query inventory from localDb:", err);
      }
    }
    loadDbInventory();
  }, [refreshTrigger, searchTerm, selectedCategory, showOnlyLowStock, inventoryCurrentPage, inventoryItemsPerPage]);

  // Reset pagination on filter changes
  useEffect(() => {
    setInventoryCurrentPage(1);
  }, [searchTerm, selectedCategory, showOnlyLowStock]);

  const inventoryTotalPages = useMemo(() => {
    return Math.ceil(filteredCount / inventoryItemsPerPage);
  }, [filteredCount, inventoryItemsPerPage]);

  const handleUpdateQuantity = async (item: InventoryItem, delta: number) => {
    if (!onUpdateInventoryItem) return;
    try {
      const newQty = Math.max(0, Number((item.quantity + delta).toFixed(2)));
      await onUpdateInventoryItem({
        ...item,
        quantity: newQty
      });
    } catch (e) {
      console.error("Failed to adjust inventory quantity:", e);
      window.showToast?.("Failed to adjust quantity.", "error");
    }
  };

  const renderFilterGroups = () => (
    <div className="space-y-5">
      {/* Search Input */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans">
          Search Products
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search name, supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-500 font-medium"
          />
        </div>
      </div>

      {/* Category Choices */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans">
          Categories
        </label>
        <div className="flex flex-col gap-1.5">
          {["All", ...dynamicCategories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors border cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary-brand/10 text-primary-brand border-primary-brand/20 dark:bg-orange-400/10 dark:text-orange-400 dark:border-orange-400/20"
                  : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-655 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <span>{cat}</span>
              {selectedCategory === cat && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Alerts toggle */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-450 dark:text-zinc-505 font-bold uppercase tracking-wider font-sans">
          Stock Status
        </label>
        <button
          type="button"
          onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center justify-between border ${
            showOnlyLowStock
              ? "bg-rose-100 dark:bg-rose-955/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40 shadow-xs"
              : "bg-white dark:bg-zinc-850 border-zinc-150 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 ${showOnlyLowStock ? "text-rose-500 animate-pulse" : "text-zinc-400"}`} />
            <span>Low Stock Only</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-605 dark:text-rose-400">
            {lowStockCount}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-left">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-primary-brand dark:text-orange-400 truncate flex items-center gap-2">
            <span>📦</span>
            Baking Inventories
          </h2>
          <p className="hidden sm:block text-xs text-zinc-550 font-sans mt-0.5">
            Real-time baking raw material measurements, alerts, and supplier metrics.
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
            onClick={() => navigate("/inventory/new")}
            className="w-10 h-10 rounded-full bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
            title="Add Product"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

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
              aria-label="Filter products"
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs bg-white dark:bg-zinc-800 shadow-2xl flex flex-col text-left"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-700 shrink-0">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-105 font-sans">Filters</h3>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 cursor-pointer"
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
                    className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-665 dark:text-zinc-305 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
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

      {/* Purchase Order Alert Notification */}
      {lowStockItemsList.length > 0 && (
        <section className="w-full">
          <div className="bg-orange-50 dark:bg-orange-955/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-orange-100 dark:border-orange-900/30 shadow-sm leading-snug">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl text-orange-700 dark:text-orange-400 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-orange-850 dark:text-orange-300">
                  Low Stock Alert: {lowStockItemsList.length} core baking ingredients are below minimum threshold limit!
                </p>
                <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium mt-0.5">
                  Suggested replenishment:{" "}
                  {lowStockItemsList.map((i) => `${i.name} (${i.minStockLevel * 1.5}${i.unit})`).join(", ")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedCategory !== "All" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span>Category: {selectedCategory}</span>
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
          {searchTerm.trim() && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span>Search: "{searchTerm}"</span>
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
          {showOnlyLowStock && (
            <button
              type="button"
              onClick={() => setShowOnlyLowStock(false)}
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span>Low Stock Only</span>
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 hover:text-zinc-655 hover:underline px-1.5 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Stock Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Side Filters Card */}
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

        {/* Right side: Stock Items grid */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800 shadow-xs flex flex-col min-h-[350px]">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4 flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-550 uppercase tracking-wider">
                CURRENT STOCK ITEMS ({filteredCount})
              </span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[600px] pr-1.5 custom-scrollbar">
              {paginatedInventory.length > 0 ? (
                paginatedInventory.map((item) => {
                  const isLow = item.quantity < item.minStockLevel;
                  const fillPercent = Math.min((item.quantity / (item.minStockLevel * 2)) * 100, 100);

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-zinc-850 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-150 dark:border-zinc-750/70 hover:border-zinc-250 dark:hover:bg-zinc-800/80 hover:shadow-xs transition-all relative"
                    >
                      <div className="flex-1 min-w-0 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 px-2.5 py-0.5 rounded-md">
                            {item.category}
                          </span>
                          {item.supplier && (
                            <span className="text-[10px] text-zinc-405 truncate max-w-[150px]">
                              • {item.supplier}
                            </span>
                          )}
                          {isLow && (
                            <span className="bg-rose-50 text-rose-600 dark:bg-rose-955/30 dark:text-rose-400 text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider flex items-center gap-1 animate-pulse border border-rose-100 dark:border-rose-900/20">
                              ⚠️ Low Stock
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 tracking-tight text-left">
                          {item.name}
                        </h4>

                        {/* Progress bar and metadata */}
                        <div className="max-w-md">
                          <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${isLow ? "bg-rose-500" : "bg-emerald-500"} rounded-full transition-all duration-300`}
                              style={{ width: `${Math.max(5, fillPercent)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-zinc-405 dark:text-zinc-550 mt-1">
                            <span>Min Limit: <strong className="font-semibold text-zinc-650 dark:text-zinc-400">{item.minStockLevel} {item.unit}</strong></span>
                            <span>Value: <strong className="font-semibold text-zinc-655 dark:text-zinc-400">{formatPrice(item.costPrice * item.quantity)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Tactile quantity adjustment */}
                      <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                        <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-xl p-1 flex items-center gap-1 border border-zinc-100 dark:border-zinc-800 shadow-inner">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item, -1)}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 flex items-center justify-center text-sm text-zinc-600 dark:text-zinc-300 font-extrabold shadow-xs active:scale-90 transition-all cursor-pointer"
                            title="Decrease quantity by 1"
                          >
                            -
                          </button>

                          <div className="px-3.5 text-center min-w-[72px]">
                            <span className="block text-sm font-black font-serif text-zinc-800 dark:text-zinc-50 leading-tight">
                              {item.quantity}
                            </span>
                            <span className="block text-[8px] uppercase tracking-wider font-bold text-zinc-500">
                              {item.unit}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 flex items-center justify-center text-sm text-zinc-600 dark:text-zinc-300 font-extrabold shadow-xs active:scale-90 transition-all cursor-pointer"
                            title="Increase quantity by 1"
                          >
                            +
                          </button>
                        </div>

                        {/* Edit Details Action button */}
                        <button
                          type="button"
                          onClick={() => navigate("/inventory/new", { state: { item } })}
                          className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-primary-brand hover:text-white dark:hover:bg-orange-500 dark:hover:text-white text-zinc-505 dark:text-zinc-400 border border-zinc-150 dark:border-zinc-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Edit Product Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-zinc-400 text-sm">
                  <Inbox className="w-12 h-12 text-zinc-350 dark:text-zinc-700 mx-auto mb-3 opacity-60" />
                  <p className="font-bold text-zinc-500 dark:text-zinc-450">No Stock Records Discovered</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1 max-w-[280px] text-center">
                    There are no items matching your selected categories or search keyword.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination controls for Inventory */}
            {filteredCount > 0 && (
              <div className="flex flex-row items-center justify-between gap-3 pt-5 mt-6 border-t border-zinc-150/60 dark:border-zinc-800/80 w-full select-none">
                {/* Showing details */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                  <span className="hidden sm:inline">Showing </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{(inventoryCurrentPage - 1) * inventoryItemsPerPage + 1}</span>–
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{Math.min(inventoryCurrentPage * inventoryItemsPerPage, filteredCount)}</span> of{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredCount}</span>
                  <span className="hidden sm:inline"> items</span>
                  <span className="sm:hidden"> items</span>
                </div>

                {/* Page buttons and Desktop Select container */}
                <div className="flex items-center gap-3">
                  {/* Page buttons */}
                  <div className="flex items-center bg-zinc-50 dark:bg-zinc-900/60 p-0.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800/80 shadow-sm">
                    <button
                      onClick={() => setInventoryCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={inventoryCurrentPage === 1}
                      className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: inventoryTotalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (inventoryTotalPages > 4) {
                        const isCurrent = inventoryCurrentPage === pageNum;
                        const isFirstOrLast = pageNum === 1 || pageNum === inventoryTotalPages;
                        const isNear = Math.abs(pageNum - inventoryCurrentPage) <= 1;

                        if (!isCurrent && !isFirstOrLast && !isNear) {
                          if (pageNum === 2 || pageNum === inventoryTotalPages - 1) {
                            return (
                              <span key={pageNum} className="w-6 h-6 flex items-center justify-center text-zinc-400 dark:text-zinc-605 text-[10px] font-semibold">
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
                          onClick={() => setInventoryCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            inventoryCurrentPage === pageNum
                              ? "bg-primary-brand text-white shadow-sm"
                              : "text-zinc-650 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setInventoryCurrentPage(prev => Math.min(prev + 1, inventoryTotalPages))}
                      disabled={inventoryCurrentPage === inventoryTotalPages || inventoryTotalPages === 0}
                      className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-855 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Desktop show select */}
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs text-zinc-400 dark:text-zinc-505 font-medium">Show</span>
                    <select
                      value={inventoryItemsPerPage}
                      onChange={(e) => {
                        setInventoryItemsPerPage(Number(e.target.value));
                        setInventoryCurrentPage(1);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium outline-none focus:ring-1 focus:ring-primary-brand/35 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all"
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
