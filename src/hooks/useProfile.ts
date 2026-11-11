import React, { useState, useEffect } from "react";
import { setPreference } from "../db";
import { setFormatConfig, normalizeCurrency } from "../utils/format";
import { getApiUrl, getDeviceId } from "../utils/api";
import { isAuthSignatureError, triggerReauth } from "../utils/auth";

export interface UseProfileProps {
  user: { name: string; email: string; avatar: string; token?: string } | null;
  onUpdateProfile: (updatedUser: { name: string; email: string; avatar: string; token?: string }) => void;
  bakeryProfile?: any;
  onUpdateBakeryProfile?: (updatedProfile: any) => Promise<void>;
}

export { compressImage, getBase64ByteSize, formatByteSize } from "../utils/imageCompressor";

export function useProfile({
  user,
  onUpdateProfile,
  bakeryProfile,
  onUpdateBakeryProfile,
}: UseProfileProps) {
  const isNewUser = false;
  const showOnboarding = false;

  const [name, setName] = useState(() => {
    if (user?.name) return user.name;
    return isNewUser ? "" : "Chef Paul";
  });
  const [avatar, setAvatar] = useState(user?.avatar || "chef");
  const [errorMsg, setErrorMsg] = useState("");
  
  const [bakeryName, setBakeryName] = useState(() => {
    if (bakeryProfile?.bakeryName) return bakeryProfile.bakeryName;
    return isNewUser ? "" : "Sweet Home Bakery";
  });
  const [email, setEmail] = useState(() => {
    if (bakeryProfile?.email) return bakeryProfile.email;
    if (isNewUser) return "";
    return user?.email || "";
  });
  const [phone, setPhone] = useState(() => {
    if (bakeryProfile?.phone) return bakeryProfile.phone;
    return isNewUser ? "" : "+1 (555) 012-3456";
  });
  const [address, setAddress] = useState(() => {
    if (bakeryProfile?.address) return bakeryProfile.address;
    return isNewUser ? "" : "456 Confectionary Boulevard, Suite A";
  });
  const [role, setRole] = useState(() => {
    if (bakeryProfile?.role) return bakeryProfile.role;
    return isNewUser ? "" : "Head Baker & Owner";
  });
  const [currency, setCurrency] = useState(() => {
    const init = bakeryProfile?.currency || (typeof window !== "undefined" && window.localStorage?.getItem("floura_currency")) || "$";
    return normalizeCurrency(init);
  });
  const [dateFormat, setDateFormat] = useState(() => {
    if (bakeryProfile?.dateFormat) return bakeryProfile.dateFormat;
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem("floura_date_format") || window.localStorage.getItem("patisserie_date_format");
        if (stored) return stored;
      } catch {}
    }
    return "YYYY-MM-DD";
  });
  const [isSaved, setIsSaved] = useState(false);

  // Synchronize inputs dynamically when bakeryProfile loads
  useEffect(() => {
    if (bakeryProfile) {
      if (bakeryProfile.bakeryName !== undefined) setBakeryName(bakeryProfile.bakeryName);
      if (bakeryProfile.email !== undefined) setEmail(bakeryProfile.email);
      if (bakeryProfile.phone !== undefined) setPhone(bakeryProfile.phone);
      if (bakeryProfile.address !== undefined) setAddress(bakeryProfile.address);
      if (bakeryProfile.role !== undefined) setRole(bakeryProfile.role);
      if (bakeryProfile.currency !== undefined) setCurrency(normalizeCurrency(bakeryProfile.currency));
      if (bakeryProfile.dateFormat !== undefined) setDateFormat(bakeryProfile.dateFormat);
    }
  }, [bakeryProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    try {
      // 1. Immediately update local state & bakery profile offline-first
      onUpdateProfile({ name, email: user?.email || "", avatar, token: user?.token });
      
      const normalizedCurrency = normalizeCurrency(currency);

      if (onUpdateBakeryProfile) {
        await onUpdateBakeryProfile({
          id: bakeryProfile?.id || "active-profile",
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

      window.dispatchEvent(new Event("floura_settings_changed"));

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      // 2. Sync to backend asynchronously in background without blocking offline flow
      if (user?.token && typeof navigator !== "undefined" && navigator.onLine) {
        fetch(getApiUrl("/api/auth/profile"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + user.token,
            "x-user-email": user.email,
            "x-device-id": getDeviceId()
          },
          body: JSON.stringify({
            email: user.email,
            name,
            avatar
          })
        }).then(async (response) => {
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (isAuthSignatureError(response.status, errData)) {
              console.warn("Backend auth token signature mismatch during profile sync:", errData);
            }
          }
        }).catch((err) => {
          console.warn("Background profile sync deferred (offline/network unreachable):", err);
        });
      }
    } catch (err: any) {
      console.error("Failed to update profile details:", err);
      setErrorMsg(err.message || "Could not save profile.");
    }
  };

  return {
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
  };
}
