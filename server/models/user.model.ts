import { getDb, runSql, querySqlAll } from "./db";

export async function findUserByEmail(email: string) {
  const db = await getDb();
  const results = await querySqlAll<any>(db, "SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
  db.close();
  return results.length > 0 ? results[0] : null;
}

export async function updateUserSignature(email: string, signatureToken: string, name: string, avatar: string, deviceId?: string) {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  if (deviceId) {
    await runSql(db, "UPDATE users SET password_hash = ?, name = ?, avatar = ?, device_id = ? WHERE email = ?", [
      signatureToken,
      name,
      avatar,
      deviceId,
      emailKey
    ]);
  } else {
    await runSql(db, "UPDATE users SET password_hash = ?, name = ?, avatar = ? WHERE email = ?", [
      signatureToken,
      name,
      avatar,
      emailKey
    ]);
  }
  db.close();
}

export async function createUser(email: string, signatureToken: string, name: string, avatar: string, deviceId?: string) {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await runSql(db, `
    INSERT INTO users (email, password_hash, name, avatar, createdAt, is_active, subscription_status, subscription_expires_at, device_id)
    VALUES (?, ?, ?, ?, ?, 1, 'trial', ?, ?)
  `, [emailKey, signatureToken, name, avatar, now.toISOString(), thirtyDaysLater, deviceId || null]);
  db.close();
}

export async function updateUserProfile(email: string, name: string, avatar: string) {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  await runSql(db, "UPDATE users SET name = ?, avatar = ? WHERE email = ?", [name, avatar || "chef", emailKey]);
  db.close();
}

export async function hasBakeryProfile(email: string): Promise<boolean> {
  const db = await getDb();
  const results = await querySqlAll<any>(
    db, 
    "SELECT 1 FROM bakery_profile WHERE user_email = ? AND isDeleted != 1 LIMIT 1", 
    [email.toLowerCase().trim()]
  );
  db.close();
  return results.length > 0;
}

export async function updateUserDeviceId(email: string, deviceId: string) {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  await runSql(db, "UPDATE users SET device_id = ? WHERE email = ?", [deviceId, emailKey]);
  db.close();
}

export async function ensureDemoUser(email: string, signatureToken: string, name: string = "KyDigit Demo Chef") {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  const existing = await querySqlAll<any>(db, "SELECT * FROM users WHERE email = ?", [emailKey]);
  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  
  if (existing.length === 0) {
    await runSql(db, `
      INSERT INTO users (email, password_hash, name, avatar, createdAt, is_active, subscription_status, subscription_expires_at, device_id)
      VALUES (?, ?, ?, ?, ?, 1, 'active', ?, NULL)
    `, [emailKey, signatureToken, name, "chef", now.toISOString(), oneYearLater]);
  } else {
    await runSql(db, `
      UPDATE users 
      SET password_hash = ?, is_active = 1, subscription_status = 'active', subscription_expires_at = ?
      WHERE email = ?
    `, [signatureToken, oneYearLater, emailKey]);
  }

  // Ensure default demo bakery profile exists so it skips onboarding
  const profile = await querySqlAll<any>(db, "SELECT 1 FROM bakery_profile WHERE user_email = ? AND isDeleted != 1 LIMIT 1", [emailKey]);
  if (profile.length === 0) {
    await runSql(db, `
      INSERT OR IGNORE INTO bakery_profile 
      (id, bakeryName, email, phone, address, role, currency, dateFormat, updatedAt, user_email, isDeleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      "demo_profile_" + emailKey.replace(/[^a-zA-Z0-9]/g, ""),
      "KyDigit Floura Bakery",
      emailKey,
      "+91 98765 43210",
      "123 Baker Street, Chennai, TN",
      "Head Chef & Owner",
      "₹",
      "DD/MM/YYYY",
      now.toISOString(),
      emailKey
    ]);
  }

  db.close();
}


