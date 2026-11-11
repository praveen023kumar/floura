import crypto from "crypto";
import { sendOtpEmail } from "../utils/mailer";

export interface OtpRecord {
  code: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  rateLimitUntil: number;
}

// In-memory store for active OTP codes
const otpStore = new Map<string, OtpRecord>();

// Cleanup stale records periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

const OTP_VALIDITY_MS = 15 * 60 * 1000; // 15 minutes validity
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown

/**
 * Generates or resends a 6-digit verification code to the given email.
 * If a code was already generated within the last 15 minutes and has remaining
 * attempts, the exact same code is resent (protecting against race conditions).
 */
export async function requestOtp(email: string): Promise<{
  success: boolean;
  message: string;
  retryAfter?: number;
}> {
  const cleanEmail = email.toLowerCase().trim();
  const existing = otpStore.get(cleanEmail);
  const now = Date.now();

  // 1. Rate Limit check: 60-second cooldown between send/resend requests
  if (existing && existing.rateLimitUntil > now) {
    const remaining = Math.ceil((existing.rateLimitUntil - now) / 1000);
    return {
      success: false,
      message: `Please wait ${remaining} seconds before requesting a new code.`,
      retryAfter: remaining,
    };
  }

  let otp: string;
  let isResend = false;

  // 2. Reuse same code for 15 minutes if active and valid
  if (existing && existing.expiresAt > now && existing.attempts < 5) {
    otp = existing.code;
    existing.rateLimitUntil = now + RATE_LIMIT_COOLDOWN_MS;
    isResend = true;
  } else {
    // Generate new cryptographically secure 6-digit numeric OTP
    otp = crypto.randomInt(100000, 1000000).toString();
    otpStore.set(cleanEmail, {
      code: otp,
      attempts: 0,
      createdAt: now,
      expiresAt: now + OTP_VALIDITY_MS,
      rateLimitUntil: now + RATE_LIMIT_COOLDOWN_MS,
    });
  }

  // 3. Log OTP directly to the terminal stdout for instant offline & developer testing
  const terminalBanner =
    `\n=======================================================\n` +
    ` [FLOURA TERMINAL AUTH] ${isResend ? "(Resent - Same Code for 15m)" : "(New Code - Valid 15m)"}\n` +
    ` Verification Code for: ${cleanEmail}\n` +
    ` OTP: ${otp}\n` +
    ` Valid for: 15 minutes\n` +
    `=======================================================\n`;
  console.log(terminalBanner);

  // 4. Asynchronously dispatch the email via SMTP (non-blocking for fast UI response)
  sendOtpEmail(cleanEmail, otp).catch((err) => {
    console.error("[OTP Service] Background email error:", err);
  });

  return {
    success: true,
    message: isResend
      ? `Verification code resent to ${cleanEmail} (valid for 15 minutes)`
      : `Verification code sent to ${cleanEmail}`,
  };
}

/**
 * Validates the 6-digit OTP code submitted by the user.
 */
export function verifyOtp(
  email: string,
  submittedCode: string
): {
  success: boolean;
  message: string;
  remainingAttempts?: number;
} {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = submittedCode.trim();

  const record = otpStore.get(cleanEmail);
  const now = Date.now();

  if (!record || record.expiresAt < now) {
    return {
      success: false,
      message: "Verification code has expired or was not requested. Please request a new code.",
    };
  }

  // Check brute force attempts (max 5)
  if (record.attempts >= 5) {
    otpStore.delete(cleanEmail);
    return {
      success: false,
      message: "Too many failed attempts. This code has been invalidated. Please request a new code.",
    };
  }

  if (record.code !== cleanCode) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    if (remaining <= 0) {
      otpStore.delete(cleanEmail);
      return {
        success: false,
        message: "Too many failed attempts. This code has been invalidated. Please request a new code.",
      };
    }
    return {
      success: false,
      message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      remainingAttempts: remaining,
    };
  }

  // OTP verified successfully! Clear from store to prevent replay
  otpStore.delete(cleanEmail);

  return {
    success: true,
    message: "OTP verified successfully.",
  };
}
