// File Path: /server/controllers/publicRecipe.controller.ts
import { Request, Response } from "express";
import { getDb, querySqlAll, runSql } from "../models/db";

// Helper to parse JSON fields safely
function parseRecipeRow(row: any) {
  if (!row) return null;
  return {
    ...row,
    ingredients: typeof row.ingredients === "string" ? JSON.parse(row.ingredients || "[]") : row.ingredients || [],
    instructions: typeof row.instructions === "string" ? JSON.parse(row.instructions || "[]") : row.instructions || [],
    isPublic: row.isPublic ?? 0,
    prepTimeMinutes: row.prepTimeMinutes ?? 15,
    cookTimeMinutes: row.cookTimeMinutes ?? 20
  };
}

// GET /api/public/recipes - Fetch all public recipes for guests
export async function getPublicRecipes(req: Request, res: Response) {
  try {
    const db = await getDb();
    const rows = await querySqlAll<any>(
      db,
      "SELECT id, name, category, stdYield, yieldUnit, ingredients, instructions, prepTimeMinutes, cookTimeMinutes, slug, metaTitle, metaDescription, ogImage, keywords, isPublic, updatedAt FROM recipes WHERE (isPublic = 1 OR isPublic = '1' OR slug IS NOT NULL) AND (isDeleted IS NULL OR isDeleted = 0) ORDER BY updatedAt DESC"
    );
    const recipes = rows.map(parseRecipeRow);
    return res.json({ success: true, recipes });
  } catch (error: any) {
    console.error("Error fetching public recipes:", error);
    return res.status(500).json({ success: false, error: "Failed to load public recipes" });
  }
}

// GET /api/public/recipes/:slug - Fetch single public recipe by slug or ID
export async function getPublicRecipeBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const db = await getDb();
    const rows = await querySqlAll<any>(
      db,
      "SELECT * FROM recipes WHERE (slug = ? OR id = ?) AND (isPublic = 1 OR isPublic = '1' OR slug IS NOT NULL) AND (isDeleted IS NULL OR isDeleted = 0) LIMIT 1",
      [slug, slug]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    const recipe = parseRecipeRow(rows[0]);
    return res.json({ success: true, recipe });
  } catch (error: any) {
    console.error("Error fetching public recipe by slug:", error);
    return res.status(500).json({ success: false, error: "Failed to load recipe details" });
  }
}

// POST /api/admin/public-recipes - Create or Update a public SEO recipe
export async function savePublicRecipe(req: Request, res: Response) {
  try {
    const {
      id,
      name,
      category,
      stdYield,
      yieldUnit,
      ingredients,
      instructions,
      prepTimeMinutes,
      cookTimeMinutes,
      slug,
      metaTitle,
      metaDescription,
      ogImage,
      keywords,
      isPublic
    } = req.body;

    if (!name || !category || !stdYield || !yieldUnit) {
      return res.status(400).json({ success: false, error: "Required fields missing: name, category, stdYield, yieldUnit" });
    }

    const db = await getDb();
    const recipeId = id || `rec-pub-${Date.now()}`;
    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    const now = new Date().toISOString();

    const existing = await querySqlAll<any>(db, "SELECT id FROM recipes WHERE id = ?", [recipeId]);

    const ingredientsJson = JSON.stringify(ingredients || []);
    const instructionsJson = JSON.stringify(instructions || []);
    const publicFlag = isPublic !== undefined ? (isPublic ? 1 : 0) : 1;
    const prepMins = Number(prepTimeMinutes) || 15;
    const cookMins = Number(cookTimeMinutes) || 20;

    if (existing && existing.length > 0) {
      await runSql(
        db,
        `UPDATE recipes SET 
          name = ?, category = ?, stdYield = ?, yieldUnit = ?, ingredients = ?, 
          instructions = ?, prepTimeMinutes = ?, cookTimeMinutes = ?, slug = ?, 
          metaTitle = ?, metaDescription = ?, ogImage = ?, keywords = ?, 
          isPublic = ?, updatedAt = ?
        WHERE id = ?`,
        [
          name, category, Number(stdYield), yieldUnit, ingredientsJson,
          instructionsJson, prepMins, cookMins, cleanSlug,
          metaTitle || `${name} Recipe & Ratio Calculator`,
          metaDescription || `Calculate exact ingredient weights for ${name}. Step-by-step baking formulation and batch scaler.`,
          ogImage || "", keywords || "", publicFlag, now, recipeId
        ]
      );
    } else {
      await runSql(
        db,
        `INSERT INTO recipes (
          id, name, category, stdYield, yieldUnit, ingredients, instructions,
          prepTimeMinutes, cookTimeMinutes, slug, metaTitle, metaDescription,
          ogImage, keywords, isPublic, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recipeId, name, category, Number(stdYield), yieldUnit, ingredientsJson,
          instructionsJson, prepMins, cookMins, cleanSlug,
          metaTitle || `${name} Recipe & Ratio Calculator`,
          metaDescription || `Calculate exact ingredient weights for ${name}. Step-by-step baking formulation and batch scaler.`,
          ogImage || "", keywords || "", publicFlag, now
        ]
      );
    }

    return res.json({
      success: true,
      recipe: {
        id: recipeId,
        name,
        category,
        stdYield: Number(stdYield),
        yieldUnit,
        ingredients: ingredients || [],
        instructions: instructions || [],
        prepTimeMinutes: prepMins,
        cookTimeMinutes: cookMins,
        slug: cleanSlug,
        metaTitle,
        metaDescription,
        ogImage,
        keywords,
        isPublic: publicFlag,
        updatedAt: now
      }
    });
  } catch (error: any) {
    console.error("Error saving public recipe:", error);
    return res.status(500).json({ success: false, error: "Failed to save public recipe" });
  }
}

// DELETE /api/admin/public-recipes/:id - Soft delete a public recipe
export async function deletePublicRecipe(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const db = await getDb();
    const now = new Date().toISOString();
    await runSql(db, "UPDATE recipes SET isDeleted = 1, updatedAt = ? WHERE id = ?", [now, id]);
    return res.json({ success: true, message: "Public recipe deleted" });
  } catch (error: any) {
    console.error("Error deleting public recipe:", error);
    return res.status(500).json({ success: false, error: "Failed to delete public recipe" });
  }
}
