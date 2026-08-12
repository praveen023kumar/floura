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

  const dynamicCategories = useMemo(() => {
    const defaultCats = ["Cakes", "Viennoiserie", "Tarts", "Confectionary", "Classic", "Pastry"];
    const allUsedCategories = recipeList.map(r => r.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...allUsedCategories]));
  }, [recipeList]);

  // Load paginated recipes dynamically
  useEffect(() => {
    async function loadDbRecipes() {
      try {
        let matched = await localDb.recipes.toArray();
        setRecipeList(matched);

        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          matched = matched.filter(r => 
            r.name.toLowerCase().includes(s)
          );
        }

        if (selectedCategory !== "All") {
          matched = matched.filter(r => r.category === selectedCategory);
        }

        matched.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

        setFilteredCount(matched.length);
        const startIndex = (recipesCurrentPage - 1) * recipesItemsPerPage;
        const pageSlice = matched.slice(startIndex, startIndex + recipesItemsPerPage);
        setPaginatedRecipes(pageSlice);
      } catch (err) {
        console.error("Failed to query recipes from localDb:", err);
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
