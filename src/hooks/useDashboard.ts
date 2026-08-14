import { useState, useEffect, useMemo } from "react";
import { type ChecklistItem, type Order } from "../types";
import { localDb } from "../db";

export interface UseDashboardProps {
  checklist: ChecklistItem[];
}

export function useDashboard({ checklist }: UseDashboardProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todayMappedChecklist = useMemo(() => {
    if (!checklist) return [];
    return checklist
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
  }, [checklist, todayStr]);

  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  const [stats, setStats] = useState({
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
    lowStockItems: [] as { name: string; quantity: number; unit: string; minStockLevel: number }[],
  });

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const today = new Date().toISOString().split("T")[0];

        const [allOrders, lowStockRaw] = await Promise.all([
          localDb.orders.filter(o => o.isDeleted !== 1).toArray(),
          localDb.inventory.filter((i: any) => i.isDeleted !== 1 && i.quantity < i.minStockLevel).toArray()
        ]);

        const completedOrders = allOrders.filter((o) => o.status === "Completed");
        const progressOrders = allOrders.filter((o) => o.status === "Pending");

        const productionCountCompleted = completedOrders.length;
        const productionCountProgress = progressOrders.length;
        const totalUnits = productionCountCompleted + productionCountProgress;
        const progressPercent = totalUnits > 0 ? (productionCountCompleted / totalUnits) * 100 : 0;

        const activeOrdersCount = progressOrders.length;

        const lowStockCount = lowStockRaw.length;
        const lowStockItems = lowStockRaw.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          minStockLevel: i.minStockLevel,
        }));

        const totalNetProfit = completedOrders.reduce((acc, o) => acc + (o.profitAmount || 0), 0);
        const totalBilled = completedOrders.reduce((acc, o) => acc + o.totalAmount, 0);
        const averageProfitMarginPercent = totalBilled > 0 ? (totalNetProfit / totalBilled) * 100 : 0;

        // Today-scoped stats: orders whose deliveryDate is today
        const todayDeliveries = allOrders.filter(
          (o) => o.deliveryDate === today && o.isDeleted !== 1
        );
        const todayDeliveryCount = todayDeliveries.length;
        const todayProfit = todayDeliveries
          .filter((o) => o.status === "Completed")
          .reduce((acc, o) => acc + (o.profitAmount || 0), 0);

        const activeOrders = allOrders
          .filter((o) => o.status !== "Completed" && o.status !== "Cancelled")
          .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

        setStats({
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
          todayDeliveryCount,
          lowStockItems,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats from localDb:", err);
      }
    }
    fetchDashboardStats();
  }, [refreshTrigger]);

  return {
    ...stats,
    todayMappedChecklist,
    refreshTrigger,
    todayStr,
  };
}
