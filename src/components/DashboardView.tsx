import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import {
  Search,
  Bell,
  Plus,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Truck,
  AlertTriangle,
  FolderPlus,
  BookOpen,
  Calendar,
  Check,
  Clock
} from "lucide-react";
import { formatPrice } from "../utils/format";
import { useDashboard } from "../hooks/useDashboard";
import { type Order, type ChecklistItem } from "../types";
import { getStatusColors } from "../utils/orderStatus";

// Helper to parse "hh:mm am/pm" or "hh:mm" into minutes since start of day
const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const clean = timeStr.trim().toLowerCase();
  
  // Check for am/pm
  const ampmMatch = clean.match(/^(\d+):(\d+)\s*(am|pm)$/);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3];
    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return hour * 60 + minute;
  }
  
  // Check for 24h format
  const standardMatch = clean.match(/^(\d+):(\d+)$/);
  if (standardMatch) {
    const hour = parseInt(standardMatch[1], 10);
    const minute = parseInt(standardMatch[2], 10);
    return hour * 60 + minute;
  }
  
  return null;
};



const cardColorMap = [
  {
    bg: "bg-pink-50/50 dark:bg-pink-950/20",
    border: "border-pink-100 dark:border-pink-900/30",
    bar: "bg-pink-500",
    text: "text-pink-700 dark:text-pink-300",
    time: "text-pink-500/80"
  },
  {
    bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
    border: "border-indigo-100 dark:border-indigo-900/30",
    bar: "bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-300",
    time: "text-indigo-500/80"
  },
  {
    bg: "bg-sky-50/50 dark:bg-sky-950/20",
    border: "border-sky-100 dark:border-sky-900/30",
    bar: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    time: "text-sky-500/80"
  },
  {
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    border: "border-emerald-100 dark:border-emerald-900/30",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    time: "text-emerald-500/80"
  }
];

interface DashboardViewProps {
  onNavigate: (screen: "dashboard" | "orders" | "customers" | "inventory" | "recipes" | "orders-form" | "customers-form" | "inventory-form" | "recipes-form" | "debriefs" | "checklist" | "profile" | "more") => void;
  productionCount: { completed: number; progress: number };
  activeOrdersCount: number;
  lowStockCount: number;
  checklist: ChecklistItem[];
  onToggleChecklistItem: (id: string, checked: boolean, date?: string) => void;
  onAlertClick?: (orderId: string) => void;
  user: { name: string; avatar: string } | null;
}

