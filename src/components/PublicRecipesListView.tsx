// File Path: /src/components/PublicRecipesListView.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Plus,
  Trash2,
  Clock,
  Scale,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  X,
  Home,
  ChefHat,
  ChevronDown,
  Utensils,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import flouraLogo from "../assets/images/floura_logo.webp";
import { getApiUrl } from "../utils/api";
import { type Recipe } from "../types";
import Footer from "./Footer";

export default function PublicRecipesListView() {
  const navigate = useNavigate();

  const [publicRecipes, setPublicRecipes] = useState<Recipe[]>([]);
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "disclaimer" | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("patisserie_dark_mode") === "true";
  });
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // New Custom Recipe Modal State
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("Cakes");
  const [customYield, setCustomYield] = useState<number | "">("");
  const [customYieldUnit, setCustomYieldUnit] = useState("grams");
  const [customIngredients, setCustomIngredients] = useState<{ name: string; qty: number | "" }[]>([
    { name: "", qty: "" },
    { name: "", qty: "" }
  ]);

  // Sync Dark Mode state with HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("patisserie_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("patisserie_dark_mode", "false");
    }
  }, [darkMode]);

  // Load public recipes from API & custom recipes from localStorage
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(getApiUrl("/api/public/recipes"));
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.recipes)) {
            setPublicRecipes(data.recipes);
          }
        }
      } catch (err) {
        console.error("Failed to load public recipes:", err);
      } finally {
        setLoading(false);
      }

      // Load local storage custom recipes
      try {
        const saved = localStorage.getItem("floura_custom_recipes");
        if (saved) {
          setCustomRecipes(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Error reading localStorage custom recipes:", e);
      }
    }
    loadData();
  }, []);

  const handleAddCustomIngredientField = () => {
    setCustomIngredients([...customIngredients, { name: "", qty: "" }]);
  };

  const handleCustomIngredientChange = (index: number, field: "name" | "qty", val: string) => {
    const updated = [...customIngredients];
    if (field === "qty") {
      updated[index].qty = val === "" ? "" : Number(val);
    } else {
      updated[index].name = val;
    }
    setCustomIngredients(updated);
  };

  const handleSaveCustomRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customYield) return;

    const validIngredients = customIngredients
      .filter(i => i.name.trim() !== "" && Number(i.qty) > 0)
      .map(i => ({ name: i.name.trim(), qty: Number(i.qty) }));

    if (validIngredients.length === 0) return;

    const cleanSlug = "custom-" + customName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    const newRecipe: Recipe = {
      id: cleanSlug,
      name: customName,
      category: customCategory,
      stdYield: Number(customYield),
      yieldUnit: customYieldUnit,
      ingredients: validIngredients,
      slug: cleanSlug,
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      metaTitle: `${customName} Custom Recipe Calculator`,
      metaDescription: `Custom formulation for ${customName}. Batch scaler and ratio calculator.`,
      isPublic: 0,
      updatedAt: new Date().toISOString()
    };

    const updated = [newRecipe, ...customRecipes];
    setCustomRecipes(updated);
    localStorage.setItem("floura_custom_recipes", JSON.stringify(updated));

    // Reset Form
    setCustomName("");
    setCustomYield("");
    setCustomIngredients([{ name: "", qty: "" }, { name: "", qty: "" }]);
    setShowAddCustomModal(false);
  };

  const handleDeleteCustomRecipe = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customRecipes.filter(r => r.id !== id);
    setCustomRecipes(updated);
    localStorage.setItem("floura_custom_recipes", JSON.stringify(updated));
  };

  // Combine public recipes & local custom recipes
  const allRecipes = [...customRecipes, ...publicRecipes];

  const categories = [
    { name: "All", icon: "🍰" },
    { name: "Cakes", icon: "🎂" },
    { name: "Pastries", icon: "🥐" },
    { name: "Cookies", icon: "🍪" },
    { name: "Breads", icon: "🍞" },
    { name: "Puffs & Savories", icon: "🥧" },
    { name: "My Custom", icon: "✨" }
  ];

  // Filter recipes by category & search term
  const filteredRecipes = allRecipes.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (selectedCategory === "All") return matchesSearch;
    if (selectedCategory === "My Custom") return r.id.startsWith("custom-") && matchesSearch;
    return r.category.toLowerCase() === selectedCategory.toLowerCase() && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors flex flex-col">
      <Helmet>
        <title>Bakery Recipe & Batch Yield Calculators | Floura</title>
        <meta name="description" content="Interactive bakery recipe yield calculators. Scale ingredients for cakes, macaroons, puffs, and custom formulas instantly." />
      </Helmet>

      {/* Floura Header Navbar */}
      <header className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/60 sticky top-0 z-50 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Left Side: Floura Logo & Text */}
          <Link to="/" className="flex items-center gap-3 select-none cursor-pointer">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center bg-pink-50 dark:bg-zinc-900">
              <img src={flouraLogo} alt="Floura" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-xl font-black tracking-tight text-primary-brand dark:text-pink-400 italic">Floura</span>
            </div>
          </Link>

          {/* Right Side: Action Buttons */}
          <div className="hidden lg:flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all text-zinc-600 dark:text-zinc-300 cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            <button
              onClick={() => setShowAddCustomModal(true)}
              className="bg-primary-brand hover:bg-primary-brand-dark text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-pink-200 dark:shadow-none transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Formula</span>
            </button>

            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-2.5 px-5 rounded-xl shadow-sm transition-all active:scale-[0.97]"
            >
              <span>Get Started</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            id="btn-toggle-mobile-menu-calculator"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all text-zinc-600 dark:text-zinc-300 cursor-pointer lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Drawer (Inside Sticky Header Container) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-100 dark:border-zinc-800/80 px-6 py-5 space-y-4 transition-all animate-in slide-in-from-top-2">
            {/* Main Actions inside Mobile Menu */}
            <div className="space-y-2.5">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowAddCustomModal(true); }}
                className="w-full flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Formula</span>
              </button>

              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 dark:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest py-3 px-5 rounded-xl text-center block"
              >
                <span>Get Started</span>
              </Link>
            </div>

            {/* Dark Mode Switcher inside Mobile Menu */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <span>Appearance Theme</span>
              <div className="flex items-center gap-1.5">
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-zinc-600" />
                    <span>Light</span>
                  </>
                )}
              </div>
            </button>

            
          </div>
        )}
      </header>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-50/60 via-white to-amber-50/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-pink-950/20 py-12 px-4 sm:px-8 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/80 dark:bg-pink-950/60 text-primary-brand dark:text-pink-300 text-xs font-bold border border-pink-200/60 dark:border-pink-800/40 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Bakery Scalers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-serif text-zinc-900 dark:text-white tracking-tight leading-tight">
            Perfect Bakery Batch Calculators
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Scale famous Tamil Nadu bakery cakes, pastries, macaroons, and puffs with instant baker’s ratios. Save your custom formulas right in your browser.
          </p>

          {/* Search Input Bar */}
          <div className="max-w-xl mx-auto relative pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search recipe name or ingredient (e.g. Honey Cake, Cashew, Maida)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-brand/50 dark:focus:ring-pink-500/50 shadow-sm transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills & Recipe Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8 flex-1 w-full">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.name;
            const count = allRecipes.filter(r => {
              if (cat.name === "All") return true;
              if (cat.name === "My Custom") return r.id.startsWith("custom-");
              return r.category.toLowerCase() === cat.name.toLowerCase();
            }).length;

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary-brand text-white shadow-md shadow-pink-200 dark:shadow-none scale-[1.02]"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`py-0.5 px-1.5 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-primary-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Loading recipe formulas...</p>
          </div>
        )}

        {/* Empty Search State */}
        {!loading && filteredRecipes.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-8 max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-primary-brand dark:text-pink-400 flex items-center justify-center mx-auto">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">No Recipes Found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              We couldn't find any recipes matching "{searchTerm}". Try another search or create a custom formula!
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-brand dark:text-pink-400 hover:underline cursor-pointer"
            >
              <span>Clear filters</span>
            </button>
          </div>
        )}

        {/* Recipe Cards Grid */}
        {!loading && filteredRecipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredRecipes.map((recipe, index) => {
                const isCustom = recipe.id.startsWith("custom-");

                return (
                  <motion.div
                    key={recipe.id || recipe.slug}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => navigate(`/calculator/${recipe.slug || recipe.id}`)}
                    className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:border-pink-200 dark:hover:border-pink-900/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/50 text-primary-brand dark:text-pink-400 text-xs font-bold border border-pink-100 dark:border-pink-900/30">
                          {recipe.category}
                        </span>

                        {isCustom ? (
                          <div className="flex items-center gap-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
                              Custom Formula
                            </span>
                            <button
                              onClick={e => handleDeleteCustomRecipe(recipe.id, e)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete custom formula"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              {(recipe.prepTimeMinutes || 15) + (recipe.cookTimeMinutes || 20)}m
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Recipe Title */}
                      <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white group-hover:text-primary-brand dark:group-hover:text-pink-400 transition-colors leading-snug">
                        {recipe.name}
                      </h2>

                      {/* Ingredients Preview Tags */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Ingredients ({recipe.ingredients?.length || 0})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {recipe.ingredients.slice(0, 4).map((ing, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium"
                            >
                              {ing.name}
                            </span>
                          ))}
                          {recipe.ingredients.length > 4 && (
                            <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs font-medium">
                              +{recipe.ingredients.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-5 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-primary-brand dark:text-pink-400">
                      <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-normal">
                        <Scale className="w-3.5 h-3.5 text-zinc-400" />
                        Base: {recipe.stdYield} {recipe.yieldUnit}
                      </span>
                      <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Calculate Batch <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Add Custom Recipe Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-primary-brand dark:text-pink-400 flex items-center justify-center">
                  <ChefHat className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-bold font-serif text-zinc-900 dark:text-white">Add Custom Formula</h3>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomRecipe} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Recipe Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Secret Velvet Sponge"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-brand/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">Category</label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-brand/50"
                  >
                    <option value="Cakes">Cakes</option>
                    <option value="Pastries">Pastries</option>
                    <option value="Cookies">Cookies</option>
                    <option value="Breads">Breads</option>
                    <option value="Puffs & Savories">Puffs & Savories</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">Yield Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="grams, kg, pieces"
                    value={customYieldUnit}
                    onChange={e => setCustomYieldUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-brand/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Base Standard Yield Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1000"
                  value={customYield}
                  onChange={e => setCustomYield(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-brand/50"
                />
              </div>

              {/* Ingredients List */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Ingredients & Standard Weights (grams) *
                </label>

                {customIngredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Ingredient #${i + 1}`}
                      value={ing.name}
                      onChange={e => handleCustomIngredientChange(i, "name", e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Qty (g)"
                      value={ing.qty}
                      onChange={e => handleCustomIngredientChange(i, "qty", e.target.value)}
                      className="w-24 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddCustomIngredientField}
                  className="text-xs font-bold text-primary-brand dark:text-pink-400 hover:underline pt-1 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Ingredient Row
                </button>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-brand hover:bg-primary-brand-dark text-white shadow-md shadow-pink-200 dark:shadow-none transition-all cursor-pointer"
                >
                  Save Formula Locally
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* FOOTER */}
      <Footer className="mt-16" />
    </div>
  );
}
