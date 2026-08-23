// File Path: /src/components/RecipeCreateView.tsx
import React, { useState, useMemo, useEffect } from "react";
import CreatableSelect from "react-select/creatable";
import { customSelectStyles } from "./customSelectStyles";
import { type Recipe } from "../types";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { localDb } from "../db";

const validateImageUrl = (url: string): string | null => {
  if (!url) return null;
  
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (_) {
    return "Please enter a valid absolute URL starting with http:// or https://";
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return "URL must use http:// or https:// protocol";
  }

  const hostname = parsedUrl.hostname;
  const isAllowedDomain = 
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "images.unsplash.com" ||
    hostname === "googleusercontent.com" ||
    hostname.endsWith(".googleusercontent.com");

  if (!isAllowedDomain) {
    return "This domain violates Content Security Policy. Only images from unsplash.com and googleusercontent.com are allowed.";
  }

  const pathname = parsedUrl.pathname.toLowerCase();
  const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(pathname);
  const isUnsplashDirectImage = hostname === "images.unsplash.com" && pathname.startsWith("/photo-");

  if (!hasImageExtension && !isUnsplashDirectImage) {
    return "URL must link directly to an image file (e.g. ending in .jpg, .png, .webp) rather than a webpage.";
  }

  return null;
};

interface RecipeCreateViewProps {
  onAddRecipe: (recipe: Omit<Recipe, "id" | "updatedAt">) => Promise<any>;
}

