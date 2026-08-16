import { Request, Response } from "express";
import CryptoJS from "crypto-js";
import { findAdminByEmail, listAdmins as getAdminsList, createAdminUser, getUsersCount as getRegisteredUsersCount } from "../models/admin.model";
import { checkLoginLockout, recordFailedLoginAttempt, resetFailedLoginAttempts, writeAuditLog } from "../middleware/security.middleware";
import { activeAdminSessions } from "../middleware/auth.middleware";

export async function login(req: Request, res: Response) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const emailKey = email.toLowerCase().trim();

    // Lockout check
    const lockout = await checkLoginLockout(emailKey, ip);
    if (lockout.locked) {
      await writeAuditLog(emailKey, "ADMIN_LOGIN_LOCKOUT_BLOCKED", { ip }, req);
      return res.status(423).json({
        error: `Too many failed attempts. This account or IP is temporarily locked out. Try again in ${lockout.timeLeftSec} seconds.`
      });
    }

    const admin = await findAdminByEmail(emailKey);
    if (!admin) {
      throw new Error("Invalid admin credentials.");
    }

    const computedHash = CryptoJS.SHA256(password + admin.salt).toString();
    if (computedHash !== admin.password_hash) {
      throw new Error("Invalid admin credentials.");
    }

    const adminToken = "admin_token_" + CryptoJS.lib.WordArray.random(24).toString();
    const permissionsList = JSON.parse(admin.permissions || "[]");
    
    activeAdminSessions.set(adminToken, {
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: permissionsList,
      createdAt: Date.now()
    });

    await resetFailedLoginAttempts(emailKey, ip);
    await writeAuditLog(emailKey, "ADMIN_LOGIN_SUCCESS", { role: admin.role }, req);

    res.json({
      status: "success",
      user: {
        name: admin.name,
        email: admin.email,
        avatar: "admin",
        role: admin.role,
        permissions: permissionsList
      },
      token: adminToken
    });
  } catch (err: any) {
    console.error("Admin login error:", err);
    if (req.body.email) {
      await recordFailedLoginAttempt(req.body.email, ip);
      await writeAuditLog(req.body.email, "ADMIN_LOGIN_FAILURE", { ip, reason: err.message }, req);
    }
    res.status(401).json({ error: err.message || "Failed to authenticate admin." });
  }
}

export async function listAdmins(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("users")) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions to view admin accounts." });
    }

    const users = await getAdminsList();
    const parsedUsers = users.map(u => ({
      ...u,
      permissions: JSON.parse(u.permissions || "[]")
    }));

    res.json({
      status: "success",
      users: parsedUsers
    });
  } catch (err: any) {
    console.error("Fetch admins error:", err);
    res.status(500).json({ error: err.message || "Failed to load admin accounts." });
  }
}

export async function createAdmin(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== "superadmin") {
      return res.status(403).json({ error: "Access Denied: Only superadmin can create administrative accounts." });
    }
    const { email, name, password, role, permissions = [] } = req.body;
    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: "Email, name, password, and role are required." });
    }
    const emailKey = email.toLowerCase().trim();
    
    const existing = await findAdminByEmail(emailKey);
    if (existing) {
      return res.status(409).json({ error: "An admin user with this email address already exists." });
    }
    
    const salt = CryptoJS.lib.WordArray.random(16).toString();
    const hash = CryptoJS.SHA256(password + salt).toString();
    
    await createAdminUser(emailKey, name, hash, salt, role, permissions);
    await writeAuditLog(adminUser.email, "ADMIN_CREATED", { createdAdmin: emailKey, role }, req);

    res.json({
      status: "success",
      user: {
        email: emailKey,
        name,
        role,
        permissions
      }
    });
  } catch (err: any) {
    console.error("Create admin error:", err);
    res.status(500).json({ error: err.message || "Failed to create admin user." });
  }
}

export async function getUsersCount(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("users") && !adminUser.permissions.includes("setup")) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions to view users count." });
    }
    const count = await getRegisteredUsersCount();
    res.json({
      status: "success",
      count
    });
  } catch (err: any) {
    console.error("Fetch users count error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch user count." });
  }
}
