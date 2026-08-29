// File Path: /src/components/PagesGuideModal.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutGrid,
  ShoppingBag,
  BookOpen,
  Boxes,
  Users,
  CheckCircle2,
  MessageSquare,
  UserCog,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  HelpCircle,
  Check
} from "lucide-react";

export interface PagesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

interface GuideStep {
  path: string;
  screenKey: string;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  features: { title: string; desc: string }[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    path: "/dashboard",
    screenKey: "dashboard",
    title: "Dashboard Overview",
    badge: "Step 1 of 8 • Dashboard",
    subtitle: "What we do here:",
    description:
      "The Dashboard is your main command center! Here you can monitor daily net profit, track active delivery schedules, check low-stock ingredient alerts, and complete your morning kitchen prep checklist at a glance.",
    icon: LayoutGrid,
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
    borderColor: "border-orange-200 dark:border-orange-800/40",
    features: [
      { title: "Net Profit & Margins", desc: "Real-time calculation of today's earnings & recipe profitability." },
      { title: "Delivery Schedule", desc: "Chronological order list sorted by time so you never miss a deadline." },
      { title: "Low Stock Alerts", desc: "Instant warning badge when Flour, Butter, or Eggs fall below limits." },
      { title: "Daily Prep Checklist", desc: "Interactive morning opening & prep task tracker." }
    ]
  },
  {
    path: "/orders",
    screenKey: "orders",
    title: "Orders & Client Delivery",
    badge: "Step 2 of 8 • Orders",
    subtitle: "What we do here:",
    description:
      "Manage all incoming cake and pastry orders from placement to final pickup or delivery! Track order statuses (Pending, In Production, Ready, Delivered), record payment deposits, print invoices, and view order specs.",
    icon: ShoppingBag,
    color: "text-pink-500 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/40",
    borderColor: "border-pink-200 dark:border-pink-800/40",
    features: [
      { title: "Order Pipeline", desc: "Filter by Pending, In Production, Ready for Pickup, or Delivered." },
      { title: "Invoice & Receipts", desc: "Generate professional client receipts with itemized totals." },
      { title: "Customer Specs", desc: "Include flavor requests, custom inscriptions, and delivery notes." }
    ]
  },
  {
    path: "/recipes",
    screenKey: "recipes",
    title: "Recipes & Batch Costing",
    badge: "Step 3 of 8 • Recipes",
    subtitle: "What we do here:",
    description:
      "Catalog your signature baking recipes with exact ingredient formulas! Automatically compute production cost per batch, calculate target profit margins, and determine suggested retail prices based on raw material costs.",
    icon: BookOpen,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800/40",
    features: [
      { title: "Automated Batch Costing", desc: "Dynamically calculates cost based on inventory raw material prices." },
      { title: "Target Profit Margins", desc: "Set target margin % to auto-calculate optimal selling price." },
      { title: "Baking Instructions", desc: "Step-by-step procedures to ensure consistent quality every batch." }
    ]
  },
  {
    path: "/inventory",
    screenKey: "inventory",
    title: "Inventory & Raw Materials",
    badge: "Step 4 of 8 • Inventory",
    subtitle: "What we do here:",
    description:
      "Keep track of all baking supplies, raw ingredients, and packaging materials! Set stock quantities, unit prices, minimum threshold alerts, and record new purchases to avoid running out during a rush.",
    icon: Boxes,
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800/40",
    features: [
      { title: "Stock Tracking", desc: "Monitor stock quantities in kg, grams, liters, units, or boxes." },
      { title: "Low-Stock Triggers", desc: "Automated alerts on your dashboard when stock drops below threshold." },
      { title: "Cost History", desc: "Keep track of changing supplier costs for accurate recipe pricing." }
    ]
  },
  {
    path: "/customers",
    screenKey: "customers",
    title: "Customer Directory",
    badge: "Step 5 of 8 • Customers",
    subtitle: "What we do here:",
    description:
      "Build strong relationships with your sweet clients! View lifetime spend, complete order history, phone & email contact details, and special dietary requirements (such as gluten-free, vegan, or nut allergies).",
    icon: Users,
    color: "text-sky-500 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800/40",
    features: [
      { title: "VIP Profiles", desc: "See total orders and lifetime spend for every client." },
      { title: "Dietary Preferences", desc: "Store allergy warnings and favorite cake flavors." },
      { title: "Direct Contact", desc: "Quick phone call & email buttons for seamless communication." }
    ]
  },
  {
    path: "/checklist",
    screenKey: "checklist",
    title: "Daily Prep Checklist",
    badge: "Step 6 of 8 • Daily Checklist",
    subtitle: "What we do here:",
    description:
      "Keep your kitchen operating flawlessly every day! Check off morning opening duties, oven preheating, temperature logs, sanitation checks, and evening closing routines.",
    icon: CheckCircle2,
    color: "text-violet-500 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800/40",
    features: [
      { title: "Daily Routine", desc: "Reset tasks daily to ensure high kitchen quality standards." },
      { title: "Custom Checklist Tasks", desc: "Add custom tasks tailored to your bakery's workflow." },
      { title: "Completion Tracking", desc: "Visual percentage progress bar for kitchen readiness." }
    ]
  },
  {
    path: "/debriefs",
    screenKey: "debriefs",
    title: "Order Debriefs & Notes",
    badge: "Step 7 of 8 • Debriefs",
    subtitle: "What we do here:",
    description:
      "Review performance notes after major cake deliveries or wedding events. Document customer feedback, design challenges, and recipe tweaks to continuously refine your baking process.",
    icon: MessageSquare,
    color: "text-indigo-500 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200 dark:border-indigo-800/40",
    features: [
      { title: "Event Reflections", desc: "Capture what went smoothly and what can be improved." },
      { title: "Technique Notes", desc: "Note adjustments needed for scaling or decorating techniques." },
      { title: "Continuous Growth", desc: "Build a shared knowledge base for your bakery." }
    ]
  },
  {
    path: "/more",
    screenKey: "more",
    title: "Settings & Bakery Setup",
    badge: "Step 8 of 8 • Settings",
    subtitle: "What we do here:",
    description:
      "Configure your bakery profile details, currency preference ($ / € / £ / ₹), theme mode (Dark/Light), local offline database sync status, and account settings.",
    icon: UserCog,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800/40",
    features: [
      { title: "Bakery & Chef Profile", desc: "Update bakery name, phone, address, and head baker info." },
      { title: "Currency & Formatting", desc: "Select your preferred currency symbol and date formats." },
      { title: "Offline & Cloud Sync", desc: "Monitor SQLite local database status and trigger manual cloud sync." }
    ]
  }
];