export default function RecipeCreateView({
  onAddRecipe,
}: RecipeCreateViewProps) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Cakes");
  const [stdYield, setStdYield] = useState<number | "">(1000);
  const [yieldUnit, setYieldUnit] = useState<string>("G");
  const [formIngredients, setFormIngredients] = useState<any[]>([
    { name: "Flour", qty: 250 },
    { name: "Sugar", qty: 100 }
  ]);
  const [imageUrl, setImageUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const defaultRecipeCategories = useMemo(() => ["Cakes", "Viennoiserie", "Tarts", "Confectionary", "Classic", "Pastry"], []);
  const [dynamicRecipeCategories, setDynamicRecipeCategories] = useState<string[]>(defaultRecipeCategories);

  const defaultYieldUnits = useMemo(() => ["G", "KG", "Pieces"], []);
  const [dynamicYieldUnits, setDynamicYieldUnits] = useState<string[]>(defaultYieldUnits);

  // Load category and unit suggestions from DB categories and recipes
  useEffect(() => {
    async function loadOptions() {
      try {
        const [dbCats, activeRecipes] = await Promise.all([
          localDb.categories.filter(c => c.type === "recipe" && c.isDeleted !== 1).toArray(),
          localDb.recipes.filter(r => r.isDeleted !== 1).toArray()
        ]);
        const catNames = dbCats.map(c => c.name);
        const allUsedUnits = activeRecipes.map((r) => r.yieldUnit).filter(Boolean);

        setDynamicRecipeCategories(Array.from(new Set([...defaultRecipeCategories, ...catNames])));
        setDynamicYieldUnits(Array.from(new Set([...defaultYieldUnits, ...allUsedUnits])));
      } catch (err) {
        console.error("Failed to load recipes metadata for auto-complete:", err);
      }
    }
    loadOptions();
  }, [defaultRecipeCategories, defaultYieldUnits]);

  const handleAddIngredientRow = () => {
    setFormIngredients([...formIngredients, { name: "", qty: 0 }]);
  };

  const handleRemoveIngredientRow = (idx: number) => {
    const updated = formIngredients.filter((_, i) => i !== idx);
    setFormIngredients(updated);
  };

  const handleIngredientChange = (idx: number, field: "name" | "qty", val: any) => {
    const updated = formIngredients.map((item, i) => {
      if (i === idx) {
        let cleanVal = val;
        if (field === "qty" && cleanVal !== "") {
          if (/^0\d+/.test(cleanVal)) {
            cleanVal = cleanVal.replace(/^0+/, "");
          }
        }
        return {
          ...item,
          [field]: field === "qty" ? (cleanVal === "" ? "" : Number(cleanVal)) : val
        };
      }
      return item;
    });
    setFormIngredients(updated);
  };

  const handleCreateRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || formIngredients.some((i) => !i.name)) {
      window.showToast?.("Please provide valid recipe name and ingredient descriptions", "warning");
      return;
    }

    const imgError = validateImageUrl(imageUrl);
    if (imgError) {
      window.showToast?.(imgError, "error");
      return;
    }

    setSaving(true);
    try {
      await onAddRecipe({
        name,
        category,
        stdYield: Number(stdYield) || 0,
        yieldUnit,
        ingredients: formIngredients.map((ing) => ({
          name: ing.name,
          qty: Number(ing.qty) || 0,
        })),
        imageUrl: imageUrl || ""
      });

      setSuccess(true);
      window.showToast?.("Recipe added successfully!", "success");
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setCategory("Cakes");
        setStdYield(1000);
        setFormIngredients([{ name: "Flour", qty: 250 }, { name: "Sugar", qty: 100 }]);
        setImageUrl("");
        navigate("/recipes");
      }, 1000);
    } catch (err) {
      console.error(err);
      window.showToast?.("Failed to store recipe", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header with back button */}
      <div className="flex items-center gap-4 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700/60 shadow-sm">
        <button
          type="button"
          onClick={() => navigate("/recipes")}
          className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-755 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-serif text-zinc-800 dark:text-zinc-100 font-sans">
            Add New Recipe
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Write custom formulas and list structural ratio ingredients.
          </p>
        </div>
      </div>

      {/* Main card form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-150 dark:border-zinc-800"
      >
        <form onSubmit={handleCreateRecipeSubmit} className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto p-1 pb-4 pr-3 space-y-4 custom-scrollbar text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Left Column: Recipe Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Recipe Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. French Croissants"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Category</label>
                    <CreatableSelect
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      placeholder="Select or type..."
                      value={category ? { value: category, label: category } : null}
                      options={dynamicRecipeCategories.map((c) => ({ value: c, label: c }))}
                      onChange={(opt) => setCategory(opt?.value || "")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Base Yield Volume</label>
                    <input
                      required
                      type="number"
                      placeholder="1000"
                      value={stdYield}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val === "") {
                          setStdYield("");
                        } else {
                          if (/^0\d+/.test(val)) {
                            val = val.replace(/^0+/, "");
                          }
                          setStdYield(parseInt(val, 10) || 0);
                        }
                      }}
                      className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Unit</label>
                    <CreatableSelect
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      placeholder="Select or type..."
                      value={yieldUnit ? { value: yieldUnit, label: yieldUnit } : null}
                      options={dynamicYieldUnits.map((u) => ({ value: u, label: u }))}
                      onChange={(opt) => setYieldUnit(opt?.value || "")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Reference Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or keep blank for default"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Right Column: Ingredients Table */}
              <div className="space-y-4">
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Formula Ingredients List</label>

                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900">Ingredient Name</th>
                          <th className="px-4 py-2.5">Quantity (Grams)</th>
                          <th className="px-4 py-2.5 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-250/50 dark:divide-zinc-700/55">
                        {formIngredients.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-1.5">
                              <input
                                required
                                type="text"
                                placeholder="e.g. Vanilla Extract"
                                value={item.name}
                                onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-zinc-800 dark:text-zinc-250 font-bold focus:outline-none"
                              />
                            </td>
                            <td className="px-4 py-1.5">
                              <input
                                required
                                type="number"
                                placeholder="0"
                                value={item.qty}
                                onChange={(e) => handleIngredientChange(idx, "qty", e.target.value)}
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-zinc-850 dark:text-zinc-250 font-bold focus:outline-none font-mono"
                              />
                            </td>
                            <td className="px-4 py-1.5 text-right">
                              {formIngredients.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredientRow(idx)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-97"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Ingredient Row
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => navigate("/recipes")}
              className="px-6 py-2.5 border border-zinc-250 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className="px-8 py-2.5 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-400 dark:hover:bg-orange-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
            >
              {saving ? (
                <span>Saving Formula...</span>
              ) : success ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Formula Registered!
                </span>
              ) : (
                <span>Register Recipe Formula</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
