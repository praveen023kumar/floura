import { useState, useEffect } from "react";
import { useDebriefs, type SortOption } from "../hooks/useDebriefs";
import { formatPrice, formatDate } from "../utils/format";
import {
  CheckCircle,
  Inbox,
  TrendingUp,
  Search,
  ArrowUpDown,
  Calendar,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BarChart3,
  Percent,
  AlertTriangle,
  FileText,
  Filter,
  RefreshCw,
  TrendingDown,
  SlidersHorizontal,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface DebriefsViewProps { }

function formatMonthKey(monthStr: string) {
  if (!monthStr) return "";
  const [year, monthNum] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return date.toLocaleString("en-US", { month: "long" }) + " " + year;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 dark:bg-zinc-850 text-white text-[10px] p-2.5 rounded-xl border border-zinc-750/30 shadow-lg space-y-1 text-left">
        <p className="font-serif font-extrabold border-b border-zinc-700/50 pb-1 text-zinc-200">{data.name}</p>
        <p className="font-medium text-zinc-300">
          Sales: <span className="font-bold text-white">{formatPrice(data.sales)}</span>
        </p>
        <p className="font-medium text-emerald-400">
          Profit: <span className="font-bold">{formatPrice(data.profit)}</span>
        </p>
        <p className="font-medium text-zinc-400">
          Bakes: <span className="font-bold text-zinc-300">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function DebriefsView({ }: DebriefsViewProps) {
  const {
    orders,
    refreshTrigger,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    selectedFlavor,
    setSelectedFlavor,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterLogType,
    setFilterLogType,
    completedOrders,
    metrics,
    filteredAndSortedOrders,
    availableFlavors,
    flavorOptions,
    debriefsCurrentPage,
    setDebriefsCurrentPage,
    debriefsItemsPerPage,
    setDebriefsItemsPerPage,
    paginatedDebriefs,
    debriefsTotalPages,
    unfilteredMonthlyList,
  } = useDebriefs();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const activeFilterCount =
    (selectedFlavor ? 1 : 0) +
    (startDate || endDate ? 1 : 0) +
    (filterLogType !== "all" ? 1 : 0) +
    (searchTerm ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedFlavor("");
    setStartDate("");
    setEndDate("");
    setFilterLogType("all");
    setSearchTerm("");
  };



  const logTypeOptions = [
    { value: "all", label: `All Bakes (${completedOrders.length})` },
    { value: "difficulties", label: `Hurdles Logged (${metrics.difficultyBakesCount})` },
    { value: "costs", label: `Cost Breakdown Log (${metrics.costBakesCount})` },
  ];

  const sortOptions = [
    { value: "date-desc", label: "Newest Completed" },
    { value: "date-asc", label: "Oldest Completed" },
    { value: "profit-desc", label: "Highest Profit" },
    { value: "profit-asc", label: "Lowest Profit" },
    { value: "sales-desc", label: "Highest Sale Price" },
    { value: "sales-asc", label: "Lowest Sale Price" },
  ];

  const renderFilterGroups = () => (
    <div className="space-y-6">


      {/* Date Range facet */}
      <div>
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2">
          Bake Date Range
        </h3>
        <div className="space-y-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider font-sans">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs px-2.5 py-1.5 rounded-lg outline-none text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-primary-brand"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider font-sans">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs px-2.5 py-1.5 rounded-lg outline-none text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-primary-brand"
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Clear Range
            </button>
          )}
        </div>
      </div>

      {/* Flavor facet */}
      <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2">
          Cake Flavor
        </h3>
        <div className="space-y-0.5" role="radiogroup" aria-label="Filter by cake flavor">
          <button
            type="button"
            role="radio"
            aria-checked={!selectedFlavor}
            onClick={() => setSelectedFlavor("")}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand ${!selectedFlavor
                ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
          >
            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${!selectedFlavor ? "border-primary-brand dark:border-orange-400" : "border-zinc-300 dark:border-zinc-600"
              }`}>
              {!selectedFlavor && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />}
            </span>
            All Cake Flavors
          </button>
          {availableFlavors.map((fl) => (
            <button
              key={fl}
              type="button"
              role="radio"
              aria-checked={selectedFlavor === fl}
              onClick={() => setSelectedFlavor(fl)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand ${selectedFlavor === fl
                  ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                  : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedFlavor === fl ? "border-primary-brand dark:border-orange-400" : "border-zinc-300 dark:border-zinc-600"
                }`}>
                {selectedFlavor === fl && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />}
              </span>
              {fl}
            </button>
          ))}
        </div>
      </div>

      {/* Sort facet */}
      <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-2">
          Sort By
        </h3>
        <div className="space-y-0.5" role="radiogroup" aria-label="Sort debriefs">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={sortBy === opt.value}
              onClick={() => setSortBy(opt.value as SortOption)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand ${sortBy === opt.value
                  ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                  : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${sortBy === opt.value ? "border-primary-brand dark:border-orange-400" : "border-zinc-300 dark:border-zinc-600"
                }`}>
                {sortBy === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Type facet (Moved to bottom) */}
      <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-sans mb-1">
          Log Type
        </h3>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-2.5 font-medium leading-relaxed">
          Filter bakes by logged observations, such as kitchen hurdles or cost breakdowns.
        </p>
        <div className="space-y-0.5" role="radiogroup" aria-label="Filter by log type">
          {logTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={filterLogType === opt.value}
              onClick={() => setFilterLogType(opt.value as any)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand ${filterLogType === opt.value
                  ? "bg-primary-brand-light dark:bg-primary-brand-dark/20 text-primary-brand dark:text-orange-400"
                  : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${filterLogType === opt.value ? "border-primary-brand dark:border-orange-400" : "border-zinc-300 dark:border-zinc-600"
                }`}>
                {filterLogType === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-400" />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 text-left"
    >
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-primary-brand dark:text-orange-400 truncate flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-brand dark:text-orange-400 shrink-0" />
            Kitchen Performance Dashboard
          </h2>
          <p className="hidden sm:block text-xs text-zinc-550 font-sans mt-0.5">
            Filtered performance metrics and completed bake analytics.
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
        </div>
      </div>

      {/* ── rolling 12 months unfiltered monthly trends (Full width) ── */}
      {completedOrders.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-150/80 dark:border-zinc-700/60 shadow-sm flex flex-col w-full">
          <div className="mb-4">
            <h4 className="font-serif font-extrabold text-lg text-zinc-850 dark:text-zinc-100">
              Monthly Performance Trends
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Visualizing cumulative monthly sales revenue compared against net profit (Default rolling 12 months).
            </p>
          </div>

          <div className="w-full overflow-x-auto custom-scrollbar mt-2 pb-2">
            <div className="h-48 min-w-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={unfilteredMonthlyList}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: isDarkMode ? "#a1a1aa" : "#71717a",
                      fontSize: 10,
                      fontWeight: 700
                    }}
                    dy={8}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}
                  />
                  <Bar
                    dataKey="sales"
                    fill={isDarkMode ? "#3f3f46" : "#e4e4e7"}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                    minPointSize={5}
                  />
                  <Bar
                    dataKey="profit"
                    fill={isDarkMode ? "#059669" : "#10b981"}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                    minPointSize={5}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex gap-4 items-center justify-center mt-3 text-[10px] text-zinc-555 dark:text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-600" />
              <span>Sales Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Net Profit Margin</span>
            </div>
          </div>
        </div>
      )}



      {/* ── MAIN LAYOUT WITH FILTERS SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop side menu */}
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs text-left">
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
                aria-label="Filter and sort debriefs"
                className="lg:hidden fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs bg-white dark:bg-zinc-800 shadow-2xl flex flex-col text-left"
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
                      className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-655 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
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

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6 text-left">
          {/* Active Filters Alert Banner */}
          {(selectedFlavor || startDate || endDate) && (
            <div className="bg-amber-500/10 dark:bg-amber-500/20 border border-amber-200/45 dark:border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-800 dark:text-amber-400 font-semibold shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                <span>
                  Filtering completed bakes by:{" "}
                  {(startDate || endDate) && (
                    <span className="font-bold underline decoration-zinc-350 dark:decoration-zinc-600 underline-offset-4">
                      {startDate ? formatDate(startDate) : "Anytime"} to {endDate ? formatDate(endDate) : "Anytime"}
                    </span>
                  )}
                  {(startDate || endDate) && selectedFlavor && " and "}
                  {selectedFlavor && (
                    <span className="font-bold underline decoration-zinc-350 dark:decoration-zinc-600 underline-offset-4">
                      {selectedFlavor} Flavor
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-amber-600 dark:text-amber-300 font-bold hover:underline cursor-pointer ml-4"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Overview Analytics Bento Cards (Dashboard Box) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Captured Net Profit */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-3.5 sm:p-5 border border-zinc-150/80 dark:border-zinc-700/60 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-500 flex-shrink-0" /> <span className="truncate">Captured Net Profit</span>
                </p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2">
                  {formatPrice(metrics.totalProfit)}
                </h3>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center gap-1 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate">Across {metrics.count} bakes</span>
              </div>
            </div>

            {/* Total Sales Revenue */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-3.5 sm:p-5 border border-zinc-150/80 dark:border-zinc-700/60 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-primary-brand flex-shrink-0" /> <span className="truncate">Total Sales Revenue</span>
                </p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-zinc-850 dark:text-zinc-100 mt-1 sm:mt-2">
                  {formatPrice(metrics.totalSales)}
                </h3>
              </div>
              <div className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                Accumulated volume
              </div>
            </div>

            {/* Average Profit per Order */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-3.5 sm:p-5 border border-zinc-150/80 dark:border-zinc-700/60 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" /> <span className="truncate">Avg. Profit / Order</span>
                </p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-purple-600 dark:text-purple-400 mt-1 sm:mt-2">
                  {formatPrice(metrics.averageProfitPerOrder)}
                </h3>
              </div>
              <div className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                Net return per cycle
              </div>
            </div>

            {/* Average Profit Margin */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-3.5 sm:p-5 border border-zinc-150/80 dark:border-zinc-700/60 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-orange-500 flex-shrink-0" /> <span className="truncate">Avg. Profit Margin</span>
                </p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-primary-brand dark:text-orange-400 mt-1 sm:mt-2">
                  {metrics.averageMargin.toFixed(1)}%
                </h3>
              </div>
              <div className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                Top: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{metrics.bestFlavor}</span>
              </div>
            </div>
          </div>

          {/* Flavor Profitability Chart */}
          {completedOrders.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-150/80 dark:border-zinc-700/60 shadow-sm flex flex-col w-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-serif font-extrabold text-lg text-zinc-850 dark:text-zinc-100">
                    Flavor Profitability Index
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Total profits captured by cake flavor. Click on a flavor to isolate its orders.
                  </p>
                </div>
                {selectedFlavor && (
                  <button
                    onClick={() => setSelectedFlavor("")}
                    className="text-xs font-semibold text-primary-brand dark:text-orange-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Clear filter
                  </button>
                )}
              </div>

              <div className="space-y-4 flex-grow justify-center flex flex-col">
                {metrics.flavorsList.length > 0 ? (
                  metrics.flavorsList.slice(0, 5).map((f) => {
                    const maxProfitInList = metrics.flavorsList[0]?.profit || 1;
                    const percentWidth = Math.max((f.profit / maxProfitInList) * 100, 3);
                    const isSelected = selectedFlavor === f.flavor;

                    return (
                      <div
                        key={f.flavor}
                        onClick={() => setSelectedFlavor(selectedFlavor === f.flavor ? "" : f.flavor)}
                        className={`group p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected
                            ? "bg-primary-brand/5 dark:bg-orange-500/5 border-primary-brand/30 dark:border-orange-500/30 shadow-xs"
                            : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-850"
                          }`}
                      >
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-primary-brand dark:group-hover:text-orange-400 flex items-center gap-1.5">
                            {f.flavor}
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-orange-500" />}
                          </span>
                          <div className="text-right">
                            <span className="text-zinc-850 dark:text-zinc-150 font-bold">{formatPrice(f.profit)}</span>
                            <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-1.5">({f.count} orders)</span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-700/60 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percentWidth}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${isSelected
                                ? "bg-primary-brand dark:bg-orange-500"
                                : "bg-primary-brand/75 dark:bg-orange-500/75 group-hover:bg-primary-brand dark:group-hover:bg-orange-400"
                              }`}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          <span>Sales: {formatPrice(f.sales)}</span>
                          <span>Avg Margin: {f.margin.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-zinc-400">No bakes match active filters.</div>
                )}
              </div>
            </div>
          )}

          {/* List Header */}
          <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-750 pb-2">
            <h3 className="font-serif font-extrabold text-lg text-zinc-800 dark:text-zinc-150">
              Completed Bakes Log
            </h3>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
              Filtered: {filteredAndSortedOrders.length} bakes
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search bakes, notes, flavors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-500 font-medium"
              />
            </div>
          </div>

          {/* Main List of Completed Bakes */}
          {paginatedDebriefs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedDebriefs.map((o) => {
                const marginVal = o.totalAmount > 0 ? ((o.profitAmount || 0) / o.totalAmount) * 100 : 0;
                const hasDifficultiesLogged = o.profitDifficulties && o.profitDifficulties.trim() !== "" &&
                  !o.profitDifficulties.toLowerCase().includes("no major") &&
                  !o.profitDifficulties.toLowerCase().includes("excellent execution") &&
                  !o.profitDifficulties.toLowerCase().includes("no difficulties") &&
                  !o.profitDifficulties.toLowerCase().includes("none");

                return (
                  <motion.div
                    layout
                    key={o.id}
                    className={`bg-white dark:bg-zinc-800 rounded-3xl p-6 border transition-all space-y-4 shadow-sm hover:shadow-md ${hasDifficultiesLogged
                        ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/10 dark:bg-amber-950/5"
                        : "border-zinc-150/80 dark:border-zinc-700/60"
                      }`}
                  >
                    {/* Header Info */}
                    <div className="flex flex-col gap-3.5 border-b border-zinc-100 dark:border-zinc-750/80 pb-4">
                      {/* Row 1: Title & Status Icon */}
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${hasDifficultiesLogged
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-500"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500"
                          }`}>
                          {hasDifficultiesLogged ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-extrabold text-base text-zinc-800 dark:text-zinc-150 leading-tight">
                            {o.customerName}'s {o.eventType} Cake
                          </h3>
                        </div>
                      </div>

                      {/* Row 2: Metadata (Flavor & Date & Margin Tag) */}
                      <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 items-center text-xs text-zinc-400 dark:text-zinc-550 font-medium">
                        <span className="bg-zinc-100 dark:bg-zinc-700/60 text-zinc-650 dark:text-zinc-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
                          {o.cakeFlavor}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="flex items-center gap-1 font-semibold text-zinc-500 dark:text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                          {formatDate(o.eventDate)}
                        </span>
                        {marginVal >= 60 && (
                          <>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5">
                              <Sparkles className="w-3 h-3" /> High Margin Gem
                            </span>
                          </>
                        )}
                      </div>

                      {/* Row 3: Financial Details Grid */}
                      <div className="grid grid-cols-2 gap-3 w-full pt-0.5">
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-850 dark:text-emerald-400 px-3.5 py-2.5 rounded-xl border border-emerald-100/50 dark:border-emerald-950/30">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block tracking-wider mb-1">Captured Profit</span>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base font-extrabold font-serif text-emerald-700 dark:text-emerald-400">{formatPrice(o.profitAmount || 0)}</span>
                            <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">({marginVal.toFixed(0)}% margin)</span>
                          </div>
                        </div>
                        <div className="bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-650 dark:text-zinc-350 px-3.5 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block tracking-wider mb-1">Total Sale</span>
                          <span className="text-base font-extrabold font-mono text-zinc-800 dark:text-zinc-200 block">{formatPrice(o.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost & Difficulties Logs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 font-sans text-sm leading-relaxed">
                      <div className="bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-750/30">
                        <span className="text-[10px] uppercase font-black text-zinc-400 dark:text-zinc-500 block tracking-widest mb-1.5 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-zinc-400" /> Expense & Cost Distribution Notes:
                        </span>
                        <p className="text-zinc-700 dark:text-zinc-300 font-medium italic">
                          "{o.profitCostGoing || "Ingredients, logistics and labor cost details were not explicitly logged."}"
                        </p>
                      </div>

                      <div className={`p-4 rounded-2xl border ${hasDifficultiesLogged
                          ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-200/40 dark:border-amber-500/20"
                          : "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-750/30"
                        }`}>
                        <span className={`text-[10px] uppercase font-black block tracking-widest mb-1.5 flex items-center gap-1 ${hasDifficultiesLogged ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500"
                          }`}>
                          <AlertTriangle className={`w-3.5 h-3.5 ${hasDifficultiesLogged ? "text-amber-500 animate-pulse" : "text-zinc-400"}`} />
                          Baking & Decorating Difficulties Logged:
                        </span>
                        <p className={`font-medium italic ${hasDifficultiesLogged ? "text-zinc-800 dark:text-zinc-200 font-semibold" : "text-zinc-750 dark:text-zinc-300"}`}>
                          "{o.profitDifficulties || "Excellent execution. No major custom baking hurdles encountered."}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700/60 text-zinc-400 dark:text-zinc-550 flex flex-col items-center justify-center p-6 shadow-sm">
              <Inbox className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-base font-serif font-bold text-zinc-700 dark:text-zinc-300">No Completed Debriefs Found</p>
              <p className="text-xs mt-1.5 max-w-sm leading-relaxed">
                {completedOrders.length > 0
                  ? "We couldn't find any completed bakes matching your selected filter criteria."
                  : "When you mark a client order as Completed and capture its cost logs, the detailed breakdown, difficulty notes, and captured margins will automatically appear here."
                }
              </p>
            </div>
          )}

          {/* Pagination controls for Debriefs */}
          {filteredAndSortedOrders.length > 0 && (
            <div className="flex flex-row items-center justify-between gap-3 pt-5 mt-6 border-t border-zinc-150/60 dark:border-zinc-800/80 w-full">
              {/* Showing details */}
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                <span className="hidden sm:inline">Showing </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{(debriefsCurrentPage - 1) * debriefsItemsPerPage + 1}</span>–
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{Math.min(debriefsCurrentPage * debriefsItemsPerPage, filteredAndSortedOrders.length)}</span> of{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredAndSortedOrders.length}</span>
                <span className="hidden sm:inline"> completed bakes</span>
                <span className="sm:hidden"> bakes</span>
              </div>

              {/* Page buttons and Desktop Select container */}
              <div className="flex items-center gap-3">
                {/* Page buttons */}
                <div className="flex items-center bg-zinc-50 dark:bg-zinc-900/60 p-0.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800/80 shadow-sm">
                  <button
                    onClick={() => setDebriefsCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={debriefsCurrentPage === 1}
                    className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: debriefsTotalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (debriefsTotalPages > 4) {
                      const isCurrent = debriefsCurrentPage === pageNum;
                      const isFirstOrLast = pageNum === 1 || pageNum === debriefsTotalPages;
                      const isNear = Math.abs(pageNum - debriefsCurrentPage) <= 1;

                      if (!isCurrent && !isFirstOrLast && !isNear) {
                        if (pageNum === 2 || pageNum === debriefsTotalPages - 1) {
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
                        onClick={() => setDebriefsCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${debriefsCurrentPage === pageNum
                            ? "bg-primary-brand text-white shadow-sm"
                            : "text-zinc-650 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setDebriefsCurrentPage(prev => Math.min(prev + 1, debriefsTotalPages))}
                    disabled={debriefsCurrentPage === debriefsTotalPages || debriefsTotalPages === 0}
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
                    value={debriefsItemsPerPage}
                    onChange={(e) => {
                      setDebriefsItemsPerPage(Number(e.target.value));
                      setDebriefsCurrentPage(1);
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 font-medium outline-none focus:ring-1 focus:ring-primary-brand/35 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all"
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
    </motion.div>
  );
}
