import { useState, useEffect, useMemo } from "react";
import { type ChecklistItem, type Order } from "../types";
import { localDb } from "../db";
import { useQuery } from "@tanstack/react-query";

export interface UseDashboardProps {
  checklist?: ChecklistItem[];
}

export function useDashboard({ checklist }: UseDashboardProps) {


  const [todayStr, setTodayStr] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const updateToday = () => {
      const current = new Date().toISOString().split("T")[0];
      setTodayStr(current);
    };
    window.addEventListener("focus", updateToday);
    document.addEventListener("visibilitychange", updateToday);
    return () => {
      window.removeEventListener("focus", updateToday);
      document.removeEventListener("visibilitychange", updateToday);
    };
  }, []);



  const { data: checkerList = [] } = useQuery<ChecklistItem[]>({
    queryKey: ["dashboard", "checklist"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      return await localDb.checklist.query(
        "SELECT * FROM checklist WHERE isDeleted = 0 AND (date IS NULL OR date = '' OR date <= ?)",
        [today]
      );
    }
  });

  const todayMappedChecklist = useMemo(() => {
    return checkerList
      .filter((item) => !item.date || item.date <= todayStr)
      .map((item) => {
        const isChecked = item.completedDates && Array.isArray(item.completedDates)
          ? item.completedDates.includes(todayStr)
          : (item.date === todayStr ? !!item.checked : false);
        return {
          ...item,
          checked: isChecked,
        };
      });
  }, [checkerList, todayStr]);

  const { data: stats = {
    totalUnits: 0,
    progressPercent: 0,
    productionCountCompleted: 0,
    productionCountProgress: 0,
    activeOrdersCount: 0,
    lowStockCount: 0,
    totalNetProfit: 0,
    averageProfitMarginPercent: 0,
    activeOrders: [] as Order[],
    todayProfit: 0,
    todayDeliveryCount: 0,
    todayTotalDeliveryCount: 0,
    todayCompletedDeliveryCount: 0,
    lowStockItems: [] as { name: string; quantity: number; unit: string; minStockLevel: number }[],
  } } = useQuery({
    queryKey: ["dashboard", "stats", todayStr],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [
        completedOrdersMetrics,
        activeOrders,
        todayDeliveries,
        lowStockRaw
      ] = await Promise.all([
        localDb.orders.query("SELECT profitAmount, totalAmount, status FROM orders WHERE isDeleted = 0 AND status != 'Cancelled'"),
        localDb.orders.query(
          "SELECT id, customerName, customerMobile, eventType, totalAmount, status, cakeFlavor, cakeWeight, deliveryDate, deliveryTime, eventDate FROM orders WHERE isDeleted = 0 AND status != 'Cancelled' AND (status != 'Completed' OR deliveryDate = ?) ORDER BY eventDate ASC",
          [today]
        ),
        localDb.orders.query("SELECT profitAmount, status FROM orders WHERE isDeleted = 0 AND deliveryDate = ?", [today]),
        localDb.inventory.query("SELECT name, quantity, unit, minStockLevel FROM inventory WHERE isDeleted = 0 AND quantity < minStockLevel")
      ]);

      const completedOrders = completedOrdersMetrics.filter((o: any) => o.status === "Completed");
      const progressOrders = completedOrdersMetrics.filter((o: any) => o.status !== "Completed");

      const productionCountCompleted = completedOrders.length;
      const productionCountProgress = progressOrders.length;
      const totalUnits = productionCountCompleted + productionCountProgress;
      const progressPercent = totalUnits > 0 ? (productionCountCompleted / totalUnits) * 100 : 0;

      const activeOrdersCount = progressOrders.length;

      const lowStockCount = lowStockRaw.length;
      const lowStockItems = lowStockRaw.map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        minStockLevel: i.minStockLevel,
      }));

      const totalNetProfit = completedOrders.reduce((acc, o: any) => acc + (o.profitAmount || 0), 0);
      const totalBilled = completedOrders.reduce((acc, o: any) => acc + o.totalAmount, 0);
      const averageProfitMarginPercent = totalBilled > 0 ? (totalNetProfit / totalBilled) * 100 : 0;

      const activeToday = todayDeliveries.filter((o: any) => o.status !== "Cancelled");
      const todayTotalDeliveryCount = activeToday.length;
      const todayCompletedDeliveryCount = activeToday.filter((o: any) => o.status === "Completed").length;
      const todayPendingDeliveryCount = activeToday.filter((o: any) => o.status !== "Completed").length;

      const todayProfit = todayDeliveries
        .filter((o: any) => o.status === "Completed")
        .reduce((acc, o: any) => acc + (o.profitAmount || 0), 0);

      return {
        totalUnits,
        progressPercent,
        productionCountCompleted,
        productionCountProgress,
        activeOrdersCount,
        lowStockCount,
        totalNetProfit,
        averageProfitMarginPercent,
        activeOrders,
        todayProfit,
        todayDeliveryCount: todayPendingDeliveryCount,
        todayTotalDeliveryCount,
        todayCompletedDeliveryCount,
        lowStockItems,
      };
    }
  });

  return {
    ...stats,
    todayMappedChecklist,
    todayStr,
  };
}
