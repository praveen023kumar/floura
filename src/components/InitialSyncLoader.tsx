// File Path: /src/components/InitialSyncLoader.tsx
import { motion, AnimatePresence } from "motion/react";
import { Lock, Database, RefreshCw, CheckCircle2, Sparkles, ChefHat } from "lucide-react";
import flouraLogo from "../assets/images/floura_logo.webp";

interface InitialSyncLoaderProps {
  step: string;
  progress: number;
}

export default function InitialSyncLoader({ step, progress }: InitialSyncLoaderProps) {
  return (
    <div className="min-h-screen w-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-between p-6 md:p-12 font-sans select-none transition-colors duration-300">
      {/* Top Margin Spacer */}
      <div className="h-4" />

      {/* Main Core Sync Section */}
      <div className="flex flex-col items-center max-w-md w-full text-center">
        {/* Logo Container with WhatsApp-style pulsing ring */}
        <div className="relative mb-8">
          {/* Pulsing Outer Aura */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.4, 0.15],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-primary-brand/25 dark:bg-orange-500/10 rounded-full blur-xl"
          />

          {/* Animated Outer Ring */}
          <svg className="w-28 h-28 transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="50"
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth="5"
              fill="transparent"
            />
            <motion.circle
              cx="56"
              cy="56"
              r="50"
              className="stroke-primary-brand dark:stroke-orange-500 transition-all duration-300"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={314}
              strokeDashoffset={314 - (314 * progress) / 100}
              strokeLinecap="round"
            />
          </svg>

          {/* Centered Premium Brand Logo */}
          <div className="absolute inset-2 bg-white dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-800 p-0.5 flex items-center justify-center shadow-lg">
            <img
              src={flouraLogo}
              alt="Floura Bakery Logo"
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Sparkly Success Icon when complete */}
          {progress === 100 && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute -bottom-1 -right-1 bg-emerald-500 dark:bg-emerald-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-zinc-950"
            >
              <CheckCircle2 className="w-5 h-5" />
            </motion.div>
          )}
        </div>

        {/* Sync Headers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2 mb-6"
        >
          <div className="flex items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Floura Baking Workspace</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-zinc-900 dark:text-zinc-50 italic">
            Syncing Your Bakery Journal
          </h2>
        </motion.div>

        {/* Beautiful Horizontal Progress Bar */}
        <div className="w-full max-w-xs bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-6 shadow-inner relative">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-brand to-orange-450 dark:from-orange-500 dark:to-orange-400 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Pulling Steps and Progress Status */}
        <div className="h-14 flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-300 font-sans text-sm font-medium"
            >
              {progress < 100 ? (
                <RefreshCw className="w-4 h-4 text-primary-brand dark:text-orange-400 animate-spin shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
              )}
              <span>{step}</span>
            </motion.div>
          </AnimatePresence>

          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-1 font-bold">
            {progress}% Completed
          </span>
        </div>
      </div>

      {/* Reassuring encryption message at bottom (WhatsApp Web style) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 max-w-sm text-center font-medium"
      >
        <Lock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-600 shrink-0" />
        <p className="text-[10.5px] leading-relaxed tracking-wide font-sans">
          All data is end-to-end synchronized with your secure local partition. Do not close or reload this page during data transfer.
        </p>
      </motion.div>
    </div>
  );
}
