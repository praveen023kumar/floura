// /src/components/HelpView.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Boxes,
  BookOpen,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Scale,
  Calculator,
  ArrowLeft,
  ChevronRight,
  Lightbulb,
  ShieldAlert,
  Percent,
  Coins,
  Store,
  Layers,
  HelpCircle,
} from "lucide-react";
import { formatPrice, getCurrencySymbol } from "../utils/format";

interface HelpViewProps {
  onNavigate?: (path: string | number) => void;
}

interface StepInfo {
  number: number;
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  actionText: string;
  actionPath: string;
  summary: string;
  details: {
    heading: string;
    description: string;
  }[];
  proTip: string;
}

const WORKFLOW_STEPS: StepInfo[] = [
  {
    number: 1,
    id: "stocks",
    title: "Add Stock Levels & Costs",
    subtitle: "Inventory & Raw Materials",
    tag: "Foundation",
    icon: Boxes,
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800/40",
    actionText: "Open Inventory",
    actionPath: "/inventory",
    summary:
      "Record every baking ingredient, packaging item, and liquid with purchase price, quantity, and unit (KG, L, ml, g, Pieces).",
    details: [
      {
        heading: "Unit Cost Automation",
        description:
          "When you buy a 10kg bag of flour or 5L of oil, Floura calculates the exact per-gram or per-ml cost automatically.",
      },
      {
        heading: "Supports Weight & Liquids",
        description:
          "Track dry solids in KG/g, liquids in L/ml, and packaging in Pieces or units.",
      },
      {
        heading: "Low Stock Safeguards",
        description:
          "Set minimum threshold limits so you never run out of core baking essentials during a rush.",
      },
    ],
    proTip:
      "Always enter accurate purchase costs! This is the fundamental building block that powers all your profit calculations.",
  },
  {
    number: 2,
    id: "recipes",
    title: "Map Ingredients to Formulas",
    subtitle: "Formulations & Recipes",
    tag: "Batch Costing",
    icon: BookOpen,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800/40",
    actionText: "Open Recipes",
    actionPath: "/recipes",
    summary:
      "Create recipes by selecting ingredients directly from your inventory. Floura automatically calculates the exact base recipe cost.",
    details: [
      {
        heading: "Direct Inventory Linking",
        description:
          "When choosing an ingredient in a recipe, select it from your inventory list. Its unit and cost price link seamlessly.",
      },
      {
        heading: "Auto-Calculated Batch Cost",
        description:
          "Floura adds up the exact cost of each ingredient to compute the total formulation cost and cost per unit/kg.",
      },
      {
        heading: "Live Price Sync",
        description:
          "If the supplier increases butter prices, updating your inventory item instantly updates the cost of all linked recipes.",
      },
    ],
    proTip:
      "Name your recipe the same as your standard cake flavor (e.g. 'Belgian Chocolate Truffle') so orders can automatically match it!",
  },
  {
    number: 3,
    id: "orders",
    title: "Select Flavor in Customer Orders",
    subtitle: "Orders & Production",
    tag: "Dynamic Scaling",
    icon: ShoppingBag,
    color: "text-pink-500 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/40",
    borderColor: "border-pink-200 dark:border-pink-800/40",
    actionText: "Create Order",
    actionPath: "/orders/new",
    summary:
      "When creating a cake order, select the cake flavor and weight (0.5kg, 1kg, 2kg, custom). Floura scales ingredient usage dynamically.",
    details: [
      {
        heading: "Automatic Flavor Matching",
        description:
          "Floura looks up the recipe matching the selected cake flavor name to find the exact formulation.",
      },
      {
        heading: "Proportional Weight Scaling",
        description:
          "Ordering a 2kg cake automatically doubles the required ingredient quantities and doubles the ingredient cost.",
      },
      {
        heading: "Clear Order Specifications",
        description:
          "Egg or Eggless preferences, custom inscriptions, and delivery slots stay organized with client invoices.",
      },
    ],
    proTip:
      "When you type the Cake Flavor in an order, make sure it matches your recipe name to activate automatic ingredient cost tracking.",
  },
  {
    number: 4,
    id: "profit",
    title: "Realize Exact Order Profit",
    subtitle: "Debriefs & Financial Analytics",
    tag: "Exact Profit",
    icon: TrendingUp,
    color: "text-violet-500 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800/40",
    actionText: "View Dashboard",
    actionPath: "/dashboard",
    summary:
      "Selling Price minus Scaled Ingredient Cost equals Exact Order Profit. No more guessing whether a cake was truly profitable.",
    details: [
      {
        heading: "Automated Profit Calculation",
        description:
          "Upon completing an order, Floura displays the exact ingredient cost breakdown and suggests the precise net profit.",
      },
      {
        heading: "Profit Margin % & Trends",
        description:
          "View your real-time profit margins across all orders, weekly revenue, and high-profit signature flavors in Kitchen Debriefs.",
      },
      {
        heading: "Cost Leakage Prevention",
        description:
          "Immediately identify if expensive decorations, packaging, or ingredient price spikes are eating into your bakery margins.",
      },
    ],
    proTip:
      "Review your Kitchen Debriefs (/debriefs) weekly to see which cake flavors generate the highest profit margins!",
  },
];

