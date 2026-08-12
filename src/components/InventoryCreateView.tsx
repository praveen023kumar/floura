// File Path: /src/components/InventoryCreateView.tsx
import React, { useState, useMemo, useEffect } from "react";
import CreatableSelect from "react-select/creatable";
import { customSelectStyles } from "./customSelectStyles";
import { type InventoryItem } from "../types";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { localDb } from "../db";
import { getCurrencySymbol } from "../utils/format";

interface InventoryCreateViewProps {
  onAddInventoryItem: (item: Omit<InventoryItem, "id" | "updatedAt">) => Promise<any>;
  onUpdateInventoryItem?: (item: InventoryItem) => Promise<any>;
}

export default function InventoryCreateView({
  onAddInventoryItem,
  onUpdateInventoryItem,
}: InventoryCreateViewProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const itemToEdit = location.state?.item as InventoryItem | null;

  const [formInputs, setFormInputs] = useState<any>({
    name: "",
    category: "Dry Goods",
    quantity: 0,
    unit: "KG",
    minStockLevel: 10,
    supplier: "",
    costPrice: 0.00,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const defaultCategories = useMemo(() => ["Dry Goods", "Dairy", "Spices & Flavoring", "Equipment"], []);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(defaultCategories);

  const defaultUnits = useMemo(() => ["KG", "L", "Pieces"], []);
  const [dynamicUnits, setDynamicUnits] = useState<string[]>(defaultUnits);

  // Sync edit item inputs
  useEffect(() => {
    if (itemToEdit) {
      setFormInputs({
        name: itemToEdit.name,
        category: itemToEdit.category,
        quantity: itemToEdit.quantity,
        unit: itemToEdit.unit,
        minStockLevel: itemToEdit.minStockLevel,
        supplier: itemToEdit.supplier || "",
        costPrice: itemToEdit.costPrice,
      });
    } else {
      setFormInputs({
        name: "",
        category: "Dry Goods",
        quantity: 0,
        unit: "KG",
        minStockLevel: 10,
        supplier: "",
        costPrice: 0.00,
      });
    }
  }, [itemToEdit]);

  // Load existing database category and unit options for autocompletion suggestions
  useEffect(() => {
    async function loadOptions() {
      try {
        const allItems = await localDb.inventory.filter((i: any) => i.isDeleted !== 1).toArray();
        const allCategories = allItems.map(item => item.category).filter(Boolean);
        const allUnits = allItems.map(item => item.unit).filter(Boolean);

        setDynamicCategories(Array.from(new Set([...defaultCategories, ...allCategories])));
        setDynamicUnits(Array.from(new Set([...defaultUnits, ...allUnits])));
      } catch (err) {
        console.error("Failed to load inventory categories & units for autocomplete:", err);
      }
    }
    loadOptions();
  }, [defaultCategories, defaultUnits]);

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInputs.name || Number(formInputs.quantity) < 0) {
      window.showToast?.("Please provide a valid product name and positive quantity.", "warning");
      return;
    }

    setSaving(true);
    try {
      if (itemToEdit && onUpdateInventoryItem) {
        const cleanedItem = {
          ...itemToEdit,
          name: formInputs.name,
          category: formInputs.category,
          quantity: Number(formInputs.quantity) || 0,
          unit: formInputs.unit,
          minStockLevel: Number(formInputs.minStockLevel) || 0,
          supplier: formInputs.supplier,
          costPrice: Number(formInputs.costPrice) || 0,
          updatedAt: new Date().toISOString(),
        };
        await onUpdateInventoryItem(cleanedItem);
        window.showToast?.("Ingredient updated successfully!", "success");
      } else {
        await onAddInventoryItem({
          name: formInputs.name,
          category: formInputs.category,
          quantity: Number(formInputs.quantity) || 0,
          unit: formInputs.unit,
          minStockLevel: Number(formInputs.minStockLevel) || 0,
          supplier: formInputs.supplier,
          costPrice: Number(formInputs.costPrice) || 0,
        });
        window.showToast?.("Product added successfully!", "success");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("/inventory");
      }, 1000);
    } catch (err) {
      console.error(err);
      window.showToast?.("Failed to register inventory item.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left">
      {/* Header with back button */}
      <div className="flex items-center gap-4 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700/60 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-serif text-zinc-800 dark:text-zinc-100 font-sans">
            {itemToEdit ? "Edit Raw Ingredient" : "Register Raw Ingredient"}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {itemToEdit ? "Update ingredient metrics, costs, and thresholds." : "Add new item quantities directly into baking inventories."}
          </p>
        </div>
      </div>

      {/* Main card form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800"
      >
        <form onSubmit={handleSaveProductSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Product Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Organic Vanilla Powder"
              value={formInputs.name}
              onChange={(e) => setFormInputs({ ...formInputs, name: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Category</label>
              <CreatableSelect
                styles={customSelectStyles}
                placeholder="Select or type..."
                value={formInputs.category ? { value: formInputs.category, label: formInputs.category } : null}
                options={dynamicCategories.map((c) => ({ value: c, label: c }))}
                onChange={(opt) =>
                  setFormInputs({
                    ...formInputs,
                    category: opt?.value || ""
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Quantity</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formInputs.quantity}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val === "") {
                      setFormInputs({ ...formInputs, quantity: "" });
                    } else {
                      if (/^0\d+/.test(val)) {
                        val = val.replace(/^0+/, "");
                      }
                      setFormInputs({ ...formInputs, quantity: val });
                    }
                  }}
                  className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Unit</label>
                <CreatableSelect
                  styles={customSelectStyles}
                  placeholder="Select or type..."
                  value={formInputs.unit ? { value: formInputs.unit, label: formInputs.unit } : null}
                  options={dynamicUnits.map((u) => ({ value: u, label: u }))}
                  onChange={(opt) =>
                    setFormInputs({
                      ...formInputs,
                      unit: opt?.value || ""
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Alert Minimum Stock Level</label>
              <input
                required
                type="number"
                step="0.1"
                placeholder="Alert threshold"
                value={formInputs.minStockLevel}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val === "") {
                    setFormInputs({ ...formInputs, minStockLevel: "" });
                  } else {
                    if (/^0\d+/.test(val)) {
                      val = val.replace(/^0+/, "");
                    }
                    setFormInputs({ ...formInputs, minStockLevel: val });
                  }
                }}
                className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Supplier</label>
              <input
                type="text"
                placeholder="Ardent Mills or Domino Corp"
                value={formInputs.supplier}
                onChange={(e) => setFormInputs({ ...formInputs, supplier: e.target.value })}
                className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Cost Price Per Unit</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-405 text-sm font-semibold select-none leading-none">
                {getCurrencySymbol()}
              </span>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formInputs.costPrice}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val === "") {
                    setFormInputs({ ...formInputs, costPrice: "" });
                  } else {
                    if (/^0\d+/.test(val)) {
                      val = val.replace(/^0+/, "");
                    }
                    setFormInputs({ ...formInputs, costPrice: val });
                  }
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-800 text-sm p-3 pl-9 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              className="w-full py-3 border border-zinc-250 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className="w-full py-3 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-400 dark:hover:bg-orange-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
            >
              {saving ? (
                <span>Saving Ingredient...</span>
              ) : success ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Registered!
                </span>
              ) : (
                <span>Register Ingredient</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
