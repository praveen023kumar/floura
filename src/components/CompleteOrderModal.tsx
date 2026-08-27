// File Path: /src/components/CompleteOrderModal.tsx
import React, { useState, useEffect } from "react";
import { type Order } from "../types";
import { localDb } from "../db";
import { scaleRecipeIngredients, parseWeightToGrams } from "../../shared/calculations";
import { formatPrice, getCurrencySymbol } from "../utils/format";
import { CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CompleteOrderModalProps {
  completingOrder: Order | null;
  profitAmount: string;
  setProfitAmount: (v: string) => void;
  costGoingText: string;
  setCostGoingText: (v: string) => void;
  difficultiesText: string;
  setDifficultiesText: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function CompleteOrderModal({
  completingOrder,
  profitAmount,
  setProfitAmount,
  costGoingText,
  setCostGoingText,
  difficultiesText,
  setDifficultiesText,
  onSave,
  onClose,
}: CompleteOrderModalProps) {
  const [recipesList, setRecipesList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);

  useEffect(() => {
    if (!completingOrder) return;
    let active = true;
    const load = async () => {
      try {
        const [recs, invs] = await Promise.all([
          localDb.recipes.filter((r: any) => r.isDeleted !== 1).toArray(),
          localDb.inventory.filter((i: any) => i.isDeleted !== 1).toArray(),
        ]);
        if (active) {
          setRecipesList(recs);
          setInventoryList(invs);
        }
      } catch (err) {
        console.error("[CompleteOrderModal] Failed to load recipes/inventory:", err);
      }
    };
    load();
    const handleDbUpdate = () => load();
    window.addEventListener("db-update", handleDbUpdate);
    return () => {
      active = false;
      window.removeEventListener("db-update", handleDbUpdate);
    };
  }, [completingOrder]);

  const calculateOrderIngredients = (order: Order) => {
    if (!order || !order.cakeFlavor) return { list: [], totalCost: 0, recipeFound: false, recipeName: "" };
    const matchingRecipe = recipesList.find(
      (r: any) => r.isDeleted !== 1 && r.name.trim().toLowerCase() === order.cakeFlavor.trim().toLowerCase()
    );
    if (!matchingRecipe) return { list: [], totalCost: 0, recipeFound: false, recipeName: "" };
    const targetWeight = parseWeightToGrams(order.cakeWeight);
    const scaledIngredients = scaleRecipeIngredients(matchingRecipe, targetWeight);
    let totalCost = 0;
    const list = scaledIngredients.map((ing) => {
      const invItem = inventoryList.find(
        (item: any) => item.isDeleted !== 1 && item.name.trim().toLowerCase() === ing.name.trim().toLowerCase()
      );
      const costPrice = invItem ? invItem.costPrice : 0;
      const unit = invItem ? invItem.unit : "g";
      const quantityInInvUnits = ing.scaledQty;
      const cost = quantityInInvUnits * costPrice;
      totalCost += cost;
      return { name: ing.name, invQty: quantityInInvUnits, unit, costPrice, cost, invItemFound: !!invItem };
    });
    return { list, totalCost: parseFloat(totalCost.toFixed(2)), recipeFound: true, recipeName: matchingRecipe.name };
  };

  return (
    <AnimatePresence>
      {completingOrder && (
        <motion.div
          key="profit-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-order-heading"
            className="bg-white dark:bg-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-zinc-150 dark:border-zinc-700 max-h-[90vh] overflow-y-auto custom-scrollbar text-left space-y-4 font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-700/60">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 id="complete-order-heading" className="text-sm font-serif font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                  Capture Profit &amp; Bake Details
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 dark:text-zinc-505 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <XCircle className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-505 leading-relaxed font-sans">
              Great job completing{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">"{completingOrder.customerName}'s"</strong> cake
              order! To help floura analyze your business dashboard, please specify the final captured profit,
              difficulties faced, and where the costs were allocated.
            </p>

            {/* Ingredient Cost Summary */}
            {(() => {
              const ingDetails = calculateOrderIngredients(completingOrder);
              if (!ingDetails.recipeFound) {
                return (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-[11px] text-amber-700 dark:text-amber-400 text-left">
                    No matching recipe found for flavor "{completingOrder.cakeFlavor}" to auto-calculate ingredient
                    costs.
                  </div>
                );
              }
              return (
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-1.5 text-left">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Ingredient Cost Summary</span>
                    <span className="text-[10px] text-zinc-400">
                      Recipe: {ingDetails.recipeName} ({completingOrder.cakeWeight})
                    </span>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                    {ingDetails.list.map((ing, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-zinc-650 dark:text-zinc-400">
                          {ing.name} ({ing.invQty} {ing.unit})
                        </span>
                        <div className="space-x-2 font-mono">
                          <span className="text-zinc-400">
                            {ing.invQty.toFixed(2)} {ing.unit}
                          </span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-bold">{formatPrice(ing.cost)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-1.5 flex justify-between font-bold">
                    <span className="text-zinc-700 dark:text-zinc-300">Total Ingredient Cost:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-450">
                      {formatPrice(ingDetails.totalCost)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Form fields */}
            <div className="space-y-4 pt-1 font-sans">
              {/* Net Profit */}
              <div className="flex flex-col gap-1.5 font-sans">
                <div className="flex justify-between font-sans">
                  <label className="text-xs font-bold text-zinc-655 dark:text-zinc-300">
                    Net Profit Amount ({getCurrencySymbol()})
                  </label>
                  <span className="text-[10px] text-zinc-405">
                    Total Billed: {formatPrice(completingOrder.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-xl px-3 py-2.5">
                  <span className="text-zinc-400 text-xs font-bold">{getCurrencySymbol()}</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={profitAmount}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === "") {
                        setProfitAmount("");
                      } else {
                        if (/^0\d+/.test(val)) val = val.replace(/^0+/, "");
                        setProfitAmount(val);
                      }
                    }}
                    className="bg-transparent border-none outline-none text-xs w-full text-zinc-808 dark:text-zinc-105 font-bold"
                  />
                </div>
              </div>

              {/* Cost distribution */}
              <div className="flex flex-col gap-1.5 font-sans">
                <label className="text-xs font-bold text-zinc-655 dark:text-zinc-300">
                  Where did the cost go? (Cost Distribution)
                </label>
                <textarea
                  required
                  rows={2}
                  value={costGoingText}
                  onChange={(e) => setCostGoingText(e.target.value)}
                  placeholder="e.g. Eggs and premium flour (40%), chocolate decoration toppings (25%), fuel log (15%)"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 text-xs p-3 rounded-xl focus:ring-1 focus:ring-primary-brand text-zinc-808 dark:text-zinc-250 min-h-[50px] resize-none font-medium text-left"
                />
              </div>

              {/* Difficulties */}
              <div className="flex flex-col gap-1.5 font-sans">
                <label className="text-xs font-bold text-zinc-655 dark:text-zinc-300">
                  Bakes &amp; Decorative Difficulties Faced
                </label>
                <textarea
                  required
                  rows={2}
                  value={difficultiesText}
                  onChange={(e) => setDifficultiesText(e.target.value)}
                  placeholder="e.g. Heavy structural dowel integration, fondant figurines took 4 hours, or temperature humidity issues"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 text-xs p-3 rounded-xl focus:ring-1 focus:ring-primary-brand text-zinc-808 dark:text-zinc-250 min-h-[50px] resize-none font-medium text-left"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-3 font-sans">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition-colors text-center font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-transform active:scale-95 text-center shadow-md font-sans"
              >
                Save &amp; Complete Bake
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
