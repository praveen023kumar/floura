// File Path: /src/db-worker.ts
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import CryptoJS from "crypto-js";

let sqlite3: any = null;
let db: any = null;
let userDbKey: string | null = null;
let dbReady = false;

const SENSITIVE_COLUMNS: Record<string, string[]> = {
  customers: ["name", "mobile"],
  orders: [
    "customerName", "customerMobile", "eventType", "venueAddress",
    "cakeShape", "cakeWeight", "cakeFlavor", "preference", "layers",
    "cakeInscription", "referenceImage", "specialInstructions",
    "paymentStatus", "paymentHistory", "profitDifficulties", "profitCostGoing"
  ],
  inventory: ["name", "category", "supplier", "unit"],
  recipes: ["name", "category", "yieldUnit", "ingredients", "imageUrl", "imageBase64"],
  checklist: ["text", "completedDates"],
  customEvents: ["title", "notes"],
  dispatchedNotifications: ["customerName", "customerMobile", "cakeSpec", "messageText"],
  scheduledAlerts: ["customerName", "customerMobile", "notes"],
  bakeryProfile: ["bakeryName", "email", "phone", "address", "role", "currency", "dateFormat"],
  categories: ["name"]
};

const TABLE_COLUMNS: Record<string, string[]> = {
  customers: ["id", "name", "mobile", "type", "totalOrders", "memberSince", "updatedAt", "localChange", "isDeleted"],
  orders: [
    "id", "customerId", "customerName", "customerMobile", "eventType", "eventDate",
    "deliveryDate", "deliveryTime", "venueAddress", "cakeShape", "cakeWeight", "cakeFlavor",
    "preference", "layers", "cakeInscription", "referenceImage", "specialInstructions",
    "basePrice", "decorationCharge", "deliveryFee", "totalAmount", "status", "paymentStatus",
    "paidAmount", "paymentHistory", "profitAmount", "profitDifficulties", "profitCostGoing",
    "createdAt", "updatedAt", "localChange", "isDeleted"
  ],
  inventory: ["id", "name", "category", "quantity", "unit", "minStockLevel", "supplier", "costPrice", "updatedAt", "localChange", "isDeleted"],
  recipes: ["id", "name", "category", "stdYield", "yieldUnit", "ingredients", "imageUrl", "imageBase64", "updatedAt", "localChange", "isDeleted"],
  checklist: ["id", "text", "checked", "date", "completedDates", "updatedAt", "localChange", "isDeleted"],
  customEvents: ["id", "title", "date", "type", "notes", "createdAt", "localChange", "isDeleted"],
  dispatchedNotifications: ["id", "customerName", "customerMobile", "cakeSpec", "messageText", "dispatchedAt", "status", "localChange", "isDeleted"],
  scheduledAlerts: ["id", "customerName", "customerMobile", "alertDate", "notes", "createdAt", "type", "localChange", "isDeleted"],
  bakeryProfile: ["id", "bakeryName", "email", "phone", "address", "role", "currency", "dateFormat", "updatedAt", "localChange", "isDeleted"],
  categories: ["id", "name", "type", "updatedAt", "localChange", "isDeleted"],
  preferences: ["key", "value"]
};

// Key derivation from logged-in user credentials
function deriveKey(email: string, token: string): string {
  const emailClean = email.toLowerCase().trim();
  const tokenClean = token.trim();
  return CryptoJS.SHA256(emailClean + "|" + tokenClean).toString();
}

function encryptValue(val: any, key: string): string {
  if (val === undefined || val === null) return "";
  const strVal = typeof val === "object" ? JSON.stringify(val) : String(val).trim();
  if (strVal === "") return "";
  return "__ENC__" + CryptoJS.AES.encrypt(strVal, key).toString();
}

