// File Path: /src/components/GettingStartedView.tsx
import React, { useState } from "react";
import { Sparkles, ArrowRight, Store, User, Phone, MapPin, Mail, Landmark, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { setPreference, removePreference } from "../db";
import { setFormatConfig } from "../utils/format";
import { getApiUrl } from "../utils/api";

import { useGettingStarted } from "../hooks/useGettingStarted";

interface GettingStartedViewProps {
  user: { name: string; email: string; avatar: string; token?: string } | null;
  onUpdateProfile: (updatedUser: { name: string; email: string; avatar: string; token?: string }) => void;
  onUpdateBakeryProfile?: (updatedProfile: any) => Promise<void>;
}

export default function GettingStartedView({ user, onUpdateProfile, onUpdateBakeryProfile }: GettingStartedViewProps) {
  const {
    step,
    setStep,
    chefName,
    setChefName,
    bakeryName,
    setBakeryName,
    email,
    setEmail,
    phone,
    setPhone,
    address,
    setAddress,
    role,
    setRole,
    currency,
    setCurrency,
    dateFormat,
    setDateFormat,
    saving,
    handleCustomSetupSubmit,
  } = useGettingStarted({
    user,
    onUpdateProfile,
    onUpdateBakeryProfile,
  });


  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 via-pink-400 to-amber-400"></div>

        {step === "welcome" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary-brand/10 dark:bg-orange-500/15 rounded-full flex items-center justify-center mx-auto text-primary-brand dark:text-orange-400">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-serif font-extrabold text-zinc-900 dark:text-zinc-50">
                Getting Started! 🧑‍🍳
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                Welcome to your new Floura Bakery Pro workspace! Let's personalize your workspace to fit your bakery's exact identity and preferences.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                }}
                className="w-full bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚀 Customize My Bakery Profile</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-left"
          >
            <div className="mb-6">
              <h3 className="text-xl font-serif font-bold text-zinc-850 dark:text-zinc-200 mb-1">
                Customize Bakery Profile
              </h3>
              <p className="text-xs text-zinc-404">
                Please provide your profile details to configure your bakery space.
              </p>
            </div>

            <form onSubmit={handleCustomSetupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary-brand" />
                    Chef / Owner Name
                  </label>
                  <input
                    required
                    type="text"
                    value={chefName}
                    onChange={(e) => setChefName(e.target.value)}
                    placeholder="e.g. Chef Paul"
                    className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-brand text-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-primary-brand" />
                    Bakery Name
                  </label>
                  <input
                    required
                    type="text"
                    value={bakeryName}
                    onChange={(e) => setBakeryName(e.target.value)}
                    placeholder="e.g. Sweet Home Bakery"
                    className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-brand text-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary-brand" />
                    Bakery Phone
                  </label>
                  <input
                    required
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 012-3456"
                    className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-brand text-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary-brand" />
                    Secondary Email
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. secondary@example.com"
                    className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-brand text-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary-brand" />
                  Bakery Address
                </label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 123 Main St, Springfield"
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-brand text-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-primary-brand" />
                    Currency Preference
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-primary-brand"
                  >
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                    <option value="¥">JPY (¥)</option>
                    <option value="₹">INR (₹)</option>
                    <option value="₩">KRW (₩)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary-brand" />
                    Date Format Preference
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-primary-brand"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2026-10-31)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 31/10/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 10/31/2026)</option>
                  </select>
                </div>
              </div>

              <div className="flex pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-400 dark:hover:bg-orange-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saving ? "Personalizing..." : "Save & Start Baking"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
