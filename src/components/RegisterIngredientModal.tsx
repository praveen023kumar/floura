// File Path: /src/components/RegisterIngredientModal.tsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import CreatableSelect from "react-select/creatable";
import { customSelectStyles } from "./customSelectStyles";
import { type InventoryItem, type Category } from "../types";
import { X, CheckCircle2, Calculator, ChevronDown, ChevronUp, PackagePlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { localDb } from "../db";
import { getCurrencySymbol } from "../utils/format";

export interface RegisterIngredientModalProps {
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onSuccess: (item: InventoryItem) => void;
  onAddInventoryItem?: (item: Omit<InventoryItem, "id" | "updatedAt">) => Promise<InventoryItem>;
}

export default function RegisterIngredientModal({
  isOpen,
  initialName = "",
  onClose,
  onSuccess,
  onAddInventoryItem,
}: RegisterIngredientModalProps) {
  const [formInputs, setFormInputs] = useState<any>({
    name: "",
    category: "Dry Goods",
    quantity: 0,
    unit: "g",
    minStockLevel: 0,
    supplier: "",
    costPrice: 0.0,
  });

  // Cost calculator helper state
  const [calcTotalAmount, setCalcTotalAmount] = useState<string>("");
  const [calcPurchasedQty, setCalcPurchasedQty] = useState<string>("");
  const [calcUnit, setCalcUnit] = useState<string>("g");
  const [showCalc, setShowCalc] = useState<boolean>(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const defaultCategories = useMemo(
    () => ["Dry Goods", "Dairy", "Spices & Flavoring", "Produce", "Equipment", "Packaging"],
    []
  );
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(defaultCategories);

  const defaultUnits = useMemo(
    () => ["g", "kg", "ml", "L", "Pieces", "nos", "tsp", "tbsp"],
    []
  );
  const [dynamicUnits, setDynamicUnits] = useState<string[]>(defaultUnits);

  // Derived per-unit cost from calculator
  const calcPerUnit = useMemo(() => {
    const total = parseFloat(calcTotalAmount);
    const qty = parseFloat(calcPurchasedQty);
    if (!isNaN(total) && !isNaN(qty) && qty > 0 && total >= 0) {
      return total / qty;
    }
    return null;
  }, [calcTotalAmount, calcPurchasedQty]);

  const applyCalcToForm = useCallback(() => {
    if (calcPerUnit !== null) {
      setFormInputs((prev: any) => ({
        ...prev,
        costPrice: parseFloat(calcPerUnit.toFixed(4)),
        unit: calcUnit,
      }));
      window.showToast?.("Cost per unit applied!", "success");
    }
  }, [calcPerUnit, calcUnit]);

  // Reset form inputs whenever modal opens with initialName
  useEffect(() => {
    if (isOpen) {
      setFormInputs({
        name: initialName.trim(),
        category: "Dry Goods",
        quantity: 0,
        unit: "g",
        minStockLevel: 0,
        supplier: "",
        costPrice: 0.0,
      });
      setCalcTotalAmount("");
      setCalcPurchasedQty("");
      setCalcUnit("g");
      setShowCalc(false);
      setSaving(false);
      setSuccess(false);
    }
  }, [isOpen, initialName]);

  // Load existing database category and unit options for autocomplete suggestions
  useEffect(() => {
    if (!isOpen) return;
    async function loadOptions() {
      try {
        const [dbCats, allItems] = await Promise.all([
          localDb.categories
            .filter((c: Category) => c.type === "inventory" && c.isDeleted !== 1)
            .toArray(),
          localDb.inventory.filter((i: any) => i.isDeleted !== 1).toArray(),
        ]);
        const catNames = dbCats.map((c) => c.name);
        const allCategories = allItems.map((item) => item.category).filter(Boolean);
        const allUnits = allItems.map((item) => item.unit).filter(Boolean);

        setDynamicCategories(Array.from(new Set([...defaultCategories, ...catNames, ...allCategories])));
        setDynamicUnits(Array.from(new Set([...defaultUnits, ...allUnits])));
      } catch (err) {
        console.error("Failed to load inventory categories & units for autocomplete:", err);
      }
    }
    loadOptions();
  }, [isOpen, defaultCategories, defaultUnits]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formInputs.name?.trim();
    if (!cleanName) {
      window.showToast?.("Please enter a valid ingredient name.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<InventoryItem, "id" | "updatedAt"> = {
        name: cleanName,
        category: formInputs.category || "Dry Goods",
        quantity: Number(formInputs.quantity) || 0,
        unit: formInputs.unit || "g",
        minStockLevel: Number(formInputs.minStockLevel) || 0,
        supplier: formInputs.supplier?.trim() || "",
        costPrice: Number(formInputs.costPrice) || 0,
      };

      let createdItem: InventoryItem;
      if (onAddInventoryItem) {
        createdItem = await onAddInventoryItem(payload);
      } else {
        const id = "inv-" + Math.random().toString(36).substring(2, 9);
        createdItem = {
          ...payload,
          id,
          updatedAt: new Date().toISOString(),
        };
        await localDb.inventory.put({ ...createdItem, localChange: 1 });
      }

      setSuccess(true);
      window.showToast?.(`Registered "${createdItem.name}" to inventory`, "success");

      setTimeout(() => {
        onSuccess(createdItem);
        onClose();
      }, 500);
    } catch (err) {
      console.error("Failed to register ingredient:", err);
      window.showToast?.("Failed to register ingredient into inventory.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-brand/10 dark:bg-orange-500/20 text-primary-brand dark:text-orange-400 flex items-center justify-center">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 font-sans">
                  Register Raw Ingredient
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Save to inventory for tracking and batch costing
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Product Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Ingredient Name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Vanilla Extract"
                value={formInputs.name}
                onChange={(e) => setFormInputs({ ...formInputs, name: e.target.value })}
                className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
              />
            </div>

            {/* Category and Unit / Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Category</label>
                <CreatableSelect
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  placeholder="Select or type..."
                  value={
                    formInputs.category
                      ? { value: formInputs.category, label: formInputs.category }
                      : null
                  }
                  options={dynamicCategories.map((c) => ({ value: c, label: c }))}
                  onChange={(opt) =>
                    setFormInputs({
                      ...formInputs,
                      category: opt?.value || "",
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Unit</label>
                  <CreatableSelect
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    placeholder="e.g. g"
                    value={
                      formInputs.unit ? { value: formInputs.unit, label: formInputs.unit } : null
                    }
                    options={dynamicUnits.map((u) => ({ value: u, label: u }))}
                    onChange={(opt) =>
                      setFormInputs({
                        ...formInputs,
                        unit: opt?.value || "",
                      })
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Available</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={formInputs.quantity}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === "") {
                        setFormInputs({ ...formInputs, quantity: "" });
                      } else {
                        if (/^0\d+/.test(val)) val = val.replace(/^0+/, "");
                        setFormInputs({ ...formInputs, quantity: val });
                      }
                    }}
                    className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>

            {/* Threshold and Supplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  Alert Min Stock Level
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={formInputs.minStockLevel}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val === "") {
                      setFormInputs({ ...formInputs, minStockLevel: "" });
                    } else {
                      if (/^0\d+/.test(val)) val = val.replace(/^0+/, "");
                      setFormInputs({ ...formInputs, minStockLevel: val });
                    }
                  }}
                  className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  Supplier <span className="text-[10px] text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Local Dairy or Wholesaler"
                  value={formInputs.supplier}
                  onChange={(e) => setFormInputs({ ...formInputs, supplier: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Cost Price Per Unit with Cost Calculator */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  Cost Price Per {formInputs.unit || "unit"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold select-none leading-none">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="0.00"
                    value={formInputs.costPrice}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === "") {
                        setFormInputs({ ...formInputs, costPrice: "" });
                      } else {
                        if (/^0\d+/.test(val)) val = val.replace(/^0+/, "");
                        setFormInputs({ ...formInputs, costPrice: val });
                      }
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 text-sm p-3 pl-9 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Calculator Toggle */}
              <button
                type="button"
                onClick={() => setShowCalc((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-brand dark:text-orange-400 hover:underline w-fit transition-colors pt-0.5 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                {showCalc ? "Hide" : "Use"} Cost Calculator
                {showCalc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Calculator Panel */}
              {showCalc && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-2xl border border-primary-brand/20 dark:border-orange-500/20 bg-orange-50/60 dark:bg-orange-950/20 p-3.5 space-y-3"
                >
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Enter purchase amount and total quantity bought to calculate per-unit cost:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                        Total Paid
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-semibold select-none">
                          {getCurrencySymbol()}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 50"
                          value={calcTotalAmount}
                          onChange={(e) => setCalcTotalAmount(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-800 text-xs p-2 pl-6 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                        Qty Bought
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="e.g. 500"
                          value={calcPurchasedQty}
                          onChange={(e) => setCalcPurchasedQty(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-800 text-xs p-2 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                        />
                        <select
                          value={calcUnit}
                          onChange={(e) => setCalcUnit(e.target.value)}
                          className="bg-white dark:bg-zinc-800 text-xs p-1.5 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100 cursor-pointer"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="L">L</option>
                          <option value="pcs">pcs</option>
                          <option value="nos">nos</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {calcPerUnit !== null && (
                    <div className="flex items-center justify-between bg-white dark:bg-zinc-800 rounded-xl px-3 py-2 border border-primary-brand/20 dark:border-orange-500/20">
                      <div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase">
                          Cost / {calcUnit}
                        </p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                          {getCurrencySymbol()}
                          {calcPerUnit < 0.01 ? calcPerUnit.toFixed(6) : calcPerUnit.toFixed(4)}
                          <span className="text-[10px] text-zinc-400 ml-1">/ {calcUnit}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={applyCalcToForm}
                        className="px-3 py-1.5 bg-primary-brand dark:bg-orange-500 hover:bg-primary-brand-dark dark:hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm cursor-pointer"
                      >
                        Apply Cost
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-zinc-250 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || success}
                className={`px-6 py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95 ${
                  success
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white"
                }`}
              >
                {saving ? (
                  <span>Registering...</span>
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
    </AnimatePresence>
  );
}
