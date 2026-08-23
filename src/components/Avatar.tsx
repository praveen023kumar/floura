// File Path: /src/components/Avatar.tsx
import React from "react";
import { ChefHat, Cake, Cookie, Coffee, Sparkles, User } from "lucide-react";

interface AvatarProps {
  avatarKey: string;
  className?: string;
  name?: string;
  useIconFallback?: boolean;
}

export const AVATAR_PRESETS = [
  { key: "chef", label: "Head Chef", icon: ChefHat, bg: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" },
  { key: "cake", label: "Cake Artisan", icon: Cake, bg: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
  { key: "cookie", label: "Cookie Baker", icon: Cookie, bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400" },
  { key: "coffee", label: "Barista", icon: Coffee, bg: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  { key: "sparkles", label: "Pastry Magic", icon: Sparkles, bg: "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400" },
];

const getAvatarBg = (name?: string) => {
  const colors = [
    "bg-pink-100 text-pink-600 dark:bg-pink-955/30 dark:text-pink-400 border-pink-250/20",
    "bg-purple-100 text-purple-600 dark:bg-purple-955/20 dark:text-purple-400 border-purple-250/20",
    "bg-blue-100 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400 border-blue-250/20",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-250/20",
    "bg-amber-100 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400 border-amber-250/20",
    "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-250/20",
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-250/20",
    "bg-teal-100 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400 border-teal-250/20",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function Avatar({ avatarKey, className = "w-10 h-10", name, useIconFallback }: AvatarProps) {
  const preset = AVATAR_PRESETS.find((p) => p.key === avatarKey);

  const isRoundedSpec = className.includes("rounded-");
  const roundedClass = isRoundedSpec ? "" : "rounded-full";

  const getAutoTextSize = (clsName: string) => {
    if (/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|\[)/.test(clsName)) {
      return "";
    }
    if (clsName.includes("w-28")) return "text-3xl";
    if (clsName.includes("w-24")) return "text-2xl";
    if (clsName.includes("w-20")) return "text-xl";
    if (clsName.includes("w-14")) return "text-base";
    if (clsName.includes("w-12")) return "text-sm";
    if (clsName.includes("w-9") || clsName.includes("w-8")) return "text-xs";
    return "text-[12px]";
  };

  const textSizeClass = getAutoTextSize(className);

  if (preset && avatarKey !== "chef") { // Use colourful fallback even for 'chef' key to match the main screen avatar if no other preset is selected
    const IconComponent = preset.icon;
    return (
      <div className={`${roundedClass} flex items-center justify-center shrink-0 ${preset.bg} ${className}`}>
        <IconComponent className="w-1/2 h-1/2" />
      </div>
    );
  }

  // Handle image URLs (e.g. data:image or http)
  if (avatarKey && (avatarKey.startsWith("http") || avatarKey.startsWith("data:"))) {
    return (
      <div className={`${roundedClass} overflow-hidden shrink-0 ${className}`}>
        <img
          src={avatarKey}
          alt="Avatar"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Default fallback: beautiful initials or Lucide User avatar icon
  if (useIconFallback) {
    const bgClass = getAvatarBg(name);
    return (
      <div className={`relative ${roundedClass} shrink-0 flex items-center justify-center border border-zinc-200/80 p-[1.5px] bg-white dark:bg-zinc-800 ${className}`}>
        <div className={`w-full h-full ${roundedClass} flex items-center justify-center ${bgClass} shadow-xs`}>
          <User className="w-1/2 h-1/2" />
        </div>
      </div>
    );
  }

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toLowerCase()
    : "tn";

  return (
    <div className={`relative ${roundedClass} shrink-0 flex items-center justify-center border border-zinc-200/80 p-[1.5px] bg-white dark:bg-zinc-800 ${className}`}>
      <div className={`w-full h-full ${roundedClass} flex items-center justify-center text-white bg-gradient-to-tr from-[#E11D48] via-[#C084FC] to-[#0D9488] border-[1.5px] border-white shadow-xs font-bold font-sans`}>
        <span className={`${textSizeClass} tracking-tight leading-none`}>{initials}</span>
      </div>
    </div>
  );
}
