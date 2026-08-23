// File Path: /src/components/ChecklistView.tsx
import React, { useState } from "react";
import { ChecklistItem } from "../types";
import {
  CheckCircle2,
  Plus,
  RefreshCw,
  Inbox,
  Sparkles,
  ClipboardList,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useChecklist } from "../hooks/useChecklist";
import AddChecklistModal from "./AddChecklistModal";

interface ChecklistViewProps {
  checkerList: ChecklistItem[];
  onToggleChecklistItem: (id: string, checked: boolean, date?: string) => void;
  onAddChecklistItem?: (text: string, date?: string) => Promise<any>;
  onResetChecklist: (date?: string) => void;
}

export default function ChecklistView({
  checkerList,
  onToggleChecklistItem,
  onAddChecklistItem,
  onResetChecklist,
}: ChecklistViewProps) {
  const {
    filterMode,
    setFilterMode,
    searchTerm,
    setSearchTerm,
    selectedDate,
    setSelectedDate,
    todayStr,
    yesterdayStr,
    formatChecklistDate,
    completedCount,
    totalCount,
    completionRate,
    handleSeedDefaultChecklist,
    filteredList,
    checklistCurrentPage,
    setChecklistCurrentPage,
    checklistItemsPerPage,
    setChecklistItemsPerPage,
    paginatedChecklist,
    checklistTotalPages,
  } = useChecklist({
    checkerList,
    onToggleChecklistItem,
    onAddChecklistItem,
    onResetChecklist,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFilterCount = (filterMode !== "all" ? 1 : 0) + (searchTerm.trim() ? 1 : 0) + (selectedDate !== todayStr ? 1 : 0);

  const clearAllFilters = () => {
    setFilterMode("all");
    setSearchTerm("");
    setSelectedDate(todayStr);
  };

  const renderFilterGroups = () => (
    <div className="space-y-5">
      {/* Date Filters */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans">
          Prep Date
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                selectedDate === yesterdayStr
                  ? "bg-primary-brand text-white border-primary-brand shadow-xs"
                  : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60"
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                selectedDate === todayStr
                  ? "bg-primary-brand text-white border-primary-brand shadow-xs"
                  : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60"
              }`}
            >
              Today
            </button>
          </div>
          <div className="flex items-center justify-between gap-1.5 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 pl-1">Custom:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-750 dark:text-zinc-250 outline-none focus:ring-1 focus:ring-primary-brand cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-455 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans">
          Log Status
        </label>
        <div className="flex flex-col gap-1.5">
          {[
            { mode: "all" as const, label: "All Prep Tasks", count: totalCount },
            { mode: "pending" as const, label: "Active/Pending", count: totalCount - completedCount },
            { mode: "completed" as const, label: "Completed Logs", count: completedCount },
          ].map((filter) => (
            <button
              key={filter.mode}
              type="button"
              onClick={() => setFilterMode(filter.mode)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border ${
                filterMode === filter.mode
                  ? "bg-primary-brand/10 text-primary-brand border-primary-brand/20 dark:bg-orange-400/10 dark:text-orange-400 dark:border-orange-400/20 shadow-xs"
                  : "bg-white dark:bg-zinc-855 border-zinc-200 dark:border-zinc-700 text-zinc-655 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <span>{filter.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                filterMode === filter.mode
                  ? "bg-primary-brand/20 text-primary-brand dark:bg-orange-400/20 dark:text-orange-400"
                  : "bg-zinc-100 dark:bg-zinc-750 text-zinc-500 dark:text-zinc-455"
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reset Action */}
      {totalCount > 0 && (
        <button
          type="button"
          onClick={() => {
            onResetChecklist(selectedDate);
            window.showToast?.(`Reset active list for ${formatChecklistDate(selectedDate)} to pending`, "info");
          }}
          className="w-full py-3.5 border border-zinc-200 dark:border-zinc-800 text-zinc-655 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 bg-white dark:bg-zinc-855 shadow-xs active:scale-97"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Active List
        </button>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 text-left"
    >
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-primary-brand dark:text-orange-400 truncate flex items-center gap-2">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-primary-brand dark:text-orange-400 shrink-0" />
            Daily Kitchen Checklist
          </h2>
          <p className="hidden sm:block text-xs text-zinc-550 font-sans mt-0.5">
            Organize daily preparatory workflows and maintain premium kitchen standards.
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
            onClick={() => setIsAddModalOpen(true)}
            className="w-10 h-10 rounded-full bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
            title="Add Task"
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
              aria-label="Filter prep tasks"
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs bg-white dark:bg-zinc-800 shadow-2xl flex flex-col text-left"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-700 shrink-0">
                <h3 className="text-sm font-bold text-zinc-808 dark:text-zinc-105 font-sans">Filters</h3>
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



      {/* Filters and Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Filter Card (Hidden on mobile) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-xs">
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

        {/* Right Side: Checklist Items */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800 shadow-xs min-h-[350px] flex flex-col">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4 flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-505 dark:text-zinc-550 uppercase tracking-wider">
              {filterMode.toUpperCase()} ITEMS ({filteredList.length})
            </span>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-555" />
              <input
                type="text"
                placeholder="Search prep tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-500 font-medium"
              />
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4 animate-fade-in">
              {filterMode !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-85 transition-opacity"
                >
                  <span>Status: {filterMode}</span>
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
              {searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-85 transition-opacity"
                >
                  <span>Search: "{searchTerm}"</span>
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-85 transition-opacity"
                >
                  <span>Date: Custom</span>
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

          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[600px] p-1 pb-3 pr-2.5 custom-scrollbar">
            {paginatedChecklist.length > 0 ? (
              <>
                <AnimatePresence initial={false}>
                  {paginatedChecklist.map((item) => (
                    <motion.label
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer group transition-all ${
                        item.checked
                          ? "bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-100 dark:border-zinc-900/40 opacity-70"
                          : "bg-white dark:bg-zinc-850/60 border-zinc-150 dark:border-zinc-750/70 hover:border-zinc-250 dark:hover:border-zinc-650 hover:shadow-xs"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => onToggleChecklistItem(item.id, !item.checked, selectedDate)}
                        className="w-4.5 h-4.5 rounded-md border-zinc-300 text-primary-brand focus:ring-primary-brand dark:border-zinc-700 dark:bg-zinc-900 focus:ring-offset-0 cursor-pointer transition-all"
                      />
                      <span
                        className={`text-xs font-semibold select-none leading-relaxed flex-grow text-left ${
                          item.checked ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-200"
                        }`}
                      >
                        {item.text}
                      </span>
                      {item.checked && (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      )}
                    </motion.label>
                  ))}
                </AnimatePresence>

                {/* Pagination controls for Checklist */}
                {filteredList.length > 0 && (
                  <div className="flex flex-row items-center justify-between gap-2 pt-4 mt-4 border-t border-zinc-150 dark:border-zinc-800 w-full text-xs font-semibold select-none">
                    <div className="text-zinc-500 dark:text-zinc-400">
                      <span className="hidden xs:inline">Showing </span>
                      <span className="text-zinc-800 dark:text-zinc-200">{(checklistCurrentPage - 1) * checklistItemsPerPage + 1}</span>-
                      <span className="text-zinc-800 dark:text-zinc-200">{Math.min(checklistCurrentPage * checklistItemsPerPage, filteredList.length)}</span> of{" "}
                      <span className="text-zinc-800 dark:text-zinc-200">{filteredList.length}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setChecklistCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={checklistCurrentPage === 1}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-655 dark:text-zinc-350 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      {Array.from({ length: checklistTotalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (checklistTotalPages > 4 && Math.abs(pageNum - checklistCurrentPage) > 1 && pageNum !== 1 && pageNum !== checklistTotalPages) {
                          if (pageNum === 2 || pageNum === checklistTotalPages - 1) {
                            return <span key={pageNum} className="text-zinc-400 dark:text-zinc-600 px-0.5">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setChecklistCurrentPage(pageNum)}
                            className={`w-6.5 h-6.5 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                              checklistCurrentPage === pageNum
                                ? "bg-primary-brand text-white"
                                : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-655 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 cursor-pointer"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setChecklistCurrentPage(prev => Math.min(prev + 1, checklistTotalPages))}
                        disabled={checklistCurrentPage === checklistTotalPages || checklistTotalPages === 0}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-655 dark:text-zinc-350 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
                        title="Next Page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="hidden xs:inline text-zinc-500 dark:text-zinc-400">Show</span>
                      <select
                        value={checklistItemsPerPage}
                        onChange={(e) => {
                          setChecklistItemsPerPage(Number(e.target.value));
                          setChecklistCurrentPage(1);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-750 dark:text-zinc-305 outline-none focus:ring-1 focus:ring-primary-brand/35 shadow-sm"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-12 text-zinc-400 text-sm">
                <Inbox className="w-12 h-12 text-zinc-350 dark:text-zinc-700 mx-auto mb-3 opacity-60" />
                <p className="font-bold text-zinc-500 dark:text-zinc-450">No Prep Tasks Listed</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1 max-w-[280px] text-center">
                  {filterMode === "all"
                    ? "Your prep list is currently empty. Seed our standard high-quality bakery prep checklist below to get started immediately!"
                    : "There are no tasks matching your selected filters."}
                </p>
                {filterMode === "all" && !searchTerm && (
                  <button
                    type="button"
                    onClick={handleSeedDefaultChecklist}
                    className="mt-4 px-4 py-2 bg-primary-brand/10 text-primary-brand hover:bg-primary-brand hover:text-white dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500 dark:hover:text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Seed Standard Prep Tasks
                  </button>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal Dialog */}
      <AddChecklistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddChecklistItem={onAddChecklistItem}
        defaultDate={selectedDate}
      />
    </motion.div>
  );
}
