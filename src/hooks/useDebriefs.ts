import { useState, useEffect, useMemo } from "react";
import { type Order } from "../types";
import { localDb } from "../db";

export type SortOption = "date-desc" | "date-asc" | "profit-desc" | "profit-asc" | "sales-desc" | "sales-asc";
export type LogFilterType = "all" | "difficulties" | "costs";

export function useDebriefs() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterLogType, setFilterLogType] = useState<LogFilterType>("all");

  const [debriefsCurrentPage, setDebriefsCurrentPage] = useState<number>(1);
  const [debriefsItemsPerPage, setDebriefsItemsPerPage] = useState<number>(10);

  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  useEffect(() => {
    async function loadOrders() {
      try {
        const loaded = await localDb.orders
          .filter(o => o.status === "Completed" && o.isDeleted !== 1)
          .toArray();
        setOrders(loaded);
      } catch (err) {
        console.error("Failed to load completed orders in DebriefsView:", err);
      }
    }
    loadOrders();
  }, [refreshTrigger]);

  const completedOrders = useMemo(() => {
    return orders;
  }, [orders]);

  const filteredCompletedOrders = useMemo(() => {
    return completedOrders.filter((o) => {
      if (selectedFlavor && o.cakeFlavor !== selectedFlavor) {
        return false;
      }
      if (startDate && o.eventDate < startDate) {
        return false;
      }
      if (endDate && o.eventDate > endDate) {
        return false;
      }
      const matchSearch =
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.eventType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cakeFlavor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.profitCostGoing?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.profitDifficulties?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [completedOrders, searchTerm, selectedFlavor, startDate, endDate]);

  const metrics = useMemo(() => {
    const totalProfit = filteredCompletedOrders.reduce((acc, o) => acc + (o.profitAmount || 0), 0);
    const totalSales = filteredCompletedOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const averageMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    const averageProfitPerOrder = filteredCompletedOrders.length > 0 ? totalProfit / filteredCompletedOrders.length : 0;
    
    const flavorData: Record<string, { profit: number; sales: number; count: number }> = {};
    let difficultyBakesCount = 0;
    let costBakesCount = 0;

    filteredCompletedOrders.forEach(o => {
      const flavor = o.cakeFlavor || "Unknown";
      if (!flavorData[flavor]) {
        flavorData[flavor] = { profit: 0, sales: 0, count: 0 };
      }
      flavorData[flavor].profit += (o.profitAmount || 0);
      flavorData[flavor].sales += o.totalAmount;
      flavorData[flavor].count += 1;

      const hasDiff = o.profitDifficulties && o.profitDifficulties.trim() !== "" && 
        !o.profitDifficulties.toLowerCase().includes("no major") && 
        !o.profitDifficulties.toLowerCase().includes("excellent execution") &&
        !o.profitDifficulties.toLowerCase().includes("no difficulties") &&
        !o.profitDifficulties.toLowerCase().includes("none");
      if (hasDiff) {
        difficultyBakesCount += 1;
      }

      const hasCost = o.profitCostGoing && o.profitCostGoing.trim() !== "" && 
        !o.profitCostGoing.toLowerCase().includes("were not explicitly logged") &&
        !o.profitCostGoing.toLowerCase().includes("none") &&
        !o.profitCostGoing.toLowerCase().includes("not explicitly");
      if (hasCost) {
        costBakesCount += 1;
      }
    });
    
    const flavorsList = Object.entries(flavorData).map(([flavor, val]) => ({
      flavor,
      profit: val.profit,
      sales: val.sales,
      count: val.count,
      margin: val.sales > 0 ? (val.profit / val.sales) * 100 : 0
    })).sort((a, b) => b.profit - a.profit);

    let bestFlavor = "None";
    let maxProfit = 0;
    Object.entries(flavorData).forEach(([flavor, val]) => {
      if (val.profit > maxProfit) {
        maxProfit = val.profit;
        bestFlavor = flavor;
      }
    });

    const monthlyData: Record<string, { profit: number; sales: number; count: number }> = {};
    filteredCompletedOrders.forEach(o => {
      const monthStr = o.eventDate.substring(0, 7);
      if (monthStr) {
        if (!monthlyData[monthStr]) {
          monthlyData[monthStr] = { profit: 0, sales: 0, count: 0 };
        }
        monthlyData[monthStr].profit += (o.profitAmount || 0);
        monthlyData[monthStr].sales += o.totalAmount;
        monthlyData[monthStr].count += 1;
      }
    });

    const monthlyList = Object.entries(monthlyData).map(([month, val]) => {
      const [year, monthNum] = month.split("-");
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const name = date.toLocaleString("en-US", { month: "short" }) + " " + year.substring(2);
      return {
        monthKey: month,
        name,
        profit: val.profit,
        sales: val.sales,
        count: val.count
      };
    }).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    return {
      totalProfit,
      totalSales,
      averageMargin,
      averageProfitPerOrder,
      bestFlavor,
      count: filteredCompletedOrders.length,
      flavorsList,
      difficultyBakesCount,
      costBakesCount,
      monthlyList
    };
  }, [filteredCompletedOrders]);

  const filteredAndSortedOrders = useMemo(() => {
    let result = filteredCompletedOrders.filter((o) => {
      if (filterLogType === "difficulties") {
        const hasDiff = o.profitDifficulties && o.profitDifficulties.trim() !== "" && 
          !o.profitDifficulties.toLowerCase().includes("no major") && 
          !o.profitDifficulties.toLowerCase().includes("excellent execution") &&
          !o.profitDifficulties.toLowerCase().includes("no difficulties") &&
          !o.profitDifficulties.toLowerCase().includes("none");
        if (!hasDiff) return false;
      }
      if (filterLogType === "costs") {
        const hasCost = o.profitCostGoing && o.profitCostGoing.trim() !== "" && 
          !o.profitCostGoing.toLowerCase().includes("were not explicitly logged") &&
          !o.profitCostGoing.toLowerCase().includes("none") &&
          !o.profitCostGoing.toLowerCase().includes("not explicitly");
        if (!hasCost) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return b.eventDate.localeCompare(a.eventDate);
      }
      if (sortBy === "date-asc") {
        return a.eventDate.localeCompare(b.eventDate);
      }
      if (sortBy === "profit-desc") {
        return (b.profitAmount || 0) - (a.profitAmount || 0);
      }
      if (sortBy === "profit-asc") {
        return (a.profitAmount || 0) - (b.profitAmount || 0);
      }
      if (sortBy === "sales-desc") {
        return b.totalAmount - a.totalAmount;
      }
      if (sortBy === "sales-asc") {
        return a.totalAmount - b.totalAmount;
      }
      return 0;
    });

    return result;
  }, [completedOrders, searchTerm, selectedFlavor, startDate, endDate, filterLogType, sortBy]);

  const availableFlavors = useMemo(() => {
    const list = new Set<string>();
    completedOrders.forEach(o => {
      if (o.cakeFlavor) list.add(o.cakeFlavor);
    });
    return Array.from(list).sort();
  }, [completedOrders]);



  const unfilteredMonthlyList = useMemo(() => {
    const monthlyData: Record<string, { profit: number; sales: number; count: number }> = {};
    const today = new Date();
    const last12MonthsKeys: string[] = [];
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      last12MonthsKeys.push(`${yyyy}-${mm}`);
    }

    last12MonthsKeys.forEach(key => {
      monthlyData[key] = { profit: 0, sales: 0, count: 0 };
    });

    completedOrders.forEach(o => {
      const monthStr = o.eventDate.substring(0, 7);
      if (monthStr && monthlyData[monthStr] !== undefined) {
        monthlyData[monthStr].profit += (o.profitAmount || 0);
        monthlyData[monthStr].sales += o.totalAmount;
        monthlyData[monthStr].count += 1;
      }
    });

    return last12MonthsKeys.map((month) => {
      const [year, monthNum] = month.split("-");
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const name = date.toLocaleString("en-US", { month: "short" }) + " " + year.substring(2);
      return {
        monthKey: month,
        name,
        profit: monthlyData[month].profit,
        sales: monthlyData[month].sales,
        count: monthlyData[month].count
      };
    });
  }, [completedOrders]);

  const flavorOptions = useMemo(() => {
    return availableFlavors.map(f => ({ value: f, label: f }));
  }, [availableFlavors]);

  useEffect(() => {
    setDebriefsCurrentPage(1);
  }, [searchTerm, selectedFlavor, startDate, endDate, filterLogType, sortBy]);

  const paginatedDebriefs = useMemo(() => {
    const startIndex = (debriefsCurrentPage - 1) * debriefsItemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + debriefsItemsPerPage);
  }, [filteredAndSortedOrders, debriefsCurrentPage, debriefsItemsPerPage]);

  const debriefsTotalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedOrders.length / debriefsItemsPerPage);
  }, [filteredAndSortedOrders.length, debriefsItemsPerPage]);

  return {
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
  };
}
