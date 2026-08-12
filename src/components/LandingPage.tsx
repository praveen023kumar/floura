// File Path: /src/components/LandingPage.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Check,
  Sun,
  Moon,
  Database,
  DollarSign,
  Layers,
  Calendar,
  RefreshCw,
  XCircle,
  X,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShieldCheck,
  Zap,
  Monitor,
  Smartphone,
  Star,
  BarChart3,
  Bell,
  Heart,
  Award,
  Phone,
  Users,
  Shield,
  Play,
  Video,
  Camera,
  MessageSquare,
  BookOpen,
  MapPin,
  HelpCircle,
  LogOut,
  User,
  ArrowUpRight,
  Sparkle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import appScreenshot from "../assets/images/app_screenshot.jpg";
import flouraLogo from "../assets/images/floura_logo.jpg";
import chefHeroPhoto from "../assets/images/chef_hero_photo.jpg";
import chefSarah from "../assets/images/chef_sarah.jpg";
import chefJames from "../assets/images/chef_james.jpg";
import chefEmily from "../assets/images/chef_emily.jpg";
import chefMichael from "../assets/images/chef_michael.jpg";
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

  const [activeDemoTab, setActiveDemoTab] = useState<"specs" | "margins" | "stock">("specs");
  const loginSectionRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const servicesSectionRef = useRef<HTMLDivElement>(null);
  const howItWorksSectionRef = useRef<HTMLDivElement>(null);
  const pricingSectionRef = useRef<HTMLDivElement>(null);
  const specialistsSectionRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const services = [
    { icon: <Video className="w-5 h-5" />, title: "Video Consultation", desc: "Talk to a master pastry chef face-to-face to plan complex structures." },
    { icon: <Phone className="w-5 h-5" />, title: "Voice Consultation", desc: "Get immediate baking advice and recipe adjustments on a call." },
    { icon: <Database className="w-5 h-5" />, title: "Baking Records", desc: "Store and access order specifications, custom design details, and notes." },
    { icon: <Layers className="w-5 h-5" />, title: "Recipe Formulation", desc: "Formulate custom recipes, calculate flour weight and adjust ratios." },
    { icon: <Clock className="w-5 h-5" />, title: "Kitchen Checkups", desc: "Schedule preventive inspections and audits for commercial kitchens." },
    { icon: <Users className="w-5 h-5" />, title: "Specialist Bakers", desc: "Connect with world-renowned chocolatiers and sugar decorators." },
    { icon: <DollarSign className="w-5 h-5" />, title: "Cost Calculator", desc: "Calculate your margins, ingredient costs, and labor hours per order." },
    { icon: <ShieldCheck className="w-5 h-5" />, title: "Inventory Support", desc: "Get real-time stock levels and automated low inventory alarms." },
  ];

  const stats = [
    { value: "15K+", label: "Happy Clients", icon: <Users className="w-4 h-4" /> },
    { value: "120+", label: "Expert Chefs", icon: <Award className="w-4 h-4" /> },
    { value: "98%", label: "Satisfaction Rate", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const steps = [
    { num: "01", title: "Create Account", desc: "Sign up in minutes and complete your kitchen profile." },
    { num: "02", title: "Choose Service", desc: "Select the consulting service or calculator tools you need." },
    { num: "03", title: "Consult Chef", desc: "Connect with a master pastry chef or cake designer instantly." },
    { num: "04", title: "Get Baking", desc: "Follow customized recipes, tips, and bake amazing creations." },
  ];

  const benefits = [
    { title: "Expert Chefs", desc: "Connect with certified & experienced professionals.", icon: <Award className="w-6 h-6" /> },
    { title: "Secure & Private", desc: "Your recipes, orders, and clients are 100% encrypted.", icon: <Shield className="w-6 h-6" /> },
    { title: "24/7 Availability", desc: "Get support for urgent baking emergencies anytime.", icon: <Clock className="w-6 h-6" /> },
    { title: "Affordable Pricing", desc: "Premium tools and consultations at reasonable rates.", icon: <DollarSign className="w-6 h-6" /> },
  ];

  const specialists = [
    { name: "Chef Sarah Johnson", specialty: "Pastry Designer & Sculptor", exp: "8 Years Exp", rating: "4.9", image: chefSarah },
    { name: "Chef James Smith", specialty: "Master Chocolatier", exp: "10 Years Exp", rating: "4.8", image: chefJames },
    { name: "Chef Emily Davis", specialty: "Sugar Florist & Decorator", exp: "7 Years Exp", rating: "4.9", image: chefEmily },
    { name: "Chef Michael Brown", specialty: "Artisan Bread Master", exp: "12 Years Exp", rating: "4.7", image: chefMichael },
  ];

  const pricing = [
    {
      name: "Basic Plan",
      price: "$19",
      popular: false,
      features: ["2 Consultations", "Chat Support", "Basic Kitchen Records", "Single Device Sync"],
    },
    {
      name: "Premium Plan",
      price: "$49",
      popular: true,
      features: ["Unlimited Consultations", "Priority Support", "Advanced Kitchen Records", "10% Ingredient Discount", "Multi-Device Sync"],
    },
    {
      name: "Family Plan",
      price: "$79",
      popular: false,
      features: ["Unlimited Consultations", "Family & Multi-chef Coverage", "Priority Support", "20% Ingredient Discount", "Offline-first Local DB Sync"],
    },
  ];

  const testimonials = [
    {
      quote: "Floura made it so easy to consult a chocolatier from my home. Highly recommended for custom designs!",
      author: "Lisa Ray",
      location: "New York, USA",
      rating: 5,
      image: chefSarah,
    },
    {
      quote: "The pastry chefs are extremely professional and the booking service is excellent. Saved my wedding orders!",
      author: "Mark Anderson",
      location: "London, UK",
      rating: 5,
      image: chefJames,
    },
    {
      quote: "Recipe scaling advice is super fast, incredibly accurate, and very reliable. 10/10 platform.",
      author: "Priya Sharma",
      location: "Delhi, India",
      rating: 5,
      image: chefEmily,
    },
  ];

  const blogPosts = [
    {
      title: "10 Tips for a Perfect Fluffy Sponge Cake",
      date: "May 15, 2026",
      author: "Admin",
      desc: "Learn the secrets behind perfect aeration, mixing times, and oven temperatures to bake soft, towering sponge cakes.",
    },
    {
      title: "How Kitchen Tech is Revolutionizing Home Baking",
      date: "May 12, 2026",
      author: "Admin",
      desc: "From smart scales to local database trackers, discover how modern tools empower pastry chefs to run efficient bakeries.",
    },
    {
      title: "Boost Your Dessert Profit Margins Naturally",
      date: "May 10, 2026",
      author: "Admin",
      desc: "A breakdown of ingredient cost tracking, packaging calculations, and smart strategies to optimize your pricing structures.",
    },
  ];

  // Shared heading pill style
  const pill = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border";

  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 transition-colors duration-300 font-sans">

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/85 dark:bg-zinc-950/85 border-b border-zinc-100 dark:border-zinc-800/60 px-6 lg:px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center bg-pink-50">
            <img src={flouraLogo} alt="Floura Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-black tracking-tight text-primary-brand dark:text-pink-400 italic">Floura</span>
            <span className="hidden sm:block text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">Event & Baking Management</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
          <button onClick={() => scrollToSection(servicesSectionRef)} className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors cursor-pointer">Services</button>
          <button onClick={() => scrollToSection(howItWorksSectionRef)} className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors cursor-pointer">How It Works</button>
          <button onClick={() => scrollToSection(specialistsSectionRef)} className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors cursor-pointer">Chefs</button>
          <button onClick={() => scrollToSection(pricingSectionRef)} className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors cursor-pointer">Pricing</button>
          <a href="#testimonials" className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors">Testimonials</a>
          <a href="#blog" className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors">Blog</a>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mr-2 text-xs font-semibold">
            <Phone className="w-3.5 h-3.5 text-primary-brand dark:text-pink-400" />
            <span>Need Help? +1 800 555-CAKE</span>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all text-zinc-500 dark:text-zinc-400 cursor-pointer mr-1" aria-label="Toggle Dark Mode">
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-pink-50 dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 py-1.5 px-3 rounded-xl">
                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full border border-pink-200 object-cover" referrerPolicy="no-referrer" />
                <span className="hidden sm:inline text-xs font-bold text-zinc-750 dark:text-zinc-200 truncate max-w-[100px]">{user.name.split(" ")[0]}</span>
              </div>
              <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.97] cursor-pointer">
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => scrollToSection(loginSectionRef)} className="flex items-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-2.5 px-5 rounded-xl shadow-sm transition-all active:scale-[0.97] cursor-pointer">
              <span>Book Appointment</span>
            </button>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════ */}
      {/* SECTION 1 — HERO */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white dark:bg-zinc-950 py-16 md:py-24">
        {/* Soft radial glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-white to-pink-50/20 dark:from-zinc-950 dark:via-zinc-950 dark:to-pink-950/10 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-8 text-left">
            {/* Badge */}
            <div className="inline-flex">
              <div className={`${pill} bg-pink-50/80 dark:bg-pink-950/40 border-pink-200/50 dark:border-pink-850/30 text-primary-brand dark:text-pink-400`}>
                <Sparkles className="w-3.5 h-3.5 text-primary-brand dark:text-pink-400" />
                <span>Baking & Event Management</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white leading-[1.08] tracking-tight">
              Quality Baking,<br />
              <span className="text-primary-brand dark:text-pink-400">Anytime Anywhere.</span>
            </h1>

            <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg leading-relaxed max-w-xl">
              Connect with certified pastry chefs, get expert baking advice, and take control of your kitchen — from the comfort of your home.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <button onClick={() => navigate("/dashboard")} className="group inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-sm py-4 px-8 rounded-2xl shadow-lg shadow-pink-200 dark:shadow-none transition-all active:scale-[0.97] cursor-pointer">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <button onClick={() => scrollToSection(loginSectionRef)} className="group inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-sm py-4 px-8 rounded-2xl shadow-lg shadow-pink-200 dark:shadow-none transition-all active:scale-[0.97] cursor-pointer">
                  <span>Book an Appointment</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
              <button onClick={() => scrollToSection(howItWorksSectionRef)} className="inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-755 font-bold text-sm py-4 px-8 rounded-2xl transition-all active:scale-[0.97] cursor-pointer">
                How It Works
              </button>
            </div>

            {/* Stats below */}
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

          {/* Right Column: Hero Image with Floating Cards */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[380px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-900 bg-pink-50">
              <img src={chefHeroPhoto} alt="Baking Expert" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-950/20 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Card 1: 24/7 video */}
            <div className="absolute -left-6 top-10 bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl border border-pink-50 dark:border-zinc-800/85 flex items-center gap-3 animate-bounce-subtle max-w-[200px]">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-extrabold text-zinc-900 dark:text-white leading-tight">Video Consultation</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-semibold text-zinc-400">Available 24/7</span>
                </div>
              </div>
            </div>

            {/* Floating Card 2: 100% secure */}
            <div className="absolute -right-4 bottom-24 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl shadow-xl border border-pink-50 dark:border-zinc-800/85 flex items-center gap-2 max-w-[170px]">
              <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-pink-950 flex items-center justify-center text-primary-brand dark:text-pink-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-extrabold text-zinc-900 dark:text-white">100% Secure</p>
                <p className="text-[9px] text-zinc-400 font-semibold leading-tight mt-0.5">& Confidential</p>
              </div>
            </div>

            {/* Floating Card 3: Ratings */}
            <div className="absolute left-4 -bottom-4 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl shadow-xl border border-pink-50 dark:border-zinc-800/85 flex items-center gap-3.5 max-w-[210px]">
              <div className="flex -space-x-2 shrink-0">
                <img src={chefSarah} className="w-7 h-7 rounded-full border border-white dark:border-zinc-900 object-cover" />
                <img src={chefEmily} className="w-7 h-7 rounded-full border border-white dark:border-zinc-900 object-cover" />
                <img src={chefJames} className="w-7 h-7 rounded-full border border-white dark:border-zinc-900 object-cover" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-zinc-900 dark:text-white">4.9/5</span>
                  <div className="flex text-amber-400">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                </div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">From 10K+ Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES SECTION ───────────────────────────── */}
      <section id="services" ref={servicesSectionRef} className="py-20 md:py-28 bg-pink-50/30 dark:bg-zinc-900/40 border-t border-b border-pink-50/50 dark:border-zinc-900/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16 text-center">
          <div className="space-y-4 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">Our Services</span>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              Comprehensive Kitchen Solutions for You
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-1 bg-pink-500 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, idx) => (
              <div key={idx} className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl hover:border-pink-200 dark:hover:border-pink-900/40 hover:shadow-xl hover:shadow-pink-50/30 dark:hover:shadow-none transition-all duration-300 text-left flex flex-col justify-between min-h-[190px]">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-primary-brand dark:text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    {s.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{s.title}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                <div className="pt-3 flex items-center text-[10px] font-extrabold uppercase text-primary-brand dark:text-pink-400 group-hover:translate-x-1 transition-transform cursor-pointer">
                  <span>Learn More</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            ))}
          </div>

          <div>
            <button onClick={() => scrollToSection(loginSectionRef)} className="inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3 px-8 rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer">
              Explore All Services
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ───────────────────────── */}
      <section id="how-it-works" ref={howItWorksSectionRef} className="py-20 md:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16 text-center">
          <div className="space-y-4 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">How It Works</span>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              Simple Steps to Better Baking
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-1 bg-pink-500 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting dashed line (desktop) */}
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
              <button onClick={() => navigate("/dashboard")} className="inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer">
                Get Started Now
              </button>
            ) : (
              <button onClick={() => scrollToSection(loginSectionRef)} className="inline-flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer">
                Get Started Now
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ──────────────────────────────── */}
      <section className="py-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="bg-gradient-to-br from-pink-850 to-primary-brand dark:from-pink-950 dark:to-zinc-900 p-8 md:p-12 rounded-[2.5rem] shadow-xl text-center space-y-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-15 pointer-events-none" />
          <div className="space-y-3 max-w-xl mx-auto relative z-10">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-pink-100">Why Choose Floura?</span>
            <h2 className="font-serif text-2xl md:text-3xl font-black leading-tight">
              Your Kitchen, Our Priority
            </h2>
            <div className="flex justify-center pt-1">
              <div className="w-12 h-0.5 bg-pink-200/50 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl text-left space-y-3.5 hover:bg-white/[0.14] transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/15 text-pink-100 flex items-center justify-center shrink-0">
                  {b.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white">{b.title}</h3>
                  <p className="text-pink-100/80 text-xs leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEET OUR SPECIALISTS SECTION ───────────────── */}
      <section id="specialists" ref={specialistsSectionRef} className="py-20 md:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16">
          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-5">
            <div className="space-y-2 text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">Our Experts</span>
              <h2 className="font-serif text-3xl font-black text-zinc-900 dark:text-white leading-tight">
                Meet Our Master Pastry Chefs
              </h2>
            </div>
            <button onClick={() => scrollToSection(loginSectionRef)} className="text-xs font-extrabold uppercase text-primary-brand dark:text-pink-400 flex items-center gap-1 hover:underline cursor-pointer">
              <span>View All Specialists</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialists.map((sp, idx) => (
              <div key={idx} className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-pink-100 dark:hover:border-zinc-800 transition-all duration-300 flex flex-col">
                <div className="w-full aspect-square bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
                  <img src={sp.image} alt={sp.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between text-left space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">{sp.name}</h3>
                    <p className="text-zinc-400 dark:text-zinc-500 text-[11px] font-bold uppercase tracking-wide leading-none">{sp.specialty}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">{sp.rating}</span>
                      </div>
                      <span className="text-[10px] text-zinc-300 dark:text-zinc-700">|</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">{sp.exp}</span>
                    </div>
                  </div>
                  <button onClick={() => scrollToSection(loginSectionRef)} className="w-full bg-pink-50 group-hover:bg-primary-brand hover:!bg-primary-brand-dark dark:bg-zinc-850 dark:group-hover:bg-primary-brand text-primary-brand group-hover:text-white dark:text-pink-400 font-extrabold text-[11px] uppercase tracking-wider py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ────────────────────────────── */}
      <section id="pricing" ref={pricingSectionRef} className="py-20 md:py-28 bg-pink-50/20 dark:bg-zinc-900/30 border-t border-b border-pink-50/40 dark:border-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16 text-center">
          <div className="space-y-4 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">Our Pricing</span>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              Affordable Plans for Everyone
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-1 bg-pink-500 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {pricing.map((p, idx) => (
              <div key={idx} className={`relative bg-white dark:bg-zinc-900 border rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 text-left ${p.popular ? "border-primary-brand dark:border-pink-500 shadow-xl shadow-pink-50 dark:shadow-none scale-102 z-10" : "border-zinc-150 dark:border-zinc-800 shadow-sm"}`}>
                {p.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-brand text-white font-extrabold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                    Popular
                  </span>
                )}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">{p.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-zinc-900 dark:text-white font-mono">{p.price}</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold">/month</span>
                    </div>
                  </div>
                  <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800" />
                  <ul className="space-y-3.5">
                    {p.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                        <Check className="w-4 h-4 text-primary-brand dark:text-pink-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => scrollToSection(loginSectionRef)} className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer mt-8 ${p.popular ? "bg-primary-brand hover:bg-primary-brand-dark text-white shadow-md shadow-pink-100 dark:shadow-none" : "bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"}`}>
                  Choose Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ───────────────────────── */}
      <section id="testimonials" className="py-20 md:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16 text-center">
          <div className="space-y-4 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">Testimonials</span>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              What Our Bakers Say
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-1 bg-pink-500 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-8 rounded-3xl shadow-sm text-left flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-5">
                  <div className="flex text-amber-400 shrink-0">
                    {Array.from({ length: t.rating }).map((_, rIdx) => (
                      <Star key={rIdx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs italic leading-relaxed font-semibold">
                    "{t.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-zinc-50 dark:border-zinc-850">
                  <img src={t.image} alt={t.author} className="w-9 h-9 rounded-full border border-pink-100 object-cover shrink-0" />
                  <div className="leading-tight">
                    <p className="font-bold text-xs text-zinc-900 dark:text-white">{t.author}</p>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD THE APP SECTION ───────────────────── */}
      <section className="py-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="bg-pink-50/50 dark:bg-zinc-900/50 border border-pink-50 dark:border-zinc-800/80 p-8 md:p-12 rounded-[2.5rem] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">Download the Floura App</span>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              Your Kitchen in Your Pocket
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md">
              Access master chefs, ingredient records, checklists, and order history anytime, anywhere. Receive push reminders and manage kitchen logs instantly.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#" className="flex items-center gap-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 py-3 px-5 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm select-none">
                <Smartphone className="w-5 h-5 shrink-0" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Download on the</p>
                  <p className="text-xs font-black">App Store</p>
                </div>
              </a>
              <a href="#" className="flex items-center gap-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 py-3 px-5 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm select-none">
                <Play className="w-5 h-5 fill-current shrink-0" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Get it on</p>
                  <p className="text-xs font-black">Google Play</p>
                </div>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[260px] aspect-[9/16] rounded-[2rem] overflow-hidden border-[6px] border-zinc-850 dark:border-zinc-800 shadow-2xl shadow-zinc-300 dark:shadow-black/50 bg-white">
              <img src={appScreenshot} alt="App Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST BLOG SECTION ────────────────────────── */}
      <section id="blog" className="py-20 md:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16 text-center">
          <div className="space-y-4 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">Latest from Blog</span>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
              Baking Tips & Updates
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-1 bg-pink-500 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post, idx) => (
              <div key={idx} className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-left flex flex-col">
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>By {post.author}</span>
                    </div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-primary-brand transition-colors leading-snug">{post.title}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">{post.desc}</p>
                  </div>
                  <a href="#" className="inline-flex items-center text-[10px] font-extrabold uppercase text-primary-brand dark:text-pink-400 hover:underline pt-2">
                    <span>Read More</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BANNER CTA ─────────────────────────────────── */}
      <section className="py-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="bg-gradient-to-br from-pink-850 to-primary-brand dark:from-pink-950 dark:to-zinc-900 py-12 px-8 rounded-[2.5rem] shadow-xl text-center space-y-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-10 pointer-events-none" />
          <h2 className="font-serif text-2xl md:text-3xl font-black relative z-10">
            Take the First Step Towards Better Baking
          </h2>
          <p className="text-pink-100/90 text-xs md:text-sm max-w-md mx-auto relative z-10 leading-relaxed font-semibold">
            Book a consultation now and connect with our expert chefs. Setup your kitchen dashboard in a few seconds.
          </p>
          <div className="pt-2 relative z-10">
            {user ? (
              <button onClick={() => navigate("/dashboard")} className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-primary-brand font-extrabold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer">
                Go to Dashboard
              </button>
            ) : (
              <button onClick={() => scrollToSection(loginSectionRef)} className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-primary-brand font-extrabold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer">
                Book Appointment
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — SIGN IN / USER INFO PORTAL ─────── */}
      <section id="login-section" ref={loginSectionRef} className="py-20 md:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-md mx-auto px-6 text-center space-y-10">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-md border border-zinc-150 dark:border-zinc-800 bg-pink-50 p-1 flex items-center justify-center">
              <img src={flouraLogo} alt="Floura" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h2 className="font-serif text-3xl font-black text-zinc-900 dark:text-white leading-tight">
              Start managing your<br />
              <span className="italic text-primary-brand dark:text-pink-400">kitchen today</span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm leading-relaxed max-w-xs mx-auto">
              Sign in securely with your Google account to access your event and baking dashboard.
            </p>
          </div>

          {/* Login or User Info Portal Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 space-y-6">
            {user ? (
              // Logged In Portal Card
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
                    onClick={() => navigate("/dashboard")}
                    className="w-full flex items-center justify-center gap-2 bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {onLogout && (
                    <button
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
              // Guest Login Card
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Sign In to Floura</span>
                  <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Secure
                  </div>
                </div>

                <button
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
                  <button onClick={(e) => { e.preventDefault(); setActiveModal("terms"); }} className="underline hover:text-zinc-750 dark:hover:text-zinc-350 cursor-pointer">Terms</button>,{" "}
                  <button onClick={(e) => { e.preventDefault(); setActiveModal("privacy"); }} className="underline hover:text-zinc-750 dark:hover:text-zinc-350 cursor-pointer">Privacy Policy</button>{" "}
                  &{" "}
                  <button onClick={(e) => { e.preventDefault(); setActiveModal("disclaimer"); }} className="underline hover:text-zinc-750 dark:hover:text-zinc-350 cursor-pointer">Disclaimer</button>.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="border-t border-zinc-150 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
          <div className="flex items-center gap-2.5 select-none">
            <img src={flouraLogo} alt="Floura" className="w-6 h-6 rounded-lg" />
            <span className="font-serif font-black text-zinc-650 dark:text-zinc-400 italic">Floura</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>Event & Baking Management</span>
          </div>
          <div>© {new Date().getFullYear()} Floura. All Rights Reserved.</div>
          <div className="flex items-center gap-5">
            <button onClick={() => setActiveModal("terms")} className="hover:text-zinc-750 dark:hover:text-zinc-350 transition-colors cursor-pointer">Terms</button>
            <button onClick={() => setActiveModal("privacy")} className="hover:text-zinc-750 dark:hover:text-zinc-350 transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => setActiveModal("disclaimer")} className="hover:text-zinc-750 dark:hover:text-zinc-300 transition-colors cursor-pointer">Disclaimer</button>
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
