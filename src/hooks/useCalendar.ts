import React, { useState, useMemo, useEffect } from "react";
import { type Order, type Customer, type CustomScheduledAlert, type DispatchedNotification } from "../types";
import { localDb } from "../db";

export interface UseCalendarProps {
  onUpdateOrderStatus?: (id: string, status: Order["status"]) => Promise<void> | void;
  dispatchedLogs?: DispatchedNotification[];
  scheduledAlerts?: CustomScheduledAlert[];
  onAddScheduledAlert?: (alert: CustomScheduledAlert) => Promise<void>;
  onDeleteScheduledAlert?: (id: string) => Promise<void>;
  onAddDispatchedNotification?: (notif: DispatchedNotification) => Promise<void>;
  onClearDispatchedNotifications?: () => Promise<void>;
}

export function useCalendar({
  onUpdateOrderStatus,
  dispatchedLogs: propDispatchedLogs,
  scheduledAlerts: propScheduledAlerts,
  onAddScheduledAlert,
  onDeleteScheduledAlert,
  onAddDispatchedNotification,
  onClearDispatchedNotifications,
}: UseCalendarProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(new Date().toISOString().slice(0, 10));

  const [scheduledAlerts, setScheduledAlerts] = useState<CustomScheduledAlert[]>([]);
  const [dispatchedLogs, setDispatchedLogs] = useState<DispatchedNotification[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [setupForm, setSetupForm] = useState({
    customerName: "",
    customerMobile: "",
    notes: "",
    type: "repeated event" as "repeated event" | "once alert",
    alertDate: ""
  });
  const [setupFormSuccess, setSetupFormSuccess] = useState(false);

  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean;
    customerName: string;
    customerMobile: string;
    cakeSpec: string;
    prefilledText: string;
  } | null>(null);

  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const targetYear = currentDate.getFullYear();
        const targetMonth = currentDate.getMonth();
        const yearMonthPrefix = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;

        const [loadedOrders, loadedCustomers] = await Promise.all([
          localDb.orders.filter(o => o.isDeleted !== 1).toArray(),
          localDb.customers.filter(c => c.isDeleted !== 1).limit(200).toArray()
        ]);
        setOrders(loadedOrders);
        setCustomers(loadedCustomers);
      } catch (err) {
        console.error("Failed to load calendar data from localDb:", err);
      }
    }
    loadData();
  }, [refreshTrigger, currentDate]);

  useEffect(() => {
    if (selectedDateStr) {
      setSetupForm(prev => ({
        ...prev,
        alertDate: selectedDateStr
      }));
    }
  }, [selectedDateStr]);

  useEffect(() => {
    if (propDispatchedLogs) {
      setDispatchedLogs(propDispatchedLogs);
    }
  }, [propDispatchedLogs]);

  useEffect(() => {
    if (propScheduledAlerts) {
      setScheduledAlerts(propScheduledAlerts);
    }
  }, [propScheduledAlerts]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; dayNum: number }[] = [];

    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const priorDate = new Date(year, month - 1, d);
      const str = priorDate.toISOString().slice(0, 10);
      days.push({
        date: priorDate,
        dateStr: str,
        isCurrentMonth: false,
        dayNum: d,
      });
    }

    for (let d = 1; d <= totalDays; d++) {
      const currDate = new Date(year, month, d);
      const mmStr = String(month + 1).padStart(2, "0");
      const ddStr = String(d).padStart(2, "0");
      const str = `${year}-${mmStr}-${ddStr}`;
      days.push({
        date: currDate,
        dateStr: str,
        isCurrentMonth: true,
        dayNum: d,
      });
    }

    const totalCells = 42;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const str = nextDate.toISOString().slice(0, 10);
      days.push({
        date: nextDate,
        dateStr: str,
        isCurrentMonth: false,
        dayNum: d,
      });
    }

    return days;
  }, [currentDate]);

  const ordersByDateStr = useMemo(() => {
    const map: Record<string, Order[]> = {};
    orders.forEach((o) => {
      const dateKey = o.deliveryDate || o.eventDate;
      if (dateKey) {
        if (!map[dateKey]) {
          map[dateKey] = [];
        }
        map[dateKey].push(o);
      }
    });
    return map;
  }, [orders]);

  const scheduledAlertsByDateStr = useMemo(() => {
    const map: Record<string, CustomScheduledAlert[]> = {};
    
    calendarDays.forEach((cell) => {
      const [, cellMonth, cellDay] = cell.dateStr.split("-");
      
      scheduledAlerts.forEach((alert) => {
        if (alert.alertDate) {
          const [, alertMonth, alertDay] = alert.alertDate.split("-");
          
          if (alert.type === "repeated event") {
            if (cellMonth === alertMonth && cellDay === alertDay) {
              if (!map[cell.dateStr]) {
                map[cell.dateStr] = [];
              }
              if (!map[cell.dateStr].some(a => a.id === alert.id)) {
                map[cell.dateStr].push(alert);
              }
            }
          } else {
            if (cell.dateStr === alert.alertDate) {
              if (!map[cell.dateStr]) {
                map[cell.dateStr] = [];
              }
              if (!map[cell.dateStr].some(a => a.id === alert.id)) {
                map[cell.dateStr].push(alert);
              }
            }
          }
        }
      });
    });
    
    return map;
  }, [scheduledAlerts, calendarDays]);

  const ordersOnSelectedDate = useMemo(() => {
    if (!selectedDateStr) return [];
    return ordersByDateStr[selectedDateStr] || [];
  }, [selectedDateStr, ordersByDateStr]);

  const scheduledAlertsOnSelectedDate = useMemo(() => {
    if (!selectedDateStr) return [];
    return scheduledAlertsByDateStr[selectedDateStr] || [];
  }, [selectedDateStr, scheduledAlertsByDateStr]);

  const repeatingOpportunities = useMemo(() => {
    const currentMonthIndex = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const opportunities: {
      customerId: string;
      customerName: string;
      customerMobile: string;
      lastYearOrderDate: string;
      originalYear: number;
      cakeFlavor: string;
      layers: string;
      originalOrderId: string;
    }[] = [];

    const seenCustomers = new Set<string>();

    orders.forEach((o) => {
      if (!o.eventDate) return;
      const [oYear, oMonth] = o.eventDate.split("-").map(Number);
      
      if (oMonth === currentMonthIndex && oYear < currentYear) {
        if (o.eventType && (
          o.eventType.toLowerCase().includes("corporate") ||
          o.eventType.toLowerCase().includes("corp")
        )) {
          return;
        }

        const uniqueKey = `${o.customerName}-${o.eventDate}`;
        if (!seenCustomers.has(uniqueKey)) {
          seenCustomers.add(uniqueKey);
          opportunities.push({
            customerId: o.customerId || "guest",
            customerName: o.customerName,
            customerMobile: o.customerMobile || "No phone listed",
            lastYearOrderDate: o.eventDate,
            originalYear: oYear,
            cakeFlavor: o.cakeFlavor || "Signature Cake",
            layers: o.layers || "Single Tier",
            originalOrderId: o.id,
          });
        }
      }
    });

    return opportunities;
  }, [orders, currentDate]);

  const handleCreateCustomSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetDate = setupForm.alertDate || selectedDateStr;
    if (!targetDate) {
      window.showToast?.("Please select or enter a date first", "warning");
      return;
    }
    if (!setupForm.customerName) {
      window.showToast?.("Please supply Customer Name", "warning");
      return;
    }

    const newAlert: CustomScheduledAlert = {
      id: "sch-" + Math.random().toString(36).substring(2, 9),
      customerName: setupForm.customerName,
      customerMobile: setupForm.customerMobile || "N/A",
      alertDate: targetDate,
      notes: setupForm.notes,
      type: setupForm.type,
      createdAt: new Date().toISOString()
    };

    if (onAddScheduledAlert) {
      await onAddScheduledAlert(newAlert);
    } else {
      setScheduledAlerts((prev) => [newAlert, ...prev]);
    }

    setSetupFormSuccess(true);
    window.showToast?.(`✓ Custom ${setupForm.type} scheduled successfully!`, "success");

    setTimeout(() => {
      setSetupFormSuccess(false);
      setIsCreateModalOpen(false);
      setSetupForm({
        customerName: "",
        customerMobile: "",
        notes: "",
        type: "repeated event",
        alertDate: selectedDateStr || ""
      });
    }, 1000);
  };

  const handleRemoveScheduledAlert = (id: string) => {
    if (confirm("Delete this scheduled alert/event?")) {
      if (onDeleteScheduledAlert) {
        onDeleteScheduledAlert(id);
      } else {
        setScheduledAlerts((prev) => prev.filter((a) => a.id !== id));
      }
      window.showToast?.("Scheduled setup successfully deleted", "info");
    }
  };

  const handleNotifyCustomer = (opp: { customerName: string; customerMobile: string; cakeFlavor: string; lastYearOrderDate: string; layers: string }) => {
    const text = `Hello ${opp.customerName}! We hope you had a fabulous celebration last year. Floura noticed it's nearly been a year since your custom ${opp.cakeFlavor} cake delivery on ${opp.lastYearOrderDate}! Would you like to reserve a customized cake with us again for this upcoming date? Let us know to secure your booking slot! 🌸`;
    
    setReminderModal({
      isOpen: true,
      customerName: opp.customerName,
      customerMobile: opp.customerMobile,
      cakeSpec: `${opp.layers} ${opp.cakeFlavor}`,
      prefilledText: text,
    });
  };

  const handleNotifyCustomSetup = (alert: CustomScheduledAlert) => {
    const titleText = alert.type === "once alert" ? "Once Alert" : "Repeated Event";
    const text = `Hello ${alert.customerName}! Friendly reminder from our Floura bakery kitchen regarding your upcoming scheduled ${titleText} on ${selectedDateStr}. Details: ${alert.notes || "Ready for processing."} Please reply back if you need any adjustments! 🍰`;

    setReminderModal({
      isOpen: true,
      customerName: alert.customerName,
      customerMobile: alert.customerMobile,
      cakeSpec: `${titleText}: ${alert.notes ? alert.notes.substring(0, 30) + "..." : "Custom Specialty"}`,
      prefilledText: text,
    });
  };

  const executeSendMockNotification = () => {
    if (!reminderModal) return;

    const newLog: DispatchedNotification = {
      id: "notif-" + Math.random().toString(36).substring(2, 9),
      customerName: reminderModal.customerName,
      customerMobile: reminderModal.customerMobile,
      cakeSpec: reminderModal.cakeSpec,
      messageText: reminderModal.prefilledText,
      dispatchedAt: new Date().toISOString(),
      status: "Sent"
    };

    if (onAddDispatchedNotification) {
      onAddDispatchedNotification(newLog);
    } else {
      setDispatchedLogs((prev) => [newLog, ...prev]);
    }

    window.showToast?.(`✓ Notification template dispatched to ${reminderModal.customerName}!`, "success");
    setReminderModal(null);
  };

  const clearNotificationLogs = () => {
    if (confirm("Are you sure you want to clear your dispatch outbox history?")) {
      if (onClearDispatchedNotifications) {
        onClearDispatchedNotifications();
      } else {
        setDispatchedLogs([]);
      }
      window.showToast?.("Notification outbox logs cleared.", "info");
    }
  };

  return {
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
  };
}
