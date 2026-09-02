// File Path: /server/routes/publicRecipe.routes.ts
import { Router } from "express";
import {
  getPublicRecipes,
  getPublicRecipeBySlug,
  savePublicRecipe,
  deletePublicRecipe
} from "../controllers/publicRecipe.controller";

const router = Router();

// Public Guest Routes (No authentication required)
router.get("/public/recipes", getPublicRecipes);
router.get("/public/recipes/:slug", getPublicRecipeBySlug);

// Admin Management Routes for Public Recipes
router.post("/admin/public-recipes", savePublicRecipe);
router.put("/admin/public-recipes/:id", savePublicRecipe);
router.delete("/admin/public-recipes/:id", deletePublicRecipe);

export default router;