function decryptValue(val: any, key: string): any {
  if (!val) return val;
  if (typeof val === "string" && val.startsWith("__ENC__")) {
    const cipher = val.substring(7);
    
    // Check if the decrypted string is valid printable ASCII/UTF-8
    const isValidPlaintext = (str: string) => {
      if (str === "") return true;
      if (str.includes("\uFFFD")) return false;
      // Printable characters and standard whitespaces check
      const printable = /^[\x20-\x7E\s\u00A0-\uFFFD]*$/;
      return printable.test(str);
    };

    const parseDecrypted = (str: string) => {
      if (
        (str.startsWith("[") && str.endsWith("]")) ||
        (str.startsWith("{") && str.endsWith("}"))
      ) {
        try {
          return JSON.parse(str);
        } catch {
          return str;
        }
      }
      return str;
    };

    // 1. Try decrypting with user primary key
    try {
      const decrypted = CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8);
      if (decrypted !== "" && isValidPlaintext(decrypted)) {
        return parseDecrypted(decrypted);
      }
    } catch (e) {}

    // 2. Try legacy key fallback
    try {
      const legacyKey = "floura_kitchen_super_secret_db_key_2026";
      const decryptedLegacy = CryptoJS.AES.decrypt(cipher, legacyKey).toString(CryptoJS.enc.Utf8);
      if (isValidPlaintext(decryptedLegacy)) {
        return parseDecrypted(decryptedLegacy);
      }
    } catch (e) {}

    // If both failed, return empty string if the raw value represents an empty string cipher block
    // E.g., sample empty blocks we tested like "U2FsdGVkX19M5..." decrypt to ""
    return val;
  }
  return val;
}

function encryptRow(tableName: string, row: any): any {
  if (!userDbKey) return row;
  const sensitive = SENSITIVE_COLUMNS[tableName];
  if (!sensitive) return row;

  const newRow = { ...row };
  for (const col of sensitive) {
    if (newRow[col] !== undefined && newRow[col] !== null) {
      if (typeof newRow[col] === "string" && newRow[col].startsWith("__ENC__")) {
        continue;
      }
      newRow[col] = encryptValue(newRow[col], userDbKey);
    }
  }
  return newRow;
}

function decryptRow(tableName: string, row: any): any {
  if (!userDbKey) return row;
  const sensitive = SENSITIVE_COLUMNS[tableName];
  if (!sensitive) return row;

  const newRow = { ...row };
  for (const col of sensitive) {
    if (newRow[col] !== undefined && newRow[col] !== null) {
      newRow[col] = decryptValue(newRow[col], userDbKey);
    }
  }
  return newRow;
}

function cleanRow(tableName: string, row: any): any {
  if (tableName === "preferences") {
    return {
      key: row.key,
      value: typeof row.value === "object" ? JSON.stringify(row.value) : String(row.value)
    };
  }

  const allowed = TABLE_COLUMNS[tableName];
  if (!allowed) return row;
  
  const cleaned: any = {};
  for (const col of allowed) {
    if (row[col] !== undefined) {
      let val = row[col];
      // Convert boolean to numeric for sqlite compatibility
      if (typeof val === "boolean") {
        val = val ? 1 : 0;
      }
      cleaned[col] = val;
    }
  }
  return cleaned;
}

function cleanReadRow(tableName: string, row: any): any {
  if (!row) return row;
  
  if (tableName === "preferences") {
    let parsedVal = row.value;
    try {
      parsedVal = JSON.parse(row.value);
    } catch {}
    return {
      key: row.key,
      value: parsedVal
    };
  }

  const newRow = { ...row };
  
  // Convert checklist checked field back to boolean
  if (tableName === "checklist" && newRow.checked !== undefined) {
    newRow.checked = !!newRow.checked;
  }
  return newRow;
}

