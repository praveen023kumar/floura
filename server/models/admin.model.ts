import { getDb, runSql, querySqlAll } from "./db";
import CryptoJS from "crypto-js";

const SECRET_KEY = "floura_kitchen_super_secret_db_key_2026";

function decryptAdminValue(val: any): any {
  if (typeof val === "string" && val.startsWith("__ENC__")) {
    try {
      const ciphertext = val.substring(7);
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      return dec || val;
    } catch {
      return val;
    }
  }
  return val;
}

export async function findAdminByEmail(email: string) {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  const results = await querySqlAll<any>(db, "SELECT * FROM admin_users WHERE email = ?", [emailKey]);
  db.close();
  return results.length > 0 ? results[0] : null;
}

export async function listAdmins() {
  const db = await getDb();
  const users = await querySqlAll<any>(db, "SELECT email, name, role, permissions, createdAt FROM admin_users ORDER BY createdAt DESC");
  db.close();
  return users;
}

export async function createAdminUser(email: string, name: string, passwordHash: string, salt: string, role: string, permissions: string[]) {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  await runSql(db, `
    INSERT INTO admin_users (email, name, password_hash, salt, role, permissions, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [emailKey, name, passwordHash, salt, role, JSON.stringify(permissions), new Date().toISOString()]);
  db.close();
}

export async function getUsersCount() {
  const db = await getDb();
  const result = await querySqlAll<any>(db, "SELECT count(*) as count FROM users");
  db.close();
  return result[0]?.count || 0;
}

export async function listRegisteredUsers() {
  const db = await getDb();
  const query = `
    SELECT 
      u.email, 
      u.name, 
      u.avatar, 
      u.createdAt, 
      COALESCE(u.is_active, 1) as is_active, 
      COALESCE(u.subscription_status, 'trial') as subscription_status, 
      u.subscription_expires_at, 
      u.last_payment_date,
      (SELECT COUNT(*) FROM orders o WHERE o.user_email = u.email AND (o.isDeleted IS NULL OR o.isDeleted = 0)) as orders_count,
      (SELECT bakeryName FROM bakery_profile b WHERE b.user_email = u.email AND (b.isDeleted IS NULL OR b.isDeleted = 0) LIMIT 1) as bakery_name,
      (SELECT phone FROM bakery_profile b WHERE b.user_email = u.email AND (b.isDeleted IS NULL OR b.isDeleted = 0) LIMIT 1) as phone
    FROM users u 
    ORDER BY u.createdAt DESC
  `;
  const users = await querySqlAll<any>(db, query);
  db.close();

  return users.map(u => ({
    ...u,
    bakery_name: decryptAdminValue(u.bakery_name),
    phone: decryptAdminValue(u.phone)
  }));
}

export async function toggleUserStatus(email: string, isActive: boolean) {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  await runSql(db, "UPDATE users SET is_active = ? WHERE email = ?", [isActive ? 1 : 0, emailKey]);
  db.close();
}

export async function recordPayment(params: {
  userEmail: string;
  amount: number;
  currency?: string;
  months: number;
  paymentMethod: string;
  referenceId?: string;
  razorpayOrderId?: string;
  status?: "success" | "failed" | "pending";
  failureReason?: string;
  notes?: string;
  recordedBy: string;
  customExpiry?: string;
  paymentId?: string;
}) {
  const db = await getDb();
  const emailKey = params.userEmail.toLowerCase().trim();
  const paymentId = params.paymentId || ("pay_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8));
  const now = new Date();
  const nowIso = now.toISOString();
  const paymentStatus = params.status || "success";

  // Find user's current subscription expiry
  const userRows = await querySqlAll<any>(db, "SELECT subscription_expires_at FROM users WHERE email = ?", [emailKey]);
  const currentExpiry = userRows[0]?.subscription_expires_at ? new Date(userRows[0].subscription_expires_at) : null;

  let newExpiry: string | null = null;

  if (paymentStatus === "success") {
    if (params.customExpiry) {
      newExpiry = new Date(params.customExpiry).toISOString();
    } else {
      // If current expiry is in the future, extend from that date; otherwise extend from now
      const baseTime = (currentExpiry && currentExpiry.getTime() > now.getTime()) 
        ? currentExpiry.getTime() 
        : now.getTime();
      const daysToAdd = (params.months || 1) * 30;
      newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // Insert payment log
  await runSql(db, `
    INSERT INTO payment_logs (
      id, user_email, amount, currency, months, payment_method, 
      reference_id, razorpay_order_id, status, failure_reason, notes, recorded_by, createdAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    paymentId,
    emailKey,
    params.amount || 99,
    params.currency || "INR",
    params.months || 1,
    params.paymentMethod,
    params.referenceId || "",
    params.razorpayOrderId || "",
    paymentStatus,
    params.failureReason || null,
    params.notes || "",
    params.recordedBy,
    nowIso
  ]);

  // Update user subscription & activate account ONLY if payment is successful
  if (paymentStatus === "success" && newExpiry) {
    await runSql(db, `
      UPDATE users 
      SET is_active = 1, 
          subscription_status = 'active', 
          subscription_expires_at = ?, 
          last_payment_date = ? 
      WHERE email = ?
    `, [newExpiry, nowIso, emailKey]);
  }

  db.close();
  return { paymentId, newExpiry };
}

export async function recordPaymentFailure(params: {
  userEmail: string;
  amount: number;
  currency?: string;
  months: number;
  paymentMethod: string;
  referenceId?: string;
  razorpayOrderId?: string;
  failureReason: string;
  notes?: string;
  recordedBy?: string;
}) {
  return recordPayment({
    ...params,
    status: "failed",
    recordedBy: params.recordedBy || "razorpay_gateway"
  });
}

export async function updateUserExpiry(
  email: string,
  expiryDate: string,
  subscriptionStatus: string = "active",
  isActive: number = 1
) {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  const isoExpiry = new Date(expiryDate).toISOString();

  await runSql(db, `
    UPDATE users 
    SET subscription_expires_at = ?,
        subscription_status = ?,
        is_active = ?
    WHERE email = ?
  `, [isoExpiry, subscriptionStatus, isActive, emailKey]);

  db.close();
  return { newExpiry: isoExpiry };
}

export async function getPaymentLogs(userEmail?: string, statusFilter?: string) {
  const db = await getDb();
  let query = `
    SELECT 
      p.*, 
      COALESCE(p.status, 'success') as status,
      u.name as user_name,
      u.subscription_expires_at as current_expires_at
    FROM payment_logs p
    LEFT JOIN users u ON p.user_email = u.email
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (userEmail) {
    conditions.push("p.user_email = ?");
    params.push(userEmail.toLowerCase().trim());
  }

  if (statusFilter && statusFilter !== "all") {
    conditions.push("COALESCE(p.status, 'success') = ?");
    params.push(statusFilter.toLowerCase().trim());
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY p.createdAt DESC";

  const logs = await querySqlAll<any>(db, query, params);
  db.close();
  return logs;
}

