// File Path: /src/components/RecipeCreateView.tsx
import React, { useState, useMemo, useEffect, useRef, memo } from "react";
import { memoWithData } from "../utils/memo";
import CreatableSelect from "react-select/creatable";
import AsyncCreatableSelect from "react-select/async-creatable";
import { customSelectStyles, tableSelectStyles } from "./customSelectStyles";
import { type Recipe } from "../types";

import { ArrowLeft, CheckCircle2, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { motion } from "motion/react";
import { localDb } from "../db";
import { compressImage } from "../hooks/useProfile";

interface RecipeCreateViewProps {
  onAddRecipe: (recipe: Omit<Recipe, "id" | "updatedAt">) => Promise<any>;
  onUpdateRecipe?: (recipe: Recipe) => Promise<any>;
  onNavigate?: (path: string | number) => void;
  recipeToEdit?: Recipe | null;
}

function RecipeCreateView({
  onAddRecipe,
  onUpdateRecipe,
  onNavigate,
  recipeToEdit,
}: RecipeCreateViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Cakes");
  const [stdYield, setStdYield] = useState<number | "">(1000);
  const [yieldUnit, setYieldUnit] = useState<string>("G");
  const [formIngredients, setFormIngredients] = useState<any[]>([
    { name: "", qty: "" }
  ]);
  // base64 image state — only set from file upload
  const [imageBase64, setImageBase64] = useState("");

  useEffect(() => {
    if (recipeToEdit) {
      setName(recipeToEdit.name);
      setCategory(recipeToEdit.category);
      setStdYield(recipeToEdit.stdYield);
      setYieldUnit(recipeToEdit.yieldUnit);
      setFormIngredients(recipeToEdit.ingredients);
      // Only restore base64 if it's a valid image (not corrupt text/html data)
      const b64 = recipeToEdit.imageBase64 || "";
      setImageBase64(b64.startsWith("data:image/") ? b64 : "");
    } else {
      setName("");
      setCategory("Cakes");
      setStdYield(1000);
      setYieldUnit("G");
      setFormIngredients([
        { name: "", qty: "" }
      ]);
      setImageBase64("");
    }
  }, [recipeToEdit]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ingredientUnits, setIngredientUnits] = useState<Record<string, string>>({});

  useEffect(() => {
    const names = formIngredients.map((i: any) => i.name).filter(Boolean);
    if (names.length === 0) return;

    const placeholders = names.map(() => "?").join(",");
    localDb.inventory.query(`SELECT name, unit FROM inventory WHERE name IN (${placeholders})`, names)
      .then((rows: any) => {
        const newUnits: Record<string, string> = {};
        rows.forEach((r: any) => {
          newUnits[r.name] = r.unit;
        });
        setIngredientUnits(prev => ({ ...prev, ...newUnits }));
      })
      .catch((err: any) => console.error("Failed to load ingredient units in RecipeCreateView:", err));
  }, [formIngredients]);

  const loadIngredientOptions = async (inputValue: string): Promise<{ value: string; label: string }[]> => {
    try {
      let items;
      if (!inputValue) {
        items = await localDb.inventory.query(
          "SELECT * FROM inventory WHERE isDeleted = 0 ORDER BY name ASC LIMIT 30"
        );
      } else {
        items = await localDb.inventory.query(
          "SELECT * FROM inventory WHERE isDeleted = 0 AND name LIKE ? ORDER BY name ASC LIMIT 30",
          [`%${inputValue}%`]
        );
      }

      const newUnits: Record<string, string> = {};
      items.forEach((item: any) => {
        newUnits[item.name] = item.unit;
      });
      setIngredientUnits(prev => ({ ...prev, ...newUnits }));

      return items.map((invItem: any) => ({
        value: invItem.name,
        label: `${invItem.name} (${invItem.unit})`
      }));
    } catch (err) {
      console.error("Failed to search inventory items:", err);
      return [];
    }
  };

  const defaultRecipeCategories = useMemo(() => ["Cakes", "Viennoiserie", "Tarts", "Confectionary", "Classic", "Pastry"], []);
  const [dynamicRecipeCategories, setDynamicRecipeCategories] = useState<string[]>(defaultRecipeCategories);

  const defaultYieldUnits = useMemo(() => ["G", "KG", "Pieces"], []);
  const [dynamicYieldUnits, setDynamicYieldUnits] = useState<string[]>(defaultYieldUnits);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [dbCats, activeRecipesUnits] = await Promise.all([
          localDb.categories.filter(c => c.type === "recipe" && c.isDeleted !== 1).toArray(),
          localDb.recipes.query("SELECT yieldUnit FROM recipes WHERE isDeleted = 0")
        ]);
        const catNames = dbCats.map(c => c.name);
        const allUsedUnits = activeRecipesUnits.map((r: any) => r.yieldUnit).filter(Boolean);

        setDynamicRecipeCategories(Array.from(new Set([...defaultRecipeCategories, ...catNames])));
        setDynamicYieldUnits(Array.from(new Set([...defaultYieldUnits, ...allUsedUnits])));
      } catch (err) {
        console.error("Failed to load recipes metadata for auto-complete:", err);
      }
    }
    loadOptions();
  }, [defaultRecipeCategories, defaultYieldUnits]);

  // ── File upload handler ──────────────────────────────────────────────────────
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.showToast?.("Please select a valid image file (JPG, PNG, WebP, etc.)", "error");
      return;
    }

    try {
      const raw = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Failed to read file"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const compressed = await compressImage(raw, 400, 400);
      setImageBase64(compressed);
    } catch (err) {
      console.error("Failed to process image:", err);
      window.showToast?.("Failed to process image. Please try another file.", "error");
    }

    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  // ── Ingredient helpers ───────────────────────────────────────────────────────
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

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleCreateRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || formIngredients.some((i) => !i.name)) {
      window.showToast?.("Please provide valid recipe name and ingredient descriptions", "warning");
      return;
    }

    setSaving(true);

    try {
      if (recipeToEdit && onUpdateRecipe) {
        await onUpdateRecipe({
          ...recipeToEdit,
          name,
          category,
          stdYield: Number(stdYield) || 0,
          yieldUnit,
          ingredients: formIngredients.map((ing) => ({
            name: ing.name,
            qty: Number(ing.qty) || 0,
          })),
          imageUrl: "",
          imageBase64,
        });
        window.showToast?.("Recipe updated successfully!", "success");
      } else {
        await onAddRecipe({
          name,
          category,
          stdYield: Number(stdYield) || 0,
          yieldUnit,
          ingredients: formIngredients.map((ing) => ({
            name: ing.name,
            qty: Number(ing.qty) || 0,
          })),
          imageUrl: "",
          imageBase64,
        });
        window.showToast?.("Recipe added successfully!", "success");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (!recipeToEdit) {
          setName("");
          setCategory("Cakes");
          setStdYield(1000);
          setFormIngredients([{ name: "", qty: "" }]);
          setImageBase64("");
        }
        onNavigate?.("/recipes");
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
          onClick={() => onNavigate?.("/recipes")}
          className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-755 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-serif text-zinc-800 dark:text-zinc-100 font-sans">
            {recipeToEdit ? "Edit Recipe" : "Add New Recipe"}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {recipeToEdit
              ? "Modify formula specifications and structural ratio ingredients."
              : "Write custom formulas and list structural ratio ingredients."}
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
          <div className="p-1 pb-4 space-y-4 text-left">
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

                {/* ── Image Upload ─────────────────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    Recipe Photo <span className="font-normal text-zinc-400">(Optional)</span>
                  </label>

                  {imageBase64 ? (
                    /* Preview */
                    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 group">
                      <img
                        src={imageBase64}
                        alt="Recipe preview"
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white/90 text-zinc-800 text-xs font-bold rounded-lg hover:bg-white transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <ImagePlus className="w-3.5 h-3.5" />
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageBase64("")}
                          className="px-3 py-1.5 bg-rose-500/90 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload zone */
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-36 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-primary-brand dark:hover:border-orange-400 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100/60 dark:hover:bg-zinc-800 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 group-hover:bg-primary-brand/10 dark:group-hover:bg-orange-400/10 flex items-center justify-center transition-colors">
                        <ImagePlus className="w-5 h-5 text-zinc-400 group-hover:text-primary-brand dark:group-hover:text-orange-400 transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-primary-brand dark:group-hover:text-orange-400 transition-colors">
                          Tap to upload photo
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG, WebP — max display 400×400px</p>
                      </div>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
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
                          <th className="px-4 py-2.5">Quantity</th>
                          <th className="px-4 py-2.5 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-250/50 dark:divide-zinc-700/55">
                        {formIngredients.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-1.5">
                              <AsyncCreatableSelect
                                required
                                styles={tableSelectStyles}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                placeholder="Select ingredient..."
                                loadOptions={loadIngredientOptions}
                                defaultOptions
                                cacheOptions
                                value={item.name ? { 
                                  value: item.name, 
                                  label: ingredientUnits[item.name] 
                                    ? `${item.name} (${ingredientUnits[item.name]})` 
                                    : item.name 
                                } : null}
                                onChange={(opt) => handleIngredientChange(idx, "name", opt ? opt.value : "")}
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
              onClick={() => onNavigate?.("/recipes")}
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
                  <CheckCircle2 className="w-4 h-4" /> {recipeToEdit ? "Formula Updated!" : "Formula Registered!"}
                </span>
              ) : (
                <span>{recipeToEdit ? "Update Recipe Formula" : "Register Recipe Formula"}</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default memoWithData(RecipeCreateView);
