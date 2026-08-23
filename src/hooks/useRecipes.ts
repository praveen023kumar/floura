import { useState, useMemo, useEffect } from "react";
import { type Recipe } from "../types";
import { localDb } from "../db";

export interface UseRecipesProps {
  onAddRecipe: (recipe: Omit<Recipe, "id" | "updatedAt">) => Promise<any>;
  initialViewMode?: "list" | "form" | "detail";
  onViewModeChange?: (mode: "list" | "form" | "detail") => void;
}

export function useRecipes({
  onAddRecipe,
  initialViewMode = "list",
  onViewModeChange,
}: UseRecipesProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  const [viewMode, setViewMode] = useState<"list" | "form" | "detail">(initialViewMode);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [desiredUnits, setDesiredUnits] = useState<number | string>("");

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [paginatedRecipes, setPaginatedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [recipeList, setRecipeList] = useState<Recipe[]>([]);

  const [recipesCurrentPage, setRecipesCurrentPage] = useState<number>(1);
  const [recipesItemsPerPage, setRecipesItemsPerPage] = useState<number>(10);

  useEffect(() => {
    if (initialViewMode === "form") {
      setIsCreateModalOpen(true);
      setViewMode("list");
    } else {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  const handleSetViewMode = (mode: "list" | "form" | "detail") => {
    if (mode === "form") {
      setIsCreateModalOpen(true);
    } else {
      setViewMode(mode);
    }
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  // Load selected recipe dynamically
  useEffect(() => {
    async function loadSelectedRecipe() {
      try {
        if (selectedRecipeId) {
          const found = await localDb.recipes.get(selectedRecipeId);
          if (found) {
            setSelectedRecipe(found);
            return;
          }
        }
        const first = await localDb.recipes.toCollection().first();
        setSelectedRecipe(first || null);
      } catch (err) {
        console.error("Failed to load selected recipe:", err);
      }
    }
    loadSelectedRecipe();
  }, [selectedRecipeId, refreshTrigger]);

  // Set default desiredUnits when recipe is loaded
  useEffect(() => {
    if (selectedRecipe) {
      setDesiredUnits((prev) => (prev === "" ? selectedRecipe.stdYield : prev));
    }
  }, [selectedRecipe]);

  // Dynamic ingredient formula calculation
  const scaledIngredients = useMemo(() => {
    const rc = selectedRecipe;
    if (!rc) return [];
    
    const targetUnits = desiredUnits === "" ? 0 : Number(desiredUnits);
    const ratio = rc.stdYield > 0 && !isNaN(targetUnits) ? targetUnits / rc.stdYield : 0;

    return rc.ingredients.map((ing) => ({
      name: ing.name,
      originalQty: ing.qty,
      scaledQty: Number((ing.qty * ratio).toFixed(1)),
    }));
  }, [selectedRecipe, desiredUnits]);

  const [dynamicCategories, setDynamicCategories] = useState<string[]>(["Cakes", "Viennoiserie", "Tarts", "Confectionary", "Classic", "Pastry"]);

  // Load categories from categories table
  useEffect(() => {
    async function loadCategories() {
      try {
        const dbCats = await localDb.categories
          .filter(c => c.type === "recipe" && c.isDeleted !== 1)
          .toArray();
        const catNames = dbCats.map(c => c.name);
        const defaultCats = ["Cakes", "Viennoiserie", "Tarts", "Confectionary", "Classic", "Pastry"];
        setDynamicCategories(Array.from(new Set([...defaultCats, ...catNames])));
      } catch (err) {
        console.error("Failed to load recipe categories:", err);
      }
    }
    loadCategories();
  }, [refreshTrigger]);

  // Load paginated recipes dynamically
  useEffect(() => {
    async function loadDbRecipes() {
      try {
        const startIndex = (recipesCurrentPage - 1) * recipesItemsPerPage;
        
        // Query the database to retrieve all active (non-deleted) decrypted recipes
        const allRecipes = await localDb.recipes.filter((r: any) => r.isDeleted !== 1).toArray();

        // Perform all filtering in memory using the decrypted objects
        const matched = allRecipes.filter(r => {
          if (selectedCategory !== "All" && r.category !== selectedCategory) return false;
          if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return r.name.toLowerCase().includes(s);
          }
          return true;
        });

        // Perform sorting in memory (newest updated first)
        matched.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });

        // Set counts and paginated results
        setFilteredCount(matched.length);
        setPaginatedRecipes(matched.slice(startIndex, startIndex + recipesItemsPerPage));
      } catch (err) {
        console.error("Failed to query recipes from localDb:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDbRecipes();
  }, [refreshTrigger, searchTerm, selectedCategory, recipesCurrentPage, recipesItemsPerPage]);

  useEffect(() => {
    setRecipesCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const recipesTotalPages = useMemo(() => {
    return Math.ceil(filteredCount / recipesItemsPerPage);
  }, [filteredCount, recipesItemsPerPage]);

  const handleSelectRecipeClick = (r: Recipe) => {
    setSelectedRecipeId(r.id);
    setDesiredUnits(r.stdYield);
    setViewMode("detail");
  };

  return {
    loading,
    refreshTrigger,
    viewMode,
    setViewMode,
    isCreateModalOpen,
    setIsCreateModalOpen,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    dynamicCategories,
    selectedRecipeId,
    setSelectedRecipeId,
    desiredUnits,
    setDesiredUnits,
    selectedRecipe,
    setSelectedRecipe,
    paginatedRecipes,
    filteredCount,
    recipeList,
    recipesCurrentPage,
    setRecipesCurrentPage,
    recipesItemsPerPage,
    setRecipesItemsPerPage,
    scaledIngredients,
    recipesTotalPages,
    handleSetViewMode,
    handleSelectRecipeClick,
  };
}
