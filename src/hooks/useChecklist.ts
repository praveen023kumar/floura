import React, { useState, useMemo, useEffect, useRef } from "react";
import { type ChecklistItem } from "../types";
import { localDb } from "../db";
import { useQuery } from "@tanstack/react-query";

export interface UseChecklistProps {
  checkerList?: ChecklistItem[];
  stableOrderList?: ChecklistItem[];
  onToggleChecklistItem: (id: string, checked: boolean, date?: string) => void;
  onAddChecklistItem?: (text: string, date?: string) => Promise<any>;
  onResetChecklist: (date?: string) => void;
}

export function useChecklist({
  checkerList: propCheckerList,
  stableOrderList,
  onToggleChecklistItem,
  onAddChecklistItem,
  onResetChecklist,
}: UseChecklistProps) {
  const [customTask, setCustomTask] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");


  const [checklistCurrentPage, setChecklistCurrentPage] = useState<number>(1);
  const [checklistItemsPerPage, setChecklistItemsPerPage] = useState<number>(10);
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

  // Reset stable order when date changes so the new date's items get a fresh order
  useEffect(() => {
    stableIdOrderRef.current = new Map();
    stableIdSetRef.current = new Set();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Stable ID-order reference: captures the insertion order from the first fetch per date.
  // This prevents items from jumping when toggled, because SQLite's INSERT OR REPLACE
  // reassigns the rowid, making ORDER BY rowid unstable after an update.
  const stableIdOrderRef = useRef<Map<string, number>>(new Map());
  const stableIdSetRef = useRef<Set<string>>(new Set());

  // Load checklist items using useQuery
  const { data: checkerList = [] } = useQuery<ChecklistItem[]>({
    queryKey: ["checklist", "all", selectedDate],
    queryFn: async () => {
      return await localDb.checklist.query(
        "SELECT id FROM checklist WHERE isDeleted = 0 AND (date IS NULL OR date = '' OR date <= ?)",
        [selectedDate]
      );
    }
  });

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

  // (pagination & count states removed, managed by useQuery instead)

  // Load paginated list of checklist items using useQuery
  const { data: listResult = { totalCount: 0, completedCount: 0, filteredCount: 0, paginatedChecklist: [] } } = useQuery({
    queryKey: [
      "checklist",
      "list",
      selectedDate,
      searchTerm,
      filterMode,
      checklistCurrentPage,
      checklistItemsPerPage
    ],
    queryFn: async () => {
      const startIndex = (checklistCurrentPage - 1) * checklistItemsPerPage;

      // Fetch lightweight columns for all items up to the selected date to compute total counts & stats
      const allItemsLight = await localDb.checklist.query(
        "SELECT id, date, completedDates, checked FROM checklist WHERE isDeleted = 0 AND (date IS NULL OR date = '' OR date <= ?)",
        [selectedDate]
      );

      // Map checked status in memory
      const mappedAllItems = allItemsLight.map((item) => {
        const isChecked = item.completedDates && Array.isArray(item.completedDates)
          ? item.completedDates.includes(selectedDate)
          : (item.date === selectedDate ? !!item.checked : false);
        return { ...item, checked: isChecked };
      });

      const dayTotal = mappedAllItems.length;
      const dayCompleted = mappedAllItems.filter(item => item.checked).length;

      let filteredCount = 0;
      let paginatedChecklist: ChecklistItem[] = [];

      const hasEncryptedFilters = searchTerm.trim() !== "";

      if (!hasEncryptedFilters) {
        // No encrypted filters: Paginate directly in SQLite using index parameters
        const conditions = ["isDeleted = 0 AND (date IS NULL OR date = '' OR date <= ?)"];
        const params: any[] = [selectedDate];

        if (filterMode === "pending") {
          conditions.push("(completedDates NOT LIKE ? OR completedDates IS NULL)");
          params.push(`%"${selectedDate}"%`);
        } else if (filterMode === "completed") {
          conditions.push("completedDates LIKE ?");
          params.push(`%"${selectedDate}"%`);
        }

        const whereClause = conditions.join(" AND ");

        const countResult = await localDb.checklist.query(
          `SELECT COUNT(*) as count FROM checklist WHERE ${whereClause}`,
          params
        );
        filteredCount = countResult[0]?.count || 0;

        const pageItems = await localDb.checklist.query(
          `SELECT * FROM checklist WHERE ${whereClause} LIMIT ? OFFSET ?`,
          [...params, checklistItemsPerPage, startIndex]
        );

        // Map checked status for page items
        paginatedChecklist = pageItems.map((item) => {
          const isChecked = item.completedDates && Array.isArray(item.completedDates)
            ? item.completedDates.includes(selectedDate)
            : (item.date === selectedDate ? !!item.checked : false);
          return { ...item, checked: isChecked };
        });
      } else {
        // Has encrypted search filter: Fetch text column and filter in-memory
        const allItemsSearch = await localDb.checklist.query(
          "SELECT id, text, date, completedDates, checked FROM checklist WHERE isDeleted = 0 AND (date IS NULL OR date = '' OR date <= ?)",
          [selectedDate]
        );

        const mappedSearchItems = allItemsSearch.map((item) => {
          const isChecked = item.completedDates && Array.isArray(item.completedDates)
            ? item.completedDates.includes(selectedDate)
            : (item.date === selectedDate ? !!item.checked : false);
          return { ...item, checked: isChecked };
        });

        const matched = mappedSearchItems.filter(item => {
          if (filterMode === "pending" && item.checked) return false;
          if (filterMode === "completed" && !item.checked) return false;
          if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return item.text.toLowerCase().includes(s);
          }
          return true;
        });

        filteredCount = matched.length;

        const pageIds = matched
          .slice(startIndex, startIndex + checklistItemsPerPage)
          .map(i => i.id);

        if (pageIds.length > 0) {
          const placeholders = pageIds.map(() => "?").join(",");
          const pageItems = await localDb.checklist.query(
            `SELECT * FROM checklist WHERE id IN (${placeholders})`,
            pageIds
          );

          // Re-sort and map checked status
          const itemMap = new Map(pageItems.map(i => [i.id, i]));
          paginatedChecklist = pageIds
            .map(id => itemMap.get(id))
            .filter((i): i is ChecklistItem => !!i)
            .map(item => {
              const isChecked = item.completedDates && Array.isArray(item.completedDates)
                ? item.completedDates.includes(selectedDate)
                : (item.date === selectedDate ? !!item.checked : false);
              return { ...item, checked: isChecked };
            });
        }
      }

      return { totalCount: dayTotal, completedCount: dayCompleted, filteredCount, paginatedChecklist };
    }
  });

  const totalCount = listResult.totalCount;
  const completedCount = listResult.completedCount;
  const filteredCount = listResult.filteredCount;

  // Update stableIdOrderRef whenever the set of checklist IDs changes (add/delete), but NOT on toggles.
  // This gives a permanent, stable position for each item.
  useEffect(() => {
    const currentIds = checkerList.map((i: any) => i.id);
    const currentSet = new Set(currentIds);
    const prevSet = stableIdSetRef.current;
    const sameIds = currentIds.every(id => prevSet.has(id)) && currentIds.length === prevSet.size;
    if (!sameIds) {
      // Items were added or deleted — rebuild the stable order map
      const newMap = new Map<string, number>();
      currentIds.forEach((id: string, idx: number) => newMap.set(id, idx));
      stableIdOrderRef.current = newMap;
      stableIdSetRef.current = currentSet;
    }
  }, [checkerList]);

  // Sort paginatedChecklist using stable order to prevent reordering on toggle.
  const paginatedChecklist = useMemo(() => {
    const raw = listResult.paginatedChecklist;
    const orderMap = stableIdOrderRef.current;
    if (orderMap.size === 0) return raw;
    return [...raw].sort((a, b) => {
      const ia = orderMap.has(a.id) ? orderMap.get(a.id)! : 99999;
      const ib = orderMap.has(b.id) ? orderMap.get(b.id)! : 99999;
      return ia - ib;
    });
  }, [listResult.paginatedChecklist]);

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



  useEffect(() => {
    setChecklistCurrentPage(1);
  }, [filterMode, selectedDate, searchTerm]);

  const checklistTotalPages = useMemo(() => {
    return Math.ceil(filteredCount / checklistItemsPerPage);
  }, [filteredCount, checklistItemsPerPage]);

  const filteredList = useMemo(() => {
    return { length: filteredCount };
  }, [filteredCount]);

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
    dateFilteredList: [] as ChecklistItem[],
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
