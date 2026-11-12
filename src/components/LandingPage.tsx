// File Path: /src/components/LandingPage.tsx
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Lock,
  RefreshCcw,
  Utensils,
  FileText,
  PieChart,
  Globe,
  ChevronDown,
  Menu,
  Download,
  Laptop,
  Mail,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import flouraLogo from "../assets/images/floura_logo.webp";
import chefHeroPhoto from "../assets/images/chef_hero_photo.webp";
import LegalModal from "./LegalModal";
import Footer from "./Footer";
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
    ownerEmail,
    setOwnerEmail,
    otpCode,
    setOtpCode,
    isOtpSent,
    isSendingOtp,
    isVerifyingOtp,
    otpCountdown,
    toastMessage,
    errorToast,
    setErrorToast,
    activeModal,
    setActiveModal,
    handleSendOtp,
    handleVerifyOtp,
    handleResetOtp,
  } = useLogin({ onLogin });

  const [downloadTimestamp, setDownloadTimestamp] = useState<number>(() => Date.now());

  const loginSectionRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      icon: <RefreshCcw className="w-5 h-5" />,
      title: "Auto Sync",
      desc: "Your data is saved securely on your device and synced to the cloud automatically, keeping everything up to date.",
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
      <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-100 dark:border-zinc-800/60 transition-colors shadow-xs">
        <div className="px-6 lg:px-10 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center bg-pink-50">
              <img src={flouraLogo} alt="Floura" width={36} height={36} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-xl font-black tracking-tight text-primary-brand dark:text-pink-400 italic">Floura</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
            <a id="nav-link-features" href="#features" className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors">Features</a>
            <a id="nav-link-how-it-works" href="#how-it-works" className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors">How It Works</a>
            <a id="nav-link-modules" href="#modules" className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors">Modules</a>
            <Link
              id="nav-link-downloads"
              to="/downloads"
              className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors flex items-center gap-1.5"
            >
              <span>Downloads</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full font-bold bg-pink-100 dark:bg-pink-950/60 text-primary-brand dark:text-pink-400">
                New
              </span>
            </Link>

            {/* Tools Dropdown */}
            <div className="relative group">
              <button id="nav-link-tools" className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors flex items-center gap-1 cursor-pointer py-1">
                <span>Tools</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute left-0 top-full pt-2 w-60 hidden group-hover:block z-50">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-2 space-y-1">
                  <Link
                    id="nav-link-recipe-calculator"
                    to="/calculator"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-pink-50 dark:hover:bg-zinc-800/80 text-left transition-colors group/item block"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-primary-brand dark:text-pink-400 flex items-center justify-center shrink-0">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover/item:text-primary-brand dark:group-hover/item:text-pink-400 transition-colors">
                        Recipe Calculator
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal">
                        Batch yield & baker's ratio
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2.5">
            <button id="btn-toggle-dark-mode" onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all text-zinc-500 dark:text-zinc-400 cursor-pointer mr-1" aria-label="Toggle dark mode" aria-pressed={darkMode}>
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
              <Link id="btn-nav-get-started" to="/login" className="flex items-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-2.5 px-5 rounded-xl shadow-sm transition-all active:scale-[0.97]">
                <span>Get Started</span>
              </Link>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <button
            id="btn-toggle-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all text-zinc-600 dark:text-zinc-300 cursor-pointer lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Drawer (Inside Sticky Nav Container) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-100 dark:border-zinc-800/80 px-6 py-5 space-y-4 transition-all animate-in slide-in-from-top-2">
            {/* Main Action inside Mobile Menu */}
            {user ? (
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-pink-200 object-cover" referrerPolicy="no-referrer" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{user.name}</span>
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }}
                  className="flex items-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-wider py-2 px-3.5 rounded-xl shadow-sm cursor-pointer"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3 px-5 rounded-xl shadow-sm text-center block"
              >
                <span>Get Started</span>
              </Link>
            )}

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

            {/* Navigation Links inside Mobile Menu */}
            <div className="space-y-1 pt-1">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-primary-brand dark:hover:text-pink-400 transition-colors py-2 border-b border-zinc-100 dark:border-zinc-900"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-primary-brand dark:hover:text-pink-400 transition-colors py-2 border-b border-zinc-100 dark:border-zinc-900"
              >
                How It Works
              </a>
              <a
                href="#modules"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-primary-brand dark:hover:text-pink-400 transition-colors py-2 border-b border-zinc-100 dark:border-zinc-900"
              >
                Modules
              </a>
              <Link
                to="/downloads"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-primary-brand dark:hover:text-pink-400 transition-colors py-2 border-b border-zinc-100 dark:border-zinc-900"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary-brand dark:text-pink-400" />
                  <span>Downloads & Versions</span>
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold bg-pink-100 dark:bg-pink-950/60 text-primary-brand dark:text-pink-400">
                  New
                </span>
              </Link>
            </div>

            <Link
              to="/calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-pink-50 dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-brand text-white flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-primary-brand dark:text-pink-400">
                  Recipe Calculator
                </div>
                <div className="text-[10px] text-zinc-400">
                  Batch yield & baker's ratio
                </div>
              </div>
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-white dark:bg-zinc-950 py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-white to-pink-50/20 dark:from-zinc-950 dark:via-zinc-950 dark:to-pink-950/10 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex">
              <div className={`${pill} bg-pink-50/80 dark:bg-pink-950/40 border-pink-200/50 dark:border-pink-850/30 text-primary-brand dark:text-pink-400`}>
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Modern Bakery Management Platform</span>
              </div>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white leading-[1.08] tracking-tight">
              Your Bakery,<br />
              <span className="text-primary-brand dark:text-pink-400">Perfectly Organized.</span>
            </h1>

            <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg leading-relaxed max-w-xl">
              Floura is your all-in-one bakery command center — manage custom cake orders, track customers, monitor inventory, and analyze profits, all from a single encrypted workspace.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <button id="btn-hero-dashboard" onClick={() => navigate("/dashboard")} className="group inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-sm py-4 px-8 rounded-2xl shadow-lg shadow-pink-200 dark:shadow-none transition-all active:scale-[0.97] cursor-pointer">
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <Link id="btn-hero-start-free" to="/login" className="group inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-sm py-4 px-8 rounded-2xl shadow-lg shadow-pink-200 dark:shadow-none transition-all active:scale-[0.97]">
                  <span>Start 30-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
              <a href="#pricing-section" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-755 font-bold text-sm py-4 px-8 rounded-2xl transition-all active:scale-[0.97] cursor-pointer">
                <span>Plan: ₹99 / month</span>
              </a>
            </div>

            <div className="pt-0.5">
              <Link
                to="/downloads"
                className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-primary-brand dark:text-zinc-400 dark:hover:text-pink-400 transition-colors group"
              >
                <Download className="w-3.5 h-3.5 text-primary-brand dark:text-pink-400 group-hover:translate-y-0.5 transition-transform" />
                <span>Download Android APK (6.0 MB) or Open Web App</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
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

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[380px] aspect-[3/4]">
              {/* Central Chef Hero Photo Container */}
              <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-900 bg-pink-50">
                <img src={chefHeroPhoto} alt="Baker managing custom cake orders in Floura app" width={380} height={507} fetchPriority="high" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-950/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Card 1: Encrypted */}
              <div className="absolute -left-6 top-10 bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-pink-50 dark:border-zinc-800/85 flex items-center gap-3 animate-bounce-subtle max-w-[200px]">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-primary-brand flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-zinc-900 dark:text-white leading-tight">End-to-End Encrypted</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-primary-brand rounded-full animate-pulse" />
                    <span className="text-[9px] font-semibold text-zinc-400">Your data, always private</span>
                  </div>
                </div>
              </div>

              {/* Floating Card 2: Orders */}
              <div className="absolute -right-4 bottom-24 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl shadow-xl border border-pink-50 dark:border-zinc-800/85 flex items-center gap-2 max-w-[170px]">
                <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-pink-950 flex items-center justify-center text-primary-brand dark:text-pink-400 shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-extrabold text-zinc-900 dark:text-white">Order Tracking</p>
                  <p className="text-[9px] text-zinc-400 font-semibold leading-tight mt-0.5">Every order, end-to-end</p>
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
        <div className="bg-gradient-to-br from-pink-900 via-pink-800 to-pink-900 dark:from-pink-950 dark:to-zinc-900 p-8 md:p-12 rounded-[2.5rem] shadow-xl text-center space-y-10 text-white relative overflow-hidden">
          <div className="space-y-3 max-w-xl mx-auto relative z-10">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-pink-100">Why Floura?</span>
            <h2 className="font-serif text-2xl md:text-3xl font-black leading-tight">
              Privacy-First. Encrypted. Always Yours.
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 dark:bg-pink-950/60 text-primary-brand dark:text-pink-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Website Direct Release • No Store Accounts Required</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              Your Bakery in Your Pocket
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md">
              Floura is available directly from our website without App Store or Play Store middlemen. Download the standalone Android APK directly to your phone, or open and install as an offline Web App on iPhone, iPad, and desktop browsers.
            </p>

            <ul className="space-y-2.5">
              {[
                "Direct Android APK download (v1.0.0, 6.0 MB)",
                "Secure offline-first SQLite database and cloud sync",
                "Instant Web App access on any desktop or tablet browser",
                "1-tap iOS Web App installation via Safari Home Screen",
              ].map((pt, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300 font-semibold">
                  <Check className="w-4 h-4 text-primary-brand dark:text-pink-400 shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              {/* Direct APK Download Button */}
              <a
                id="link-download-apk"
                href={`/downloads/floura-v1.0.0.apk?t=${downloadTimestamp}`}
                download="floura-v1.0.0.apk"
                onClick={(e) => {
                  const freshTime = Date.now();
                  setDownloadTimestamp(freshTime);
                  e.currentTarget.href = `/downloads/floura-v1.0.0.apk?t=${freshTime}`;
                }}
                className="flex items-center gap-3 bg-primary-brand hover:bg-primary-brand-dark text-white py-3.5 px-6 rounded-2xl shadow-md shadow-pink-500/20 active:scale-98 transition-all select-none cursor-pointer"
                aria-label="Direct Download Android APK"
              >
                <Download className="w-5 h-5 shrink-0" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-bold text-orange-200 uppercase tracking-wider">Direct Download</p>
                  <p className="text-xs font-black">Android APK (v1.0.0)</p>
                </div>
              </a>

              {/* View Downloads Page */}
              <Link
                id="link-view-all-downloads"
                to="/downloads"
                className="flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 py-3.5 px-6 rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm select-none"
                aria-label="View downloads and setup guide"
              >
                <Globe className="w-5 h-5 shrink-0" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Installation Guide</p>
                  <p className="text-xs font-black">Downloads & Setup</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Right side: platform highlights */}
          <div className="space-y-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary-brand dark:text-pink-400">Where Floura Works</p>
            {[
              {
                icon: <Smartphone className="w-5 h-5" />,
                title: "Android Standalone APK",
                desc: "Direct APK download (6.0 MB) straight from our website. Fast installation, zero Google Play tracking.",
              },
              {
                icon: <Globe className="w-5 h-5" />,
                title: "iOS & iPadOS (Add to Home Screen)",
                desc: "Open in Safari and tap 'Add to Home Screen' for a full-screen offline experience without App Store.",
              },
              {
                icon: <Laptop className="w-5 h-5" />,
                title: "Web Cloud & Desktop Browser",
                desc: "Open in Chrome, Safari or Edge with local offline SQLite database and zero installation required.",
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



      {/* PRICING SECTION - ₹99/month INR with 30-Day Free Trial */}
      <section id="pricing-section" className="py-20 md:py-28 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-950 border-t border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simple, Transparent Pricing</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white leading-tight">
              One Plan. <span className="text-primary-brand dark:text-pink-400">Everything Included.</span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Experience the complete power of Floura free for 30 days. No credit card required to start. Only ₹99/month thereafter.
            </p>
          </div>

          <div className="max-w-md mx-auto rounded-3xl p-8 bg-white dark:bg-zinc-900 border-2 border-primary-brand/30 dark:border-pink-500/30 shadow-2xl shadow-pink-500/10 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary-brand text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-bl-2xl">
              30-Day Free Trial Included
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-2xl font-black text-zinc-900 dark:text-white">Bakery Pro</h3>
              <p className="text-xs text-zinc-400">Full access for home bakers & commercial bakeries</p>
            </div>

            <div className="my-6 flex items-baseline gap-2">
              <span className="font-sans text-5xl font-black text-zinc-900 dark:text-white tracking-tight">₹99</span>
              <span className="text-zinc-400 text-sm font-semibold">/ month INR</span>
            </div>

            <ul className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Unlimited custom orders with tier specs & inscriptions</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Recipe formula formulation with dynamic batch scaler</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Ingredient inventory tracking & low-stock alerts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Complete customer database & lifetime order history</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>End-to-end encrypted SQLite database & offline mobile sync</span>
              </li>
            </ul>

            <div className="mt-8">
              <Link
                to="/login"
                className="w-full py-4 px-6 rounded-2xl bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-200 dark:shadow-none transition active:scale-[0.98]"
              >
                <span>Start 30-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-2.5 text-[11px] text-center text-zinc-400">
                Cancel anytime • No auto-debit surprise • Easy manual renewal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SIGN IN SECTION */}
      <section id="login-section" ref={loginSectionRef} className="py-20 md:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-md mx-auto px-6 text-center space-y-10">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-md border border-zinc-150 dark:border-zinc-800 bg-pink-50 p-1 flex items-center justify-center">
              <img src={flouraLogo} alt="Floura" width={56} height={56} loading="lazy" className="w-full h-full object-cover rounded-xl" />
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
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Sign In to Floura</span>
                  <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Email OTP
                  </div>
                </div>

                {!isOtpSent ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-3 text-left">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      <input
                        type="email"
                        placeholder="chef@flourabakery.com"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        required
                        disabled={isSendingOtp}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-primary-brand"
                      />
                    </div>
                    <button
                      id="btn-landing-send-otp"
                      type="submit"
                      disabled={isSendingOtp || !ownerEmail.trim() || !ownerEmail.includes("@")}
                      className="w-full flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white py-3 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-bold text-xs uppercase tracking-widest"
                    >
                      {isSendingOtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-3 text-left">
                    <div className="flex items-center justify-between text-[11px] px-1 text-zinc-500 dark:text-zinc-400">
                      <span>Code sent to <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{ownerEmail}</strong></span>
                      <button
                        type="button"
                        onClick={handleResetOtp}
                        className="text-primary-brand dark:text-orange-400 font-bold hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 rounded-lg p-2 leading-tight">
                      <strong>Check Spam:</strong> If the code does not appear in your inbox, please check your Spam or Junk folder.
                    </p>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                        required
                        autoFocus
                        disabled={isVerifyingOtp}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-center text-lg font-mono font-black tracking-[0.4em] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 outline-none focus:ring-2 focus:ring-primary-brand"
                      />
                    </div>
                    <button
                      id="btn-landing-verify-otp"
                      type="submit"
                      disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                      className="w-full flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white py-3 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-bold text-xs uppercase tracking-widest"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify & Enter Workspace</span>
                        </>
                      )}
                    </button>
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isSendingOtp || otpCountdown > 0}
                        className="text-[11px] font-bold text-primary-brand dark:text-orange-400 hover:underline disabled:opacity-40"
                      >
                        {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : "Resend code"}
                      </button>
                    </div>
                  </form>
                )}

                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed text-center font-semibold pt-1">
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
      <Footer onOpenLegalModal={setActiveModal} />

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
