// File Path: /src/components/RecipesView.tsx
import React, { useState } from "react";
import { memoWithData } from "../utils/memo";
import {
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  X,
  Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useRecipes } from "../hooks/useRecipes";

interface RecipesViewProps {
  onNavigate: (path: string) => void;
}

function RecipesView({ onNavigate }: RecipesViewProps) {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    dynamicCategories,
    paginatedRecipes,
    filteredCount,
    recipeList,
    recipesCurrentPage,
    setRecipesCurrentPage,
    recipesItemsPerPage,
    setRecipesItemsPerPage,
    recipesTotalPages,
  } = useRecipes({
    onAddRecipe: async () => {},
    initialViewMode: "list",
  });

  const totalRecipesCount = recipeList?.length || 0;

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFilterCount = (selectedCategory !== "All" ? 1 : 0) + (searchTerm.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSearchTerm("");
  };

  const renderFilterGroups = () => (
    <div className="space-y-5">
      {/* Category Choices */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans">
          Recipe Category
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
                  : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-655 dark:text-zinc-405 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
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
    </div>
  );

  const getCategoryStyles = (category: string) => {
    const cat = category?.toLowerCase() || "";
    if (cat.includes("cake")) {
      return "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30";
    }
    if (cat.includes("cookie") || cat.includes("biscuit")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30";
    }
    if (cat.includes("bread") || cat.includes("dough")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
    }
    if (cat.includes("pastry") || cat.includes("tart")) {
      return "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30";
    }
    return "bg-zinc-50 text-zinc-650 border-zinc-150 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-700/30";
  };

  return (
    <div className="space-y-6 text-left">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-2xl font-bold font-serif text-primary-brand dark:text-orange-400 truncate">
              Recipe Book
            </h2>
            <span className="text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 shrink-0">
              {filteredCount} {filteredCount === 1 ? 'Recipe' : 'Recipes'}
            </span>
          </div>
          <p className="hidden sm:block text-xs text-zinc-550 font-sans mt-0.5">
            Manage sweet formulations and calculate volumetric yield scaling in real-time.
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
            onClick={() => onNavigate("/recipes/new")}
            className="w-10 h-10 rounded-full bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
            title="Add Formula"
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
              aria-label="Filter recipes"
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs bg-white dark:bg-zinc-800 shadow-2xl flex flex-col text-left"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-700 shrink-0">
                <h3 className="text-sm font-bold text-zinc-805 dark:text-zinc-105 font-sans">Filters</h3>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-405 cursor-pointer"
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
                    className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-665 dark:text-zinc-305 hover:bg-zinc-55 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
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



      {/* Main Recipes Layout */}
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

        {/* Recipes grid right side */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800 shadow-xs flex flex-col min-h-[350px]">
            {/* ── STATS TILES ── */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchTerm("");
                }}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  selectedCategory === "All" && !searchTerm
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
                  {totalRecipesCount}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                }}
                className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  selectedCategory !== "All" || searchTerm
                    ? "bg-emerald-100/80 dark:bg-emerald-950/40 ring-1.5 ring-emerald-400 shadow-2xs"
                    : "bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700/80 dark:text-emerald-300/80 uppercase tracking-wider truncate">
                    Filtered
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 leading-none">
                  {filteredCount}
                </div>
              </button>

              <div
                className="p-2 sm:p-2.5 rounded-xl text-left flex flex-col justify-between bg-amber-50/60 dark:bg-amber-950/20"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-700/80 dark:text-amber-300/80 uppercase tracking-wider truncate">
                    Categories
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black font-sans text-primary-brand dark:text-orange-400 tracking-tight mt-1 leading-none">
                  {dynamicCategories.length}
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-550" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-755 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-500 font-medium"
                />
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {selectedCategory !== "All" && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400 pl-2.5 pr-1.5 py-1 rounded-full cursor-pointer hover:opacity-85 transition-opacity"
                  >
                    <span>Category: {selectedCategory}</span>
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
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 hover:text-zinc-655 hover:underline px-1.5 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

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
              ) : paginatedRecipes.length > 0 ? (
                paginatedRecipes.map((r) => {
                  return (
                    <div
                      key={r.id}
                      onClick={() => onNavigate(`/recipes/${r.id}`)}
                      className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer text-left group"
                    >
                      {/* Row 1: Image, Name and Category Badge */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 shrink-0 border border-zinc-150 dark:border-zinc-800 shadow-inner relative">
                            <img
                              src={(r.imageBase64?.startsWith("data:image/") ? r.imageBase64 : undefined) || r.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300"}
                              alt={r.name}
                              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300";
                              }}
                            />
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-primary-brand dark:group-hover:text-orange-400 transition-colors truncate">
                            {r.name}
                          </h4>
                        </div>
                        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryStyles(r.category)}`}>
                          {r.category}
                        </span>
                      </div>

                      {/* Row 2: Secondary info */}
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
                        {r.ingredients?.length || 0} INGREDIENTS {r.allergens && r.allergens.length > 0 ? `• ${r.allergens.join(", ")}` : ""}
                      </p>

                      {/* Row 3: Metrics & Action */}
                      <div className="mt-3 pt-1 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/60">
                        <div className="grid grid-cols-3 gap-4 sm:gap-8 flex-1">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                              BASE YIELD
                            </span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                              {r.stdYield} {r.yieldUnit}
                            </span>
                          </div>

                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-550 font-semibold">
                              INGREDIENTS
                            </span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                              {r.ingredients?.length || 0} items
                            </span>
                          </div>

                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                              SCALING
                            </span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                              Enabled
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(`/recipes/${r.id}`);
                          }}
                          className="p-2 text-zinc-400 hover:text-primary-brand dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Open Recipe"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm">
                  <Inbox className="w-12 h-12 text-zinc-350 dark:text-zinc-700 mx-auto mb-3 opacity-60" />
                  <p className="font-bold text-zinc-500 dark:text-zinc-450">No Recipe Formulas Found</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1 max-w-[280px] text-center font-sans">
                    There are no recipes matching your selected category filters or search keywords.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination controls for Recipes */}
            {filteredCount > 0 && (
              <div className="flex flex-row items-center justify-between gap-3 pt-5 mt-6 border-t border-zinc-150/60 dark:border-zinc-750/50 w-full select-none">
                {/* Showing details */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                  <span className="hidden sm:inline">Showing </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{(recipesCurrentPage - 1) * recipesItemsPerPage + 1}</span>–
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{Math.min(recipesCurrentPage * recipesItemsPerPage, filteredCount)}</span> of{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredCount}</span>
                  <span className="hidden sm:inline"> recipes</span>
                  <span className="sm:hidden"> recipes</span>
                </div>
                
                {/* Page buttons and Desktop Select container */}
                <div className="flex items-center gap-3">
                  {/* Page buttons */}
                  <div className="flex items-center bg-zinc-50 dark:bg-zinc-900/60 p-0.5 rounded-xl border border-zinc-150/50 dark:border-zinc-700/50 shadow-sm">
                    <button
                      onClick={() => setRecipesCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={recipesCurrentPage === 1}
                      className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    
                    {Array.from({ length: recipesTotalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (recipesTotalPages > 4) {
                        const isCurrent = recipesCurrentPage === pageNum;
                        const isFirstOrLast = pageNum === 1 || pageNum === recipesTotalPages;
                        const isNear = Math.abs(pageNum - recipesCurrentPage) <= 1;
                        
                        if (!isCurrent && !isFirstOrLast && !isNear) {
                          if (pageNum === 2 || pageNum === recipesTotalPages - 1) {
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
                          onClick={() => setRecipesCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            recipesCurrentPage === pageNum
                              ? "bg-primary-brand text-white shadow-sm"
                              : "text-zinc-650 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setRecipesCurrentPage(prev => Math.min(prev + 1, recipesTotalPages))}
                      disabled={recipesCurrentPage === recipesTotalPages || recipesTotalPages === 0}
                      className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {/* Desktop show select */}
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs text-zinc-405 dark:text-zinc-505 font-medium">Show</span>
                    <select
                      value={recipesItemsPerPage}
                      onChange={(e) => {
                        setRecipesItemsPerPage(Number(e.target.value));
                        setRecipesCurrentPage(1);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-305 font-medium outline-none focus:ring-1 focus:ring-primary-brand/35 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all"
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

export default memoWithData(RecipesView);
