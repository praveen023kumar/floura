import { getDb, runSql, querySqlAll } from "./db";

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
