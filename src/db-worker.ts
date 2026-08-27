// File Path: /src/db-worker.ts
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import CryptoJS from "crypto-js";

let sqlite3: any = null;
let db: any = null;
let userDbKey: any = null;
let legacyUserDbKey: string | null = null;
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
    "createdAt", "updatedAt", "localChange", "isDeleted", "inventoryReduced"
  ],
  inventory: ["id", "name", "category", "quantity", "unit", "minStockLevel", "supplier", "costPrice", "updatedAt", "localChange", "isDeleted"],
  recipes: ["id", "name", "category", "stdYield", "yieldUnit", "ingredients", "imageUrl", "imageBase64", "updatedAt", "localChange", "isDeleted"],
  checklist: ["id", "text", "checked", "date", "completedDates", "updatedAt", "localChange", "isDeleted"],
  customEvents: ["id", "title", "date", "type", "notes", "createdAt", "localChange", "isDeleted"],
  dispatchedNotifications: ["id", "customerName", "customerMobile", "cakeSpec", "messageText", "dispatchedAt", "status", "localChange", "isDeleted"],
  scheduledAlerts: ["id", "customerName", "customerMobile", "alertDate", "notes", "createdAt", "type", "localChange", "isDeleted"],
  bakeryProfile: ["id", "bakeryName", "email", "phone", "address", "role", "currency", "dateFormat", "updatedAt", "localChange", "isDeleted"],
  categories: ["id", "name", "type", "updatedAt", "localChange", "isDeleted"],
  preferences: ["key", "value"],
  updated_tables: ["tableName", "hasChanges"]
};

const ALLOWED_TABLES = new Set(Object.keys(TABLE_COLUMNS));

function isValidTable(table: string): boolean {
  return ALLOWED_TABLES.has(table);
}

// Key derivation from logged-in user credentials using Web Crypto API PBKDF2
async function deriveKey(email: string, token: string): Promise<any> {
  const emailClean = email.toLowerCase().trim();
  const tokenClean = token.trim();
  
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(tokenClean);
  // Salt is the SHA-256 hash of the cleaned email for determinism
  const saltBytes = await self.crypto.subtle.digest("SHA-256", encoder.encode(emailClean));
  
  const baseKey = await self.crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  return self.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// Legacy key derivation using SHA256 of email + "|" + token for migration only
function deriveLegacyKey(email: string, token: string): string {
  const emailClean = email.toLowerCase().trim();
  const tokenClean = token.trim();
  return CryptoJS.SHA256(emailClean + "|" + tokenClean).toString();
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return self.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = self.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function encryptValue(val: any, key: any): Promise<string> {
  if (val === undefined || val === null) return "";
  const strVal = typeof val === "object" ? JSON.stringify(val) : String(val).trim();
  if (strVal === "") return "";
  
  if (!key) {
    throw new Error("Encryption key not available");
  }

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(strVal);
  
  const iv = self.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await self.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintextBytes
  );
  
  // Combine IV and encrypted buffer [iv (12) + ciphertext + tag (16)]
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  
  return "__GCM__" + arrayBufferToBase64(combined.buffer);
}

async function decryptValue(val: any, key: any, legacyKey: string | null): Promise<any> {
  if (!val) return val;
  
  if (typeof val === "string" && val.startsWith("__GCM__")) {
    if (!key) {
      throw new Error("Decryption key not available");
    }
    const rawBase64 = val.substring(7);
    let combinedBytes: Uint8Array;
    try {
      combinedBytes = new Uint8Array(base64ToArrayBuffer(rawBase64));
    } catch (e) {
      console.warn("Failed to decode base64 for encrypted value");
      return val;
    }
    
    if (combinedBytes.length < 12) {
      console.warn("Ciphertext too short to be valid AES-GCM");
      return val;
    }
    
    const iv = combinedBytes.slice(0, 12);
    const ciphertextBytes = combinedBytes.slice(12);
    
    try {
      const decryptedBuffer = await self.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertextBytes
      );
      const str = new TextDecoder().decode(decryptedBuffer);
      
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
    } catch (err) {
      console.error("AES-GCM Decryption failed (integrity/authentication failure)");
      throw new Error("Decryption failed: Integrity check failed");
    }
  }
  
  if (typeof val === "string" && val.startsWith("__ENC__")) {
    return decryptLegacyValue(val, legacyKey);
  }
  
  return val;
}

