// File Path: /src/components/admin/AdminPublicRecipesTab.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Globe,
  ExternalLink,
  Edit3,
  Trash2,
  RefreshCw,
  Clock,
  Scale,
  ChefHat,
  Tag,
  AlertCircle,
  CheckCircle2,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../../utils/api";
import { type Recipe } from "../../types";
import AdminPublicRecipeCreateView from "../AdminPublicRecipeCreateView";

interface AdminPublicRecipesTabProps {
  onNavigate?: (path: string) => void;
}

export default function AdminPublicRecipesTab({ onNavigate }: AdminPublicRecipesTabProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View state: "list" or "form"
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchRecipes = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch(getApiUrl("/api/public/recipes"));
      if (!res.ok) {
        throw new Error("Failed to load public recipes");
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
      } else {
        setRecipes([]);
      }
    } catch (err: any) {
      console.error("Error fetching public recipes:", err);
      setError(err.message || "Failed to fetch public recipes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [recipes]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesCategory =
        selectedCategory === "all" ||
        recipe.category?.toLowerCase() === selectedCategory.toLowerCase();

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        recipe.name?.toLowerCase().includes(term) ||
        recipe.slug?.toLowerCase().includes(term) ||
        recipe.category?.toLowerCase().includes(term) ||
        recipe.keywords?.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [recipes, searchTerm, selectedCategory]);

  const handleCreateNew = () => {
    setEditingRecipeId(null);
    setViewMode("form");
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id || recipe.slug || null);
    setViewMode("form");
  };

  const handleDelete = async (recipe: Recipe) => {
    if (!recipe.id) return;
    try {
      setDeletingId(recipe.id);
      const res = await fetch(getApiUrl(`/api/admin/public-recipes/${recipe.id}`), {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
        setDeleteConfirmId(null);
      } else {
        alert(data.error || "Failed to delete recipe");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete recipe");
    } finally {
      setDeletingId(null);
    }
  };

  // If in form mode, render the creation / editing form
  if (viewMode === "form") {
    return (
      <AdminPublicRecipeCreateView
        editRecipeId={editingRecipeId}
        onBack={() => {
          setViewMode("list");
          setEditingRecipeId(null);
          fetchRecipes();
        }}
        onNavigate={onNavigate}
      />
    );
  }

  // List mode
  return (
    <div className="space-y-6 text-left">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Globe className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-serif text-zinc-900 dark:text-zinc-100">
              Public SEO Recipes
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
              {recipes.length} {recipes.length === 1 ? "Recipe" : "Recipes"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Public recipes serve as high-converting SEO landing pages with interactive batch yield calculators for guests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRecipes(true)}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-600 dark:text-zinc-300 transition cursor-pointer disabled:opacity-50"
            title="Refresh recipe list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Public Recipe</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by recipe name, slug, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-zinc-800 dark:text-zinc-200"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>

          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedCategory === "all"
                ? "bg-orange-500 text-white shadow-xs"
                : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50"
            }`}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-orange-500 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => fetchRecipes(true)}
            className="ml-auto underline font-bold hover:text-rose-900 dark:hover:text-rose-100"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 animate-pulse space-y-3"
            >
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-16 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl" />
              <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRecipes.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-800/60 border border-dashed border-zinc-200 dark:border-zinc-700/80 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-500">
            <ChefHat className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            {searchTerm || selectedCategory !== "all" ? "No matching recipes found" : "No public recipes yet"}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== "all"
              ? "Try clearing your filters or searching with different terms."
              : "Publish your first SEO-optimized public recipe to attract organic search traffic and showcase Floura's calculator."}
          </p>
          <div className="pt-2">
            {searchTerm || selectedCategory !== "all" ? (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Recipe Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recipe Grid Cards */}
      {!loading && filteredRecipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => {
            const ingCount = Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0;
            const instCount = Array.isArray(recipe.instructions) ? recipe.instructions.length : 0;
            const publicUrl = recipe.slug ? `/calculator/${recipe.slug}` : `/calculator`;
            const isDeleting = deletingId === recipe.id;
            const isConfirming = deleteConfirmId === recipe.id;

            return (
              <motion.div
                key={recipe.id || recipe.slug}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/70 shadow-xs hover:border-orange-200 dark:hover:border-zinc-600 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badge & Slug */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300">
                      <Tag className="w-2.5 h-2.5 text-zinc-400" />
                      {recipe.category || "General"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        recipe.isPublic
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                      }`}
                    >
                      {recipe.isPublic ? "Public SEO" : "Draft / Unlisted"}
                    </span>
                  </div>

                  {/* Title & SEO Slug */}
                  <div>
                    <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {recipe.name}
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
                      /{recipe.slug || "no-slug"}
                    </p>
                  </div>

                  {/* Specs Pill Box */}
                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <Scale className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate font-semibold">
                        {recipe.stdYield || 0} {recipe.yieldUnit || "g"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">
                        {(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)}m total
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 col-span-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between">
                      <span>{ingCount} ingredients</span>
                      <span>{instCount} steps</span>
                    </div>
                  </div>

                  {recipe.metaDescription && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
                      "{recipe.metaDescription}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-3 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between gap-2">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 py-1.5 px-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40 transition cursor-pointer"
                    title="View live calculator page"
                  >
                    <span>Preview</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    {/* Delete confirmation inline */}
                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(recipe)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold transition disabled:opacity-50"
                        >
                          {isDeleting ? "..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(recipe.id)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete public recipe"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleEdit(recipe)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