export default function PagesGuideModal({
  isOpen,
  onClose,
  onNavigate
}: PagesGuideModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Sync step changes with page navigation
  const goToStep = (index: number) => {
    if (index >= 0 && index < GUIDE_STEPS.length) {
      setCurrentStepIndex(index);
      onNavigate(GUIDE_STEPS[index].path);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < GUIDE_STEPS.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem("floura_has_seen_pages_guide", "true");
    } catch (e) {
      console.warn("Could not save pages guide status:", e);
    }
    onClose();
    onNavigate("/dashboard");
  };

  const handleSkip = () => {
    try {
      localStorage.setItem("floura_has_seen_pages_guide", "true");
    } catch (e) {
      console.warn("Could not save pages guide status:", e);
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentStep = GUIDE_STEPS[currentStepIndex];
  const IconComponent = currentStep.icon;
  const progressPercent = Math.round(((currentStepIndex + 1) / GUIDE_STEPS.length) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-zinc-950/65 backdrop-blur-md transition-all">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Decorative Gradient Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-pink-400 to-amber-400" />

          {/* Header Bar */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-400/15 flex items-center justify-center text-primary-brand dark:text-orange-400">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-serif text-zinc-900 dark:text-zinc-100 leading-tight">
                  Floura Pages Guide 📖
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {currentStep.badge}
                </p>
              </div>
            </div>

            {/* Skip & Close Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                title="Skip pages guide"
              >
                Skip Guide
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                title="Close guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800/60 h-1">
            <div
              className="bg-gradient-to-r from-orange-400 to-pink-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Page Title & Icon Hero Card */}
            <div className={`p-4 rounded-2xl border ${currentStep.bgColor} ${currentStep.borderColor} flex items-start gap-4 transition-all duration-300`}>
              <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border ${currentStep.borderColor} flex items-center justify-center shrink-0 shadow-sm ${currentStep.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 dark:bg-zinc-900/80 ${currentStep.color}`}>
                    {currentStep.screenKey}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {currentStep.subtitle}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                  {currentStep.title}
                </h3>
                <p className="text-xs text-zinc-650 dark:text-zinc-300 mt-1.5 leading-relaxed font-sans">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div>
              <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Key Features on this Page
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentStep.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-150 dark:border-zinc-750 rounded-xl flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {feat.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Navigation Dots / Pills */}
            <div className="pt-2 flex items-center justify-center gap-1.5 flex-wrap">
              {GUIDE_STEPS.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? "w-7 bg-primary-brand dark:bg-orange-400"
                        : "w-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                    }`}
                    title={`Jump to ${step.title}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Footer Controls: Back, Skip, Next */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="px-3.5 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
              
              <button
                type="button"
                onClick={handleSkip}
                className="px-3.5 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              >
                Skip
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 text-xs font-bold text-white bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              {currentStepIndex === GUIDE_STEPS.length - 1 ? (
                <>
                  <span>Finish & Start Baking</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Next Page</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