export default function HelpView({ onNavigate }: HelpViewProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [demoCakeWeight, setDemoCakeWeight] = useState<number>(1); // in kg
  const [demoSellingPrice, setDemoSellingPrice] = useState<number>(35);

  const currency = getCurrencySymbol();

  // Demo calculations for 1kg Belgian Chocolate Cake
  // Base 1kg ingredients:
  // Flour: 250g @ $2/kg ($0.002/g) = $0.50
  // Butter: 200g @ $10/kg ($0.01/g) = $2.00
  // Cocoa Powder: 100g @ $15/kg ($0.015/g) = $1.50
  // Refined Oil: 60ml @ $3/L ($0.003/ml) = $0.18
  // Sugar & Eggs: $1.00
  const baseCostPerKg = 5.18;
  const scaledIngredientCost = baseCostPerKg * demoCakeWeight;
  const netProfit = Math.max(0, demoSellingPrice - scaledIngredientCost);
  const marginPercent =
    demoSellingPrice > 0 ? ((netProfit / demoSellingPrice) * 100).toFixed(1) : "0.0";

  const currentStep = WORKFLOW_STEPS.find((s) => s.number === activeStep) || WORKFLOW_STEPS[0];

  return (
    <div className="w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-8 text-zinc-800 dark:text-zinc-100">
      {/* ======================================================
          TOP HEADER
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-left">
          <button
            type="button"
            onClick={() => onNavigate?.("/more")}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Back to More"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 uppercase tracking-wider">
                Bakery ERP Guide
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-sans tracking-tight mt-1">
              How Floura Works & Calculates Profit
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              From raw stock purchase to exact order profit margins with zero guesswork.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate?.("/inventory")}
          className="self-start sm:self-center bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Boxes className="w-4 h-4" />
          <span>Start with Inventory</span>
        </button>
      </div>

      {/* ======================================================
          FLOW DIAGRAM PIPELINE (4 STAGES)
      ====================================================== */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 font-sans">
              <Sparkles className="w-5 h-5 text-amber-500" />
              The 4-Step Profit Engine
            </h2>
            <p className="text-xs text-zinc-450 dark:text-zinc-400 mt-0.5">
              Click any stage below to inspect how data flows through your bakery.
            </p>
          </div>
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 font-mono">
            STAGE {activeStep} OF 4
          </span>
        </div>

        {/* Responsive Step Cards Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            const isSelected = activeStep === step.number;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.number)}
                className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[140px] ${
                  isSelected
                    ? "bg-zinc-50 dark:bg-zinc-800/90 border-primary-brand dark:border-orange-500 shadow-md ring-2 ring-primary-brand/20 dark:ring-orange-500/20"
                    : "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${step.bgColor} ${step.color} border ${step.borderColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isSelected
                          ? "bg-primary-brand text-white dark:bg-orange-500"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      Step {step.number}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">
                    {step.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-bold">
                  <span className={`${isSelected ? "text-primary-brand dark:text-orange-400" : "text-zinc-400"}`}>
                    {step.tag}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? "translate-x-0.5 text-primary-brand dark:text-orange-400" : "text-zinc-300"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Step Detailed View */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`p-5 sm:p-6 rounded-2xl border ${currentStep.borderColor} ${currentStep.bgColor} space-y-4`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-white dark:bg-zinc-900 ${currentStep.color} shadow-xs`}>
                  <currentStep.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Step {currentStep.number}: {currentStep.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                    {currentStep.summary}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate?.(currentStep.actionPath)}
                className="self-start sm:self-center px-4 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentStep.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {currentStep.details.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-left space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${currentStep.color}`} />
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {item.heading}
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-6">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-amber-100/70 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 p-3 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <Lightbulb className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Pro-Tip:</strong> {currentStep.proTip}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ======================================================
          INTERACTIVE PROFIT SIMULATOR (CONCRETE EXAMPLE)
      ====================================================== */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-sans">
                Interactive Profit Example: Belgian Chocolate Cake
              </h2>
            </div>
            <p className="text-xs text-zinc-450 dark:text-zinc-400 mt-0.5">
              See in real time how Floura calculates scaled ingredient costs and exact net profits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500">Cake Weight:</span>
            {[0.5, 1, 2, 3].map((wt) => (
              <button
                key={wt}
                type="button"
                onClick={() => setDemoCakeWeight(wt)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  demoCakeWeight === wt
                    ? "bg-primary-brand text-white border-primary-brand dark:bg-orange-500 dark:border-orange-500"
                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {wt} kg
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Recipe Ingredients Breakdown */}
          <div className="lg:col-span-7 space-y-3">
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Stock Ingredient</th>
                    <th className="px-4 py-2.5 text-right">Scaled Qty ({demoCakeWeight}kg)</th>
                    <th className="px-4 py-2.5 text-right">Stock Rate</th>
                    <th className="px-4 py-2.5 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <tr>
                    <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                      All Purpose Flour
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {(250 * demoCakeWeight).toFixed(0)} g
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-400">
                      {currency}2.00 / kg
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {currency}{(0.5 * demoCakeWeight).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                      Unsalted Butter
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {(200 * demoCakeWeight).toFixed(0)} g
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-400">
                      {currency}10.00 / kg
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {currency}{(2.0 * demoCakeWeight).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                      Dark Cocoa Powder
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {(100 * demoCakeWeight).toFixed(0)} g
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-400">
                      {currency}15.00 / kg
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {currency}{(1.5 * demoCakeWeight).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                      Refined Sunflower Oil
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {(60 * demoCakeWeight).toFixed(0)} ml
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-400">
                      {currency}3.00 / L
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {currency}{(0.18 * demoCakeWeight).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                      Eggs, Sugar & Vanilla
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      Batch units
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-400">
                      Standard
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {currency}{(1.0 * demoCakeWeight).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-zinc-50/80 dark:bg-zinc-800/50 font-bold border-t border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <td colSpan={3} className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                      Total Scaled Ingredient Cost:
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                      {currency}{scaledIngredientCost.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              * Notice how both dry ingredients (in grams) and liquid oil (in ml) combine with inventory unit prices into an exact batch cost.
            </p>
          </div>

          {/* Right: Profit Summary Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-zinc-50 to-amber-50/40 dark:from-zinc-800 dark:to-zinc-850 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Order Financials Simulation
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                Customer Selling Price ({currency})
              </label>
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2">
                <span className="text-zinc-400 font-bold text-sm">{currency}</span>
                <input
                  type="number"
                  step="1"
                  min="5"
                  value={demoSellingPrice}
                  onChange={(e) => setDemoSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-zinc-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700/80 text-xs">
              <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                <span>Revenue Billed:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {currency}{demoSellingPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                <span>Raw Ingredient Cost:</span>
                <span className="font-mono font-bold text-rose-500">
                  - {currency}{scaledIngredientCost.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center text-sm font-extrabold">
                <span className="text-zinc-900 dark:text-white">Exact Net Profit:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  {currency}{netProfit.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Profit Margin
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {marginPercent}%
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                Healthy Profit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          COMMON QUESTIONS & TROUBLESHOOTING
      ====================================================== */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4 text-left">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-sans">
            Frequently Asked Questions for Bakers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-150 dark:border-zinc-750 space-y-1.5">
            <h4 className="font-bold text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-primary-brand" />
              Why are ingredients measured in grams (g) by default?
            </h4>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
              Professional pastry formulas rely on weight (grams) rather than volume cups because digital scales ensure extreme accuracy. 100ml of oil or water is weighed directly on the bench scale (~92g oil), keeping all proportions scientifically consistent.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-150 dark:border-zinc-750 space-y-1.5">
            <h4 className="font-bold text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-500" />
              How do I measure liquids like oil or milk in ml?
            </h4>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
              When creating the item in <strong>Inventory</strong>, choose or type <strong>ml</strong> or <strong>L</strong> as the unit (e.g. <em>Sunflower Oil (L)</em>). When you choose it in a recipe, Floura respects the liquid volume unit and cost rate.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-150 dark:border-zinc-750 space-y-1.5">
            <h4 className="font-bold text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Why does my order say "No matching recipe found"?
            </h4>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
              Floura connects orders to recipes by matching the order's <strong>Cake Flavor</strong> with your <strong>Recipe Name</strong>. For example, if your recipe is named <em>"Red Velvet"</em>, ensure the order's flavor is also <em>"Red Velvet"</em>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-150 dark:border-zinc-750 space-y-1.5">
            <h4 className="font-bold text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-violet-500" />
              Where can I see total monthly profit and margin reports?
            </h4>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
              Check your <strong>Kitchen Debriefs</strong> page (<code>/debriefs</code>). It aggregates all completed orders, showing total net profit, average margin %, top earning cake flavors, and cost breakdown patterns.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          BOTTOM CTA BAR
      ====================================================== */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-amber-500 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg text-left">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
            Ready to set up your bakery's profit engine?
          </h3>
          <p className="text-xs sm:text-sm text-white/90 mt-1">
            Start by adding 3 or 4 basic baking ingredients (Flour, Butter, Sugar, Oil) to your inventory to see the magic happen!
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate?.("/inventory/new")}
            className="px-4 py-2.5 bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            + Add First Stock Item
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("/recipes/new")}
            className="px-4 py-2.5 bg-black/20 hover:bg-black/30 border border-white/30 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
          >
            + Add Recipe
          </button>
        </div>
      </div>
    </div>
  );
}
