// File Path: /src/components/ProfileView.tsx
import React, { useState, useEffect, memo } from "react";
import { memoWithData } from "../utils/memo";
import { User, Shield, Store, Mail, Phone, MapPin, Check, Edit2, Sparkles, Camera } from "lucide-react";
import { motion } from "motion/react";
import Avatar, { AVATAR_PRESETS } from "./Avatar";
import { setPreference } from "../db";
import { setFormatConfig } from "../utils/format";
import { getApiUrl } from "../utils/api";

import { useProfile, compressImage } from "../hooks/useProfile";

interface ProfileViewProps {
  user: { name: string; email: string; avatar: string; token?: string } | null;
  onUpdateProfile: (updatedUser: { name: string; email: string; avatar: string; token?: string }) => void;
  bakeryProfile?: any;
  onUpdateBakeryProfile?: (updatedProfile: any) => Promise<void>;
}

function ProfileView({ user, onUpdateProfile, bakeryProfile, onUpdateBakeryProfile }: ProfileViewProps) {
  const {
    isNewUser,
    showOnboarding,
    name,
    setName,
    avatar,
    setAvatar,
    errorMsg,
    setErrorMsg,
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
    isSaved,
    setIsSaved,
    handleSave,
  } = useProfile({
    user,
    onUpdateProfile,
    bakeryProfile,
    onUpdateBakeryProfile,
  });


  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Title Segment */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-primary-brand dark:text-orange-400 truncate">
            {isNewUser ? "Onboarding: Create Your Bakery Profile" : "Account & Profile Setup"}
          </h2>
          <p className="hidden sm:block text-xs text-zinc-500 font-sans mt-0.5">
            {isNewUser 
              ? "Welcome to Floura Bakery Pro! Fill in your kitchen details below to custom brand your workspace" 
              : "Manage your kitchen identity, bakery branding, and credentials"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card Summary & Avatar Selection */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm text-center space-y-5">
            <div className="relative w-28 h-28 mx-auto flex justify-center">
              <Avatar avatarKey={avatar} className="w-28 h-28" />
            </div>

            <div>
              <h2 className="text-lg font-serif font-bold text-zinc-800 dark:text-zinc-100">{name}</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{role}</p>
              <div className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-2">
                <Store className="w-3 h-3" /> {bakeryName}
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 text-left">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2.5 text-center">
                Select Bakery Avatar
              </span>
              
              <div className="grid grid-cols-5 gap-2.5 justify-center">
                {AVATAR_PRESETS.map((p) => {
                  const IconComp = p.icon;
                  const isSelected = avatar === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setAvatar(p.key)}
                      title={p.label}
                      className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                        isSelected
                          ? "border-primary-brand bg-primary-brand/10 text-primary-brand scale-110"
                          : "border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-500"
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>

              {/* Custom Image Upload Option */}
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                  Or Upload Custom Image
                </span>
                <label className="w-full flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 py-2.5 px-4 rounded-xl shadow-sm text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-all active:scale-95">
                  <Camera className="w-4 h-4 text-primary-brand dark:text-orange-400" />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            const rawBase64 = event.target.result as string;
                            compressImage(rawBase64, 160, 160).then((compressed) => {
                              setAvatar(compressed);
                            }).catch(() => {
                              setAvatar(rawBase64);
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Fields Form Block */}
        <div className="lg:col-span-2">
          <form id="profile-form" onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-sweet-pink dark:text-pink-400" />
                <h3 className="text-xs font-extrabold text-sweet-pink dark:text-pink-400 uppercase tracking-widest">
                  IDENTITY & BAKERY BRANDING INFO
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> Local/Cloud Offline Persisted
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Baker Name */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-500">Head Chef Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                {/* Baker Role */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-500">Corporate Title/Role</label>
                  <input
                    required
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                {/* Bakery Business Name */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-500">Sweet Shop/Bakery Name</label>
                  <input
                    required
                    type="text"
                    value={bakeryName}
                    onChange={(e) => setBakeryName(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                {/* Primary Email */}
                <div className="flex flex-col gap-1.5 text-left bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-150 dark:border-zinc-800/80">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Primary Email (Account ID)</label>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{user?.email || "No primary email linked"}</span>
                    <span className="ml-auto bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Locked</span>
                  </span>
                </div>

                {/* Secondary Contact Email */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-500">Secondary Email (Contact)</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-400 focus:outline-none font-semibold"
                      placeholder="e.g. business@domain.com"
                    />
                  </div>
                </div>

                {/* Shop Phone */}
                <div className="flex flex-col gap-1.5 text-left1">
                  <label className="text-xs font-bold text-zinc-500">Business Telephone</label>
                  <input
                    required
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                {/* Physical Address */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-500">Bakery Kitchen Address</label>
                  <input
                    required
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                {/* Currency Symbol Setup */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-500">Currency Symbol</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-400 focus:outline-none"
                  >
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                    <option value="₹">INR (₹)</option>
                    <option value="¥">JPY/CNY (¥)</option>
                  </select>
                </div>

                {/* Date Format Setup */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-500">Preferred Date Format</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-400 focus:outline-none"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap justify-end items-center gap-3">
              {errorMsg && (
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold tracking-tight bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                  ⚠️ {errorMsg}
                </span>
              )}
              {isSaved && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold tracking-tight bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Changes successfully saved!
                </span>
              )}
              <button
                type="submit"
                className="bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-white" /> Save Setup Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export default memoWithData(ProfileView);
