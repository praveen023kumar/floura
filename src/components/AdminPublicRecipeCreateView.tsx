// File Path: /src/components/AdminPublicRecipeCreateView.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Plus, Trash2, Globe, Search, Sparkles, Clock, ListOrdered, Code } from "lucide-react";
import { motion } from "motion/react";
import { getApiUrl } from "../utils/api";
import { type Recipe, type RecipeInstructionStep } from "../types";

interface AdminPublicRecipeCreateViewProps {
  onNavigate?: (path: string) => void;
}

export default function AdminPublicRecipeCreateView({ onNavigate }: AdminPublicRecipeCreateViewProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Recipe Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cakes");
  const [stdYield, setStdYield] = useState<number | "">(1000);
  const [yieldUnit, setYieldUnit] = useState("grams");
  const [ingredients, setIngredients] = useState<{ name: string; qty: number | "" }[]>([
    { name: "Cake Flour", qty: 250 },
    { name: "Caster Sugar", qty: 250 },
    { name: "Unsalted Butter", qty: 250 }
  ]);
  const [instructions, setInstructions] = useState<{ stepNumber: number; text: string; note?: string }[]>([
    { stepNumber: 1, text: "Preheat oven to 175°C (350°F) and grease pan.", note: "Use baking parchment on bottom" }
  ]);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(20);
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number>(30);

  // SEO Fields
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Auto generate slug from title if autoSlug enabled
  useEffect(() => {
    if (autoSlug && name) {
      const generated = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setSlug(generated);
    }
  }, [name, autoSlug]);

  // Load recipe if editing
  useEffect(() => {
    async function loadRecipeForEdit() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(getApiUrl(`/api/public/recipes/${id}`));
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.recipe) {
            const r: Recipe = data.recipe;
            setName(r.name);
            setCategory(r.category);
            setStdYield(r.stdYield);
            setYieldUnit(r.yieldUnit);
            setIngredients(r.ingredients || []);
            setInstructions(r.instructions || []);
            setPrepTimeMinutes(r.prepTimeMinutes || 15);
            setCookTimeMinutes(r.cookTimeMinutes || 20);
            setSlug(r.slug || "");
            setAutoSlug(false);
            setMetaTitle(r.metaTitle || "");
            setMetaDescription(r.metaDescription || "");
            setOgImage(r.ogImage || "");
            setKeywords(r.keywords || "");
            setIsPublic(!!r.isPublic);
          }
        }
      } catch (err) {
        console.error("Failed to load recipe for edit:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecipeForEdit();
  }, [id]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", qty: "" }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, { stepNumber: instructions.length + 1, text: "", note: "" }]);
  };

  const handleRemoveInstruction = (index: number) => {
    const updated = instructions.filter((_, idx) => idx !== index).map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
    setInstructions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !stdYield || !yieldUnit) {
      alert("Please fill in Name, Standard Yield, and Unit.");
      return;
    }

    const validIngredients = ingredients
      .filter((i) => i.name.trim() !== "" && Number(i.qty) > 0)
      .map((i) => ({ name: i.name.trim(), qty: Number(i.qty) }));

    const validInstructions = instructions
      .filter((step) => step.text.trim() !== "")
      .map((step, idx) => ({
        stepNumber: idx + 1,
        text: step.text.trim(),
        note: step.note ? step.note.trim() : undefined
      }));

    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const payload = {
      id: id || undefined,
      name,
      category,
      stdYield: Number(stdYield),
      yieldUnit,
      ingredients: validIngredients,
      instructions: validInstructions,
      prepTimeMinutes: Number(prepTimeMinutes) || 15,
      cookTimeMinutes: Number(cookTimeMinutes) || 20,
      slug: cleanSlug,
      metaTitle: metaTitle || `${name} Recipe & Yield Calculator | Floura`,
      metaDescription: metaDescription || `Calculate exact ingredient measurements for ${name} by batch yield. Interactive baker's ratio calculator.`,
      ogImage,
      keywords,
      isPublic: isPublic ? 1 : 0
    };

    try {
      setSaving(true);
      const url = id ? getApiUrl(`/api/admin/public-recipes/${id}`) : getApiUrl("/api/admin/public-recipes");
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (onNavigate) {
            onNavigate("/calculator");
          } else {
            navigate("/calculator");
          }
        }
      } else {
        alert("Failed to save public recipe.");
      }
    } catch (err) {
      console.error("Save public recipe error:", err);
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-400 text-sm">
        Loading public recipe builder...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left max-w-5xl mx-auto pb-16 font-sans"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-zinc-800 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate("/calculator") : navigate("/calculator")}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{id ? "Edit Public SEO Recipe" : "Create New Public SEO Recipe"}</span>
              <Globe className="w-5 h-5 text-orange-500" />
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage public recipe formulation, interactive yield scaling, and Google search SEO settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate("/calculator") : navigate("/calculator")}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Publish SEO Recipe"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recipe Measurements & Steps */}
        <div className="lg:col-span-7 space-y-6">
          {/* Core Info Box */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-white border-b border-zinc-150 dark:border-zinc-700 pb-2">
              1. Recipe Identification
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Recipe Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., French Macaron Shells"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-3 rounded-xl text-xs font-semibold"
                  >
                    <option value="Macarons">Macarons</option>
                    <option value="Cakes">Cakes</option>
                    <option value="Pastry">Pastry</option>
                    <option value="Frosting">Frosting</option>
                    <option value="Bread">Bread</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Base Batch Yield *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      value={stdYield}
                      onChange={(e) => setStdYield(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="1000"
                      className="w-1/2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-3 rounded-xl text-xs font-semibold"
                    />
                    <input
                      type="text"
                      required
                      value={yieldUnit}
                      onChange={(e) => setYieldUnit(e.target.value)}
                      placeholder="shells / grams / cake"
                      className="w-1/2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-3 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Prep & Cook Times */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Prep Time (Minutes)</span>
                  </label>
                  <input
                    type="number"
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                    placeholder="15"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-3 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cook/Bake Time (Minutes)</span>
                  </label>
                  <input
                    type="number"
                    value={cookTimeMinutes}
                    onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                    placeholder="20"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-3 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ingredient Measurements */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-700 pb-2">
              <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-white">
                2. Ingredient Measurements (Grams)
              </h3>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Ingredient ${idx + 1}`}
                    value={ing.name}
                    onChange={(e) => {
                      const updated = [...ingredients];
                      updated[idx].name = e.target.value;
                      setIngredients(updated);
                    }}
                    className="w-2/3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="number"
                    placeholder="Qty (g)"
                    value={ing.qty}
                    onChange={(e) => {
                      const updated = [...ingredients];
                      updated[idx].qty = e.target.value === "" ? "" : Number(e.target.value);
                      setIngredients(updated);
                    }}
                    className="w-1/3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="p-2 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation Instructions */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-700 pb-2">
              <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-white flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-amber-500" />
                <span>3. Preparation Steps (Google Schema.org)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddInstruction}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Step
              </button>
            </div>

            <div className="space-y-3">
              {instructions.map((step, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-500">Step {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(idx)}
                      className="text-zinc-400 hover:text-red-500 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Describe step preparation instructions..."
                    value={step.text}
                    onChange={(e) => {
                      const updated = [...instructions];
                      updated[idx].text = e.target.value;
                      setInstructions(updated);
                    }}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: SEO Configuration & Preview Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-700 pb-2">
              <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>SEO Metadata Setup</span>
              </h3>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span>Public Page</span>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              {/* URL Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">URL Slug *</label>
                  <label className="text-[10px] text-zinc-400 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSlug}
                      onChange={(e) => setAutoSlug(e.target.checked)}
                    />
                    <span>Auto-generate</span>
                  </label>
                </div>
                <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-500 font-mono">
                  <span className="text-[10px] select-none">/calculator/</span>
                  <input
                    type="text"
                    disabled={autoSlug}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                    placeholder="french-macaron-shells-calculator"
                    className="w-full bg-transparent text-zinc-900 dark:text-white border-none focus:outline-none text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Meta Title */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Meta Title Tag</label>
                  <span className={`text-[10px] ${metaTitle.length > 60 ? "text-red-500 font-bold" : "text-zinc-400"}`}>
                    {metaTitle.length}/60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={`${name || "Recipe"} & Ratio Calculator | Floura`}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Meta Description Tag</label>
                  <span className={`text-[10px] ${metaDescription.length > 160 ? "text-red-500 font-bold" : "text-zinc-400"}`}>
                    {metaDescription.length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={`Calculate exact ingredient weights for ${name || "recipe"} based on desired yield. Interactive baker ratio scale.`}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-medium"
                />
              </div>

              {/* OG Image URL */}
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Social Preview Image URL (OG Image)</label>
                <input
                  type="url"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://example.com/images/macarons.jpg"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Google Search Result Live Preview Box */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-700 pb-2">
              <Search className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold font-serif text-zinc-900 dark:text-white">
                Google Search Result Preview
              </h3>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/50 space-y-1">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                https://floura.app › calculator › {slug || "recipe-calculator"}
              </div>
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {metaTitle || `${name || "Recipe Name"} & Batch Ratio Calculator | Floura`}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                {metaDescription || `Calculate exact ingredient measurements for ${name || "this recipe"} by yield or batch size. Step-by-step baking formulation.`}
              </div>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