function decryptLegacyValue(val: string, legacyKey: string | null): any {
  const cipher = val.substring(7);
  
  const isValidPlaintext = (str: string) => {
    if (str === "") return true;
    if (str.includes("\uFFFD")) return false;
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

  // 1. Try decrypting with user legacy primary key derived from credentials
  if (legacyKey) {
    try {
      const decrypted = CryptoJS.AES.decrypt(cipher, legacyKey).toString(CryptoJS.enc.Utf8);
      if (decrypted !== "" && isValidPlaintext(decrypted)) {
        return parseDecrypted(decrypted);
      }
    } catch (e) {}
  }

  // 2. Try legacy fallback key
  try {
    const fallbackLegacyKey = "floura_kitchen_super_secret_db_key_2026";
    const decryptedLegacy = CryptoJS.AES.decrypt(cipher, fallbackLegacyKey).toString(CryptoJS.enc.Utf8);
    if (decryptedLegacy !== "" && isValidPlaintext(decryptedLegacy)) {
      return parseDecrypted(decryptedLegacy);
    }
  } catch (e) {}

  return val;
}

async function encryptRow(tableName: string, row: any): Promise<any> {
  if (!userDbKey) return row;
  const sensitive = SENSITIVE_COLUMNS[tableName];
  if (!sensitive) return row;

  const newRow = { ...row };
  for (const col of sensitive) {
    if (newRow[col] !== undefined && newRow[col] !== null) {
      if (typeof newRow[col] === "string" && (newRow[col].startsWith("__GCM__") || newRow[col].startsWith("__ENC__"))) {
        continue;
      }
      newRow[col] = await encryptValue(newRow[col], userDbKey);
    }
  }
  return newRow;
}

async function decryptRow(tableName: string, row: any): Promise<any> {
  if (!userDbKey) return row;
  const sensitive = SENSITIVE_COLUMNS[tableName];
  if (!sensitive) return row;

  const newRow = { ...row };
  for (const col of sensitive) {
    if (newRow[col] !== undefined && newRow[col] !== null) {
      newRow[col] = await decryptValue(newRow[col], userDbKey, legacyUserDbKey);
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
        isDeleted INTEGER DEFAULT 0,
        inventoryReduced INTEGER DEFAULT 0
      );
    `);
    try {
      db.exec("ALTER TABLE orders ADD COLUMN inventoryReduced INTEGER DEFAULT 0;");
    } catch (e) {
      // column already exists
    }
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

    // 12. Updated Tables Metadata
    db.exec(`
      CREATE TABLE IF NOT EXISTS updated_tables (
        tableName TEXT PRIMARY KEY,
        hasChanges INTEGER DEFAULT 0
      );
    `);

    const syncTables = [
      "customers",
      "orders",
      "inventory",
      "recipes",
      "checklist",
      "customEvents",
      "dispatchedNotifications",
      "scheduledAlerts",
      "bakeryProfile",
      "categories"
    ];

    for (const t of syncTables) {
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS t_${t}_sync_insert AFTER INSERT ON ${t}
        BEGIN
          INSERT OR REPLACE INTO updated_tables (tableName, hasChanges)
          VALUES ('${t}', EXISTS (SELECT 1 FROM ${t} WHERE localChange = 1));
        END;
      `);
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS t_${t}_sync_update AFTER UPDATE OF localChange ON ${t}
        BEGIN
          INSERT OR REPLACE INTO updated_tables (tableName, hasChanges)
          VALUES ('${t}', EXISTS (SELECT 1 FROM ${t} WHERE localChange = 1));
        END;
      `);
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS t_${t}_sync_delete AFTER DELETE ON ${t}
        BEGIN
          INSERT OR REPLACE INTO updated_tables (tableName, hasChanges)
          VALUES ('${t}', EXISTS (SELECT 1 FROM ${t} WHERE localChange = 1));
        END;
      `);

      // Initialize table state in updated_tables
      db.exec(`
        INSERT OR REPLACE INTO updated_tables (tableName, hasChanges)
        VALUES ('${t}', EXISTS (SELECT 1 FROM ${t} WHERE localChange = 1));
      `);
    }
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
        const isLockError = err.name === "NoModificationAllowedError" || 
                            (err.message && err.message.includes("Access Handles cannot be created"));
        if (isLockError) {
          self.postMessage({ type: "DB_LOCKED", error: "Database is locked by another tab" });
          return;
        }
      }
    }

    if (!db) {
      console.warn("OPFS VFS is unavailable, falling back to temporary in-memory database.");
      db = new sqlite3.oo1.DB();
    }

    createTables();

    dbReady = true;
    self.postMessage({ type: "DB_READY" });
  } catch (err: any) {
    console.error("Failed to load SQLite Wasm:", err);
    self.postMessage({ type: "DB_ERROR", error: err.message || "Init failed" });
  }
}

