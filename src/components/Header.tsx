// File Path: /src/components/Header.tsx
import { Sun, Moon, Cloud, CloudOff, RefreshCw, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import flouraLogo from "../assets/images/floura_logo.jpg";

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  syncStatus: "synced" | "offline" | "syncing" | "error";
  onSync: () => void;
  user: { name: string; avatar: string } | null;
  onLogout: () => void;
  bakeryName?: string;
}

export default function Header({
  darkMode,
  setDarkMode,
  syncStatus,
  onSync,
  user,
  onLogout,
  bakeryName
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <img 
            src={flouraLogo} 
            alt="Floura Logo" 
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border border-zinc-150/80 dark:border-zinc-800 shadow-xs select-none" 
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Sync Status Button */}
          <button
            onClick={onSync}
            disabled={syncStatus === "syncing"}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200/80 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-650 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Click to trigger manual cloud sync"
          >
            {syncStatus === "syncing" && (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            )}
            {syncStatus === "synced" && (
              <Cloud className="w-4.5 h-4.5 text-emerald-500" />
            )}
            {syncStatus === "offline" && (
              <CloudOff className="w-4.5 h-4.5 text-amber-500" />
            )}
            {syncStatus === "error" && (
              <CloudOff className="w-4.5 h-4.5 text-red-500" />
            )}
          </button>

          {/* Dark Mode Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200/80 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-650 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
            aria-label="Toggle Accessibility Dark Mode"
          >
            {darkMode ? (
              <Moon className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500/10" />
            ) : (
              <Sun className="w-4.5 h-4.5 text-amber-500 fill-amber-500/10" />
            )}
          </button>

          {/* Divider */}
          {user && <span className="h-6 w-[1.5px] bg-zinc-200/80 dark:bg-zinc-700 mx-1"></span>}

          {/* User Profile Avatar with Setup Link */}
          {user && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/profile")}
                title="Manage Bakery & Head Baker Profile Setup"
                className="flex items-center gap-2 group text-left cursor-pointer"
              >
                <div className="group-hover:scale-102 transition-all">
                  <Avatar avatarKey={user.avatar} name={user.name} className="w-9 h-9" />
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 group-hover:text-primary-brand dark:text-zinc-300 dark:group-hover:text-orange-400 transition-colors leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">Head Baker (Edit)</span>
                </div>
              </button>

              <button
                onClick={onLogout}
                title="Sign Out of Sweet Home Bakery"
                className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
