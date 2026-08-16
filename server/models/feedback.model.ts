import { getDb, runSql, querySqlAll } from "./db";

export async function createFeedback(id: string, name: string, email: string, category: string, title: string, message: string, rating: number, imageUrl: string, status: string, createdAt: string) {
  const db = await getDb();
  await runSql(db, `
    INSERT INTO feedbacks (id, name, email, category, title, message, rating, imageUrl, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, name, email, category, title, message, rating, imageUrl, status, createdAt]);
  db.close();
}

export async function listFeedbacksForUser(email: string) {
  const db = await getDb();
  const emailKey = email.toLowerCase().trim();
  const results = await querySqlAll<any>(db, "SELECT * FROM feedbacks WHERE email = ? ORDER BY createdAt DESC", [emailKey]);
  db.close();
  return results;
}

export async function listAllFeedbacks() {
  const db = await getDb();
  const results = await querySqlAll<any>(db, "SELECT * FROM feedbacks ORDER BY createdAt DESC");
  db.close();
  return results;
}

export async function updateFeedbackStatus(id: string, status: string) {
  const db = await getDb();
  await runSql(db, "UPDATE feedbacks SET status = ? WHERE id = ?", [status, id]);
  db.close();
}
