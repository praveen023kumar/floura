import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setPreference, removePreference } from "../db";
import { setFormatConfig, normalizeCurrency } from "../utils/format";
import { getApiUrl, getDeviceId } from "../utils/api";
import { isAuthSignatureError, triggerReauth } from "../utils/auth";

export interface UseGettingStartedProps {
  user: { name: string; email: string; avatar: string; token?: string } | null;
  onUpdateProfile: (updatedUser: { name: string; email: string; avatar: string; token?: string }) => void;
  onUpdateBakeryProfile?: (updatedProfile: any) => Promise<void>;
}

export function useGettingStarted({
  user,
  onUpdateProfile,
  onUpdateBakeryProfile,
}: UseGettingStartedProps) {
  const navigate = useNavigate();
  // Start directly on the customization form step to avoid confirmation gates
  const [step, setStep] = useState<"welcome" | "form">("form");
  
  const [chefName, setChefName] = useState(user?.name || "");
  const [bakeryName, setBakeryName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [currency, setCurrency] = useState(() => {
    const init = (typeof window !== "undefined" && window.localStorage?.getItem("floura_currency")) || "₹";
    return normalizeCurrency(init);
  });
  const [dateFormat, setDateFormat] = useState(() => {
    return (typeof window !== "undefined" && window.localStorage?.getItem("floura_date_format")) || "YYYY-MM-DD";
  });
  
  const [saving, setSaving] = useState(false);

  const handleCustomSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const normalizedCurrency = normalizeCurrency(currency);
      const activeBakery = bakeryName.trim() || "Sweet Home Bakery";
      const activeChef = chefName.trim() || user?.name || "Chef Paul";
      const activeEmail = email.trim() || user?.email || "";
      const activePhone = phone.trim() || "";
      const activeAddress = address.trim() || "";
      const activeRole = role.trim() || "Head Baker & Owner";
      const activeDateFormat = dateFormat || "YYYY-MM-DD";

      const profilePayload = {
        id: "active-profile",
        bakeryName: activeBakery,
        email: activeEmail,
        phone: activePhone,
        address: activeAddress,
        role: activeRole,
        currency: normalizedCurrency,
        dateFormat: activeDateFormat,
        isDeleted: 0,
      };

      // 1. Immediately save to local profile states & storage (guaranteed offline-first!)
      if (onUpdateBakeryProfile) {
        await onUpdateBakeryProfile(profilePayload);
      }

      onUpdateProfile({
        ...(user || {}),
        name: activeChef,
        email: user?.email || activeEmail,
        avatar: "chef",
        token: user?.token,
      });

      setFormatConfig(normalizedCurrency, activeDateFormat);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem("patisserie_bakery_name", activeBakery);
          window.localStorage.setItem("floura_currency", normalizedCurrency);
          window.localStorage.setItem("floura_date_format", activeDateFormat);
        } catch {}
      }

      await setPreference("patisserie_bakery_name", activeBakery);
      await setPreference("patisserie_bakery_email", activeEmail);
      await setPreference("patisserie_bakery_phone", activePhone);
      await setPreference("patisserie_bakery_address", activeAddress);
      await setPreference("patisserie_bakery_role", activeRole);
      await setPreference("floura_currency", normalizedCurrency);
      await setPreference("floura_date_format", activeDateFormat);
      await removePreference("patisserie_is_new_user");

      window.dispatchEvent(new Event("floura_settings_changed"));
      window.showToast?.("Bakery Profile personalized successfully!", "success");

      // 2. Non-blocking background sync to server
      if (user?.token && typeof navigator !== "undefined" && navigator.onLine) {
        fetch(getApiUrl("/api/auth/profile"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + user.token,
            "x-user-email": user.email,
            "x-device-id": getDeviceId(),
          },
          body: JSON.stringify({
            userEmail: user.email,
            email: user.email,
            name: activeChef,
            avatar: "chef",
          }),
        }).catch((err) => {
          console.warn("[GettingStarted] Background profile sync warning:", err);
        });
      }

      // 3. Immediately transition to Dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("[GettingStarted] Error during profile setup:", err);
      // Fallback: still navigate to dashboard so user is never trapped
      navigate("/dashboard", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSkipWithDefaults = async () => {
    setSaving(true);
    try {
      const finalChef = user?.name || "Chef Paul";
      const finalBakery = "Sweet Home Bakery";
      const finalEmail = user?.email || "chef@example.com";
      const finalPhone = "+1 (555) 012-3456";
      const finalAddress = "456 Confectionary Boulevard, Suite A";
      const finalRole = "Head Baker & Owner";
      const finalCurrency = "₹";
      const finalDateFormat = "YYYY-MM-DD";

      const profilePayload = {
        id: "active-profile",
        bakeryName: finalBakery,
        email: finalEmail,
        phone: finalPhone,
        address: finalAddress,
        role: finalRole,
        currency: finalCurrency,
        dateFormat: finalDateFormat,
        isDeleted: 0,
      };

      if (onUpdateBakeryProfile) {
        await onUpdateBakeryProfile(profilePayload);
      }

      onUpdateProfile({
        ...(user || {}),
        name: finalChef,
        email: user?.email || finalEmail,
        avatar: "chef",
        token: user?.token,
      });

      setFormatConfig(finalCurrency, finalDateFormat);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem("patisserie_bakery_name", finalBakery);
          window.localStorage.setItem("floura_currency", finalCurrency);
          window.localStorage.setItem("floura_date_format", finalDateFormat);
        } catch {}
      }

      await setPreference("patisserie_bakery_name", finalBakery);
      await setPreference("patisserie_bakery_email", finalEmail);
      await setPreference("patisserie_bakery_phone", finalPhone);
      await setPreference("patisserie_bakery_address", finalAddress);
      await setPreference("patisserie_bakery_role", finalRole);
      await setPreference("floura_currency", finalCurrency);
      await setPreference("floura_date_format", finalDateFormat);
      await removePreference("patisserie_is_new_user");

      window.dispatchEvent(new Event("floura_settings_changed"));
      window.showToast?.("Workspace initialized with premium defaults!", "success");

      // Non-blocking background sync
      if (user?.token && typeof navigator !== "undefined" && navigator.onLine) {
        fetch(getApiUrl("/api/auth/profile"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + user.token,
            "x-user-email": user.email,
            "x-device-id": getDeviceId(),
          },
          body: JSON.stringify({
            userEmail: user.email,
            email: user.email,
            name: finalChef,
            avatar: "chef",
          }),
        }).catch((err) => {
          console.warn("[GettingStarted] Background skip profile sync warning:", err);
        });
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("[GettingStarted] Error skipping:", err);
      navigate("/dashboard", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return {
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
    setSaving,
    handleCustomSetupSubmit,
    handleSkipWithDefaults,
  };
}
