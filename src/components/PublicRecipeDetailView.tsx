// File Path: /src/components/PublicRecipeDetailView.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Calculator,
  Scale,
  BookOpen,
  Clock,
  Share2,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ListOrdered,
  ChefHat,
  Sun,
  Moon,
  Printer,
  Check,
  ChevronDown,
  Utensils,
  Menu,
  X
} from "lucide-react";
import { motion } from "motion/react";
import flouraLogo from "../assets/images/floura_logo.webp";
import { getApiUrl } from "../utils/api";
import { type Recipe, type RecipeInstructionStep } from "../types";
import Footer from "./Footer";

export default function PublicRecipeDetailView() {
  const params = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [desiredUnits, setDesiredUnits] = useState<number | string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "disclaimer" | null>(null);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("patisserie_dark_mode") === "true";
  });

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

  useEffect(() => {
    async function loadRecipe() {
      const currentSlug = params.slug || location.pathname.replace(/^\/calculator\/?/, "").split("/")[0];
      if (!currentSlug) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Try fetching from public API endpoint
        const res = await fetch(getApiUrl(`/api/public/recipes/${encodeURIComponent(currentSlug)}`));
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.recipe) {
            setRecipe(data.recipe);
            setDesiredUnits(data.recipe.stdYield);
            setLoading(false);
            return;
          }
        }
        
        // Fallback: check guest localStorage custom recipes
        const savedCustom = localStorage.getItem("floura_custom_recipes");
        if (savedCustom) {
          const customList: Recipe[] = JSON.parse(savedCustom);
          const found = customList.find(r => r.slug === currentSlug || r.id === currentSlug);
          if (found) {
            setRecipe(found);
            setDesiredUnits(found.stdYield);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load public recipe:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecipe();
  }, [params.slug, location.pathname]);

  // Scaled ingredient weights memoization
  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    
    const targetUnits = desiredUnits === "" ? 0 : Number(desiredUnits);
    const ratio = recipe.stdYield > 0 && !isNaN(targetUnits) ? targetUnits / recipe.stdYield : 0;

    return recipe.ingredients.map((ing) => ({
      name: ing.name,
      originalQty: ing.qty,
      scaledQty: Number((ing.qty * ratio).toFixed(1)),
    }));
  }, [recipe, desiredUnits]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  const toggleIngredientCheck = (index: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Loading recipe formulation matrix...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-4 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-primary-brand dark:text-pink-400 flex items-center justify-center mx-auto">
            <ChefHat className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-serif text-zinc-900 dark:text-white">Recipe Formula Not Found</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The recipe you are looking for might have been moved or removed.
          </p>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Calculator Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const metaTitle = recipe.metaTitle || `${recipe.name} Recipe & Yield Scaler | Floura`;
  const metaDesc = recipe.metaDescription || `Calculate exact ingredient measurements for ${recipe.name} by yield quantity.`;
  const totalInstructions = recipe.instructions?.length || 0;
  const completedInstructionCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors flex flex-col">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        {recipe.keywords && <meta name="keywords" content={recipe.keywords} />}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        {recipe.ogImage && <meta property="og:image" content={recipe.ogImage} />}
      </Helmet>

      {/* Floura Header Navbar */}
      <header className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/60 sticky top-0 z-50 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Left Side: Floura Logo & Back Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-3 select-none cursor-pointer">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center bg-pink-50 dark:bg-zinc-900">
                <img src={flouraLogo} alt="Floura" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-xl font-black tracking-tight text-primary-brand dark:text-pink-400 italic">Floura</span>
              </div>
            </Link>
          </div>

          {/* Right Side: Action Header Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all text-zinc-600 dark:text-zinc-300 cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer hidden sm:flex"
              title="Print recipe formula"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-primary-brand dark:text-pink-400 hover:bg-pink-100 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Share Formula Link"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
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
            id="btn-toggle-mobile-menu-detail"
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
              <Link
                to="/calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-pink-50 dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 text-primary-brand dark:text-pink-400 font-bold py-2.5 px-4 rounded-xl text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Recipe Calculators</span>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); handlePrint(); }}
                  className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs py-2.5 px-3 rounded-xl"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>

                <button
                  onClick={() => { setMobileMenuOpen(false); handleCopyLink(); }}
                  className="flex items-center justify-center gap-2 bg-pink-50 dark:bg-pink-950/60 text-primary-brand dark:text-pink-400 font-bold text-xs py-2.5 px-3 rounded-xl"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Share"}</span>
                </button>
              </div>

              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3 px-5 rounded-xl text-center block"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6 flex-1 w-full">
        {/* Back Navigation Button */}
        <div>
          <Link
            id="btn-back-calculator-main"
            to="/calculator"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-primary-brand dark:hover:text-pink-400 transition-all bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 px-4 py-2.5 rounded-2xl shadow-xs group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-primary-brand dark:text-pink-400 transition-transform group-hover:-translate-x-1" />
            <span>Back to Recipe Calculators</span>
          </Link>
        </div>

        {/* Top Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-pink-50 dark:bg-pink-950/60 text-primary-brand dark:text-pink-300 text-xs font-bold border border-pink-200/60 dark:border-pink-800/40">
                {recipe.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold">
                Base: {recipe.stdYield} {recipe.yieldUnit}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-brand dark:text-pink-400" />
                <span>Prep: {recipe.prepTimeMinutes || 15}m</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Bake: {recipe.cookTimeMinutes || 20}m</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-zinc-900 dark:text-white tracking-tight">
            {recipe.name}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-3xl leading-relaxed">
            {recipe.metaDescription || `Interactive baker's batch calculator for ${recipe.name}. Adjust batch units below to scale ingredient weights automatically.`}
          </p>
        </motion.div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive Batch Scaler */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-primary-brand via-pink-700 to-rose-700 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-5 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Calculator className="w-6 h-6 text-pink-100" />
                <h2 className="text-xl font-bold font-serif">Batch Yield Scaler</h2>
              </div>

              <p className="text-xs text-pink-100/90 leading-relaxed">
                Enter your target batch weight or choose a preset multiplier. Ingredient measurements recalculate live.
              </p>

              {/* Target Yield Input */}
              <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Target Batch Yield ({recipe.yieldUnit})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={desiredUnits}
                    onChange={(e) => setDesiredUnits(e.target.value)}
                    placeholder={`Standard: ${recipe.stdYield}`}
                    className="w-full bg-white text-zinc-900 font-bold text-lg px-4 py-2.5 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-inner"
                  />
                  <span className="text-sm font-bold text-pink-100 whitespace-nowrap">
                    {recipe.yieldUnit}
                  </span>
                </div>
              </div>

              {/* Quick Multiplier Pills */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-pink-200 block">
                  Quick Multipliers
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[0.5, 1, 2, 5, 10].map((mult) => {
                    const targetVal = Number((recipe.stdYield * mult).toFixed(1));
                    const isSelected = Number(desiredUnits) === targetVal;
                    return (
                      <button
                        key={mult}
                        onClick={() => setDesiredUnits(targetVal)}
                        className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white text-primary-brand shadow-md scale-105"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        {mult}x
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scaling Factor Summary */}
              <div className="bg-black/20 p-3.5 rounded-xl flex items-center justify-between text-xs text-pink-100">
                <span>Scaling Ratio:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {recipe.stdYield > 0 && desiredUnits !== ""
                    ? `${(Number(desiredUnits) / recipe.stdYield).toFixed(2)}x`
                    : "0.00x"}
                </span>
              </div>
            </div>

            {/* Floura App Sign Up CTA Card */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-primary-brand dark:text-pink-400 font-bold text-sm">
                <ChefHat className="w-5 h-5" />
                <span>Save Your Custom Formulas</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Track client orders, auto-calculate ingredient costs, and manage custom cake databases with Floura.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-primary-brand hover:bg-primary-brand-dark text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Scaled Measurements & Preparation Steps */}
          <div className="lg:col-span-7 space-y-6">
            {/* Ingredients Scaled Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden space-y-0">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary-brand dark:text-pink-400" />
                  <h2 className="text-lg font-bold font-serif text-zinc-900 dark:text-white">
                    Scaled Ingredient Measurements
                  </h2>
                </div>
                <span className="text-xs text-zinc-400 font-medium">
                  {scaledIngredients.length} Items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold text-[10px] border-b border-zinc-100 dark:border-zinc-800">
                      <th className="py-3 px-4 w-10">Done</th>
                      <th className="py-3 px-4">Ingredient Name</th>
                      <th className="py-3 px-4 text-right">Standard (g)</th>
                      <th className="py-3 px-4 text-right text-primary-brand dark:text-pink-400 font-extrabold">
                        Target Scaled
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {scaledIngredients.map((ing, idx) => {
                      const isChecked = !!checkedIngredients[idx];
                      return (
                        <tr
                          key={idx}
                          onClick={() => toggleIngredientCheck(idx)}
                          className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                            isChecked ? "bg-pink-50/40 dark:bg-pink-950/20 line-through text-zinc-400 dark:text-zinc-500" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                isChecked
                                  ? "bg-primary-brand border-primary-brand text-white"
                                  : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-white">
                            {ing.name}
                          </td>
                          <td className="py-3.5 px-4 text-right text-zinc-400 font-mono">
                            {ing.originalQty}g
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-primary-brand dark:text-pink-400 text-sm">
                            {ing.scaledQty} {ing.scaledQty > 0 ? "g" : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preparation Instructions */}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-primary-brand dark:text-pink-400" />
                    <h2 className="text-lg font-bold font-serif text-zinc-900 dark:text-white">
                      Step-by-Step Preparation
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-primary-brand dark:text-pink-400">
                    {completedInstructionCount} of {totalInstructions} Completed
                  </span>
                </div>

                <div className="space-y-4">
                  {recipe.instructions.map((step: RecipeInstructionStep, idx: number) => {
                    const stepNum = step.stepNumber || idx + 1;
                    const isDone = !!completedSteps[stepNum];

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleStep(stepNum)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isDone
                            ? "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 opacity-60"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-pink-200 dark:hover:border-pink-900/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isDone
                                ? "bg-green-500 text-white"
                                : "bg-pink-100 dark:bg-pink-950 text-primary-brand dark:text-pink-400"
                            }`}
                          >
                            {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepNum}
                          </div>
                          <div className="space-y-1">
                            <p
                              className={`text-xs sm:text-sm leading-relaxed ${
                                isDone
                                  ? "line-through text-zinc-400 dark:text-zinc-500"
                                  : "text-zinc-800 dark:text-zinc-200 font-medium"
                              }`}
                            >
                              {step.text}
                            </p>
                            {step.note && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                                Note: {step.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <Footer className="mt-16" />
    </div>
  );
}
