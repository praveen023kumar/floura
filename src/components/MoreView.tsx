// /src/components/MoreView.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Building2,
  CheckCircle,
  Boxes,
  BookOpen,
  Activity,
  MessageSquare,
  ShieldCheck,
  FileText,
  AlertCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  RefreshCw,
  UserCog
} from "lucide-react";
import LegalModal from "./LegalModal";
import { useMore } from "../hooks/useMore";
import Avatar from "./Avatar";

interface MoreViewProps {
  initialMoreTab?: string;
  onLogout?: () => void;
  user?: {
    name: string;
    email: string;
    avatar: string;
    token?: string;
  } | null;
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
  syncStatus?: "synced" | "offline" | "syncing" | "error";
  onSync?: () => void;
}

interface MenuItemProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function MoreView({
  onLogout,
  user,
  darkMode,
  setDarkMode,
  syncStatus,
  onSync,
}: MoreViewProps) {
  const navigate = useNavigate();
  const { activeModal, setActiveModal } = useMore({ onLogout });

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      onLogout?.();
    }
  };

  const MenuItem = ({
    icon: Icon,
    title,
    description,
    onClick,
    danger = false,
  }: MenuItemProps) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`
          group w-full flex items-center gap-3.5
          px-4 py-3.5
          text-left
          transition-colors
          cursor-pointer
          ${
            danger
              ? "hover:bg-rose-50 dark:hover:bg-rose-950/20"
              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          }
        `}
      >
        {/* Icon */}
        <div
          className={`
            w-8 h-8
            shrink-0
            flex items-center justify-center
            rounded-lg
            ${
              danger
                ? "text-rose-550 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400"
                : "text-zinc-600 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400"
            }
          `}
        >
          <Icon className="w-[17px] h-[17px]" strokeWidth={1.7} />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p
            className={`
              text-[13px] font-bold
              ${
                danger
                  ? "text-rose-600 dark:text-rose-455"
                  : "text-zinc-800 dark:text-zinc-200"
              }
            `}
          >
            {title}
          </p>

          {description && (
            <p className="mt-0.5 text-[10px] leading-4 text-zinc-400 dark:text-zinc-500 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Arrow */}
        {!danger && (
          <ChevronRight
            className="
              w-4 h-4
              shrink-0
              text-zinc-300
              dark:text-zinc-650
              group-hover:text-zinc-500
              dark:group-hover:text-zinc-405
              transition-colors
            "
            strokeWidth={1.8}
          />
        )}
      </button>
    );
  };

  const MenuSection = ({
    title,
    children,
  }: MenuSectionProps) => {
    return (
      <section className="space-y-2">
        <div className="px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
            {title}
          </h2>
        </div>

        <div
          className="
            overflow-hidden
            rounded-2xl
            border border-zinc-200/80
            dark:border-zinc-800/80
            bg-white
            dark:bg-zinc-900
            divide-y
            divide-zinc-100
            dark:divide-zinc-800
            shadow-xs
          "
        >
          {children}
        </div>
      </section>
    );
  };

  return (
    <>
      <div
        id="more-page-container"
        className="w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 text-zinc-800 dark:text-zinc-100"
      >
        {/* ======================================================
            PAGE HEADER
        ====================================================== */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white font-sans tracking-tight">
                More Settings
              </h1>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Manage your bakery details, account profiles, operations, and preferences.
            </p>
          </div>
        </div>

        {/* ======================================================
            RESPONSIVE GRID LAYOUT
        ====================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Profile and Operations (Spans 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PROFILE CARD */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-250/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-left">
                  {user ? (
                    <Avatar
                      avatarKey={user.avatar}
                      name={user.name}
                      className="w-16 h-16 text-lg ring-4 ring-pink-500/10 dark:ring-pink-400/10"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <User className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-extrabold text-zinc-900 dark:text-white truncate">
                        {user?.name || "Bakery Operator"}
                      </h2>
                      <span className="px-2 py-0.5 rounded-lg text-[8px] font-extrabold bg-pink-50 dark:bg-pink-950/30 text-primary-brand dark:text-pink-400 border border-pink-100 dark:border-pink-900/20">
                        HOME BAKER
                      </span>
                    </div>
                    <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1 truncate">
                      {user?.email || "Manage your bakery account settings"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                        Account active
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-center"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* BAKERY & OPERATIONS SECTION */}
            <div className="space-y-6">
              <MenuSection title="Bakery Settings">
                <MenuItem
                  icon={Building2}
                  title="Bakery Profile"
                  description="Business details, payment methods and delivery settings"
                  onClick={() => navigate("/profile")}
                />
              </MenuSection>

              <MenuSection title="Operations Management">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-zinc-100 dark:divide-zinc-800 md:divide-y-0 md:gap-px bg-zinc-100 dark:bg-zinc-800 rounded-none overflow-hidden">
                  <div className="bg-white dark:bg-zinc-900">
                    <MenuItem
                      icon={CheckCircle}
                      title="Daily Prep Checklist"
                      description="Manage today's kitchen preparation tasks"
                      onClick={() => navigate("/checklist")}
                    />
                  </div>
                  <div className="bg-white dark:bg-zinc-900">
                    <MenuItem
                      icon={Boxes}
                      title="Inventory & Raw Materials"
                      description="Ingredients, stock levels and alerts"
                      onClick={() => navigate("/inventory")}
                    />
                  </div>
                  <div className="bg-white dark:bg-zinc-900">
                    <MenuItem
                      icon={BookOpen}
                      title="Formulations & Recipes"
                      description="Recipes, measurements and baking formulations"
                      onClick={() => navigate("/recipes")}
                    />
                  </div>
                  <div className="bg-white dark:bg-zinc-900">
                    <MenuItem
                      icon={Activity}
                      title="Kitchen Debriefs"
                      description="Review completed orders and kitchen performance"
                      onClick={() => navigate("/debriefs")}
                    />
                  </div>
                </div>
              </MenuSection>
            </div>

          </div>

          {/* RIGHT COLUMN: System preferences and Support (Spans 1 column) */}
          <div className="space-y-6">
            
            {/* SYSTEM PREFERENCES */}
            <MenuSection title="Preferences & System">
              {/* Dark Mode switcher */}
              <div className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-650 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                    {darkMode ? <Moon className="w-[17px] h-[17px]" /> : <Sun className="w-[17px] h-[17px]" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100">Dark Mode</p>
                    <p className="mt-0.5 text-[9px] text-zinc-400 dark:text-zinc-500">Toggle dark appearance theme</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDarkMode?.(!darkMode)}
                  className="w-10 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0"
                >
                  <div className={`w-5 h-5 bg-white dark:bg-zinc-300 rounded-full shadow-xs transform transition-transform duration-200 ${darkMode ? "translate-x-4" : ""}`} />
                </button>
              </div>

              {/* Sync controls */}
              <div className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-650 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                    <RefreshCw className={`w-[17px] h-[17px] ${syncStatus === "syncing" ? "animate-spin text-indigo-500" : ""}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100">Database Sync</p>
                    <p className="mt-0.5 text-[9px] text-zinc-400 dark:text-zinc-500 truncate">Status: {syncStatus?.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSync}
                  disabled={syncStatus === "syncing"}
                  className="px-3 py-1.5 bg-zinc-55 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
                >
                  Sync Now
                </button>
              </div>
            </MenuSection>

            {/* SUPPORT & INFORMATION */}
            <MenuSection title="Support & Information">
              <MenuItem
                icon={MessageSquare}
                title="Share Feedback"
                description="Send bugs, requests or suggestions"
                onClick={() => navigate("/feedback")}
              />
              <MenuItem
                icon={ShieldCheck}
                title="Privacy Policy"
                description="How your information is handled"
                onClick={() => setActiveModal("privacy")}
              />
              <MenuItem
                icon={FileText}
                title="Terms & Conditions"
                description="Floura terms of use"
                onClick={() => setActiveModal("terms")}
              />
              <MenuItem
                icon={AlertCircle}
                title="Disclaimer"
                description="Important information about Floura"
                onClick={() => setActiveModal("disclaimer")}
              />
            </MenuSection>

            {/* LOGOUT */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs">
              <MenuItem
                icon={LogOut}
                title="Logout"
                description="Sign out from this account"
                onClick={handleLogout}
                danger
              />
            </div>

          </div>

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}
        <div className="text-center pt-8 pb-4">
          <p className="text-[10px] font-semibold text-zinc-300 dark:text-zinc-700">
            Floura Bakery Management System
          </p>
        </div>
      </div>

      {/* ========================================================
          LEGAL MODAL
      ======================================================== */}
      <LegalModal
        isOpen={activeModal !== null}
        type={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}