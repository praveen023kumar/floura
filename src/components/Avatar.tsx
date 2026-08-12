// File Path: /src/components/Avatar.tsx
import React from "react";
import { ChefHat, Cake, Cookie, Coffee, Sparkles } from "lucide-react";

interface AvatarProps {
  avatarKey: string;
  className?: string;
  name?: string;
}

export const AVATAR_PRESETS = [
  { key: "chef", label: "Head Chef", icon: ChefHat, bg: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" },
  { key: "cake", label: "Cake Artisan", icon: Cake, bg: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
  { key: "cookie", label: "Cookie Baker", icon: Cookie, bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400" },
  { key: "coffee", label: "Barista", icon: Coffee, bg: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  { key: "sparkles", label: "Pastry Magic", icon: Sparkles, bg: "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400" },
];

export default function Avatar({ avatarKey, className = "w-10 h-10", name }: AvatarProps) {
  const preset = AVATAR_PRESETS.find((p) => p.key === avatarKey);

  if (preset && avatarKey !== "chef") { // Use colourful fallback even for 'chef' key to match the main screen avatar if no other preset is selected
    const IconComponent = preset.icon;
    return (
      <div className={`rounded-full flex items-center justify-center shrink-0 ${preset.bg} ${className}`}>
        <IconComponent className="w-1/2 h-1/2" />
      </div>
    );
  }

  // Handle image URLs (e.g. data:image or http)
  if (avatarKey && (avatarKey.startsWith("http") || avatarKey.startsWith("data:"))) {
    return (
      <div className={`rounded-full overflow-hidden shrink-0 ${className}`}>
        <img
          src={avatarKey}
          alt="Avatar"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Default fallback: beautiful initials avatar to match screenshot
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toLowerCase()
    : "tn";

  return (
    <div className={`relative rounded-full shrink-0 flex items-center justify-center border border-zinc-200/80 p-[1.5px] bg-white dark:bg-zinc-800 ${className}`}>
      <div className="w-full h-full rounded-full flex items-center justify-center text-white bg-gradient-to-tr from-[#E11D48] via-[#C084FC] to-[#0D9488] border-[1.5px] border-white shadow-xs font-bold font-sans">
        <span className="text-[12px] tracking-tight leading-none">{initials}</span>
      </div>
    </div>
  );
}
