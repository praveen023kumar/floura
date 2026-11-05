import express from "express";
import { findUserByEmail } from "../models/user.model";
import { getDb, runSql } from "../models/db";

// Shared memory reference, imported from routes registry or controller sessions
export const activeAdminSessions = new Map<string, {
  email: string;
  name: string;
  role: string;
  permissions: string[];
  createdAt: number;
}>();

export const requireAdminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Admin authorization required." });
  }
  const token = authHeader.substring(7).trim();
  const session = activeAdminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired admin session token." });
  }

  // Admin Session Expiration: 2 Hours
  const maxSessionAge = 2 * 60 * 60 * 1000;
  if (Date.now() - session.createdAt > maxSessionAge) {
    activeAdminSessions.delete(token);
    return res.status(401).json({ error: "Unauthorized: Admin session expired. Please log in again." });
  }

  (req as any).adminUser = session;
  next();
};

export const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Security Authorization required. Please log in first." });
    }
    const token = authHeader.substring(7).trim();

    // Look for userEmail anywhere (body, query, or customized header)
    const rawEmail = req.body.userEmail || req.headers["x-user-email"] || req.query.userEmail;
    if (!rawEmail) {
      return res.status(400).json({ error: "Missing identity parameter (userEmail). Please supply your email." });
    }

    const emailKey = String(rawEmail).toLowerCase().trim();
    const user = await findUserByEmail(emailKey);

    if (!user || user.password_hash !== token) {
      return res.status(403).json({ 
        error: "Access Denied: Invalid security workspace signature. Please re-authenticate.",
        code: "INVALID_WORKSPACE_SIGNATURE"
      });
    }

    // Enforce single-device session locking
    const reqDeviceId = req.headers["x-device-id"] || req.body?.deviceId;
    if (!user.device_id && reqDeviceId) {
      const db = await getDb();
      await runSql(db, "UPDATE users SET device_id = ? WHERE email = ?", [String(reqDeviceId), emailKey]);
      db.close();
      user.device_id = String(reqDeviceId);
    } else if (user.device_id && (!reqDeviceId || reqDeviceId !== user.device_id)) {
      return res.status(403).json({
        error: "Session Terminated: Your account is active on another device. Only one device may access Floura at a time.",
        code: "SINGLE_DEVICE_CONFLICT"
      });
    }

    // Check account active state & subscription expiry
    const now = Date.now();
    const expiryTime = user.subscription_expires_at ? new Date(user.subscription_expires_at).getTime() : 0;
    const isExpired = expiryTime ? now > expiryTime : false;
    const isInactive = user.is_active === 0;

    if (isInactive || isExpired) {
      return res.status(403).json({
        error: isInactive 
          ? "Your account has been deactivated. Please contact support to restore access." 
          : "Your 30-day trial or subscription has expired. Please renew to continue using Floura.",
        code: isInactive ? "ACCOUNT_DEACTIVATED" : "SUBSCRIPTION_EXPIRED",
        is_active: user.is_active,
        subscription_status: isInactive ? "deactivated" : (isExpired ? "expired" : user.subscription_status),
        subscription_expires_at: user.subscription_expires_at
      });
    }

    // Securely stash verified properties for handler pipelines
    (req as any).userEmail = emailKey;
    (req as any).token = token;
    (req as any).user = user;

    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal security authorization failure." });
  }
};
