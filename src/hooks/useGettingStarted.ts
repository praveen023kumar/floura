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
      if (user?.token) {
        const response = await fetch(getApiUrl("/api/auth/profile"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + user.token,
            "x-user-email": user.email,
            "x-device-id": getDeviceId()
          },
          body: JSON.stringify({
            userEmail: user.email,
            email: user.email,
            name: chefName,
            avatar: "chef"
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (isAuthSignatureError(response.status, errData)) {
            triggerReauth("/getting-started", errData.error);
            return;
          }
        }
      }

      onUpdateProfile({ name: chefName, email: user?.email || "", avatar: "chef", token: user?.token });
      
      const normalizedCurrency = normalizeCurrency(currency);

      if (onUpdateBakeryProfile) {
        await onUpdateBakeryProfile({
          id: "active-profile",
          bakeryName,
          email,
          phone,
          address,
          role,
          currency: normalizedCurrency,
          dateFormat,
          isDeleted: 0
        });
      }

      setFormatConfig(normalizedCurrency, dateFormat);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem("floura_currency", normalizedCurrency);
          window.localStorage.setItem("floura_date_format", dateFormat);
        } catch {}
      }

      await setPreference("patisserie_bakery_name", bakeryName);
      await setPreference("patisserie_bakery_email", email);
      await setPreference("patisserie_bakery_phone", phone);
      await setPreference("patisserie_bakery_address", address);
      await setPreference("patisserie_bakery_role", role);
      await setPreference("floura_currency", normalizedCurrency);
      await setPreference("floura_date_format", dateFormat);
      
      await removePreference("patisserie_is_new_user");
      
      window.dispatchEvent(new Event("floura_settings_changed"));
      
      window.showToast?.("Bakery Profile personalized successfully!", "success");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      window.showToast?.("Could not save profile. Using local defaults instead.", "warning");
      navigate("/dashboard");
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
      const finalCurrency = "$";
      const finalDateFormat = "YYYY-MM-DD";

      if (user?.token) {
        const response = await fetch(getApiUrl("/api/auth/profile"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + user.token,
            "x-user-email": user.email,
            "x-device-id": getDeviceId()
          },
          body: JSON.stringify({
            userEmail: user.email,
            email: user.email,
            name: finalChef,
            avatar: "chef"
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (isAuthSignatureError(response.status, errData)) {
            triggerReauth("/getting-started", errData.error);
            return;
          }
        }
      }

      onUpdateProfile({ name: finalChef, email: user?.email || "", avatar: "chef", token: user?.token });
      
      if (onUpdateBakeryProfile) {
        await onUpdateBakeryProfile({
          id: "active-profile",
          bakeryName: finalBakery,
          email: finalEmail,
          phone: finalPhone,
          address: finalAddress,
          role: finalRole,
          currency: finalCurrency,
          dateFormat: finalDateFormat,
          isDeleted: 0
        });
      }

      setFormatConfig(finalCurrency, finalDateFormat);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
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
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      navigate("/dashboard");
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
