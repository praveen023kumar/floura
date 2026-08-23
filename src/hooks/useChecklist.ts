import React, { useState, useMemo, useEffect, useRef } from "react";
import { type ChecklistItem } from "../types";

export interface UseChecklistProps {
  checkerList: ChecklistItem[];
  onToggleChecklistItem: (id: string, checked: boolean, date?: string) => void;
  onAddChecklistItem?: (text: string, date?: string) => Promise<any>;
  onResetChecklist: (date?: string) => void;
}

export function useChecklist({
  checkerList,
  onToggleChecklistItem,
  onAddChecklistItem,
  onResetChecklist,
}: UseChecklistProps) {
  const [customTask, setCustomTask] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  const yesterdayStr = useMemo(() => {
    const parts = todayStr.split("-");
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [todayStr]);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const prevTodayStrRef = useRef(todayStr);
  useEffect(() => {
    const prevToday = prevTodayStrRef.current;
    if (selectedDate === prevToday) {
      setSelectedDate(todayStr);
    }
    prevTodayStrRef.current = todayStr;
  }, [todayStr, selectedDate]);

  const formatChecklistDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      }
    } catch (e) {}
    return dateStr;
  };

  const dateFilteredList = useMemo(() => {
    return checkerList
      .filter((item) => !item.date || item.date <= selectedDate)
      .map((item) => {
        const isChecked = item.completedDates && Array.isArray(item.completedDates)
          ? item.completedDates.includes(selectedDate)
          : (item.date === selectedDate ? !!item.checked : false);
        return {
          ...item,
          checked: isChecked,
        };
      });
  }, [checkerList, selectedDate]);

  const completedCount = useMemo(() => {
    return dateFilteredList.filter((item) => item.checked).length;
  }, [dateFilteredList]);

  const totalCount = dateFilteredList.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTask.trim()) return;
    if (onAddChecklistItem) {
      await onAddChecklistItem(customTask.trim(), selectedDate);
      setCustomTask("");
      window.showToast?.("Task added successfully!", "success");
    }
  };

  const handleSeedDefaultChecklist = async () => {
    if (onAddChecklistItem) {
      const items = [
        "Preheat deck ovens & proofing boxes",
        "Refill premium Belgian chocolate reservoirs",
        "Take inventory counts of pasteurized dairy cartons",
        "Sanitize marble production benches",
        "Prepare packaging cartons & cake decoration boxes",
        "Verify custom frosting inscription details"
      ];
      for (const item of items) {
        await onAddChecklistItem(item, selectedDate);
      }
      window.showToast?.(`Pre-loaded daily kitchen prep tasks for ${formatChecklistDate(selectedDate)}!`, "success");
    }
  };

  const filteredList = useMemo(() => {
    let list = dateFilteredList;
    if (filterMode === "pending") {
      list = dateFilteredList.filter((item) => !item.checked);
    } else if (filterMode === "completed") {
      list = dateFilteredList.filter((item) => item.checked);
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter((item) => item.text.toLowerCase().includes(s));
    }
    return list;
  }, [dateFilteredList, filterMode, searchTerm]);

  const [checklistCurrentPage, setChecklistCurrentPage] = useState<number>(1);
  const [checklistItemsPerPage, setChecklistItemsPerPage] = useState<number>(10);

  useEffect(() => {
    setChecklistCurrentPage(1);
  }, [filterMode, selectedDate, searchTerm]);

  const paginatedChecklist = useMemo(() => {
    const startIndex = (checklistCurrentPage - 1) * checklistItemsPerPage;
    return filteredList.slice(startIndex, startIndex + checklistItemsPerPage);
  }, [filteredList, checklistCurrentPage, checklistItemsPerPage]);

  const checklistTotalPages = useMemo(() => {
    return Math.ceil(filteredList.length / checklistItemsPerPage);
  }, [filteredList.length, checklistItemsPerPage]);

  return {
    customTask,
    setCustomTask,
    filterMode,
    setFilterMode,
    searchTerm,
    setSearchTerm,
    selectedDate,
    setSelectedDate,
    todayStr,
    yesterdayStr,
    formatChecklistDate,
    dateFilteredList,
    completedCount,
    totalCount,
    completionRate,
    handleAddCustomTask,
    handleSeedDefaultChecklist,
    filteredList,
    checklistCurrentPage,
    setChecklistCurrentPage,
    checklistItemsPerPage,
    setChecklistItemsPerPage,
    paginatedChecklist,
    checklistTotalPages,
  };
}
