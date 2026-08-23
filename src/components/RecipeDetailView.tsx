// File Path: /src/components/RecipeDetailView.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { localDb } from "../db";
import { type Recipe } from "../types";
import { ArrowLeft, Calculator, Scale, BookOpen, Edit } from "lucide-react";
import { motion } from "motion/react";

export default function RecipeDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [desiredUnits, setDesiredUnits] = useState<number | string>("");
  const [loading, setLoading] = useState(true);

  // Load recipe details from Local IndexedDB
  useEffect(() => {
    async function loadRecipe() {
      if (id) {
        try {
          const found = await localDb.recipes.get(id);
          if (found) {
            setRecipe(found);
            setDesiredUnits(found.stdYield);
          }
        } catch (err) {
          console.error("Failed to load recipe details from localDb:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadRecipe();
  }, [id]);

  // Scaled ingredient weights memoization
  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    
    const targetUnits = desiredUnits === "" ? 0 : Number(desiredUnits);
    const ratio = recipe.stdYield > 0 && !isNaN(targetUnits) ? targetUnits / recipe.stdYield : 0;

    return recipe.ingredients.map((ing) => ({
      name: ing.name,
      originalQty: ing.qty,
      scaledQty: Number((ing.qty * ratio).toFixed(1)),
    }));
  }, [recipe, desiredUnits]);

  if (loading) {
    return (
      <div className="text-center py-12 text-zinc-400 text-sm">
        Loading formulation specifications...
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="space-y-6 text-left">
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-700/60 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/recipes")}
            className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-755 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold font-serif text-zinc-800 dark:text-zinc-100 font-sans">
              Recipe Not Discovered
            </h2>
            <p className="text-xs text-zinc-450 mt-0.5">
              The requested formula standard does not exist or has been deleted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-6 text-left"
    >
      {/* Header/Back Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700/60 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/recipes")}
            className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
            title="Back to recipes list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-zinc-805 dark:text-zinc-105">
                {recipe.name}
              </h2>
              <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase rounded bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 tracking-wider font-sans">
                {recipe.category}
              </span>
            </div>
            <p className="text-xs text-zinc-455 mt-0.5 font-sans">
              Standard recipe formulation details & interactive scaling matrix.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/recipes/new", { state: { recipe } })}
            className="bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white py-1.5 px-4 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md font-sans"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Recipe
          </button>
          <button
            type="button"
            onClick={() => navigate("/recipes")}
            className="border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-zinc-750 dark:text-zinc-300"
          >
            Back to Recipe Book
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Smart Yield Scaler */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-primary-brand text-white dark:bg-zinc-800 dark:text-zinc-200 p-6 rounded-3xl shadow-lg space-y-4 border border-primary-brand/10 dark:border-orange-400/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-[40%] translate-y-[40%] w-36 h-36 bg-white/10 dark:bg-orange-500/10 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-zinc-100 dark:text-orange-400" />
              <h3 className="text-lg font-serif font-bold text-white dark:text-zinc-100">
                Smart Yield Scaler
              </h3>
            </div>

            <div className="space-y-4 text-left font-sans">
              <div className="bg-white/10 dark:bg-zinc-900/40 p-3 rounded-xl">
                <span className="text-[10px] text-zinc-200 dark:text-zinc-400 block font-bold uppercase tracking-wider">Base Recipe Formula Standard</span>
                <p className="text-sm font-bold text-white mt-1">
                  100% Volume Yield: {recipe.stdYield} {recipe.yieldUnit}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-100/90 dark:text-zinc-350">
                  Desired Output Volume ({recipe.yieldUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder={`e.g. ${recipe.stdYield}`}
                  value={desiredUnits}
                  onChange={(e) => setDesiredUnits(e.target.value)}
                  className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-350 p-3 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-orange-350 w-full"
                />
              </div>
            </div>

            <div className="bg-white/15 dark:bg-zinc-900/65 backdrop-blur-md rounded-2xl p-4 border border-white/10 dark:border-zinc-700/60 text-left">
              <h4 className="text-xs font-bold text-white dark:text-orange-400 mb-2.5 flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> Scaled Ingredient Matrix
              </h4>

              <div className="space-y-2">
                {scaledIngredients.length > 0 ? (
                  scaledIngredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="bg-white/10 dark:bg-zinc-800/80 border border-white/5 dark:border-zinc-700/40 p-2.5 rounded-xl flex justify-between items-center px-4 hover:bg-white/20 transition-all"
                    >
                      <span className="text-xs font-medium text-white/90">{ing.name}</span>
                      <span className="text-xs font-bold font-mono tracking-wide bg-white/20 dark:bg-zinc-900 px-2.5 py-0.5 rounded-lg text-white">
                        {ing.scaledQty}g
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-zinc-200/60 py-4 text-xs">No formulation items specified.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Original Recipe specs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-700/60 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-700/60">
              <BookOpen className="w-4 h-4 text-primary-brand dark:text-orange-400" />
              <h3 className="text-xs font-bold text-zinc-750 dark:text-zinc-305 uppercase tracking-wider font-sans">
                Standard Ratio Ingredients List (100% Base Formula)
              </h3>
            </div>

            <div className="overflow-hidden border border-zinc-150 dark:border-zinc-750 rounded-xl font-sans">
              <table className="w-full text-xs">
                <thead className="bg-zinc-55 dark:bg-zinc-900/60 border-b border-zinc-150 dark:border-zinc-750 text-zinc-500 font-bold">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-sans">Ingredient</th>
                    <th className="px-4 py-2.5 text-right font-sans">Quantity (Base)</th>
                    <th className="px-4 py-2.5 text-right font-sans">Weight Ratio (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-750">
                  {recipe.ingredients.map((ing, idx) => {
                    const totalBaseQty = recipe.ingredients.reduce((acc, curr) => acc + curr.qty, 0);
                    const percentage = totalBaseQty > 0 ? ((ing.qty / totalBaseQty) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/10">
                        <td className="px-4 py-2.5 text-zinc-800 dark:text-zinc-300 font-medium">{ing.name}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-650 dark:text-zinc-350">{ing.qty}g</td>
                        <td className="px-4 py-2.5 text-right text-zinc-405 font-mono">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-150 shrink-0">
                <img
                  src={(recipe.imageBase64?.startsWith("data:image/") ? recipe.imageBase64 : undefined) || recipe.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150"}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150";
                  }}
                />
              </div>
              <div className="text-left font-sans text-xs text-zinc-500">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block">Formulation Reference Visual</span>
                <span className="block mt-0.5">Yield scale factor automatically updates quantities of all ingredients dynamically.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
