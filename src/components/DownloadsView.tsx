// File Path: /src/components/DownloadsView.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Download,
  Smartphone,
  Laptop,
  Monitor,
  Terminal,
  Globe,
  Check,
  Copy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X,
  FileCheck2,
  HardDrive,
  Info,
  Clock,
  Layers,
  HelpCircle,
  ExternalLink,
  Flame,
  CheckCircle2,
  Boxes,
  Lock
} from "lucide-react";
import flouraLogo from "../assets/images/floura_logo.webp";
import Footer from "./Footer";
import {
  APP_VERSIONS,
  AppVersion,
  PlatformDownload,
  PlatformId,
  detectUserPlatform,
  getLatestVersion
} from "../data/versions";

interface DownloadsViewProps {
  user?: { name: string; email: string; avatar: string } | null;
  onLogin?: (user: any) => void;
  onLogout?: () => void;
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
}

export default function DownloadsView({
  user,
  darkMode: externalDarkMode,
  setDarkMode: externalSetDarkMode
}: DownloadsViewProps) {
  const navigate = useNavigate();

  // Internal dark mode fallback if not provided
  const [internalDarkMode, setInternalDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("patisserie_dark_mode") === "true";
  });
  const darkMode = externalDarkMode !== undefined ? externalDarkMode : internalDarkMode;
  const setDarkMode = externalSetDarkMode || ((val: boolean) => {
    setInternalDarkMode(val);
    if (val) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("patisserie_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("patisserie_dark_mode", "false");
    }
  });

  const [selectedVersionTag, setSelectedVersionTag] = useState<string>("v1.0.0");
  const [userPlatform, setUserPlatform] = useState<PlatformId>("android");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedInstructions, setExpandedInstructions] = useState<Record<string, boolean>>({});
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [downloadTimestamp, setDownloadTimestamp] = useState<number>(() => Date.now());

  const getDownloadUrlWithTime = (url?: string) => {
    if (!url) return "";
    if (!url.startsWith("/downloads/")) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}t=${downloadTimestamp}`;
  };

  // Auto-detect OS on mount
  useEffect(() => {
    setUserPlatform(detectUserPlatform());
  }, []);

  const currentVersion: AppVersion = useMemo(() => {
    return APP_VERSIONS.find(v => v.version === selectedVersionTag) || getLatestVersion();
  }, [selectedVersionTag]);

  const recommendedPlatform: PlatformDownload | undefined = useMemo(() => {
    return currentVersion.platforms.find(p => p.id === userPlatform) || currentVersion.platforms[0];
  }, [currentVersion, userPlatform]);

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedHash(id);
      setTimeout(() => setCopiedHash(null), 2500);
    }
  };

  const toggleInstructions = (id: string) => {
    setExpandedInstructions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDownloadClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    platform: PlatformDownload,
    isSecondary: boolean = false
  ) => {
    const freshTime = Date.now();
    setDownloadTimestamp(freshTime);

    // Dynamically ensure the anchor tag uses the exact click timestamp to bypass any CDN or browser cache
    const target = e.currentTarget;
    if (target) {
      const base = isSecondary && platform.secondaryDownloadUrl ? platform.secondaryDownloadUrl : platform.downloadUrl;
      const separator = base.includes("?") ? "&" : "?";
      target.href = `${base}${separator}t=${freshTime}`;
    }

    setDownloadToast(`Starting download: ${platform.fileName} (${platform.fileSize})...`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  const getPlatformIcon = (iconName: string) => {
    switch (iconName) {
      case "Smartphone":
        return <Smartphone className="w-5 h-5" />;
      case "Apple":
        return <Laptop className="w-5 h-5" />;
      case "Monitor":
        return <Monitor className="w-5 h-5" />;
      case "Globe":
        return <Globe className="w-5 h-5" />;
      case "Terminal":
        return <Terminal className="w-5 h-5" />;
      default:
        return <Smartphone className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FCFBF8] dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 transition-colors duration-300 font-sans flex flex-col">
      <Helmet>
        <title>Downloads & Setup - Floura Bakery Management System</title>
        <meta
          name="description"
          content="Download Floura directly from our website: Android APK, macOS DMG, Windows PC, Linux, and iOS Web App with zero app store middleman."
        />
        <link rel="canonical" href="https://floura.app/downloads" />
      </Helmet>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-100 dark:border-zinc-800/60 transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 select-none group">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center bg-pink-50 group-hover:scale-105 transition-transform">
              <img src={flouraLogo} alt="Floura" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-xl font-black tracking-tight text-primary-brand dark:text-pink-400 italic">Floura</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                Downloads
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
            <Link to="/" className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors">Home</Link>
            <a href="/#features" className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors">Features</a>
            <Link to="/calculator" className="hover:text-primary-brand dark:hover:text-pink-400 transition-colors">Recipe Calculator</Link>
            <span className="text-primary-brand dark:text-pink-400 font-bold flex items-center gap-1.5">
              <span>Downloads</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-brand dark:bg-pink-400 animate-pulse" />
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 transition-all text-zinc-500 dark:text-zinc-400 cursor-pointer mr-1"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-1.5 bg-primary-brand hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer active:scale-97"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-primary-brand hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest py-2.5 px-5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-97"
              >
                <span>Launch Web App</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 transition-all text-zinc-600 dark:text-zinc-300 cursor-pointer lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-100 dark:border-zinc-800/80 px-6 py-5 space-y-4 bg-white dark:bg-zinc-950">
            <div className="space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 py-1.5"
              >
                Home
              </Link>
              <Link
                to="/calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 py-1.5"
              >
                Recipe Calculator
              </Link>
              <span className="block text-sm font-bold text-primary-brand dark:text-pink-400 py-1.5">
                Downloads & Versions
              </span>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              <span>Appearance Theme</span>
              <div className="flex items-center gap-1.5">
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
                <span>{darkMode ? "Dark" : "Light"}</span>
              </div>
            </button>

            <Link
              to={user ? "/dashboard" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 bg-primary-brand text-white font-bold text-xs uppercase tracking-widest py-3 px-5 rounded-xl shadow-xs text-center block"
            >
              <span>{user ? "Open Dashboard" : "Get Started"}</span>
            </Link>
          </div>
        )}
      </nav>

      {/* TOAST ALERT */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-3.5 rounded-2xl shadow-2xl border border-zinc-800 dark:border-zinc-200 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="pt-12 pb-10 px-6 lg:px-10 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 dark:bg-pink-950/40 text-primary-brand dark:text-pink-400 text-xs font-bold border border-pink-100 dark:border-pink-900/40 mb-5">
          <ShieldCheck className="w-4 h-4" />
          <span>Direct Website Release • Zero App Store Intermediaries</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-5">
          Download <span className="text-primary-brand dark:text-pink-400 italic">Floura</span> For Any Device
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
          Install Floura directly from our official website. Native speed, offline-first SQLite database, automatic cloud backup, and zero app store restrictions.
        </p>

        {/* CURRENT VERSION BADGE OR SELECTOR */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {APP_VERSIONS.length > 1 ? (
            <>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2">Release:</span>
              {APP_VERSIONS.map(ver => (
                <button
                  key={ver.version}
                  onClick={() => setSelectedVersionTag(ver.version)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    selectedVersionTag === ver.version
                      ? "bg-primary-brand text-white shadow-md shadow-orange-500/20 scale-102"
                      : "bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800 hover:border-primary-brand/40"
                  }`}
                >
                  <span>{ver.version}</span>
                  {ver.isLatest && (
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold ${
                      selectedVersionTag === ver.version
                        ? "bg-white/20 text-white"
                        : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      Latest
                    </span>
                  )}
                </button>
              ))}
            </>
          ) : (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs text-xs font-bold text-zinc-750 dark:text-zinc-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Current Production Release: <strong>{currentVersion.version}</strong></span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                {currentVersion.status}
              </span>
            </div>
          )}
        </div>

        {/* RECOMMENDED FOR YOUR DEVICE BANNER */}
        {recommendedPlatform && (
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-orange-50 via-pink-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border-2 border-primary-brand/30 dark:border-pink-500/30 rounded-3xl p-6 sm:p-8 text-left shadow-lg mb-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-primary-brand/10 dark:bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-primary-brand text-white">
                    Recommended for your OS
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                    {recommendedPlatform.osName} Detected
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-black text-zinc-900 dark:text-white">
                  Floura for {recommendedPlatform.osName} ({currentVersion.version})
                </h3>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium max-w-lg">
                  {recommendedPlatform.fileName} • {recommendedPlatform.fileSize} • {recommendedPlatform.architecture}
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {recommendedPlatform.directDownload ? (
                  <a
                    href={getDownloadUrlWithTime(recommendedPlatform.downloadUrl)}
                    download={recommendedPlatform.fileName}
                    onClick={(e) => handleDownloadClick(e, recommendedPlatform)}
                    className="flex items-center justify-center gap-2.5 bg-primary-brand hover:bg-orange-600 text-white font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition-all cursor-pointer text-center"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {recommendedPlatform.fileType}</span>
                  </a>
                ) : (
                  <Link
                    to={recommendedPlatform.downloadUrl}
                    className="flex items-center justify-center gap-2.5 bg-primary-brand hover:bg-orange-600 text-white font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition-all cursor-pointer text-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Floura Web</span>
                  </Link>
                )}

                {recommendedPlatform.secondaryDownloadUrl && (
                  <a
                    href={getDownloadUrlWithTime(recommendedPlatform.secondaryDownloadUrl)}
                    download
                    onClick={(e) => handleDownloadClick(e, recommendedPlatform, true)}
                    className="text-[11px] text-center font-bold text-primary-brand dark:text-pink-400 hover:underline"
                  >
                    {recommendedPlatform.secondaryDownloadLabel || "Alternative Link"}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ALL PLATFORMS GRID */}
      <section className="py-8 px-6 lg:px-10 max-w-7xl mx-auto w-full flex-grow">
        <div className="text-left mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 max-w-4xl mx-auto">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">
              Installation Options
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1">
              Floura {currentVersion.version} for Mobile & Web
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <Clock className="w-4 h-4" />
            <span>{currentVersion.releaseDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {currentVersion.platforms.map((platform) => {
            const isDetected = platform.id === userPlatform;
            const instructionsOpen = !!expandedInstructions[platform.id];

            return (
              <div
                key={platform.id}
                className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isDetected
                    ? "border-primary-brand/50 dark:border-pink-500/50 ring-2 ring-primary-brand/10 dark:ring-pink-500/10"
                    : "border-zinc-200/80 dark:border-zinc-800"
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-primary-brand dark:text-pink-400 flex items-center justify-center border border-pink-100 dark:border-pink-900/30">
                      {getPlatformIcon(platform.iconName)}
                    </div>
                    {platform.badge && (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                        {platform.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
                    {platform.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-4">
                    {platform.minOs}
                  </p>

                  {/* Metadata Specs Strip */}
                  <div className="space-y-2 py-3 px-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-850 text-xs mb-5">
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Package:</span>
                      <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{platform.fileName}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Size:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{platform.fileSize}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Arch:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[170px]">{platform.architecture}</span>
                    </div>
                  </div>

                  {/* SHA-256 Checksum Strip */}
                  {platform.sha256 && (
                    <div className="mb-5 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-850 text-[11px]">
                      <div className="flex items-center gap-1.5 overflow-hidden text-zinc-500 dark:text-zinc-400">
                        <FileCheck2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        <span className="font-mono truncate">{platform.sha256.substring(0, 16)}...</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(platform.sha256!, platform.id)}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-100 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Copy SHA-256 Checksum"
                      >
                        {copiedHash === platform.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">SHA-256</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="space-y-3 pt-2">
                  {platform.directDownload ? (
                    <a
                      href={getDownloadUrlWithTime(platform.downloadUrl)}
                      download={platform.fileName}
                      onClick={(e) => handleDownloadClick(e, platform)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-brand hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 cursor-pointer active:scale-98"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download {platform.fileType}</span>
                    </a>
                  ) : (
                    <Link
                      to={platform.downloadUrl}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-98"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Launch Web App</span>
                    </Link>
                  )}

                  {/* Installation Guide Toggle */}
                  <button
                    onClick={() => toggleInstructions(platform.id)}
                    className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer py-1"
                  >
                    <span>{instructionsOpen ? "Hide Steps" : "How to Install"}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${instructionsOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Expandable Install Steps */}
                  {instructionsOpen && (
                    <div className="pt-3 text-left space-y-3 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in">
                      {platform.instructions.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-1.5">
                          <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{section.platform}:</p>
                          {section.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                              <span className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VERSION CHANGELOG & RELEASE NOTES */}
      <section className="py-14 px-6 lg:px-10 max-w-7xl mx-auto w-full">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-sm text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">
                  Release Notes
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  {currentVersion.status}
                </span>
              </div>
              <h2 className="text-3xl font-serif font-black text-zinc-900 dark:text-white">
                What's New in {currentVersion.version}
              </h2>
            </div>

            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Published on {currentVersion.releaseDate}
            </div>
          </div>

          <p className="text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed py-6 font-medium">
            {currentVersion.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-primary-brand dark:text-pink-400" />
                <span>New Features</span>
              </div>
              <ul className="space-y-2.5">
                {currentVersion.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Improvements</span>
              </div>
              <ul className="space-y-2.5">
                {currentVersion.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fixes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                <span>Bug Fixes</span>
              </div>
              <ul className="space-y-2.5">
                {currentVersion.fixes.map((fix, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHY DIRECT DOWNLOADS & FAQ */}
      <section className="py-12 px-6 lg:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-brand dark:text-pink-400">
            Frequently Asked Questions
          </span>
          <h2 className="font-serif text-3xl font-black text-zinc-900 dark:text-white mt-2">
            Direct Website Distribution
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Why Floura is delivered straight to you without app store middleman fees or review delays.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-brand" />
              <span>Why direct download instead of App Store or Play Store?</span>
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We build Floura directly for independent bakery owners. Direct downloads allow us to roll out instant bug fixes, recipe calculator upgrades, and offline sync updates without waiting weeks for app store approval queues. You own your software and your bakery records remain completely private.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <span>Does Floura work without an internet connection?</span>
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Yes, absolutely. Floura features an embedded SQLite database and local IndexedDB engine. You can log cake orders, scale recipes, and manage ingredients completely offline in your kitchen. All changes sync to the cloud automatically whenever you reconnect.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-sky-500" />
              <span>How do I install the Android APK?</span>
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Simply tap the "Download .apk" button above on your Android phone. When the 6.0MB file completes downloading, tap to open it. If your browser asks for permission to install apps from this source, enable it in Settings and tap "Install".
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-500" />
              <span>How do I use Floura on iPhone or iPad?</span>
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Open our website in Safari, tap the Share icon, and select "Add to Home Screen". Floura will instantly install as a full-screen standalone application with offline support and local storage — no App Store account required!
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
