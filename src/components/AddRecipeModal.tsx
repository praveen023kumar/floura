// File Path: /src/components/AddRecipeModal.tsx
import React, { useState, useMemo } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { customSelectStyles } from "./customSelectStyles";
import { type Recipe } from "../types";
import { X, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onAddRecipe: (recipe: Omit<Recipe, "id" | "updatedAt">) => Promise<any>;
}

export default function AddRecipeModal({
  isOpen,
  onClose,
  recipes,
  onAddRecipe,
}: AddRecipeModalProps) {
  // Form states
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
  const dynamicRecipeCategories = useMemo(() => {
    const allUsedCategories = recipes.map((r) => r.category).filter(Boolean);
    const combined = Array.from(new Set([...defaultRecipeCategories, ...allUsedCategories]));
    return combined;
  }, [recipes, defaultRecipeCategories]);

  const defaultYieldUnits = useMemo(() => ["G", "KG", "Pieces"], []);
  const dynamicYieldUnits = useMemo(() => {
    const allUsedUnits = recipes.map((r) => r.yieldUnit).filter(Boolean);
    const combined = Array.from(new Set([...defaultYieldUnits, ...allUsedUnits]));
    return combined;
  }, [recipes, defaultYieldUnits]);

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
      window.showToast?.("Please provide valid recipe name and valid row ingredient descriptions", "warning");
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
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      window.showToast?.("Failed to store recipe", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />
          
          {/* Slide-up Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-[32px] shadow-2xl border-t border-zinc-200 dark:border-zinc-850 p-6 z-10 max-h-[85vh] overflow-y-auto pb-8 text-left"
          >
            {/* Pill Drag Handle Indicator */}
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-zinc-850 dark:text-zinc-200">Add New Recipe</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Write custom formulas and list structural ratio ingredients.</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecipeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Recipe Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. French Croissants"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-xs p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
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
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Base Yield</label>
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
                    className="bg-white dark:bg-zinc-800 text-xs p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
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

              {/* Dynamic row items adding */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Formula Ingredients List</label>

                <div className="border border-zinc-200 dark:border-zinc-750 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-750 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900">Ingredient Name</th>
                        <th className="px-4 py-2">Quantity (Grams)</th>
                        <th className="px-4 py-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-700/55">
                      {formIngredients.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-1.5">
                            <input
                              required
                              type="text"
                              placeholder="e.g. Vanilla Extract"
                              value={item.name}
                              onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                              className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-1.5">
                            <input
                              required
                              type="number"
                              placeholder="0"
                              value={item.qty}
                              onChange={(e) => handleIngredientChange(idx, "qty", e.target.value)}
                              className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-1.5 text-center">
                            {formIngredients.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredientRow(idx)}
                                className="text-rose-500 hover:text-rose-600 p-1 rounded cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="bg-zinc-50/50 dark:bg-zinc-900/10 p-2 border-t border-zinc-150 dark:border-zinc-750">
                    <button
                      type="button"
                      onClick={handleAddIngredientRow}
                      className="text-sweet-pink font-bold text-xs p-1 cursor-pointer flex items-center gap-1 text-left hover:opacity-80 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" /> Append Ingredient Formula Row
                    </button>
                  </div>
                </div>
              </div>

              {/* Cover image URL field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Optional Illustration Asset Link (URL)</label>
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-white dark:bg-zinc-800 text-xs p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-400 focus:outline-none dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 border border-zinc-250 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || success}
                  className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 ${
                    success
                      ? "bg-emerald-500 text-white"
                      : "bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-400 dark:hover:bg-orange-555 text-white"
                  }`}
                >
                  {saving ? (
                    <span>Storing Ratio Formula...</span>
                  ) : success ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Formulation Formula Recorded</span>
                  ) : (
                    <span>Save Volumetric Formula</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
