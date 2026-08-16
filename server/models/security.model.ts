import { getDb, runSql, querySqlAll } from "./db";
import CryptoJS from "crypto-js";

// --- SECURITY DATABASE SETUP ---

export async function initSecurityDb() {
  const db = await getDb();
  try {
    // 1. Blocked IPs Table
    await runSql(db, `
      CREATE TABLE IF NOT EXISTS blocked_ips (
        ip TEXT PRIMARY KEY,
        reason TEXT NOT NULL,
        blocked_until TEXT NOT NULL
      )
    `);

    // 2. Failed Logins Table
    await runSql(db, `
      CREATE TABLE IF NOT EXISTS failed_logins (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        lockout_until TEXT
      )
    `);

    // 3. Processed Idempotency Keys Table
    await runSql(db, `
      CREATE TABLE IF NOT EXISTS processed_idempotency_keys (
        key TEXT PRIMARY KEY,
        user_email TEXT,
        response_status INTEGER NOT NULL,
        response_body TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // 4. Audit Logs Table
    await runSql(db, `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_email TEXT,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        ip TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    console.log("[Security DB] Security tables initialized successfully.");
  } catch (err) {
    console.error("[Security DB] Initialization failed:", err);
  } finally {
    db.close();
  }
}

// --- AUDIT LOGGING ---

export async function insertAuditLog(userEmail: string, action: string, details: any, ip: string) {
  const timestamp = new Date().toISOString();
  const id = "audit_" + CryptoJS.lib.WordArray.random(16).toString();
  const detailsStr = typeof details === "string" ? details : JSON.stringify(details);

  try {
    const db = await getDb();
    await runSql(db, `
      INSERT INTO audit_logs (id, user_email, action, details, ip, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, userEmail, action, detailsStr, ip, timestamp]);
    db.close();
  } catch (err) {
    console.error("[Audit Log] Failed to write audit log:", err);
  }
}

export async function getAllAuditLogs(limit: number = 200) {
  const db = await getDb();
  const logs = await querySqlAll<any>(db, "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", [limit]);
  db.close();
  return logs;
}

// --- IP BLOCKING ---

export async function insertBlockedIp(ip: string, reason: string, durationMinutes: number) {
  const blockUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const db = await getDb();
  await runSql(db, `
    INSERT OR REPLACE INTO blocked_ips (ip, reason, blocked_until)
    VALUES (?, ?, ?)
  `, [ip, reason, blockUntil]);
  db.close();
  return blockUntil;
}

export async function deleteBlockedIp(ip: string) {
  const db = await getDb();
  await runSql(db, "DELETE FROM blocked_ips WHERE ip = ?", [ip]);
  db.close();
}

export async function getActiveBlockedIps(nowStr: string) {
  const db = await getDb();
  // Clean up expired blocks first
  await runSql(db, "DELETE FROM blocked_ips WHERE blocked_until <= ?", [nowStr]);
  const activeBlocks = await querySqlAll<{ ip: string; reason: string; blocked_until: string }>(
    db,
    "SELECT ip, reason, blocked_until FROM blocked_ips"
  );
  db.close();
  return activeBlocks;
}

// --- FAILED LOGINS & LOCKOUTS ---

export async function getFailedLogins(emailKey: string, ip: string) {
  const db = await getDb();
  const results = await querySqlAll<{ key: string; count: number; lockout_until: string }>(
    db,
    "SELECT key, count, lockout_until FROM failed_logins WHERE key = ? OR key = ?",
    [emailKey, ip]
  );
  db.close();
  return results;
}

export async function incrementFailedLoginCount(key: string, limit: number) {
  const db = await getDb();
  const existing = await querySqlAll<{ count: number }>(db, "SELECT count FROM failed_logins WHERE key = ?", [key]);
  let count = 1;
  let lockoutUntil = null;
  
  if (existing.length > 0) {
    count = existing[0].count + 1;
    if (count >= limit) {
      lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
  }
  
  await runSql(db, `
    INSERT OR REPLACE INTO failed_logins (key, count, lockout_until)
    VALUES (?, ?, ?)
  `, [key, count, lockoutUntil]);
  db.close();
}

export async function deleteFailedLogins(emailKey: string, ip: string) {
  const db = await getDb();
  await runSql(db, "DELETE FROM failed_logins WHERE key = ? OR key = ?", [emailKey, ip]);
  db.close();
}

// --- IDEMPOTENCY ---

export async function findProcessedIdempotencyKey(key: string) {
  const db = await getDb();
  const existing = await querySqlAll<{ user_email: string; response_status: number; response_body: string }>(
    db,
    "SELECT user_email, response_status, response_body FROM processed_idempotency_keys WHERE key = ?",
    [key]
  );
  db.close();
  return existing.length > 0 ? existing[0] : null;
}

export async function saveProcessedIdempotencyKey(key: string, userEmail: string, status: number, bodyStr: string) {
  const db = await getDb();
  await runSql(db, `
    INSERT OR REPLACE INTO processed_idempotency_keys (key, user_email, response_status, response_body, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `, [key, userEmail, status, bodyStr, new Date().toISOString()]);
  db.close();
}
