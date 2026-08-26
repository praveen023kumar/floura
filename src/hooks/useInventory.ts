import { useState, useMemo, useEffect } from "react";
import { type InventoryItem } from "../types";
import { localDb } from "../db";
import { useQuery } from "@tanstack/react-query";

export interface UseInventoryProps {
  onAddInventoryItem?: (item: Omit<InventoryItem, "id" | "updatedAt">) => Promise<any>;
  onUpdateInventoryItem?: (item: InventoryItem) => Promise<any>;
  initialViewMode?: "list" | "form";
  onViewModeChange?: (mode: "list" | "form") => void;
}

export function useInventory({
  onAddInventoryItem,
  onUpdateInventoryItem,
  initialViewMode = "list",
  onViewModeChange,
}: UseInventoryProps = {}) {


  const [viewMode, setViewMode] = useState<"list" | "form">(initialViewMode);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  const defaultCategories = useMemo(() => ["Dry Goods", "Dairy", "Spices & Flavoring", "Equipment"], []);
  const defaultUnits = useMemo(() => ["KG", "L", "Pieces"], []);

  const [inventoryCurrentPage, setInventoryCurrentPage] = useState<number>(1);
  const [inventoryItemsPerPage, setInventoryItemsPerPage] = useState<number>(10);

  useEffect(() => {
    if (initialViewMode === "form") {
      setIsCreateModalOpen(true);
      setViewMode("list");
    } else {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  const handleSetViewMode = (mode: "list" | "form") => {
    if (mode === "form") {
      setIsCreateModalOpen(true);
    } else {
      setViewMode(mode);
    }
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  // Load metadata using TanStack useQuery
  const metadataQuery = useQuery({
    queryKey: ["inventory", "metadata"],
    queryFn: async () => {
      const [dbCats, lowStock, activeUnits, allItemsLight] = await Promise.all([
        localDb.categories.filter(c => c.type === "inventory" && c.isDeleted !== 1).toArray(),
        localDb.inventory.query("SELECT * FROM inventory WHERE isDeleted = 0 AND quantity < minStockLevel"),
        localDb.inventory.query("SELECT unit FROM inventory WHERE isDeleted = 0"),
        localDb.inventory.query("SELECT id, name, category, quantity, minStockLevel, supplier, unit, updatedAt FROM inventory WHERE isDeleted = 0")
      ]);

      const catNames = dbCats.map(c => c.name);
      const combinedCats = Array.from(new Set([...defaultCategories, ...catNames]));

      const allUsedUnits = activeUnits.map((item: any) => item.unit).filter(Boolean);
      const combinedUnits = Array.from(new Set([...defaultUnits, ...allUsedUnits]));

      return {
        dynamicCategories: combinedCats,
        dynamicUnits: combinedUnits,
        lowStockItemsList: lowStock,
        lowStockCount: lowStock.length,
        inventoryItems: allItemsLight
      };
    }
  });

  const metadata = metadataQuery.data || {
    dynamicCategories: ["Dry Goods", "Dairy", "Spices & Flavoring", "Equipment"],
    dynamicUnits: ["KG", "L", "Pieces"],
    lowStockItemsList: [],
    lowStockCount: 0,
    inventoryItems: []
  };

  const dynamicCategories = metadata.dynamicCategories;
  const dynamicUnits = metadata.dynamicUnits;
  const lowStockItemsList = metadata.lowStockItemsList;
  const lowStockCount = metadata.lowStockCount;
  const inventoryItems = metadata.inventoryItems;

  // Load paginated list of inventory items using useQuery
  const listQuery = useQuery({
    queryKey: [
      "inventory",
      "list",
      searchTerm,
      selectedCategory,
      showOnlyLowStock,
      inventoryCurrentPage,
      inventoryItemsPerPage
    ],
    queryFn: async () => {
      const startIndex = (inventoryCurrentPage - 1) * inventoryItemsPerPage;

      // Since name, category, and supplier are encrypted in SQLite,
      // we must fetch lightweight decrypted records and filter/sort in memory.
      const allItemsLight = await localDb.inventory.query(
        "SELECT id, name, category, quantity, minStockLevel, supplier, updatedAt FROM inventory WHERE isDeleted = 0"
      );

      // Perform filtering on decrypted fields
      const matched = allItemsLight.filter(i => {
        if (selectedCategory !== "All" && i.category !== selectedCategory) return false;
        if (showOnlyLowStock && !(i.quantity < i.minStockLevel)) return false;
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          return (
            i.name.toLowerCase().includes(s) || 
            (i.supplier || "").toLowerCase().includes(s)
          );
        }
        return true;
      });

      // Perform stable sorting by name (alphabetically, case-insensitive)
      matched.sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });

      const filteredCount = matched.length;
      let paginatedInventory: InventoryItem[] = [];

      const pageIds = matched
        .slice(startIndex, startIndex + inventoryItemsPerPage)
        .map(i => i.id);

      if (pageIds.length > 0) {
        const placeholders = pageIds.map(() => "?").join(",");
        const pageInventory = await localDb.inventory.query(
          `SELECT * FROM inventory WHERE id IN (${placeholders})`,
          pageIds
        );

        // Re-sort to match the in-memory filtered & sorted pageIds order
        const itemMap = new Map(pageInventory.map(i => [i.id, i]));
        paginatedInventory = pageIds
          .map(id => itemMap.get(id))
          .filter((i): i is InventoryItem => !!i);
      }

      return { filteredCount, paginatedInventory };
    }
  });

  const listResult = listQuery.data || { filteredCount: 0, paginatedInventory: [] };
  const filteredCount = listResult.filteredCount;
  const paginatedInventory = listResult.paginatedInventory;
  const isLoading = metadataQuery.isLoading || listQuery.isLoading;

  const [formInputs, setFormInputs] = useState<any>({
    name: "",
    category: "Dry Goods" as string,
    quantity: 0,
    unit: "KG" as string,
    minStockLevel: 10,
    supplier: "",
    costPrice: 0.00,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setInventoryCurrentPage(1);
  }, [searchTerm, selectedCategory, showOnlyLowStock]);

  const inventoryTotalPages = useMemo(() => {
    return Math.ceil(filteredCount / inventoryItemsPerPage);
  }, [filteredCount, inventoryItemsPerPage]);

  const filteredInventory = useMemo(() => {
    return { length: filteredCount };
  }, [filteredCount]);

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name || Number(editingItem.quantity) < 0) {
      window.showToast("Please provide a valid name and positive quantity.", "warning");
      return;
    }

    if (onUpdateInventoryItem) {
      try {
        const cleanedItem = {
          ...editingItem,
          quantity: Number(editingItem.quantity) || 0,
          minStockLevel: Number(editingItem.minStockLevel) || 0,
          costPrice: Number(editingItem.costPrice) || 0,
        };
        await onUpdateInventoryItem(cleanedItem);
        setEditingItem(null);
      } catch (e) {
        console.error(e);
        window.showToast("Failed to update stock material.", "error");
      }
    }
  };

  return {
    viewMode,
    setViewMode,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingItem,
    setEditingItem,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showOnlyLowStock,
    setShowOnlyLowStock,
    dynamicCategories,
    lowStockCount,
    lowStockItemsList,
    inventoryItems,
    dynamicUnits,
    paginatedInventory,
    filteredCount,
    inventoryCurrentPage,
    setInventoryCurrentPage,
    inventoryItemsPerPage,
    setInventoryItemsPerPage,
    inventoryTotalPages,
    filteredInventory,
    formInputs,
    setFormInputs,
    saving,
    setSaving,
    success,
    setSuccess,
    handleSetViewMode,
    handleUpdateProduct,
    isLoading,
  };
}
