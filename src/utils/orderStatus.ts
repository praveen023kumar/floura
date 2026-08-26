import { type Order } from "../types";

export const getStatusColors = (status: Order["status"]) => {
  switch (status) {
    case "Pending":
      return {
        border: "border-l-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/40",
        accentBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      };
    case "Ordered Ingredients":
      return {
        border: "border-l-orange-500",
        bg: "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-250 dark:border-orange-900/40",
        accentBg: "bg-orange-500/10 text-orange-700 dark:text-orange-400"
      };
    case "Processing":
      return {
        border: "border-l-sky-500",
        bg: "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-250 dark:border-sky-900/40",
        accentBg: "bg-sky-500/10 text-sky-700 dark:text-sky-400"
      };
    case "Decorating":
      return {
        border: "border-l-pink-500",
        bg: "bg-pink-50 dark:bg-pink-950/20 text-pink-750 dark:text-pink-405 border-pink-250 dark:border-pink-900/40",
        accentBg: "bg-pink-500/10 text-pink-750 dark:text-pink-400"
      };
    case "Ready for Pickup":
      return {
        border: "border-l-teal-500",
        bg: "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border-teal-250 dark:border-teal-900/40",
        accentBg: "bg-teal-500/10 text-teal-700 dark:text-teal-400"
      };
    case "Completed":
      return {
        border: "border-l-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/40",
        accentBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      };
    default:
      return {
        border: "border-l-zinc-500",
        bg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
        accentBg: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
      };
  }
};
