// File Path: /server/middleware/seo.middleware.ts
import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { getDb, querySqlAll } from "../models/db";

export async function seoServerSideInjectionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only intercept GET requests for public recipe routes (/calculator/:slug)
  if (req.method !== "GET" || !req.path.startsWith("/calculator/")) {
    return next();
  }

  const parts = req.path.split("/").filter(Boolean);
  if (parts.length < 2) {
    return next();
  }

  const slug = parts[1];
  
  // If it's a static file request (js, css, png, ico, json, etc.), skip
  if (slug.includes(".")) {
    return next();
  }

  try {
    const db = await getDb();
    const rows = await querySqlAll<any>(
      db,
      "SELECT * FROM recipes WHERE (slug = ? OR id = ?) AND isPublic = 1 AND (isDeleted IS NULL OR isDeleted = 0) LIMIT 1",
      [slug, slug]
    );

    if (!rows || rows.length === 0) {
      return next(); // Fallback to SPA rendering if recipe not found
    }

    const recipe = rows[0];
    const ingredients = typeof recipe.ingredients === "string" ? JSON.parse(recipe.ingredients || "[]") : recipe.ingredients || [];
    const instructions = typeof recipe.instructions === "string" ? JSON.parse(recipe.instructions || "[]") : recipe.instructions || [];

    const metaTitle = recipe.metaTitle || `${recipe.name} Recipe & Yield Calculator | Floura`;
    const metaDesc = recipe.metaDescription || `Calculate exact ingredient measurements for ${recipe.name} by yield or batch size. Interactive baker's calculator.`;
    const ogImg = recipe.ogImage || recipe.imageUrl || "https://floura.app/assets/images/floura_logo.webp";
    const prepMins = recipe.prepTimeMinutes || 15;
    const cookMins = recipe.cookTimeMinutes || 20;

    // Construct Google Schema.org Recipe JSON-LD
    const jsonLdRecipe = {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": recipe.name,
      "image": [ogImg],
      "category": recipe.category,
      "description": metaDesc,
      "keywords": recipe.keywords || `${recipe.name}, recipe calculator, bakery scaling`,
      "prepTime": `PT${prepMins}M`,
      "cookTime": `PT${cookMins}M`,
      "totalTime": `PT${prepMins + cookMins}M`,
      "recipeYield": `${recipe.stdYield} ${recipe.yieldUnit}`,
      "recipeIngredient": ingredients.map((ing: any) => `${ing.qty}g ${ing.name}`),
      "recipeInstructions": instructions.map((step: any, idx: number) => ({
        "@type": "HowToStep",
        "position": step.stepNumber || idx + 1,
        "text": step.text || step
      }))
    };

    // Locate index.html (in dev or dist)
    const indexPath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "index.html")
      : path.join(process.cwd(), "index.html");

    if (!fs.existsSync(indexPath)) {
      return next();
    }

    let html = fs.readFileSync(indexPath, "utf8");

    // Inject SEO Head Tags
    const seoHeadContent = `
    <title>${escapeHtml(metaTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDesc)}">
    <meta name="keywords" content="${escapeHtml(recipe.keywords || "")}">
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(metaTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDesc)}">
    <meta property="og:image" content="${escapeHtml(ogImg)}">
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(metaTitle)}">
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
    <meta name="twitter:image" content="${escapeHtml(ogImg)}">
    <!-- Google Schema.org Recipe JSON-LD -->
    <script type="application/ld+json">
      ${JSON.stringify(jsonLdRecipe)}
    </script>
    `;

    // Replace existing <title> and inject head tags before </head>
    html = html.replace(/<title>.*?<\/title>/gi, "");
    html = html.replace("</head>", `${seoHeadContent}\n</head>`);

    // In dev mode, run html through Vite transformer to inject React Refresh preamble & HMR scripts
    const vite = req.app ? req.app.get("vite") : null;
    if (vite && typeof vite.transformIndexHtml === "function") {
      html = await vite.transformIndexHtml(req.originalUrl || req.url, html);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("Error in seoServerSideInjectionMiddleware:", err);
    return next();
  }
}

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
