import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import CryptoJS from "crypto-js";
import { initSecurityDb } from "./security.model";

const DB_FILE = path.join(process.cwd(), "patisserie.sqlite");

// Helper to open SQLite database with security constraints and configurations
export function getDb(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        reject(err);
      } else {
        try {
          // Set filesystem permissions to owner read/write only (chmod 600)
          if (fs.existsSync(DB_FILE)) {
            fs.chmodSync(DB_FILE, 0o600);
          }

          // Apply security and reliability Pragmas
          db.serialize(() => {
            db.run("PRAGMA journal_mode = WAL;");
            db.run("PRAGMA foreign_keys = ON;");
            db.run("PRAGMA busy_timeout = 5000;");
          });

          resolve(db);
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

// Helper to run a SQL command
export function runSql(db: sqlite3.Database, sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Helper to query all rows
export function querySqlAll<T>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// Initialize database with tables and default seed data
export async function initDb() {
  const db = await getDb();

  // Create Customers Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      type TEXT NOT NULL,
      totalOrders INTEGER NOT NULL DEFAULT 0,
      memberSince TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com'
    )
  `);

  // Create Orders Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerMobile TEXT NOT NULL,
      eventType TEXT NOT NULL,
      eventDate TEXT NOT NULL,
      deliveryDate TEXT,
      deliveryTime TEXT NOT NULL,
      venueAddress TEXT,
      cakeShape TEXT,
      cakeWeight TEXT,
      cakeFlavor TEXT,
      preference TEXT,
      layers TEXT,
      cakeInscription TEXT,
      referenceImage TEXT,
      specialInstructions TEXT,
      basePrice REAL,
      decorationCharge REAL,
      deliveryFee REAL,
      totalAmount REAL,
      status TEXT NOT NULL DEFAULT 'Pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com',
      paymentStatus TEXT NOT NULL DEFAULT 'Unpaid',
      paidAmount REAL NOT NULL DEFAULT 0,
      paymentHistory TEXT NOT NULL DEFAULT '[]',
      inventoryReduced INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create Inventory Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      minStockLevel REAL NOT NULL DEFAULT 0,
      supplier TEXT,
      costPrice REAL NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com'
    )
  `);

  // Create Recipes Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      stdYield REAL NOT NULL,
      yieldUnit TEXT NOT NULL,
      ingredients TEXT NOT NULL, -- JSON string array
      imageUrl TEXT,
      imageBase64 TEXT,
      updatedAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com'
    )
  `);

  // Ensure imageBase64 column exists in recipes table
  try {
    const columns = await querySqlAll<any>(db, "PRAGMA table_info(recipes)");
    const hasImageBase64 = columns.some((col: any) => col.name === "imageBase64");
    if (!hasImageBase64) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN imageBase64 TEXT");
      console.log("Migrated recipes table: Added imageBase64 column");
    }
  } catch (e) {
    console.error("Migration check for recipes imageBase64 column failed:", e);
  }

  // Create Checklist Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS checklist (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com',
      isDeleted INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create Custom Events Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS custom_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com',
      isDeleted INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create Dispatched Notifications Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS dispatched_notifications (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      customerMobile TEXT NOT NULL,
      cakeSpec TEXT,
      messageText TEXT NOT NULL,
      dispatchedAt TEXT NOT NULL,
      status TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com',
      isDeleted INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create Scheduled Alerts Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS scheduled_alerts (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      customerMobile TEXT NOT NULL,
      alertDate TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com',
      isDeleted INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create Bakery Profile Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS bakery_profile (
      id TEXT PRIMARY KEY,
      bakeryName TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      role TEXT,
      currency TEXT,
      dateFormat TEXT,
      updatedAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com',
      isDeleted INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create Categories Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com',
      isDeleted INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create Users Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Create Feedbacks Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      category TEXT,
      title TEXT,
      message TEXT NOT NULL,
      rating INTEGER,
      imageUrl TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      createdAt TEXT NOT NULL
    )
  `);

  // Create Admin Users Table
  await runSql(db, `
    CREATE TABLE IF NOT EXISTS admin_users (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Seed default superadmin if table is empty
  try {
    const adminCount = await querySqlAll<any>(db, "SELECT count(*) as count FROM admin_users");
    if (adminCount.length === 0 || adminCount[0].count === 0) {
      const email = "superadmin@floura.com";
      const name = "Super Administrator";
      const password = "FlouraAdmin#SuperSecure!2026";
      const role = "superadmin";
      const permissions = ["users", "feedbacks", "setup"];
      
      const salt = CryptoJS.lib.WordArray.random(16).toString();
      const hash = CryptoJS.SHA256(password + salt).toString();
      
      await runSql(db, `
        INSERT INTO admin_users (email, name, password_hash, salt, role, permissions, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [email, name, hash, salt, role, JSON.stringify(permissions), new Date().toISOString()]);
      console.log("Default superadmin user seeded successfully.");
    }
  } catch (err) {
    console.error("Failed to seed default superadmin user:", err);
  }

  // Safe schema migrations helper (adds user_email & isDeleted if absent in old sqlite tables)
  const tables = ["customers", "orders", "inventory", "recipes", "checklist", "custom_events", "dispatched_notifications", "scheduled_alerts", "bakery_profile", "categories"];
  for (const t of tables) {
    try {
      await runSql(db, `ALTER TABLE ${t} ADD COLUMN user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com'`);
    } catch {}
    try {
      await runSql(db, `ALTER TABLE ${t} ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0`);
    } catch {}
  }

  // Safe migration specifically for deliveryDate on orders table
  try {
    await runSql(db, `ALTER TABLE orders ADD COLUMN deliveryDate TEXT NOT NULL DEFAULT ''`);
  } catch {}

  // Safe migrations for payment fields on orders table
  try {
    await runSql(db, `ALTER TABLE orders ADD COLUMN paymentStatus TEXT NOT NULL DEFAULT 'Unpaid'`);
  } catch {}
  try {
    await runSql(db, `ALTER TABLE orders ADD COLUMN paidAmount REAL NOT NULL DEFAULT 0`);
  } catch {}
  try {
    await runSql(db, `ALTER TABLE orders ADD COLUMN paymentHistory TEXT NOT NULL DEFAULT '[]'`);
  } catch {}
  try {
    await runSql(db, `ALTER TABLE orders ADD COLUMN inventoryReduced INTEGER NOT NULL DEFAULT 0`);
  } catch {}

  // Safe migrations for feedbacks table fields
  try {
    await runSql(db, `ALTER TABLE feedbacks ADD COLUMN title TEXT`);
  } catch {}
  try {
    await runSql(db, `ALTER TABLE feedbacks ADD COLUMN imageUrl TEXT`);
  } catch {}

  // We do not seed the initial bakery profile anymore, as doing so automatically
  // marks the user as "onboarded" and prevents the Getting Started page from showing.
  // The profile will be created when the user completes onboarding.

  // Seed default categories if table is empty
  try {
    const catCount = await querySqlAll<any>(db, "SELECT count(*) as count FROM categories WHERE user_email = 'praveen023kumar@gmail.com'");
    if (catCount.length === 0 || catCount[0].count === 0) {
      const now = new Date().toISOString();
      const defaultRecipeCats = ["Cakes", "Viennoiserie", "Tarts", "Confectionary", "Classic", "Pastry"];
      for (const cat of defaultRecipeCats) {
        const id = `cat-recipe-${cat.toLowerCase().replace(/\s+/g, '-')}`;
        await runSql(db, `
          INSERT INTO categories (id, name, type, updatedAt, user_email, isDeleted)
          VALUES (?, ?, 'recipe', ?, 'praveen023kumar@gmail.com', 0)
        `, [id, cat, now]);
      }
      const defaultInvCats = ["Dry Goods", "Dairy", "Produce", "Packaging", "Flour", "Chocolate"];
      for (const cat of defaultInvCats) {
        const id = `cat-inv-${cat.toLowerCase().replace(/\s+/g, '-')}`;
        await runSql(db, `
          INSERT INTO categories (id, name, type, updatedAt, user_email, isDeleted)
          VALUES (?, ?, 'inventory', ?, 'praveen023kumar@gmail.com', 0)
        `, [id, cat, now]);
      }
    }
  } catch (err) {
    console.error("Failed to seed default categories SQLite table:", err);
  }

  db.close();
  console.log("SQLite database initialized successfully.");

  // Chain load security database tables
  await initSecurityDb();
}
