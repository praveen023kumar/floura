// File Path: /src/components/DashboardView.tsx
import { type ChecklistItem } from "../types";
import { formatPrice } from "../utils/format";
import {
  ArrowRight,
  PlusCircle,
  FolderPlus,
  BookOpen,
  Check,
  TrendingUp,
  Truck,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useDashboard } from "../hooks/useDashboard";

interface DashboardViewProps {
  onNavigate: (screen: "dashboard" | "orders" | "customers" | "inventory" | "recipes" | "orders-form" | "customers-form" | "inventory-form" | "recipes-form" | "debriefs" | "checklist") => void;
  productionCount: { completed: number; progress: number };
  activeOrdersCount: number;
  lowStockCount: number;
  checklist: ChecklistItem[];
  onToggleChecklistItem: (id: string, checked: boolean, date?: string) => void;
  onAlertClick?: (orderId: string) => void;
}

export default function DashboardView({
  onNavigate,
  checklist,
  onToggleChecklistItem,
}: DashboardViewProps) {
  const {
    lowStockCount,
    todayMappedChecklist,
    todayStr,
    todayProfit,
    todayDeliveryCount,
  } = useDashboard({ checklist });

  const completedCount = todayMappedChecklist.filter((i) => i.checked).length;
  const totalCount = todayMappedChecklist.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-3xl font-bold text-primary-brand dark:text-orange-400 font-serif tracking-tight">
            Hello, Chef.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-sans text-xs sm:text-sm font-medium">
            Floura Kitchen pulse for today.
          </p>
        </div>
        <button
          onClick={() => onNavigate("orders-form")}
          className="flex items-center justify-center w-11 h-11 bg-primary-brand dark:bg-pink-700 hover:bg-primary-brand-dark hover:scale-102 text-white rounded-2xl shadow-md shadow-pink-700/10 cursor-pointer active:scale-95 transition-all"
          title="New Order"
        >
          <PlusCircle className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>

      {/* 1. Today — Profit & Delivery Order Count */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Today's Profit */}
        <div
          onClick={() => onNavigate("orders")}
          className="bg-[#F4FDF9] dark:bg-emerald-950/10 rounded-2xl p-4 sm:p-5 border border-emerald-100/60 dark:border-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[140px]"
        >
          <div className="flex justify-between items-start">
            <p className="text-[9px] sm:text-[11px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-450 font-sans">
              Today's Profit
            </p>
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-3xl font-serif font-bold text-emerald-800 dark:text-emerald-300 mt-1 truncate">
              {formatPrice(todayProfit)}
            </h3>
            <p className="text-[9px] sm:text-[11px] text-emerald-600 dark:text-emerald-500 font-semibold mt-1 truncate">
              From completed deliveries
            </p>
          </div>
        </div>

        {/* Today's Delivery Order Count */}
        <div
          onClick={() => onNavigate("orders")}
          className="bg-pink-50/40 dark:bg-pink-950/10 rounded-2xl p-4 sm:p-5 border border-pink-100/50 dark:border-pink-900/20 hover:border-pink-300 dark:hover:border-pink-800 transition-all cursor-pointer shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[140px]"
        >
          <div className="flex justify-between items-start">
            <p className="text-[9px] sm:text-[11px] font-bold tracking-wider uppercase text-pink-650 dark:text-pink-400 font-sans">
              Today's Deliveries
            </p>
            <div className="w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
              <Truck className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-3xl font-serif font-bold text-zinc-800 dark:text-zinc-100 mt-1">
              {todayDeliveryCount}
            </h3>
            <p className="text-[9px] sm:text-[11px] text-pink-600 dark:text-pink-400 font-semibold mt-1 truncate">
              {todayDeliveryCount === 0 ? "No deliveries today" : `Order${todayDeliveryCount !== 1 ? "s" : ""} due today`}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Daily Inventory Check */}
      <div
        onClick={() => onNavigate("checklist")}
        className={`rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all shadow-xs flex items-center justify-between gap-4 ${
          allDone
            ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700"
            : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700/60 hover:border-zinc-300 dark:hover:border-zinc-600"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            allDone
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          }`}>
            {allDone
              ? <CheckCircle className="w-5 h-5" />
              : <Check className="w-5 h-5" />
            }
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Daily Inventory Check
            </p>
            <p className={`text-xs font-semibold mt-0.5 ${
              allDone
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-amber-700 dark:text-amber-400"
            }`}>
              {totalCount === 0
                ? "No items for today"
                : allDone
                ? "All items verified"
                : `${totalCount - completedCount} item${totalCount - completedCount !== 1 ? "s" : ""} pending`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalCount > 0 && !allDone && (
            <span className="w-8 h-8 rounded-full bg-amber-500 dark:bg-amber-600 text-white text-sm font-bold flex items-center justify-center">
              {totalCount - completedCount}
            </span>
          )}
          <ArrowRight className={`w-4 h-4 ${
            allDone ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
          }`} />
        </div>
      </div>

      {/* 3. Low Stock Alert */}
      <div
        onClick={() => onNavigate("inventory")}
        className={`rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all shadow-xs flex items-center justify-between gap-4 ${
          lowStockCount > 0
            ? "bg-amber-50/60 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/30 hover:border-amber-400 dark:hover:border-amber-700"
            : "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            lowStockCount > 0
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          }`}>
            {lowStockCount > 0
              ? <AlertTriangle className="w-5 h-5" />
              : <CheckCircle className="w-5 h-5" />
            }
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Low Stock Alert
            </p>
            <p className={`text-xs font-semibold mt-0.5 ${
              lowStockCount > 0
                ? "text-amber-700 dark:text-amber-400"
                : "text-emerald-700 dark:text-emerald-400"
            }`}>
              {lowStockCount > 0
                ? `${lowStockCount} ingredient${lowStockCount !== 1 ? "s" : ""} below minimum level`
                : "All stocks are healthy"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lowStockCount > 0 && (
            <span className="w-8 h-8 rounded-full bg-amber-500 dark:bg-amber-600 text-white text-sm font-bold flex items-center justify-center">
              {lowStockCount}
            </span>
          )}
          <ArrowRight className={`w-4 h-4 ${
            lowStockCount > 0 ? "text-amber-500 dark:text-amber-400" : "text-emerald-500 dark:text-emerald-400"
          }`} />
        </div>
      </div>

      {/* 4. Quick Actions */}
      <section className="flex flex-col gap-3">
        <h3 className="text-base sm:text-lg font-serif font-bold text-zinc-800 dark:text-zinc-200 pl-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate("orders-form")}
            className="group bg-primary-brand hover:bg-primary-brand/95 text-white rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer text-center min-h-[100px]"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:scale-105">
              <PlusCircle className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold tracking-tight">New Order</span>
          </button>

          <button
            onClick={() => onNavigate("inventory-form")}
            className="group bg-sweet-pink hover:bg-sweet-pink/95 text-white rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer text-center min-h-[100px]"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:scale-105">
              <FolderPlus className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold tracking-tight">Add Stock</span>
          </button>

          <button
            onClick={() => onNavigate("recipes")}
            className="group bg-[#F1F5F9] dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer text-center min-h-[100px]"
          >
            <div className="w-10 h-10 rounded-full bg-[#FCE7F3] dark:bg-pink-950/40 flex items-center justify-center transition-transform group-hover:scale-105">
              <BookOpen className="w-5 h-5 text-primary-brand dark:text-pink-400 stroke-[2.2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold tracking-tight text-zinc-850 dark:text-zinc-250">Recipes</span>
          </button>
        </div>
      </section>
    </motion.div>
  );
}
