import express from "express";
import { findUserByEmail } from "../models/user.model";

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
      return res.status(403).json({ error: "Access Denied: Invalid security workspace signature. Please re-authenticate." });
    }

    // Securely stash verified properties for handler pipelines
    (req as any).userEmail = emailKey;
    (req as any).token = token;

    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal security authorization failure." });
  }
};
