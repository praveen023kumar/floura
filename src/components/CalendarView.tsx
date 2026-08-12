// File Path: /src/components/CalendarView.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  User,
  Trash2,
  Plus,
  Send,
  History,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type Order, type Customer, type CustomScheduledAlert, type DispatchedNotification } from "../types";
import { formatPrice, formatDate } from "../utils/format";
import { localDb } from "../db";

import { useCalendar } from "../hooks/useCalendar";

interface CalendarViewProps {
  onUpdateOrderStatus?: (id: string, status: Order["status"]) => Promise<void> | void;
  dispatchedLogs?: DispatchedNotification[];
  scheduledAlerts?: CustomScheduledAlert[];
  onAddScheduledAlert?: (alert: CustomScheduledAlert) => Promise<void>;
  onDeleteScheduledAlert?: (id: string) => Promise<void>;
  onAddDispatchedNotification?: (notif: DispatchedNotification) => Promise<void>;
  onClearDispatchedNotifications?: () => Promise<void>;
  // For backwards compatibility
  customEvents?: any[];
  onAddCustomEvent?: any;
  onDeleteCustomEvent?: any;
}

export default function CalendarView({
  onUpdateOrderStatus,
  dispatchedLogs: propDispatchedLogs,
  scheduledAlerts: propScheduledAlerts,
  onAddScheduledAlert,
  onDeleteScheduledAlert,
  onAddDispatchedNotification,
  onClearDispatchedNotifications
}: CalendarViewProps) {
  const navigate = useNavigate();
  const {
    orders,
    customers,
    refreshTrigger,
    currentDate,
    setCurrentDate,
    selectedDateStr,
    setSelectedDateStr,
    scheduledAlerts,
    dispatchedLogs,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    setupForm,
    setSetupForm,
    setupFormSuccess,
    reminderModal,
    setReminderModal,
    monthNames,
    handlePrevMonth,
    handleNextMonth,
    calendarDays,
    ordersByDateStr,
    scheduledAlertsByDateStr,
    ordersOnSelectedDate,
    scheduledAlertsOnSelectedDate,
    repeatingOpportunities,
    handleCreateCustomSetup,
    handleRemoveScheduledAlert,
    handleNotifyCustomer,
    handleNotifyCustomSetup,
    executeSendMockNotification,
    clearNotificationLogs,
  } = useCalendar({
    onUpdateOrderStatus,
    dispatchedLogs: propDispatchedLogs,
    scheduledAlerts: propScheduledAlerts,
    onAddScheduledAlert,
    onDeleteScheduledAlert,
    onAddDispatchedNotification,
    onClearDispatchedNotifications,
  });


  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 text-left" id="calendar-operations-view">
      
      {/* View Header Redesigned like Daily Kitchen Checklist */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-serif font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary-brand dark:text-orange-400" />
            Calendar & Custom Setup Hub
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Configure custom setup alerts, view scheduled cake deliveries, and manage your bakery timeline.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-primary-brand hover:opacity-90 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Schedule Setup Alert
          </button>
          <span className="text-xs bg-white dark:bg-zinc-800 px-4 py-2.5 rounded-xl border border-zinc-150 dark:border-zinc-700/60 font-semibold font-mono shadow-xs text-zinc-650 dark:text-zinc-400">
            📅 {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* Full-width Interactive Calendar Matrix */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150/50 dark:border-zinc-800 rounded-3xl p-6 shadow-xs mb-10">
        
        {/* Monthly header navigation */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold font-serif text-zinc-850 dark:text-zinc-100">
              Cake Bookings & Custom Setups
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Click any calendar date cell to inspect deliveries, view orders, or manage setup alerts in detail.</p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700 self-start sm:self-center">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-zinc-750 dark:text-zinc-200 min-w-28 text-center font-mono uppercase tracking-wider">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day column names */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
            <div key={dayName} className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider py-1 font-mono">
              {dayName}
            </div>
          ))}
        </div>

        {/* Day cells matrix */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((cell, idx) => {
            const dayOrders = ordersByDateStr[cell.dateStr] || [];
            const dayScheduledAlerts = scheduledAlertsByDateStr[cell.dateStr] || [];
            const repeatedEvents = dayScheduledAlerts.filter(a => !a.type || a.type === "repeated event");
            const onceAlerts = dayScheduledAlerts.filter(a => a.type === "once alert");
            
            const isSelected = selectedDateStr === cell.dateStr;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedDateStr(cell.dateStr);
                  setIsDetailModalOpen(true);
                }}
                className={`min-h-[85px] md:min-h-[110px] w-full p-2 rounded-2xl flex flex-col justify-between items-start border cursor-pointer relative transition-all duration-150 ${
                  !cell.isCurrentMonth
                    ? "text-zinc-350 dark:text-zinc-650 font-normal hover:bg-zinc-50/20 dark:hover:bg-zinc-950/10 border-transparent opacity-40"
                    : isSelected
                    ? "bg-primary-brand text-white border-primary-brand font-bold shadow-md shadow-primary-brand/15 dark:bg-orange-500 dark:border-orange-500"
                    : "bg-white dark:bg-zinc-850 font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-100 dark:border-zinc-800"
                }`}
              >
                <span className="text-xs font-mono font-bold leading-none">{cell.dayNum}</span>

                {/* Stack of indicators inside day blocks */}
                <div className="w-full flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                  {/* Desktop layout: show small text badges with delivery time */}
                  <div className="hidden md:flex flex-col gap-0.5 w-full text-[9px] font-semibold leading-tight mt-0.5">
                    {dayOrders.slice(0, 2).map((co, cidx) => (
                      <div
                        key={`text-o-${cidx}`}
                        className={`px-1.5 py-0.5 rounded-md text-left truncate w-full flex items-center justify-between gap-1 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : co.status === "Pending"
                            ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/10"
                            : co.status === "Ready for Pickup"
                            ? "bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/10"
                            : co.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/10"
                            : "bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/10"
                        }`}
                        title={`Order: ${co.customerName} (${co.status}) - Delivery: ${co.deliveryTime || "N/A"}`}
                      >
                        <span className="truncate">{co.customerName}</span>
                        <span className="font-bold opacity-80 shrink-0">{co.deliveryTime || "09:00"}</span>
                      </div>
                    ))}
                    {repeatedEvents.slice(0, 1).map((ca, caIdx) => (
                      <div
                        key={`text-re-${caIdx}`}
                        className={`px-1.5 py-0.5 rounded-md text-left truncate w-full flex items-center gap-0.5 ${
                          isSelected ? "bg-white/20 text-white" : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/10"
                        }`}
                        title={`Repeated Event: ${ca.customerName}`}
                      >
                        <span className="shrink-0">🔄</span> <span className="truncate">{ca.customerName}</span>
                      </div>
                    ))}
                    {onceAlerts.slice(0, 1).map((ca, caIdx) => (
                      <div
                        key={`text-oa-${caIdx}`}
                        className={`px-1.5 py-0.5 rounded-md text-left truncate w-full flex items-center gap-0.5 ${
                          isSelected ? "bg-white/20 text-white" : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/10"
                        }`}
                        title={`Once Alert: ${ca.customerName}`}
                      >
                        <span className="shrink-0">📍</span> <span className="truncate">{ca.customerName}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mobile layout: show tiny dots */}
                  <div className="flex md:hidden flex-wrap gap-1 justify-start">
                    {dayOrders.slice(0, 3).map((co, cidx) => (
                      <span
                        key={`o-${cidx}`}
                        className={`w-1.5 h-1.5 rounded-full ${
                          co.status === "Pending"
                            ? "bg-amber-500 dark:bg-amber-400"
                            : co.status === "Ready for Pickup"
                            ? "bg-teal-500 dark:bg-teal-400"
                            : co.status === "Completed"
                            ? "bg-emerald-500 dark:bg-emerald-400"
                            : "bg-blue-500 dark:bg-blue-400"
                        }`}
                        title={`Order: ${co.customerName} (${co.status})`}
                      />
                    ))}
                    {repeatedEvents.slice(0, 2).map((ca, caIdx) => (
                      <span
                        key={`re-${caIdx}`}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"
                        title={`Repeated Event: ${ca.customerName}`}
                      />
                    ))}
                    {onceAlerts.slice(0, 2).map((ca, caIdx) => (
                      <span
                        key={`oa-${caIdx}`}
                        className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400"
                        title={`Once Alert: ${ca.customerName}`}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend Indicator */}
        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap gap-4 text-[10px] text-zinc-400 font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400"></span> Pending Orders
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 dark:bg-teal-400"></span> Ready Delivery
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> Completed Cakes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 dark:bg-indigo-400"></span> Repeated Events
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 dark:bg-rose-400"></span> Once Alerts
          </span>
        </div>

      </div>

      {/* Date Details Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedDateStr && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="date-detail-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-xl w-full shadow-2xl text-left border border-zinc-150/40 dark:border-zinc-800 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider font-mono">Selected Date</span>
                  <h4 className="text-base font-serif font-extrabold text-zinc-850 dark:text-zinc-100">
                    {new Date(selectedDateStr + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </h4>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-6">
                
                {/* Orders / Deliveries */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Sweet Deliveries ({ordersOnSelectedDate.length})</h5>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        navigate("/orders/new", { state: { prepopulatedDate: selectedDateStr } });
                      }}
                      className="text-[10px] text-primary-brand dark:text-orange-400 hover:opacity-85 font-bold flex items-center gap-0.5 cursor-pointer"
                      title="Create dynamic order on this date"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Order</span>
                    </button>
                  </div>

                  {ordersOnSelectedDate.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {ordersOnSelectedDate.map((o) => (
                        <div key={o.id} className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-2xl bg-zinc-50/40 dark:bg-zinc-850/60 shadow-2xs">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[9px] font-mono text-zinc-400">#{o.id}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              o.status === "Pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" :
                              o.status === "Ready for Pickup" ? "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400" :
                              o.status === "Completed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" :
                              o.status === "Cancelled" ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400" :
                              "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400"
                            }`}>{o.status}</span>
                          </div>
                          <h6 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 mt-1">{o.customerName}</h6>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{o.cakeFlavor} • {o.layers}</p>
                          <div className="mt-1 flex justify-between items-center text-[9px] text-zinc-500 font-medium">
                            <span>Delivery @ {o.deliveryTime}</span>
                            <span className="text-primary-brand dark:text-orange-400 font-bold">{formatPrice(o.totalAmount)}</span>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-zinc-150/40 dark:border-zinc-800/60 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setIsDetailModalOpen(false);
                                navigate("/orders", { state: { highlightOrderId: o.id } });
                              }}
                              className="text-[9px] font-bold text-primary-brand dark:text-orange-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Details</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No customer orders scheduled on this date.</p>
                  )}
                </div>

                {/* Custom Scheduled Setups */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Custom Setups ({scheduledAlertsOnSelectedDate.length})</h5>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setIsCreateModalOpen(true);
                      }}
                      className="text-[10px] text-primary-brand dark:text-orange-400 hover:opacity-85 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Configure Setup</span>
                    </button>
                  </div>

                  {scheduledAlertsOnSelectedDate.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {scheduledAlertsOnSelectedDate.map((alert) => {
                        const isOnce = alert.type === "once alert";
                        return (
                          <div key={alert.id} className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-2xl bg-zinc-50/40 dark:bg-zinc-850/60 flex justify-between items-start gap-2 shadow-2xs">
                            <div className="flex-1 min-w-0">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                                isOnce
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                              }`}>
                                {alert.type || "repeated event"}
                              </span>
                              <h6 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 mt-1.5">{alert.customerName}</h6>
                              {alert.notes && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic mt-0.5">"{alert.notes}"</p>}
                              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium font-mono">{alert.customerMobile}</p>
                            </div>
                            <div className="flex flex-col gap-1.5 justify-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleNotifyCustomSetup(alert)}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-primary-brand dark:text-orange-400 transition-colors cursor-pointer flex items-center justify-center"
                                title="Draft setup reminder alert"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveScheduledAlert(alert.id)}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center justify-center"
                                title="Delete custom setup"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No custom repeated events or once alerts scheduled.</p>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="mt-6 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-750 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messaging Template Reminder Modal */}
      {reminderModal && reminderModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl text-left border border-zinc-150/40 dark:border-zinc-800"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 font-serif flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary-brand" />
                Draft Anniversary Invitation
              </h4>
              <button
                onClick={() => setReminderModal(null)}
                className="text-zinc-400 hover:text-zinc-650 p-1 rounded-full hover:bg-zinc-100/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500 mb-3 block leading-relaxed">
              Prepare dynamic reminder templates for <strong>{reminderModal.customerName}</strong> about their milestone reservation for custom cake order <strong>({reminderModal.cakeSpec})</strong>.
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-xl p-3 mb-4 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Message Template Body</span>
              <textarea
                rows={6}
                value={reminderModal.prefilledText}
                onChange={(e) => setReminderModal({ ...reminderModal, prefilledText: e.target.value })}
                className="w-full text-xs bg-transparent text-zinc-700 dark:text-zinc-200 outline-none resize-none border-none p-0 focus:ring-0 leading-relaxed font-sans"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setReminderModal(null)}
                className="border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 py-2 px-4 rounded-xl text-xs hover:bg-zinc-100/50 cursor-pointer"
              >
                Cancel Draft
              </button>
              <button
                onClick={executeSendMockNotification}
                className="bg-primary-brand text-white dark:bg-orange-500 py-2 px-4 rounded-xl text-xs font-bold hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Dispatch Notification</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bottom Sheet Modal for Creating Custom Setup */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center" id="custom-setup-bottom-sheet">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Slide-up Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-[32px] shadow-2xl border-t border-zinc-200 dark:border-zinc-850 p-6 z-10 max-h-[85vh] overflow-y-auto pb-8"
            >
              {/* Pill Drag Handle Indicator */}
              <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-5" />
              
              {/* Header */}
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-base font-serif font-extrabold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Configure Custom Setup
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Scheduling custom setup alert for <strong className="text-zinc-700 dark:text-zinc-200">{setupForm.alertDate || selectedDateStr}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateCustomSetup} className="space-y-4 text-left">
                {/* Link customer dropdown */}
                {customers && customers.length > 0 && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1.5 font-mono">
                      Link Existing Customer (Optional)
                    </label>
                    <select
                      onChange={(e) => {
                        const selectedCust = customers.find(c => c.id === e.target.value);
                        if (selectedCust) {
                          setSetupForm(prev => ({
                            ...prev,
                            customerName: selectedCust.name,
                            customerMobile: selectedCust.mobile || ""
                          }));
                        }
                      }}
                      className="w-full text-xs p-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl outline-none focus:ring-1 focus:ring-primary-brand cursor-pointer"
                    >
                      <option value="">-- Choose Existing Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.mobile ? `(${c.mobile})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Alert Date */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1.5 font-mono">
                    Alert / Event Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={setupForm.alertDate}
                    onChange={(e) => setSetupForm({ ...setupForm, alertDate: e.target.value })}
                    className="w-full text-xs p-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-2xl outline-none focus:ring-1 focus:ring-primary-brand"
                  />
                </div>

                {/* Customer Name */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1.5 font-mono font-serif">
                    Customer Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={setupForm.customerName}
                    onChange={(e) => setSetupForm({ ...setupForm, customerName: e.target.value })}
                    className="w-full text-xs p-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl outline-none focus:ring-1 focus:ring-primary-brand"
                  />
                </div>

                {/* Contact Mobile */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1.5 font-mono">
                    Customer Mobile Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-0199"
                    value={setupForm.customerMobile}
                    onChange={(e) => setSetupForm({ ...setupForm, customerMobile: e.target.value })}
                    className="w-full text-xs p-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl outline-none focus:ring-1 focus:ring-primary-brand"
                  />
                </div>

                {/* Setup Type */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1.5 font-mono">
                    Setup Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSetupForm({ ...setupForm, type: "repeated event" })}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        setupForm.type === "repeated event"
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-400 dark:text-indigo-350"
                          : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700"
                      }`}
                    >
                      <span className="font-extrabold text-xs">🔄 Repeated Event</span>
                      <span className="text-[9px] font-normal opacity-75">Recurring annually</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSetupForm({ ...setupForm, type: "once alert" })}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        setupForm.type === "once alert"
                          ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:border-rose-400 dark:text-rose-350"
                          : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700"
                      }`}
                    >
                      <span className="font-extrabold text-xs">📍 Once Alert</span>
                      <span className="text-[9px] font-normal opacity-75">Single occurrence</span>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1.5 font-mono">
                    Reminding Notes / Specifications
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Deliver 12 bespoke cupcakes with pearl icing for wedding rehearsal..."
                    value={setupForm.notes}
                    onChange={(e) => setSetupForm({ ...setupForm, notes: e.target.value })}
                    className="w-full text-xs p-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl outline-none focus:ring-1 focus:ring-primary-brand resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-2xl text-xs font-bold hover:bg-zinc-150/20 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-brand text-white dark:bg-orange-500 rounded-2xl text-xs font-bold hover:opacity-90 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Create Setup</span>
                  </button>
                </div>

                {setupFormSuccess && (
                  <span className="text-[10px] text-emerald-600 font-semibold block text-center mt-2 animate-pulse">
                    ✓ Custom setup configured successfully!
                  </span>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
