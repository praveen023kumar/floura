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
      instructions TEXT, -- JSON string array
      prepTimeMinutes INTEGER DEFAULT 15,
      cookTimeMinutes INTEGER DEFAULT 20,
      slug TEXT UNIQUE,
      metaTitle TEXT,
      metaDescription TEXT,
      ogImage TEXT,
      keywords TEXT,
      isPublic INTEGER DEFAULT 0,
      imageUrl TEXT,
      imageBase64 TEXT,
      updatedAt TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT 'praveen023kumar@gmail.com'
    )
  `);

  // Ensure missing columns exist in recipes table (Migration check)
  try {
    const columns = await querySqlAll<any>(db, "PRAGMA table_info(recipes)");
    const colNames = columns.map((col: any) => col.name);

    if (!colNames.includes("imageBase64")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN imageBase64 TEXT");
    }
    if (!colNames.includes("instructions")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN instructions TEXT");
    }
    if (!colNames.includes("prepTimeMinutes")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN prepTimeMinutes INTEGER DEFAULT 15");
    }
    if (!colNames.includes("cookTimeMinutes")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN cookTimeMinutes INTEGER DEFAULT 20");
    }
    if (!colNames.includes("slug")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN slug TEXT");
    }
    if (!colNames.includes("metaTitle")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN metaTitle TEXT");
    }
    if (!colNames.includes("metaDescription")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN metaDescription TEXT");
    }
    if (!colNames.includes("ogImage")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN ogImage TEXT");
    }
    if (!colNames.includes("keywords")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN keywords TEXT");
    }
    if (!colNames.includes("isPublic")) {
      await runSql(db, "ALTER TABLE recipes ADD COLUMN isPublic INTEGER DEFAULT 0");
    }
  } catch (e) {
    console.error("Migration check for recipes columns failed:", e);
  }

  // Seed sample public SEO recipes if none exist
  try {
    const publicCountRows = await querySqlAll<any>(db, "SELECT COUNT(*) as count FROM recipes WHERE isPublic = 1");
    if (publicCountRows && publicCountRows[0] && publicCountRows[0].count === 0) {
      const now = new Date().toISOString();
      const sampleRecipes = [
        {
          id: "pub-recipe-macarons",
          name: "French Macaron Shells",
          category: "Macarons",
          stdYield: 24,
          yieldUnit: "shells",
          ingredients: JSON.stringify([
            { name: "Almond Flour", qty: 100 },
            { name: "Powdered Sugar", qty: 100 },
            { name: "Egg Whites", qty: 75 },
            { name: "Granulated Sugar", qty: 75 }
          ]),
          instructions: JSON.stringify([
            { stepNumber: 1, text: "Sift almond flour and powdered sugar twice through a fine-mesh sieve into a bowl." },
            { stepNumber: 2, text: "Whip egg whites to soft peaks, then gradually add granulated sugar while whipping to stiff french meringue." },
            { stepNumber: 3, text: "Fold dry ingredients into meringue using macaronage technique until batter flows like lava." },
            { stepNumber: 4, text: "Pipe 1.5-inch rounds on baking sheets lined with silicone mats. Rest until skin forms (20-30 mins)." },
            { stepNumber: 5, text: "Bake at 150°C (300°F) for 14-16 minutes until feet are solid and shells do not wobble." }
          ]),
          prepTimeMinutes: 25,
          cookTimeMinutes: 15,
          slug: "french-macaron-shells-calculator",
          metaTitle: "French Macaron Shells Recipe & Batch Ratio Calculator | Floura",
          metaDescription: "Calculate exact ingredient weights for French Macaron shells based on desired yield or batch size. Interactive baker's ratio calculator with step-by-step instructions.",
          keywords: "macaron calculator, french macaron recipe, baker percentage, macaron batch scale",
          isPublic: 1,
          updatedAt: now
        },
        {
          id: "pub-recipe-vanilla-sponge",
          name: "Classic Vanilla Bakery Sponge Cake",
          category: "Cakes",
          stdYield: 1,
          yieldUnit: "8-inch cake",
          ingredients: JSON.stringify([
            { name: "Cake Flour", qty: 250 },
            { name: "Caster Sugar", qty: 250 },
            { name: "Unsalted Butter", qty: 250 },
            { name: "Whole Eggs", qty: 250 },
            { name: "Baking Powder", qty: 8 },
            { name: "Vanilla Extract", qty: 10 }
          ]),
          instructions: JSON.stringify([
            { stepNumber: 1, text: "Preheat oven to 175°C (350°F) and grease two 8-inch round cake pans." },
            { stepNumber: 2, text: "Cream room temperature butter and caster sugar together until pale and fluffy (approx 5 minutes)." },
            { stepNumber: 3, text: "Add eggs one at a time, beating thoroughly after each addition along with vanilla extract." },
            { stepNumber: 4, text: "Sift flour and baking powder together, then gently fold into wet mixture until smooth batter forms." },
            { stepNumber: 5, text: "Divide batter evenly between prepared pans and bake for 25-30 minutes until toothpick comes out clean." }
          ]),
          prepTimeMinutes: 20,
          cookTimeMinutes: 30,
          slug: "classic-vanilla-sponge-cake-calculator",
          metaTitle: "Classic Vanilla Sponge Cake Recipe & Yield Scale Calculator | Floura",
          metaDescription: "Free bakery sponge cake recipe yield calculator. Scale ingredients for any cake size or tin diameter instantly with step-by-step baking guide.",
          keywords: "sponge cake calculator, cake scaling formula, vanilla cake recipe",
          isPublic: 1,
          updatedAt: now
        }
      ];

      for (const r of sampleRecipes) {
        await runSql(db, `
          INSERT INTO recipes (
            id, name, category, stdYield, yieldUnit, ingredients, instructions,
            prepTimeMinutes, cookTimeMinutes, slug, metaTitle, metaDescription,
            keywords, isPublic, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          r.id, r.name, r.category, r.stdYield, r.yieldUnit, r.ingredients, r.instructions,
          r.prepTimeMinutes, r.cookTimeMinutes, r.slug, r.metaTitle, r.metaDescription,
          r.keywords, r.isPublic, r.updatedAt
        ]);
      }
      console.log("Seeded default public SEO recipes in SQLite database.");
    }

    // Seed Tamil Nadu Public SEO recipes dataset
    const { seedTop50TamilNaduRecipes } = await import("../seedTamilNaduRecipes");
    await seedTop50TamilNaduRecipes();
  } catch (seedErr) {
    console.error("Seeding public recipes failed:", seedErr);
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
