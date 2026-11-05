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

