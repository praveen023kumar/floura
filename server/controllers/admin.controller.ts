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

export async function getRegisteredUsers(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("users")) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions to view registered users." });
    }

    const { listRegisteredUsers } = await import("../models/admin.model");
    const users = await listRegisteredUsers();

    res.json({
      status: "success",
      users
    });
  } catch (err: any) {
    console.error("Fetch registered users error:", err);
    res.status(500).json({ error: err.message || "Failed to load registered users." });
  }
}

export async function toggleUserStatusHandler(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("users")) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions to update user status." });
    }

    const { email } = req.params;
    const { isActive } = req.body;
    if (!email) {
      return res.status(400).json({ error: "User email is required." });
    }

    const { toggleUserStatus } = await import("../models/admin.model");
    await toggleUserStatus(email, Boolean(isActive));
    await writeAuditLog(adminUser.email, "USER_STATUS_TOGGLED", { targetUser: email, isActive }, req);

    res.json({
      status: "success",
      email,
      isActive: Boolean(isActive)
    });
  } catch (err: any) {
    console.error("Toggle user status error:", err);
    res.status(500).json({ error: err.message || "Failed to update user status." });
  }
}

export async function addPaymentLogHandler(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("users") && !adminUser.permissions.includes("billing")) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions to record payments." });
    }

    const { userEmail, amount, currency = "INR", months = 1, paymentMethod, referenceId, notes, customExpiry } = req.body;
    if (!userEmail || !paymentMethod) {
      return res.status(400).json({ error: "User email and payment method are required." });
    }

    const { recordPayment } = await import("../models/admin.model");
    const result = await recordPayment({
      userEmail,
      amount: Number(amount) || (months * 99),
      currency,
      months: Number(months) || 1,
      paymentMethod,
      referenceId,
      notes,
      recordedBy: adminUser.email,
      customExpiry
    });

    await writeAuditLog(adminUser.email, "PAYMENT_RECORDED", {
      targetUser: userEmail,
      amount: Number(amount) || (months * 99),
      months,
      newExpiry: result.newExpiry,
      customExpiry
    }, req);

    res.json({
      status: "success",
      ...result
    });
  } catch (err: any) {
    console.error("Add payment error:", err);
    res.status(500).json({ error: err.message || "Failed to record payment log." });
  }
}

export async function updateUserExpiryHandler(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    const permissions = Array.isArray(adminUser?.permissions) ? adminUser.permissions : [];
    if (adminUser?.role !== "superadmin" && !permissions.includes("users")) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions to update user expiry." });
    }

    const email = (req.params.email || req.body.email || req.body.userEmail || "").trim();
    const { expiryDate, subscriptionStatus = "active", isActive = 1 } = req.body;
    if (!email || !expiryDate) {
      return res.status(400).json({ error: "User email and expiry date are required." });
    }

    const dateObj = new Date(expiryDate);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: "Invalid expiry date provided." });
    }

    const { updateUserExpiry } = await import("../models/admin.model");
    const result = await updateUserExpiry(email, dateObj.toISOString(), subscriptionStatus, Number(isActive));

    if (adminUser?.email) {
      await writeAuditLog(adminUser.email, "USER_EXPIRY_UPDATED", {
        targetUser: email,
        newExpiry: result.newExpiry,
        subscriptionStatus,
        isActive
      }, req).catch((err) => console.warn("Audit log write error:", err));
    }

    return res.status(200).json({
      status: "success",
      email,
      newExpiry: result.newExpiry,
      subscription_status: subscriptionStatus,
      is_active: Number(isActive)
    });
  } catch (err: any) {
    console.error("Update user expiry error:", err);
    res.status(500).json({ error: err.message || "Failed to update user expiry." });
  }
}

export async function getPaymentsListHandler(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("users") && !adminUser.permissions.includes("billing")) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions to view payment logs." });
    }

    const { userEmail, status } = req.query;
    const { getPaymentLogs } = await import("../models/admin.model");
    const logs = await getPaymentLogs(
      userEmail ? String(userEmail) : undefined,
      status ? String(status) : undefined
    );

    res.json({
      status: "success",
      payments: logs
    });
  } catch (err: any) {
    console.error("Get payment logs error:", err);
    res.status(500).json({ error: err.message || "Failed to load payment logs." });
  }
}

