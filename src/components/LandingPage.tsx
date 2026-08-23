// File Path: /src/components/LandingPage.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Check,
  Sun,
  Moon,
  Layers,
  Calendar,
  RefreshCw,
  XCircle,
  X,
  ShieldCheck,
  Smartphone,
  BarChart3,
  Users,
  Play,
  LogOut,
  ArrowUpRight,
  ClipboardList,
  Package,
  WifiOff,
  Lock,
  RefreshCcw,
  Utensils,
  FileText,
  PieChart,
  Globe,
} from "lucide-react";
import flouraLogo from "../assets/images/floura_logo.webp";
import chefHeroPhoto from "../assets/images/chef_hero_photo.webp";
import LegalModal from "./LegalModal";
import { useLogin } from "../hooks/useLogin";

interface LandingPageProps {
  user?: { name: string; email: string; avatar: string; token?: string } | null;
  onLogin: (user: { name: string; email: string; avatar: string; token: string; isNew?: boolean }) => void;
  onLogout?: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function LandingPage({ user, onLogin, onLogout, darkMode, setDarkMode }: LandingPageProps) {
  const navigate = useNavigate();
  const {
    authenticating,
    toastMessage,
    errorToast,
    setErrorToast,
    activeModal,
    setActiveModal,
    handleGoogleSignIn,
  } = useLogin({ onLogin });

  const loginSectionRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const howItWorksSectionRef = useRef<HTMLDivElement>(null);
  const demoSectionRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const features = [
    {
      icon: <ClipboardList className="w-5 h-5" />,
      title: "Order Management",
      desc: "Track custom cake orders end-to-end — specs, inscriptions, delivery, and payment status all in one place.",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Customer Records",
      desc: "Maintain detailed customer profiles with order history, contact info, and membership since date.",
    },
    {
      icon: <Package className="w-5 h-5" />,
      title: "Inventory Tracking",
      desc: "Monitor ingredient stock levels, get low-stock alerts, and track supplier costs in real time.",
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: "Recipe Formulation",
      desc: "Store and scale custom recipes with ingredient ratios, yield calculations, and category tagging.",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Profit Analytics",
      desc: "Analyze margins, revenue, and ingredient costs with a built-in dashboard powered by your own data.",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Calendar & Reminders",
      desc: "Schedule delivery dates, custom events, and automated WhatsApp/SMS follow-up alerts.",
    },
    {
      icon: <ClipboardList className="w-5 h-5" />,
      title: "Daily Checklists",
      desc: "Create and manage daily kitchen task lists to stay organized and never miss a prep step.",
    },
    {
      icon: <WifiOff className="w-5 h-5" />,
      title: "Offline First",
      desc: "Your data is saved directly on your device. The app works fully without internet and syncs automatically when back online.",
    },
  ];

  const stats = [
    { value: "8+", label: "Core Modules", icon: <Layers className="w-4 h-4" /> },
    { value: "100%", label: "Encrypted Data", icon: <ShieldCheck className="w-4 h-4" /> },
    { value: "Mobile", label: "iOS & Android", icon: <Smartphone className="w-4 h-4" /> },
  ];

  const steps = [
    { num: "01", title: "Sign In with Google", desc: "Create your account in seconds using your Google profile — no passwords needed." },
    { num: "02", title: "Set Up Your Profile", desc: "Configure your bakery name, currency, and preferred date format to personalise your workspace." },
    { num: "03", title: "Add Orders & Customers", desc: "Log your custom cake orders, track payment installments, and link them to customers." },
    { num: "04", title: "Access Anywhere", desc: "Your data is saved on your device and syncs automatically whenever you're back online." },
  ];

  const benefits = [
    {
      title: "End-to-End Encrypted",
      desc: "All your bakery records are fully encrypted at rest — your data stays private, always.",
      icon: <Lock className="w-6 h-6" />,
    },
    {
      title: "Multi-Platform",
      desc: "Use Floura on the web or install the native iOS and Android app — same experience everywhere.",
      icon: <Smartphone className="w-6 h-6" />,
    },
    {
      title: "Instant Sync",
      desc: "Sign in on any device to access your latest data. Your account stays in sync — one active session at a time.",
      icon: <RefreshCcw className="w-6 h-6" />,
    },
    {
      title: "Always Yours",
      desc: "No third-party sharing. Your customers, orders, and recipes belong only to you.",
      icon: <ShieldCheck className="w-6 h-6" />,
    },
  ];

  const modules = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Order Detail View",
      desc: "Every order captures cake shape, flavour, weight, layers, inscription, reference images, venue, and the full payment history.",
      tag: "Orders",
    },
    {
      icon: <PieChart className="w-5 h-5" />,
      title: "Dashboard Analytics",
      desc: "At a glance: today's deliveries, revenue this month, pending payments, and low-stock alerts — all derived from your local data.",
      tag: "Dashboard",
    },
    {
      icon: <Utensils className="w-5 h-5" />,
      title: "Recipe Scaling",
      desc: "Store full recipes with ingredient lists, scale them to any yield, and link them to orders for accurate cost calculation.",
      tag: "Recipes",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Customer Management",
      desc: "Manage your client base with full profiles, contact details, order history, and membership records — all in one view.",
      tag: "Customers",
    },
  ];

  const pill = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border";

  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 transition-colors duration-300 font-sans">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/85 dark:bg-zinc-950/85 border-b border-zinc-100 dark:border-zinc-800/60 px-6 lg:px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center bg-pink-50">
            <img src={flouraLogo} alt="Floura Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-black tracking-tight text-primary-brand dark:text-pink-400 italic">Floura</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
          <a id="nav-link-features" href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(featuresSectionRef); }} className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors cursor-pointer">Features</a>
          <a id="nav-link-how-it-works" href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection(howItWorksSectionRef); }} className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors cursor-pointer">How It Works</a>
          <a id="nav-link-modules" href="#modules" onClick={(e) => { e.preventDefault(); scrollToSection(demoSectionRef); }} className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors cursor-pointer">Modules</a>
          <a id="nav-link-signin" href="#login-section" onClick={(e) => { e.preventDefault(); scrollToSection(loginSectionRef); }} className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors cursor-pointer">Sign In</a>
        </div>

        <div className="flex items-center gap-2.5">
          <button id="btn-toggle-dark-mode" onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all text-zinc-500 dark:text-zinc-400 cursor-pointer mr-1" aria-label="Toggle Dark Mode">
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-pink-50 dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 py-1.5 px-3 rounded-xl">
                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full border border-pink-200 object-cover" referrerPolicy="no-referrer" />
                <span className="hidden sm:inline text-xs font-bold text-zinc-750 dark:text-zinc-200 truncate max-w-[100px]">{user.name.split(" ")[0]}</span>
              </div>
              <button id="btn-nav-dashboard" onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.97] cursor-pointer">
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button id="btn-nav-get-started" onClick={() => scrollToSection(loginSectionRef)} className="flex items-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-2.5 px-5 rounded-xl shadow-sm transition-all active:scale-[0.97] cursor-pointer">
              <span>Get Started</span>
            </button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-white dark:bg-zinc-950 py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-white to-pink-50/20 dark:from-zinc-950 dark:via-zinc-950 dark:to-pink-950/10 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex">
              <div className={`${pill} bg-pink-50/80 dark:bg-pink-950/40 border-pink-200/50 dark:border-pink-850/30 text-primary-brand dark:text-pink-400`}>
                <Sparkles className="w-3.5 h-3.5 text-primary-brand dark:text-pink-400" />
                <span>Offline-First Bakery Management</span>
              </div>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white leading-[1.08] tracking-tight">
              Your Bakery,<br />
              <span className="text-primary-brand dark:text-pink-400">Perfectly Organized.</span>
            </h1>

            <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg leading-relaxed max-w-xl">
              Floura is your all-in-one bakery command center — manage custom cake orders, track customers, monitor inventory, and analyze profits, all from a single encrypted workspace that works even offline.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <button id="btn-hero-dashboard" onClick={() => navigate("/dashboard")} className="group inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-sm py-4 px-8 rounded-2xl shadow-lg shadow-pink-200 dark:shadow-none transition-all active:scale-[0.97] cursor-pointer">
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <button id="btn-hero-start-free" onClick={() => scrollToSection(loginSectionRef)} className="group inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-sm py-4 px-8 rounded-2xl shadow-lg shadow-pink-200 dark:shadow-none transition-all active:scale-[0.97] cursor-pointer">
                  <span>Start for Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
              <button id="btn-hero-how-it-works" onClick={() => scrollToSection(howItWorksSectionRef)} className="inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-755 font-bold text-sm py-4 px-8 rounded-2xl transition-all active:scale-[0.97] cursor-pointer">
                How It Works
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 max-w-lg">
              {stats.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-primary-brand dark:text-pink-400">
                    {s.icon}
                    <span className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white font-mono">{s.value}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[380px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-900 bg-pink-50">
              <img src={chefHeroPhoto} alt="Bakery Dashboard" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-950/20 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Card 1: Offline ready */}
            <div className="absolute -left-6 top-10 bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-pink-50 dark:border-zinc-800/85 flex items-center gap-3 animate-bounce-subtle max-w-[200px]">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-extrabold text-zinc-900 dark:text-white leading-tight">Offline Ready</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-semibold text-zinc-400">Works without internet</span>
                </div>
              </div>
            </div>

            {/* Floating Card 2: Encrypted */}
            <div className="absolute -right-4 bottom-24 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl shadow-xl border border-pink-50 dark:border-zinc-800/85 flex items-center gap-2 max-w-[170px]">
              <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-pink-950 flex items-center justify-center text-primary-brand dark:text-pink-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-extrabold text-zinc-900 dark:text-white">Fully Encrypted</p>
                <p className="text-[9px] text-zinc-400 font-semibold leading-tight mt-0.5">Your data, always private</p>
              </div>
            </div>

            {/* Floating Card 3: Sync */}
            <div className="absolute left-4 -bottom-4 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl shadow-xl border border-pink-50 dark:border-zinc-800/85 flex items-center gap-3.5 max-w-[210px]">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 shrink-0">
                <RefreshCcw className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-extrabold text-zinc-900 dark:text-white">Auto Sync</p>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Saves as you go</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" ref={featuresSectionRef} className="py-20 md:py-28 bg-pink-50/30 dark:bg-zinc-900/40 border-t border-b border-pink-50/50 dark:border-zinc-900/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16 text-center">
          <div className="space-y-4 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">Everything You Need</span>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              Built for Bakers, Not Accountants
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-1 bg-pink-500 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => (
              <div key={idx} className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl hover:border-pink-200 dark:hover:border-pink-900/40 hover:shadow-xl hover:shadow-pink-50/30 dark:hover:shadow-none transition-all duration-300 text-left flex flex-col justify-between min-h-[190px]">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-primary-brand dark:text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    {f.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{f.title}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <button id="btn-features-get-started" onClick={() => scrollToSection(loginSectionRef)} className="inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3 px-8 rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer">
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" ref={howItWorksSectionRef} className="py-20 md:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16 text-center">
          <div className="space-y-4 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">How It Works</span>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              Up and Running in Minutes
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-1 bg-pink-500 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-0.5 border-t border-dashed border-pink-200 dark:border-zinc-800 -z-0" />
            {steps.map((st, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center space-y-4 z-10">
                <div className="w-16 h-16 rounded-full bg-pink-50 dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 flex items-center justify-center text-primary-brand dark:text-pink-400 text-lg font-black shadow-sm shrink-0">
                  {st.num}
                </div>
                <div className="space-y-1.5 max-w-[200px]">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{st.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            {user ? (
              <button id="btn-howitworks-dashboard" onClick={() => navigate("/dashboard")} className="inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer">
                Open My Dashboard
              </button>
            ) : (
              <button id="btn-howitworks-start-now" onClick={() => scrollToSection(loginSectionRef)} className="inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer">
                Get Started Now
              </button>
            )}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE FLOURA */}
      <section className="py-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="bg-gradient-to-br from-pink-700 via-pink-600 to-primary-brand dark:from-pink-950 dark:to-zinc-900 p-8 md:p-12 rounded-[2.5rem] shadow-xl text-center space-y-10 text-white relative overflow-hidden">
          <div className="space-y-3 max-w-xl mx-auto relative z-10">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-pink-100">Why Floura?</span>
            <h2 className="font-serif text-2xl md:text-3xl font-black leading-tight">
              Privacy-First. Offline-Ready. Always Yours.
            </h2>
            <div className="flex justify-center pt-1">
              <div className="w-12 h-0.5 bg-pink-200/50 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-sm border border-white/25 p-6 rounded-2xl text-left space-y-3.5 hover:bg-white/25 transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  {b.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-sm text-white drop-shadow-sm">{b.title}</h3>
                  <p className="text-white text-xs leading-relaxed opacity-95 drop-shadow-sm">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEY MODULES */}
      <section id="modules" ref={demoSectionRef} className="py-20 md:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16">
          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-5">
            <div className="space-y-2 text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">Key Modules</span>
              <h2 className="font-serif text-3xl font-black text-zinc-900 dark:text-white leading-tight">
                Every Part of Your Bakery, Covered
              </h2>
            </div>
            <a id="nav-modules-signin" href="#login-section" onClick={(e) => { e.preventDefault(); scrollToSection(loginSectionRef); }} className="text-xs font-extrabold uppercase text-primary-brand dark:text-pink-400 flex items-center gap-1 hover:underline cursor-pointer">
              <span>Sign In to Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {modules.map((m, idx) => (
              <div key={idx} className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-7 rounded-2xl hover:border-pink-200 dark:hover:border-pink-900/40 hover:shadow-xl hover:shadow-pink-50/30 dark:hover:shadow-none transition-all duration-300 flex gap-5 items-start">
                <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-primary-brand dark:text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  {m.icon}
                </div>
                <div className="space-y-1.5 flex-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{m.title}</h3>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary-brand dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-full border border-pink-100 dark:border-pink-900/30">{m.tag}</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOBILE / DOWNLOAD */}
      <section className="py-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="bg-pink-50/50 dark:bg-zinc-900/50 border border-pink-50 dark:border-zinc-800/80 p-8 md:p-12 rounded-[2.5rem] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">Available Everywhere</span>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              Your Bakery in Your Pocket
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md">
              Floura is available as a web app and as a native iOS and Android app. Access your orders, recipes, inventory, and checklists from anywhere — even without internet.
            </p>

            <ul className="space-y-2.5">
              {[
                "Works offline — no internet required",
                "Native iOS & Android apps available",
                "Sign in securely with Google",
                "Order history & records always accessible",
              ].map((pt, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300 font-semibold">
                  <Check className="w-4 h-4 text-primary-brand dark:text-pink-400 shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              <a id="link-download-appstore" href="#" className="flex items-center gap-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 py-3 px-5 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm select-none">
                <Smartphone className="w-5 h-5 shrink-0" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Download on the</p>
                  <p className="text-xs font-black">App Store</p>
                </div>
              </a>
              <a id="link-download-googleplay" href="#" className="flex items-center gap-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 py-3 px-5 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm select-none">
                <Play className="w-5 h-5 fill-current shrink-0" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Get it on</p>
                  <p className="text-xs font-black">Google Play</p>
                </div>
              </a>
            </div>
          </div>

          {/* Right side: platform highlights */}
          <div className="space-y-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary-brand dark:text-pink-400">Where Floura Works</p>
            {[
              {
                icon: <Globe className="w-5 h-5" />,
                title: "Web App",
                desc: "Open your browser and start managing orders instantly — no installation needed.",
              },
              {
                icon: <Smartphone className="w-5 h-5" />,
                title: "iOS & Android",
                desc: "Native apps built for speed. Take orders, check inventory, and view recipes on the go.",
              },
              {
                icon: <WifiOff className="w-5 h-5" />,
                title: "Works Offline",
                desc: "No signal? No problem. Your data is always available — syncs automatically when back online.",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-primary-brand dark:text-pink-400 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-extrabold text-zinc-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* SIGN IN SECTION */}
      <section id="login-section" ref={loginSectionRef} className="py-20 md:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-md mx-auto px-6 text-center space-y-10">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-md border border-zinc-150 dark:border-zinc-800 bg-pink-50 p-1 flex items-center justify-center">
              <img src={flouraLogo} alt="Floura" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h2 className="font-serif text-3xl font-black text-zinc-900 dark:text-white leading-tight">
              Start managing your<br />
              <span className="italic text-primary-brand dark:text-pink-400">bakery today</span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm leading-relaxed max-w-xs mx-auto">
              Sign in securely with your Google account to access your personal bakery dashboard — orders, inventory, recipes, and more.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 space-y-6">
            {user ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Active Profile Session</span>
                  <div className="flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-primary-brand/20 object-cover shadow-sm" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">{user.name}</h3>
                    <p className="text-[11px] text-zinc-400 font-semibold mt-1">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    id="btn-signin-dashboard"
                    onClick={() => navigate("/dashboard")}
                    className="w-full flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {onLogout && (
                    <button
                      id="btn-signin-logout"
                      onClick={onLogout}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Sign In to Floura</span>
                  <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Secure
                  </div>
                </div>

                <button
                  id="btn-signin-google"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authenticating}
                  className="group w-full flex items-center justify-center gap-3 bg-primary-brand hover:bg-primary-brand-dark text-white py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-bold text-xs uppercase tracking-widest"
                >
                  {authenticating ? (
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <div className="w-5.5 h-5.5 bg-white rounded-full flex items-center justify-center p-1 shrink-0 shadow-sm">
                      <svg className="w-full h-full" viewBox="0 0 48 48">
                        <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335" />
                        <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4" />
                        <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05" />
                        <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853" />
                      </svg>
                    </div>
                  )}
                  <span>{authenticating ? "Signing in..." : "Continue with Google"}</span>
                </button>

                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed text-center font-semibold">
                  By signing in, you agree to our{" "}
                  <button id="btn-terms-modal-signin" onClick={(e) => { e.preventDefault(); setActiveModal("terms"); }} className="underline hover:text-zinc-750 dark:hover:text-zinc-350 cursor-pointer">Terms</button>,{" "}
                  <button id="btn-privacy-modal-signin" onClick={(e) => { e.preventDefault(); setActiveModal("privacy"); }} className="underline hover:text-zinc-750 dark:hover:text-zinc-350 cursor-pointer">Privacy Policy</button>{" "}
                  &{" "}
                  <button id="btn-disclaimer-modal-signin" onClick={(e) => { e.preventDefault(); setActiveModal("disclaimer"); }} className="underline hover:text-zinc-750 dark:hover:text-zinc-300 cursor-pointer">Disclaimer</button>.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-150 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
          <div className="flex items-center gap-2.5 select-none">
            <img src={flouraLogo} alt="Floura" className="w-6 h-6 rounded-lg" />
            <span className="font-serif font-black text-zinc-650 dark:text-zinc-400 italic">Floura</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
          </div>
          <div>© {new Date().getFullYear()} Floura. All Rights Reserved.</div>
          <div className="flex items-center gap-5">
            <button id="btn-terms-modal-footer" onClick={() => setActiveModal("terms")} className="hover:text-zinc-750 dark:hover:text-zinc-350 transition-colors cursor-pointer">Terms</button>
            <button id="btn-privacy-modal-footer" onClick={() => setActiveModal("privacy")} className="hover:text-zinc-750 dark:hover:text-zinc-350 transition-colors cursor-pointer">Privacy</button>
            <button id="btn-disclaimer-modal-footer" onClick={() => setActiveModal("disclaimer")} className="hover:text-zinc-750 dark:hover:text-zinc-300 transition-colors cursor-pointer">Disclaimer</button>
          </div>
        </div>
      </footer>

      {/* Toasts */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-full shadow-xl font-bold text-xs flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}
      {errorToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold max-w-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span className="leading-relaxed">{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast("")} className="text-white/80 hover:text-white cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <LegalModal isOpen={activeModal !== null} type={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