export default function DashboardView({
  onNavigate,
  checklist,
  onToggleChecklistItem,
  user,
}: DashboardViewProps) {
  const {
    lowStockCount,
    todayMappedChecklist,
    todayStr,
    todayProfit,
    todayDeliveryCount,
    activeOrders,
    lowStockItems,
    averageProfitMarginPercent,
  } = useDashboard({ checklist });

  const [scheduleDate, setScheduleDate] = useState(todayStr);

  const prevTodayStrRef = useRef(todayStr);
  useEffect(() => {
    const prevToday = prevTodayStrRef.current;
    if (scheduleDate === prevToday) {
      setScheduleDate(todayStr);
    }
    prevTodayStrRef.current = todayStr;
  }, [todayStr, scheduleDate]);

  // Compute checklist stats
  const completedChecklistCount = todayMappedChecklist.filter((i) => i.checked).length;
  const totalChecklistCount = todayMappedChecklist.length;
  const checklistPercent = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  // Filter and sort orders for selected schedule date
  const scheduleOrders = activeOrders.filter(o => o.deliveryDate === scheduleDate);
  const sortedScheduleOrders = useMemo(() => {
    return [...scheduleOrders].sort((a, b) => {
      const aMins = parseTimeToMinutes(a.deliveryTime) ?? 9999;
      const bMins = parseTimeToMinutes(b.deliveryTime) ?? 9999;
      return aMins - bMins;
    });
  }, [scheduleOrders]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-12 text-zinc-800 dark:text-zinc-100"
    >
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Welcome message */}
        <div className="flex flex-col text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-sans">
            Welcome Back, Chef!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-1">
            Floura Kitchen pulse for today. Track inventory levels, prep lists, and scheduled dispatches.
          </p>
        </div>
      </div>

      {/* ================= MAIN DASHBOARD GRID ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main content area (Spans 2 columns on large screens) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* 1. TOP CARDS: Subject progress style widgets showing Floura metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Today's Profit */}
            <div
              onClick={() => onNavigate("orders")}
              className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-xs flex flex-col justify-between h-[130px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-950/50 shrink-0">
                  <TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <span className="text-xs font-bold text-zinc-750 dark:text-zinc-300 tracking-tight leading-tight">
                  Today's Profit
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {formatPrice(todayProfit)}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                    Margin {Math.round(averageProfitMarginPercent)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-sky-600 transition-all duration-550"
                    style={{ width: `${Math.round(averageProfitMarginPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Today's Deliveries */}
            <div
              onClick={() => onNavigate("orders")}
              className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-xs flex flex-col justify-between h-[130px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 shrink-0">
                  <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-zinc-750 dark:text-zinc-300 tracking-tight leading-tight">
                  Today's Deliveries
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {todayDeliveryCount}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                    {todayDeliveryCount === 0 ? "No dispatches" : `${todayDeliveryCount} due today`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-indigo-600 transition-all duration-550"
                    style={{ width: todayDeliveryCount > 0 ? "100%" : "0%" }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Daily Prep Checklist Overview */}
            <div
              onClick={() => onNavigate("checklist")}
              className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md dark:hover:shadow-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-xs flex flex-col justify-between h-[130px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-pink-50 dark:bg-pink-950/50 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <span className="text-xs font-bold text-zinc-750 dark:text-zinc-300 tracking-tight leading-tight">
                  Daily Prep Checklist
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {checklistPercent}%
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                    {completedChecklistCount}/{totalChecklistCount} Tasks
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-pink-600 transition-all duration-550"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* 2. SCHEDULE CARD: Dynamic Delivery Schedule (Filtered by selected Date) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-white font-sans tracking-tight">
                  My Schedule
                </h2>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">
                  Showing delivery timelines based on chosen date
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Selected Date Pick input */}
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 text-zinc-800 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                />
                <button 
                  onClick={() => onNavigate("orders-form")}
                  className="flex items-center justify-center w-7 h-7 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-750 rounded-lg text-zinc-650 dark:text-zinc-300 transition-all cursor-pointer active:scale-95"
                  title="New Order"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Delivery list container */}
            <div className="relative">
              {sortedScheduleOrders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedScheduleOrders.map((order, idx) => {
                    const colors = cardColorMap[idx % cardColorMap.length];
                    const statusInfo = getStatusColors(order.status);
                    
                    return (
                      <div
                        key={order.id}
                        onClick={() => onNavigate("orders")}
                        className="group bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-350 dark:hover:border-zinc-700/80 hover:shadow-xs active:scale-98 transition-all cursor-pointer relative overflow-hidden text-left"
                      >
                        {/* Status Accent Left Border Line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bar}`} />
                        
                        <div className="pl-1.5 space-y-3.5">
                          {/* Top row: Time and Status */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              <Clock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                              {order.deliveryTime || "04:00 pm"}
                            </span>
                            <span className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusInfo.bg}`}>
                              {order.status}
                            </span>
                          </div>

                          {/* Customer & Product details */}
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-150 leading-tight group-hover:text-primary-brand dark:group-hover:text-orange-400 transition-colors truncate">
                                {order.customerName}
                              </h4>
                              <span className="text-xs font-extrabold text-zinc-900 dark:text-white shrink-0">
                                {formatPrice(order.totalAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                              <span>{order.customerMobile}</span>
                              {order.eventType && (
                                <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 text-[9px] font-bold">
                                  {order.eventType}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Specs Section */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-semibold text-zinc-650 dark:text-zinc-400">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-xs">🍰</span>
                              <span className="truncate">{order.cakeFlavor}</span>
                            </div>
                            <span className="text-[10px] bg-zinc-100/60 dark:bg-zinc-800/40 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 font-bold shrink-0">
                              {order.cakeWeight}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Empty state visual showing no scheduled dispatches
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500">
                  <Calendar className="w-9 h-9 text-zinc-300 dark:text-zinc-800 mb-2" />
                  <p className="text-xs font-semibold">No deliveries scheduled on this date</p>
                  <p className="text-[10px] text-zinc-400/80 mt-1">Click the "+" icon above to schedule a dispatch.</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. SHOW: Daily Inventory Check list manager */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white font-sans tracking-tight">
                  Daily Inventory Check
                </h3>
                <p className="text-[10px] text-zinc-450 mt-0.5">Toggle prep items to update your local inventory checkoff</p>
              </div>
              <button 
                onClick={() => onNavigate("checklist")}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-350 cursor-pointer"
              >
                Manage Tasks
              </button>
            </div>

            {/* Checklist items list */}
            {todayMappedChecklist.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {todayMappedChecklist.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => onToggleChecklistItem(item.id, !item.checked, todayStr)}
                    className={`flex items-center gap-3 p-3 border rounded-2xl transition-all cursor-pointer select-none active:scale-98 ${
                      item.checked
                        ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-850 dark:text-emerald-300"
                        : "bg-zinc-50/30 dark:bg-zinc-900/20 border-zinc-150 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      item.checked
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}>
                      {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-semibold truncate flex-1 text-left ${item.checked ? "line-through opacity-70" : ""}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400 dark:text-zinc-600 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-zinc-300 dark:text-zinc-800 mb-2" />
                <p className="text-xs font-semibold">No prep checklist items scheduled for today</p>
                <button 
                  onClick={() => onNavigate("checklist")}
                  className="mt-2 text-[10px] font-bold text-amber-500 hover:underline"
                >
                  Create checklists
                </button>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar Panel (Stock alerts, Quick Actions, Upcoming Queue) */}
        <div className="space-y-6">
          
          {/* 1. SHOW: Low Stock Alerts widget */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white font-sans tracking-tight">
                Low Stock Alerts
              </h3>
              <button 
                onClick={() => onNavigate("inventory")}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-350 cursor-pointer"
              >
                Stock Room
              </button>
            </div>

            {/* Stock list */}
            {lowStockCount > 0 ? (
              <div className="space-y-2.5">
                {lowStockItems.slice(0, 5).map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => onNavigate("inventory")}
                    className="flex items-center justify-between p-2.5 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 truncate max-w-[130px] text-left">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        {item.quantity} {item.unit}
                      </span>
                      <p className="text-[8px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Min: {item.minStockLevel} {item.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-zinc-400 dark:text-zinc-600 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center mb-2">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <p className="text-xs font-semibold">Ingredient levels are healthy</p>
                <p className="text-[9px] text-zinc-400/80 mt-0.5">All stocks are above minimal levels.</p>
              </div>
            )}
          </div>

          {/* 2. SHOW: Quick Actions buttons */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white font-sans tracking-tight mb-4 text-left">
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Add Order */}
              <button
                onClick={() => onNavigate("orders-form")}
                className="group bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer text-center min-h-[90px]"
              >
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform group-hover:scale-105">
                  <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold tracking-tight">New Order</span>
              </button>

              {/* Add Stock */}
              <button
                onClick={() => onNavigate("inventory-form")}
                className="group bg-rose-500 hover:bg-rose-600 text-white rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer text-center min-h-[90px]"
              >
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform group-hover:scale-105">
                  <FolderPlus className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-bold tracking-tight">Add Stock</span>
              </button>

              {/* View Recipes */}
              <button
                onClick={() => onNavigate("recipes")}
                className="group bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer text-center min-h-[90px]"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-pink-950/40 flex items-center justify-center transition-transform group-hover:scale-105">
                  <BookOpen className="w-4 h-4 text-amber-600 dark:text-pink-400" />
                </div>
                <span className="text-[10px] font-bold tracking-tight">Recipes</span>
              </button>
            </div>
          </div>

          {/* 3. UPCOMING DELIVERIES QUEUE */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white font-sans tracking-tight">
                Upcoming Queue
              </h3>
              <button 
                onClick={() => onNavigate("orders")}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-350 cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Upcoming queue items */}
            <div className="space-y-3">
              {activeOrders.length > 0 ? (
                activeOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="p-3 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 rounded-2xl flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-start text-left">
                      <div>
                        <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                          {order.customerName}
                        </h4>
                        <p className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {order.cakeFlavor} Cake ({order.cakeWeight})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500">
                        {order.deliveryDate} at {order.deliveryTime || "04:00 pm"}
                      </span>

                      <button 
                        onClick={() => onNavigate("orders")}
                        className="flex items-center justify-center px-2 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 font-bold text-[9px] rounded-lg hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer shadow-xs"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-zinc-400 dark:text-zinc-600 flex flex-col items-center">
                  <Truck className="w-8 h-8 text-zinc-300 dark:text-zinc-800 mb-2" />
                  <p className="text-xs font-semibold">Production queue is empty</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
