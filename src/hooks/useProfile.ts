import React, { useState, useEffect } from "react";
import { setPreference } from "../db";
import { setFormatConfig } from "../utils/format";
import { getApiUrl } from "../utils/api";

export interface UseProfileProps {
  user: { name: string; email: string; avatar: string; token?: string } | null;
  onUpdateProfile: (updatedUser: { name: string; email: string; avatar: string; token?: string }) => void;
  bakeryProfile?: any;
  onUpdateBakeryProfile?: (updatedProfile: any) => Promise<void>;
}

export function compressImage(base64Str: string, maxWidth: number = 160, maxHeight: number = 160): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
}

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
    return user?.email || "praveen023kumar@gmail.com";
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
  const [currency, setCurrency] = useState(() => bakeryProfile?.currency || "$");
  const [dateFormat, setDateFormat] = useState(() => bakeryProfile?.dateFormat || "YYYY-MM-DD");
  const [isSaved, setIsSaved] = useState(false);

  // Synchronize inputs dynamically when bakeryProfile loads
  useEffect(() => {
    if (bakeryProfile) {
      if (bakeryProfile.bakeryName !== undefined) setBakeryName(bakeryProfile.bakeryName);
      if (bakeryProfile.email !== undefined) setEmail(bakeryProfile.email);
      if (bakeryProfile.phone !== undefined) setPhone(bakeryProfile.phone);
      if (bakeryProfile.address !== undefined) setAddress(bakeryProfile.address);
      if (bakeryProfile.role !== undefined) setRole(bakeryProfile.role);
      if (bakeryProfile.currency !== undefined) setCurrency(bakeryProfile.currency);
      if (bakeryProfile.dateFormat !== undefined) setDateFormat(bakeryProfile.dateFormat);
    }
  }, [bakeryProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    try {
      if (user?.token) {
        const response = await fetch(getApiUrl("/api/auth/profile"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + user.token
          },
          body: JSON.stringify({
            email: user.email,
            name,
            avatar
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to update profile on backend database.");
        }
      }

      onUpdateProfile({ name, email: user?.email || "", avatar, token: user?.token });
      
      if (onUpdateBakeryProfile) {
        await onUpdateBakeryProfile({
          id: bakeryProfile?.id || "active-profile",
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

      window.dispatchEvent(new Event("floura_settings_changed"));

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to update profile details:", err);
      setErrorMsg(err.message || "Could not save profile. Please check connection.");
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