function createTables() {
  db.transaction(() => {
    // 1. Customers
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT,
        mobile TEXT,
        type TEXT,
        totalOrders INTEGER,
        memberSince TEXT,
        updatedAt TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_customers_updatedAt ON customers(updatedAt);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_customers_localChange ON customers(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_customers_isDeleted ON customers(isDeleted);");

    // 2. Orders
    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customerId TEXT,
        customerName TEXT,
        customerMobile TEXT,
        eventType TEXT,
        eventDate TEXT,
        deliveryDate TEXT,
        deliveryTime TEXT,
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
        status TEXT,
        paymentStatus TEXT,
        paidAmount REAL,
        paymentHistory TEXT,
        profitAmount REAL,
        profitDifficulties TEXT,
        profitCostGoing TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders(customerId);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_eventDate ON orders(eventDate);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_deliveryDate ON orders(deliveryDate);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_updatedAt ON orders(updatedAt);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_localChange ON orders(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_isDeleted ON orders(isDeleted);");

    // 3. Inventory
    db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        quantity REAL,
        unit TEXT,
        minStockLevel REAL,
        supplier TEXT,
        costPrice REAL,
        updatedAt TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_inventory_updatedAt ON inventory(updatedAt);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_inventory_localChange ON inventory(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_inventory_isDeleted ON inventory(isDeleted);");

    // 4. Recipes
    db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        stdYield REAL,
        yieldUnit TEXT,
        ingredients TEXT,
        imageUrl TEXT,
        imageBase64 TEXT,
        updatedAt TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_recipes_updatedAt ON recipes(updatedAt);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_recipes_localChange ON recipes(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_recipes_isDeleted ON recipes(isDeleted);");

    // 5. Checklist
    db.exec(`
      CREATE TABLE IF NOT EXISTS checklist (
        id TEXT PRIMARY KEY,
        text TEXT,
        checked INTEGER DEFAULT 0,
        date TEXT,
        completedDates TEXT,
        updatedAt TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_checklist_updatedAt ON checklist(updatedAt);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_checklist_localChange ON checklist(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_checklist_isDeleted ON checklist(isDeleted);");

    // 6. CustomEvents
    db.exec(`
      CREATE TABLE IF NOT EXISTS customEvents (
        id TEXT PRIMARY KEY,
        title TEXT,
        date TEXT,
        type TEXT,
        notes TEXT,
        createdAt TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_customEvents_createdAt ON customEvents(createdAt);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_customEvents_localChange ON customEvents(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_customEvents_isDeleted ON customEvents(isDeleted);");

    // 7. DispatchedNotifications
    db.exec(`
      CREATE TABLE IF NOT EXISTS dispatchedNotifications (
        id TEXT PRIMARY KEY,
        customerName TEXT,
        customerMobile TEXT,
        cakeSpec TEXT,
        messageText TEXT,
        dispatchedAt TEXT,
        status TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_dispatchedNotifications_localChange ON dispatchedNotifications(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_dispatchedNotifications_isDeleted ON dispatchedNotifications(isDeleted);");

    // 8. ScheduledAlerts
    db.exec(`
      CREATE TABLE IF NOT EXISTS scheduledAlerts (
        id TEXT PRIMARY KEY,
        customerName TEXT,
        customerMobile TEXT,
        alertDate TEXT,
        notes TEXT,
        createdAt TEXT,
        type TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_scheduledAlerts_createdAt ON scheduledAlerts(createdAt);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_scheduledAlerts_localChange ON scheduledAlerts(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_scheduledAlerts_isDeleted ON scheduledAlerts(isDeleted);");

    // 9. BakeryProfile
    db.exec(`
      CREATE TABLE IF NOT EXISTS bakeryProfile (
        id TEXT PRIMARY KEY,
        bakeryName TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        role TEXT,
        currency TEXT,
        dateFormat TEXT,
        updatedAt TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_bakeryProfile_updatedAt ON bakeryProfile(updatedAt);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_bakeryProfile_localChange ON bakeryProfile(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_bakeryProfile_isDeleted ON bakeryProfile(isDeleted);");

    // 10. Categories
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        updatedAt TEXT,
        localChange INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_categories_updatedAt ON categories(updatedAt);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_categories_localChange ON categories(localChange);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_categories_isDeleted ON categories(isDeleted);");

    // 11. Preferences
    db.exec(`
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  });
}

async function bootDb() {
  try {
    sqlite3 = await (sqlite3InitModule as any)({
      locateFile: (file: string) => {
        if (file.endsWith(".wasm")) {
          return "/sqlite3.wasm";
        }
        return file;
      }
    });

    if (sqlite3.opfs) {
      try {
        db = new sqlite3.oo1.OpfsDb("/patisserie.db");
        console.log("Opened standard OPFS database: /patisserie.db");
      } catch (err: any) {
        console.error("Locking error opening standard OPFS DB:", err);
        self.postMessage({ type: "DB_LOCKED", error: err.message || "Database is locked" });
        return;
      }
    } else if (sqlite3.installOpfsSAHPoolVfs) {
      try {
        console.log("Standard OPFS is unavailable. Attempting opfs-sahpool fallback...");
        const poolUtil = await sqlite3.installOpfsSAHPoolVfs({
          directory: "/databases",
          name: "opfs-sahpool"
        });
        db = new poolUtil.OpfsSAHPoolDb("/databases/patisserie.db");
        console.log("Opened opfs-sahpool database: /databases/patisserie.db");
      } catch (err: any) {
        console.error("Failed to initialize opfs-sahpool database:", err);
      }
    }

    if (!db) {
      console.warn("OPFS VFS is unavailable, falling back to temporary in-memory database.");
      db = new sqlite3.oo1.DB();
    }

    createTables();
    
    // Auto-load active key if user is already saved in preferences
    try {
      const userRow: any[] = [];
      db.exec({
        sql: "SELECT value FROM preferences WHERE key = 'patisserie_user' LIMIT 1",
        rowMode: "object",
        callback: (row: any) => userRow.push(row)
      });
      if (userRow.length > 0) {
        const userData = JSON.parse(userRow[0].value);
        if (userData && userData.email && userData.token) {
          userDbKey = deriveKey(userData.email, userData.token);
          console.log("Worker automatically derived database key from saved preference");
        }
      }
    } catch (e) {
      console.warn("Could not auto-derive key on startup:", e);
    }

    dbReady = true;
    self.postMessage({ type: "DB_READY" });
  } catch (err: any) {
    console.error("Failed to load SQLite Wasm:", err);
    self.postMessage({ type: "DB_ERROR", error: err.message || "Init failed" });
  }
}

// Start booting immediately
bootDb();

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;
  
  if (type === "SET_KEY") {
    try {
      const { email, token } = payload;
      if (email && token) {
        userDbKey = deriveKey(email, token);
        self.postMessage({ id, type, result: { success: true } });
      } else {
        userDbKey = null;
        self.postMessage({ id, type, result: { success: true, message: "Key cleared" } });
      }
    } catch (err: any) {
      self.postMessage({ id, type, error: err.message });
    }
    return;
  }

  if (!dbReady || !db) {
    self.postMessage({ id, type, error: "Database not initialized yet" });
    return;
  }

  try {
    switch (type) {
      case "GET": {
        const { table, key } = payload;
        const result: any[] = [];
        const pkName = table === "preferences" ? "key" : "id";
        
        db.exec({
          sql: `SELECT * FROM ${table} WHERE ${pkName} = ? LIMIT 1`,
          bind: [key],
          rowMode: "object",
          callback: (row: any) => result.push(row)
        });

        if (result.length > 0) {
          const decrypted = decryptRow(table, result[0]);
          const cleaned = cleanReadRow(table, decrypted);
          self.postMessage({ id, type, result: cleaned });
        } else {
          self.postMessage({ id, type, result: undefined });
        }
        break;
      }

      case "PUT": {
        const { table, row } = payload;
        const cleaned = cleanRow(table, row);
        const encrypted = encryptRow(table, cleaned);
        
        const keys = Object.keys(encrypted);
        const placeholders = keys.map(() => "?").join(", ");
        const columns = keys.join(", ");
        const sql = `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})`;
        const params = keys.map(k => encrypted[k]);

        db.exec({
          sql,
          bind: params
        });

        self.postMessage({ id, type, result: { success: true } });
        break;
      }

      case "DELETE": {
        const { table, key } = payload;
        const pkName = table === "preferences" ? "key" : "id";
        db.exec({
          sql: `DELETE FROM ${table} WHERE ${pkName} = ?`,
          bind: [key]
        });
        self.postMessage({ id, type, result: { success: true } });
        break;
      }

      case "CLEAR": {
        const { table } = payload;
        db.exec({
          sql: `DELETE FROM ${table}`
        });
        self.postMessage({ id, type, result: { success: true } });
        break;
      }

      case "COUNT": {
        const { table } = payload;
        const result: any[] = [];
        db.exec({
          sql: `SELECT COUNT(*) as count FROM ${table}`,
          rowMode: "object",
          callback: (row: any) => result.push(row)
        });
        self.postMessage({ id, type, result: result[0]?.count || 0 });
        break;
      }

      case "QUERY": {
        const { sql, params, table } = payload;
        const result: any[] = [];
        db.exec({
          sql,
          bind: params || [],
          rowMode: "object",
          callback: (row: any) => result.push(row)
        });

        const decryptedList = result.map(row => {
          const decrypted = decryptRow(table, row);
          return cleanReadRow(table, decrypted);
        });

        self.postMessage({ id, type, result: decryptedList });
        break;
      }

      default:
        self.postMessage({ id, type, error: `Unknown request type: ${type}` });
    }
  } catch (err: any) {
    console.error(`Error handling ${type}:`, err);
    self.postMessage({ id, type, error: err.message });
  }
};