// Start booting immediately
bootDb();

function validateSqlQuery(sql: string, table: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith("SELECT")) {
    return false;
  }
  
  if (trimmed.includes(";")) {
    return false;
  }
  
  // Ensure the query references the specified table name
  const fromPattern = new RegExp(`\\bFROM\\s+\`?${table}\`?\\b`, "i");
  if (!fromPattern.test(sql)) {
    return false;
  }
  
  // Ban write or administrative SQL commands
  const bannedKeywords = [
    "INSERT", "UPDATE", "DELETE", "REPLACE", "DROP", "CREATE", 
    "ALTER", "TRUNCATE", "PRAGMA", "ATTACH", "DETACH", "UNION",
    "JOIN"
  ];
  for (const keyword of bannedKeywords) {
    const keywordPattern = new RegExp(`\\b${keyword}\\b`, "i");
    if (keywordPattern.test(sql)) {
      return false;
    }
  }
  
  return true;
}

async function migrateLegacyEncryptedData() {
  if (!db || !userDbKey) return;
  
  try {
    for (const [tableName, cols] of Object.entries(SENSITIVE_COLUMNS)) {
      if (!isValidTable(tableName)) continue;
      
      const rows: any[] = [];
      db.exec({
        sql: `SELECT * FROM ${tableName}`,
        rowMode: "object",
        callback: (row: any) => rows.push(row)
      });
      
      const rowsToUpdate: any[] = [];
      for (const row of rows) {
        let needsUpdate = false;
        const updatedRow = { ...row };
        
        for (const col of cols) {
          const val = row[col];
          if (typeof val === "string" && val.startsWith("__ENC__")) {
            const decrypted = decryptLegacyValue(val, legacyUserDbKey);
            if (decrypted !== val) {
              updatedRow[col] = await encryptValue(decrypted, userDbKey);
              needsUpdate = true;
            }
          }
        }
        
        if (needsUpdate) {
          rowsToUpdate.push(updatedRow);
        }
      }
      
      if (rowsToUpdate.length > 0) {
        db.transaction(() => {
          const pkName = tableName === "preferences" ? "key" : "id";
          for (const updatedRow of rowsToUpdate) {
            const keys = Object.keys(updatedRow);
            const setClause = keys.map(k => `${k} = ?`).join(", ");
            const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${pkName} = ?`;
            const params = keys.map(k => updatedRow[k]);
            params.push(updatedRow[pkName]);
            
            db.exec({
              sql,
              bind: params
            });
          }
        });
        console.log(`Migrated ${rowsToUpdate.length} legacy encrypted records in table: ${tableName}`);
      }
    }
  } catch (err) {
    console.error("Failed to run background legacy encryption migration:", err);
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;
  
  if (type === "SET_KEY") {
    try {
      const { email, token } = payload;
      if (email && token) {
        userDbKey = await deriveKey(email, token);
        legacyUserDbKey = deriveLegacyKey(email, token);
        self.postMessage({ id, type, result: { success: true } });
        
        // Execute background migration of old data to new AES-GCM format
        migrateLegacyEncryptedData().catch(err => {
          console.error("Background migration of legacy encrypted records failed:", err);
        });
      } else {
        userDbKey = null;
        legacyUserDbKey = null;
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
        if (!isValidTable(table)) {
          self.postMessage({ id, type, error: `Unauthorized table name: ${table}` });
          break;
        }
        
        const result: any[] = [];
        const pkName = table === "preferences" ? "key" : "id";
        
        const sql = `SELECT * FROM ${table} WHERE ${pkName} = ? LIMIT 1`;
        console.log(`[SQLite Worker] GET | SQL: ${sql} | Bind:`, [key]);
        db.exec({
          sql,
          bind: [key],
          rowMode: "object",
          callback: (row: any) => result.push(row)
        });

        if (result.length > 0) {
          const decrypted = await decryptRow(table, result[0]);
          const cleaned = cleanReadRow(table, decrypted);
          self.postMessage({ id, type, result: cleaned });
        } else {
          self.postMessage({ id, type, result: undefined });
        }
        break;
      }

      case "PUT": {
        const { table, row } = payload;
        if (!isValidTable(table)) {
          self.postMessage({ id, type, error: `Unauthorized table name: ${table}` });
          break;
        }
        
        const cleaned = cleanRow(table, row);
        const encrypted = await encryptRow(table, cleaned);
        
        const keys = Object.keys(encrypted);
        const placeholders = keys.map(() => "?").join(", ");
        const columns = keys.join(", ");
        const sql = `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})`;
        const params = keys.map(k => encrypted[k]);
        console.log(`[SQLite Worker] PUT | SQL: ${sql} | Bind:`, params);

        db.exec({
          sql,
          bind: params
        });

        self.postMessage({ id, type, result: { success: true } });
        break;
      }

      case "DELETE": {
        const { table, key } = payload;
        if (!isValidTable(table)) {
          self.postMessage({ id, type, error: `Unauthorized table name: ${table}` });
          break;
        }
        
        const pkName = table === "preferences" ? "key" : "id";
        const sql = `DELETE FROM ${table} WHERE ${pkName} = ?`;
        console.log(`[SQLite Worker] DELETE | SQL: ${sql} | Bind:`, [key]);
        db.exec({
          sql,
          bind: [key]
        });
        self.postMessage({ id, type, result: { success: true } });
        break;
      }

      case "CLEAR": {
        const { table } = payload;
        if (!isValidTable(table)) {
          self.postMessage({ id, type, error: `Unauthorized table name: ${table}` });
          break;
        }
        
        const sql = `DELETE FROM ${table}`;
        console.log(`[SQLite Worker] CLEAR | SQL: ${sql}`);
        db.transaction(() => {
          db.exec({
            sql
          });
          if (table !== "updated_tables" && table !== "preferences") {
            db.exec({
              sql: `INSERT OR REPLACE INTO updated_tables (tableName, hasChanges) VALUES (?, 0)`,
              bind: [table]
            });
          }
        });
        self.postMessage({ id, type, result: { success: true } });
        break;
      }

      case "COUNT": {
        const { table } = payload;
        if (!isValidTable(table)) {
          self.postMessage({ id, type, error: `Unauthorized table name: ${table}` });
          break;
        }
        
        const result: any[] = [];
        const sql = `SELECT COUNT(*) as count FROM ${table}`;
        console.log(`[SQLite Worker] COUNT | SQL: ${sql}`);
        db.exec({
          sql,
          rowMode: "object",
          callback: (row: any) => result.push(row)
        });
        self.postMessage({ id, type, result: result[0]?.count || 0 });
        break;
      }

      case "QUERY": {
        const { sql, params, table } = payload;
        if (!isValidTable(table)) {
          self.postMessage({ id, type, error: `Unauthorized table name: ${table}` });
          break;
        }
        
        if (!validateSqlQuery(sql, table)) {
          self.postMessage({ id, type, error: `SQL query validation failed for table ${table}` });
          break;
        }
        
        const result: any[] = [];
        console.log(`[SQLite Worker] QUERY | SQL: ${sql} | Bind:`, params || []);
        db.exec({
          sql,
          bind: params || [],
          rowMode: "object",
          callback: (row: any) => result.push(row)
        });

        const decryptedList = [];
        for (const row of result) {
          const decrypted = await decryptRow(table, row);
          decryptedList.push(cleanReadRow(table, decrypted));
        }

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
