import { useState, useMemo, useEffect } from "react";
import { type InventoryItem } from "../types";
import { localDb } from "../db";

export interface UseInventoryProps {
  onAddInventoryItem: (item: Omit<InventoryItem, "id" | "updatedAt">) => Promise<any>;
  onUpdateInventoryItem?: (item: InventoryItem) => Promise<any>;
  initialViewMode?: "list" | "form";
  onViewModeChange?: (mode: "list" | "form") => void;
}

export function useInventory({
  onAddInventoryItem,
  onUpdateInventoryItem,
  initialViewMode = "list",
  onViewModeChange,
}: UseInventoryProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  const [viewMode, setViewMode] = useState<"list" | "form">(initialViewMode);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  const defaultCategories = useMemo(() => ["Dry Goods", "Dairy", "Spices & Flavoring", "Equipment"], []);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(["Dry Goods", "Dairy", "Spices & Flavoring", "Equipment"]);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [lowStockItemsList, setLowStockItemsList] = useState<InventoryItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const defaultUnits = useMemo(() => ["KG", "L", "Pieces"], []);
  const [dynamicUnits, setDynamicUnits] = useState<string[]>(["KG", "L", "Pieces"]);

  const [paginatedInventory, setPaginatedInventory] = useState<InventoryItem[]>([]);
  const [filteredCount, setFilteredCount] = useState<number>(0);

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

  // Metadata loader
  useEffect(() => {
    async function fetchInventoryMetadata() {
      try {
        const allItems = await localDb.inventory.filter((i: any) => i.isDeleted !== 1).toArray();
        setInventoryItems(allItems);
        
        const allUsedCategories = allItems.map((item) => item.category).filter(Boolean);
        const combinedCats = Array.from(new Set([...defaultCategories, ...allUsedCategories]));
        setDynamicCategories(combinedCats);

        const allUsedUnits = allItems.map((item) => item.unit).filter(Boolean);
        const combinedUnits = Array.from(new Set([...defaultUnits, ...allUsedUnits]));
        setDynamicUnits(combinedUnits);

        const lowStock = allItems.filter((item) => item.quantity < item.minStockLevel);
        setLowStockItemsList(lowStock);
        setLowStockCount(lowStock.length);
      } catch (err) {
        console.error("Failed to fetch inventory metadata from localDb:", err);
      }
    }
    fetchInventoryMetadata();
  }, [refreshTrigger, defaultCategories, defaultUnits]);

  // Load paginated inventory dynamically
  useEffect(() => {
    async function loadDbInventory() {
      try {
        let query = localDb.inventory.filter((i: any) => i.isDeleted !== 1);
        let matched = await query.toArray();

        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          matched = matched.filter(item => 
            item.name.toLowerCase().includes(s) || 
            (item.supplier || "").toLowerCase().includes(s)
          );
        }

        if (selectedCategory !== "All") {
          matched = matched.filter(item => item.category === selectedCategory);
        }

        if (showOnlyLowStock) {
          matched = matched.filter(item => item.quantity < item.minStockLevel);
        }

        matched.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

        setFilteredCount(matched.length);
        const startIndex = (inventoryCurrentPage - 1) * inventoryItemsPerPage;
        const pageSlice = matched.slice(startIndex, startIndex + inventoryItemsPerPage);
        setPaginatedInventory(pageSlice);
      } catch (err) {
        console.error("Failed to query inventory from localDb:", err);
      }
    }
    loadDbInventory();
  }, [refreshTrigger, searchTerm, selectedCategory, showOnlyLowStock, inventoryCurrentPage, inventoryItemsPerPage]);

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
    refreshTrigger,
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
  };
}
