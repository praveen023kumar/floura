import { useState, useEffect } from "react";
import { getApiUrl, getDeviceId } from "../utils/api";

export interface UseLoginProps {
  onLogin: (user: {
    name: string;
    email: string;
    avatar: string;
    token: string;
    isNew?: boolean;
    subscription_status?: string;
    subscription_expires_at?: string;
    is_active?: number;
    last_payment_date?: string | null;
    [key: string]: any;
  }) => void;
}

export function useLogin({ onLogin }: UseLoginProps) {
  const [ownerEmail, setOwnerEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const [toastMessage, setToastMessage] = useState("");
  const [errorToast, setErrorToast] = useState("");
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "disclaimer" | null>(null);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const handleSendOtp = async (targetEmail?: string) => {
    const rawEmail = typeof targetEmail === "string" ? targetEmail : ownerEmail;
    const cleanEmail = rawEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorToast("Please enter a valid email address.");
      return;
    }

    setIsSendingOtp(true);
    setErrorToast("");
    setToastMessage("Generating verification code...");

    try {
      const response = await fetch(getApiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send verification code. Please check your network.");
      }

      setIsOtpSent(true);
      setOtpCountdown(60);
      setToastMessage(`Verification code sent! Please check your Inbox and Spam folder.`);
      setTimeout(() => setToastMessage(""), 6000);
    } catch (err: any) {
      console.error("[OTP Error] send-otp failed:", err);
      setErrorToast(err.message || "Could not reach authentication service. Please verify your connection.");
      setToastMessage("");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (targetOtp?: string, targetEmail?: string) => {
    const cleanEmail = (targetEmail || ownerEmail).trim().toLowerCase();
    const cleanCode = (targetOtp || otpCode).trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setErrorToast("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    setErrorToast("");
    setToastMessage("Verifying code & preparing workspace...");

    try {
      const response = await fetch(getApiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanCode,
          deviceId: getDeviceId(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid or expired verification code.");
      }

      setToastMessage("Code verified! Loading your kitchen workspace...");
      setTimeout(() => {
        onLogin({
          ...data.user,
          token: data.token,
          isNew: data.isNew,
        });
      }, 500);
    } catch (err: any) {
      console.error("[OTP Error] verify-otp failed:", err);
      setErrorToast(err.message || "Verification failed. Please check the code and try again.");
      setToastMessage("");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetOtp = () => {
    setIsOtpSent(false);
    setOtpCode("");
    setErrorToast("");
    setToastMessage("");
  };

  const authenticating = isSendingOtp || isVerifyingOtp;

  return {
    ownerEmail,
    setOwnerEmail,
    otpCode,
    setOtpCode,
    isOtpSent,
    setIsOtpSent,
    isSendingOtp,
    isVerifyingOtp,
    otpCountdown,
    authenticating,
    toastMessage,
    setToastMessage,
    errorToast,
    setErrorToast,
    activeModal,
    setActiveModal,
    handleSendOtp,
    handleVerifyOtp,
    handleResetOtp,
  };
}
