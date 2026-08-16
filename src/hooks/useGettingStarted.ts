import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setPreference, removePreference } from "../db";
import { setFormatConfig } from "../utils/format";
import { getApiUrl } from "../utils/api";

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
  const [currency, setCurrency] = useState("$");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  
  const [saving, setSaving] = useState(false);

  const handleCustomSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user?.token) {
        await fetch(getApiUrl("/api/auth/profile"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + user.token,
            "x-user-email": user.email
          },
          body: JSON.stringify({
            userEmail: user.email,
            email: user.email,
            name: chefName,
            avatar: "chef"
          })
        });
      }

      onUpdateProfile({ name: chefName, email: user?.email || "", avatar: "chef", token: user?.token });
      
      if (onUpdateBakeryProfile) {
        await onUpdateBakeryProfile({
          id: "active-profile",
          bakeryName,
          email,
          phone,
          address,
          role,
          currency,
          dateFormat,
          isDeleted: 0
        });
      }

      setFormatConfig(currency, dateFormat);

      await setPreference("patisserie_bakery_name", bakeryName);
      await setPreference("patisserie_bakery_email", email);
      await setPreference("patisserie_bakery_phone", phone);
      await setPreference("patisserie_bakery_address", address);
      await setPreference("patisserie_bakery_role", role);
      await setPreference("floura_currency", currency);
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
        await fetch(getApiUrl("/api/auth/profile"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + user.token,
            "x-user-email": user.email
          },
          body: JSON.stringify({
            userEmail: user.email,
            email: user.email,
            name: finalChef,
            avatar: "chef"
          })
        });
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
