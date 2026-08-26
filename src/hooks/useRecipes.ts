import { useState, useMemo, useEffect } from "react";
import { type Recipe } from "../types";
import { localDb } from "../db";
import { useQuery } from "@tanstack/react-query";

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


  const [viewMode, setViewMode] = useState<"list" | "form" | "detail">(initialViewMode);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [desiredUnits, setDesiredUnits] = useState<number | string>("");

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

  // Load selected recipe dynamically using TanStack useQuery
  const { data: selectedRecipe = null } = useQuery<Recipe | null>({
    queryKey: ["recipes", "detail", selectedRecipeId],
    queryFn: async () => {
      if (selectedRecipeId) {
        const found = await localDb.recipes.get(selectedRecipeId);
        if (found) return found;
      }
      const first = await localDb.recipes.toCollection().first();
      return first || null;
    }
  });

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

  // Load categories using TanStack useQuery
  const { data: dynamicCategories = ["Cakes", "Viennoiserie", "Tarts", "Confectionary", "Classic", "Pastry"] } = useQuery<string[]>({
    queryKey: ["recipes", "categories"],
    queryFn: async () => {
      const dbCats = await localDb.categories
        .filter(c => c.type === "recipe" && c.isDeleted !== 1)
        .toArray();
      const catNames = dbCats.map(c => c.name);
      const defaultCats = ["Cakes", "Viennoiserie", "Tarts", "Confectionary", "Classic", "Pastry"];
      return Array.from(new Set([...defaultCats, ...catNames]));
    }
  });

  // Load paginated list of recipes using TanStack useQuery
  const { data: listResult = { filteredCount: 0, paginatedRecipes: [] }, isLoading: loading } = useQuery({
    queryKey: [
      "recipes",
      "list",
      searchTerm,
      selectedCategory,
      recipesCurrentPage,
      recipesItemsPerPage
    ],
    queryFn: async () => {
      const startIndex = (recipesCurrentPage - 1) * recipesItemsPerPage;
      const hasFilters = selectedCategory !== "All" || searchTerm.trim() !== "";

      let filteredCount = 0;
      let paginatedRecipes: Recipe[] = [];

      if (!hasFilters) {
        // No filters: Paginate directly in SQLite using lightweight queries
        const countResult = await localDb.recipes.query(
          "SELECT COUNT(*) as count FROM recipes WHERE isDeleted = 0"
        );
        const totalCount = countResult[0]?.count || 0;

        const pageRecipes = await localDb.recipes.query(
          "SELECT * FROM recipes WHERE isDeleted = 0 ORDER BY COALESCE(updatedAt, '') DESC LIMIT ? OFFSET ?",
          [recipesItemsPerPage, startIndex]
        );

        filteredCount = totalCount;
        paginatedRecipes = pageRecipes;
      } else {
        // Has encrypted/decrypted filters: Fetch only lightweight columns for memory filter/sort
        const allRecipesLight = await localDb.recipes.query(
          "SELECT id, name, category, updatedAt FROM recipes WHERE isDeleted = 0"
        );

        // Perform filtering on lightweight decrypted fields
        const matched = allRecipesLight.filter(r => {
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

        filteredCount = matched.length;

        const pageIds = matched
          .slice(startIndex, startIndex + recipesItemsPerPage)
          .map(r => r.id);

        if (pageIds.length > 0) {
          const placeholders = pageIds.map(() => "?").join(",");
          const pageRecipes = await localDb.recipes.query(
            `SELECT * FROM recipes WHERE id IN (${placeholders})`,
            pageIds
          );

          // Re-sort to match the in-memory filtered & sorted pageIds order
          const recipeMap = new Map(pageRecipes.map(r => [r.id, r]));
          paginatedRecipes = pageIds
            .map(id => recipeMap.get(id))
            .filter((r): r is Recipe => !!r);
        }
      }

      return { filteredCount, paginatedRecipes };
    }
  });

  const filteredCount = listResult.filteredCount;
  const paginatedRecipes = listResult.paginatedRecipes;
  const recipeList: Recipe[] = [];
  const setSelectedRecipe = (recipe: Recipe | null) => {};

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
