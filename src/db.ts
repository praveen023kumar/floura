import { Customer, Order, InventoryItem, Recipe, ChecklistItem, CustomEvent, DispatchedNotification, CustomScheduledAlert, BakeryProfile, Category } from "./types";
import CryptoJS from "crypto-js";

function checkDatabaseExists(dbName: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(false);
      return;
    }
    if (indexedDB.databases) {
      indexedDB.databases().then((dbs) => {
        resolve(dbs.some((db) => db.name === dbName));
      }).catch(() => {
        resolve(true); // Fallback to try opening
      });
    } else {
      resolve(true); // Fallback
    }
  });
}

function getIndexedDBData(dbName: string, storeNames: string[]): Promise<Record<string, any[]>> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      resolve({});
      return;
    }
    const request = indexedDB.open(dbName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const result: Record<string, any[]> = {};
      const storeList = Array.from(db.objectStoreNames).filter((name) => storeNames.includes(name));

      if (storeList.length === 0) {
        db.close();
        resolve(result);
        return;
      }

      const tx = db.transaction(storeList, "readonly");
      let completedStores = 0;

      for (const storeName of storeList) {
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          result[storeName] = req.result;
          completedStores++;
          if (completedStores === storeList.length) {
            db.close();
            resolve(result);
          }
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      }
    };
  });
}

const SECRET_KEY = "floura_kitchen_super_secret_db_key_2026";

// Decrypt Dexie records encrypted with old hardcoded key during migration
export function decryptOldData(ciphertext: string): any {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

function normalizeOrderStatus(status: string): string {
  if (!status) return "Pending";
  const lower = status.trim().toLowerCase();
  if (lower === "pending") return "Pending";
  if (lower === "ordered ingredients" || lower === "ingredients ordered") return "Ordered Ingredients";
  if (lower === "in progress" || lower === "inprogress" || lower === "processing") return "Processing";
  if (lower === "decorating") return "Decorating";
  if (lower === "ready for pickup" || lower === "ready for pick up" || lower === "readyforpickup") return "Ready for Pickup";
  if (lower === "completed") return "Completed";
  if (lower === "cancelled" || lower === "canceled") return "Cancelled";
  return status;
}

let messageId = 0;
const pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
let dbReady = false;
const requestQueue: Array<{ fn: () => Promise<any>; resolve: (val: any) => void; reject: (err: any) => void }> = [];

// Web Worker instance
const worker = new Worker(new URL("./db-worker.ts", import.meta.url), { type: "module" });

// Clean up old worker on hot module replacement to release SQLite OPFS file lock
if ((import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    console.log("[DB] Terminating old database worker due to HMR...");
    worker.terminate();
  });
}

worker.onmessage = (e) => {
  const { id, type, result, error } = e.data;
  
  if (type === "DB_LOCKED" || type === "DB_ERROR") {
    const errMsg = error || (type === "DB_LOCKED" ? "Database is locked by another tab" : "Failed to initialize database");
    console.error(`SQLite database error: ${type} - ${errMsg}`);
    
    while (requestQueue.length > 0) {
      const { reject } = requestQueue.shift()!;
      reject(new Error(errMsg));
    }
    
    if (type === "DB_LOCKED" && typeof window !== "undefined") {
      window.dispatchEvent(new window.CustomEvent("db-locked"));
    }
    return;
  }
  
  if (type === "DB_READY") {
    console.log("SQLite WASM + OPFS Worker is ready. Running migration check...");
    
    const initDb = async () => {
      if (typeof window !== "undefined") {
        try {
          const savedUserStr = localStorage.getItem("patisserie_user");
          if (savedUserStr) {
            const userData = JSON.parse(savedUserStr);
            if (userData && userData.email && userData.token) {
              // Direct send to worker bypassing the dbReady check to avoid deadlock
              await new Promise((resolve, reject) => {
                const reqId = messageId++;
                pendingRequests.set(reqId, { resolve, reject });
                worker.postMessage({ id: reqId, type: "SET_KEY", payload: { email: userData.email, token: userData.token } });
              });
              console.log("[DB] Restored database encryption key successfully on startup.");
            }
          }
        } catch (e) {
          console.error("Failed to restore DB key from localStorage on startup:", e);
        }
      }

      dbReady = true;

      while (requestQueue.length > 0) {
        const { fn, resolve, reject } = requestQueue.shift()!;
        fn().then(resolve).catch(reject);
      }
      
      triggerMigration();
    };

    initDb().catch((err) => {
      console.error("Error during database initialization sequence:", err);
      // Fallback to prevent app freeze
      dbReady = true;
      while (requestQueue.length > 0) {
        const { fn, resolve, reject } = requestQueue.shift()!;
        fn().then(resolve).catch(reject);
      }
    });
    return;
  }
  
  if (pendingRequests.has(id)) {
    const { resolve, reject } = pendingRequests.get(id)!;
    pendingRequests.delete(id);
    if (error) reject(new Error(error));
    else resolve(result);
  }
};

export function sendToWorker(type: string, payload: any): Promise<any> {
  const execute = () => {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pendingRequests.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload });
    });
  };

  if (!dbReady) {
    return new Promise((resolve, reject) => {
      requestQueue.push({ fn: execute, resolve, reject });
    });
  }

  return execute();
}

export async function setDatabaseEncryptionKey(email: string, token: string) {
  await sendToWorker("SET_KEY", { email, token });
}

class SQLiteTable<T> {
  tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async get(key: string): Promise<T | undefined> {
    return sendToWorker("GET", { table: this.tableName, key });
  }

  async put(row: any): Promise<void> {
    if (this.tableName === "orders" && row.status) {
      row.status = normalizeOrderStatus(row.status);
    }
    return sendToWorker("PUT", { table: this.tableName, row });
  }

  async update(key: string, modifications: any): Promise<void> {
    const existing = await this.get(key);
    if (!existing) {
      throw new Error(`Record not found: ${key}`);
    }
    const updated = { ...existing, ...modifications };
    return this.put(updated);
  }

  async bulkPut(rows: any[]): Promise<void> {
    for (const row of rows) {
      await this.put(row);
    }
  }

  async delete(key: string): Promise<void> {
    return sendToWorker("DELETE", { table: this.tableName, key });
  }

  async clear(): Promise<void> {
    return sendToWorker("CLEAR", { table: this.tableName });
  }

  async count(): Promise<number> {
    return sendToWorker("COUNT", { table: this.tableName });
  }

  async toArray(): Promise<T[]> {
    return sendToWorker("QUERY", {
      sql: `SELECT * FROM ${this.tableName}`,
      params: [],
      table: this.tableName
    });
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    return sendToWorker("QUERY", {
      sql,
      params,
      table: this.tableName
    });
  }

  toCollection() {
    return {
      first: async (): Promise<T | undefined> => {
        const rows = await sendToWorker("QUERY", {
          sql: `SELECT * FROM ${this.tableName} LIMIT 1`,
          params: [],
          table: this.tableName
        });
        return rows[0];
      }
    };
  }

  where(field: string) {
    return {
      equals: (val: any) => {
        return {
          toArray: () => {
            return sendToWorker("QUERY", {
              sql: `SELECT * FROM ${this.tableName} WHERE ${field} = ?`,
              params: [val],
              table: this.tableName
            });
          }
        };
      }
    };
  }

  filter(predicate: (item: T) => boolean) {
    let limitCount: number | null = null;

    const builder = {
      limit: (n: number) => {
        limitCount = n;
        return builder;
      },
      toArray: async (): Promise<T[]> => {
        const predStr = predicate.toString();
        let sql = `SELECT * FROM ${this.tableName}`;
        const params: any[] = [];
        const conditions: string[] = [];

        // Map standard isDeleted checks
        if (predStr.includes("isDeleted !== 1") || predStr.includes("isDeleted != 1") || predStr.includes("isDeleted === 0")) {
          conditions.push("isDeleted = 0");
        }

        // Map standard Category type checks
        if (predStr.includes('type === "inventory"') || predStr.includes("type === 'inventory'")) {
          conditions.push("type = ?");
          params.push("inventory");
        } else if (predStr.includes('type === "recipe"') || predStr.includes("type === 'recipe'")) {
          conditions.push("type = ?");
          params.push("recipe");
        }

        // Map any direct status checks
        const statusMatch = predStr.match(/status\s*===\s*["']([^"']+)["']/);
        if (statusMatch) {
          conditions.push("status = ?");
          params.push(statusMatch[1]);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        if (limitCount !== null) {
          sql += ` LIMIT ${limitCount}`;
        }

        return sendToWorker("QUERY", {
          sql,
          params,
          table: this.tableName
        });
      },
      count: async (): Promise<number> => {
        const rows = await builder.toArray();
        return rows.filter(predicate).length;
      }
    };

    return builder;
  }
}

class SQLitePreferencesTable {
  async get(key: string): Promise<any> {
    return sendToWorker("GET", { table: "preferences", key });
  }

  async put(row: { key: string; value: any }): Promise<void> {
    return sendToWorker("PUT", { table: "preferences", row });
  }

  async delete(key: string): Promise<void> {
    return sendToWorker("DELETE", { table: "preferences", key });
  }
}

export const localDb = {
  customers: new SQLiteTable<Customer>("customers"),
  orders: new SQLiteTable<Order>("orders"),
  inventory: new SQLiteTable<InventoryItem>("inventory"),
  recipes: new SQLiteTable<Recipe>("recipes"),
  checklist: new SQLiteTable<ChecklistItem>("checklist"),
  customEvents: new SQLiteTable<CustomEvent>("customEvents"),
  dispatchedNotifications: new SQLiteTable<DispatchedNotification>("dispatchedNotifications"),
  scheduledAlerts: new SQLiteTable<CustomScheduledAlert>("scheduledAlerts"),
  bakeryProfile: new SQLiteTable<BakeryProfile>("bakeryProfile"),
  categories: new SQLiteTable<Category>("categories"),
  preferences: new SQLitePreferencesTable(),
  updated_tables: new SQLiteTable<any>("updated_tables"),

  async transaction(type: string, tables: any[], callback: () => Promise<void>) {
    await callback();
  },

  async delete(): Promise<void> {
    const tables = ["customers", "orders", "inventory", "recipes", "checklist", "customEvents", "dispatchedNotifications", "scheduledAlerts", "bakeryProfile", "categories", "preferences", "updated_tables"];
    for (const table of tables) {
      await sendToWorker("CLEAR", { table });
    }
  },

  async open(): Promise<void> {
    // SQLite worker database is opened automatically on startup
  }
};

export async function getPreference(key: string, defaultValue: any = null): Promise<any> {
  try {
    if (key === "patisserie_user" || key === "patisserie_last_synced_email") {
      if (typeof window !== "undefined") {
        const val = localStorage.getItem(key);
        return val !== null ? JSON.parse(val) : defaultValue;
      }
      return defaultValue;
    }
    const pref = await localDb.preferences.get(key);
    return pref ? pref.value : defaultValue;
  } catch (e) {
    console.error("Failed to get preference for key:", key, e);
    return defaultValue;
  }
}

export async function setPreference(key: string, value: any): Promise<void> {
  try {
    if (key === "patisserie_user" || key === "patisserie_last_synced_email") {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
      }
      if (key === "patisserie_user" && value && value.email && value.token) {
        await setDatabaseEncryptionKey(value.email, value.token);
      }
      return;
    }
    await localDb.preferences.put({ key, value });
  } catch (e) {
    console.error("Failed to set preference for key:", key, e);
  }
}

export async function removePreference(key: string): Promise<void> {
  try {
    if (key === "patisserie_user" || key === "patisserie_last_synced_email") {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
      if (key === "patisserie_user") {
        await sendToWorker("SET_KEY", { email: "", token: "" });
      }
      return;
    }
    await localDb.preferences.delete(key);
  } catch (e) {
    console.error("Failed to remove preference for key:", key, e);
  }
}

export async function seedLocalDbFromPayload(payload: {
  customers: Customer[];
  orders: Order[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  checklist: ChecklistItem[];
  customEvents: CustomEvent[];
  dispatchedNotifications: DispatchedNotification[];
  scheduledAlerts: CustomScheduledAlert[];
  bakeryProfile?: BakeryProfile[];
  categories?: Category[];
}) {
  const tables = [
    { name: "customers", list: payload.customers, dateField: "updatedAt" },
    { name: "orders", list: payload.orders, dateField: "updatedAt" },
    { name: "inventory", list: payload.inventory, dateField: "updatedAt" },
    { name: "recipes", list: payload.recipes, dateField: "updatedAt" },
    { name: "checklist", list: payload.checklist, dateField: "updatedAt" },
    { name: "customEvents", list: payload.customEvents, dateField: "createdAt" },
    { name: "dispatchedNotifications", list: payload.dispatchedNotifications, dateField: "dispatchedAt" },
    { name: "scheduledAlerts", list: payload.scheduledAlerts, dateField: "createdAt" },
    { name: "bakeryProfile", list: payload.bakeryProfile || [], dateField: "updatedAt" },
    { name: "categories", list: payload.categories || [], dateField: "updatedAt" }
  ];

  for (const table of tables) {
    const sqliteTable = (localDb as any)[table.name];
    if (!sqliteTable) continue;
    
    for (const item of table.list) {
      const existing = await sqliteTable.get(item.id);
      const itemDate = new Date(item[table.dateField] || 0);
      const existingDate = existing ? new Date(existing[table.dateField] || 0) : new Date(0);

      if (!existing || !existing.localChange || itemDate > existingDate) {
        await sqliteTable.put({ ...item, localChange: 0 });
      }
    }
  }
}

function decryptAllEncryptedFieldsInObject(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (typeof val === "string" && val.startsWith("__ENC__")) {
      const cipher = val.substring(7);
      try {
        const decrypted = CryptoJS.AES.decrypt(cipher, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        if (
          (decrypted.startsWith("[") && decrypted.endsWith("]")) ||
          (decrypted.startsWith("{") && decrypted.endsWith("}"))
        ) {
          try {
            result[key] = JSON.parse(decrypted);
          } catch {
            result[key] = decrypted;
          }
        } else {
          result[key] = decrypted;
        }
      } catch (e) {
        console.error("Failed to decrypt legacy column field during migration:", key, e);
      }
    } else if (typeof val === "object" && val !== null) {
      result[key] = decryptAllEncryptedFieldsInObject(val);
    }
  }
  return result;
}

// One-time IndexedDB to SQLite WASM migration trigger using native IndexedDB API
async function triggerMigration() {
  try {
    const isMigrated = await getPreference("sqlite_migrated");
    if (isMigrated === true) {
      console.log("Migration to SQLite was already completed.");
      return;
    }

    const dexieDbName = "PatisserieDatabaseV1";
    const exists = await checkDatabaseExists(dexieDbName);
    if (!exists) {
      console.log("No Dexie database found to migrate. Marking migration as complete.");
      await setPreference("sqlite_migrated", true);
      return;
    }

    console.log("Dexie database found. Starting data migration to SQLite...");
    
    const tablesToMigrate = [
      "customers", "orders", "inventory", "recipes", "checklist",
      "customEvents", "dispatchedNotifications", "scheduledAlerts",
      "bakeryProfile", "categories", "preferences"
    ];

    let allData: Record<string, any[]> = {};
    try {
      allData = await getIndexedDBData(dexieDbName, tablesToMigrate);
    } catch (e) {
      console.error("Failed to read IndexedDB database:", e);
      await setPreference("sqlite_migrated", true);
      return;
    }

    // 1. Migrate preferences first to get user session data
    const prefRows = allData["preferences"] || [];
    let patisserieUser: any = null;
    
    for (const row of prefRows) {
      let decryptedVal = row.value;
      if (row.encryptedData) {
        try {
          const dec = decryptOldData(row.encryptedData);
          decryptedVal = dec.value;
        } catch (e) {
          console.error("Failed to decrypt preference row:", row.key, e);
        }
      }
      if (row.key === "patisserie_user" || row.key === "patisserie_last_synced_email") {
        if (typeof window !== "undefined") {
          localStorage.setItem(row.key, JSON.stringify(decryptedVal));
        }
        if (row.key === "patisserie_user") {
          patisserieUser = decryptedVal;
        }
      } else {
        await localDb.preferences.put({ key: row.key, value: decryptedVal });
      }
    }

    // Initialize worker key if user exists
    if (patisserieUser && patisserieUser.email && patisserieUser.token) {
      await setDatabaseEncryptionKey(patisserieUser.email, patisserieUser.token);
      console.log("Migration initialized worker encryption key");
    }

    // 2. Migrate standard tables
    for (const tableName of tablesToMigrate) {
      if (tableName === "preferences") continue;
      const rows = allData[tableName] || [];
      const destTable = (localDb as any)[tableName];
      if (!destTable) continue;

      for (const row of rows) {
        let decryptedRow = { ...row };
        if (row.encryptedData) {
          try {
            const decrypted = decryptOldData(row.encryptedData);
            decryptedRow = {
              ...row,
              ...decrypted
            };
            delete decryptedRow.encryptedData;
          } catch (e) {
            console.error(`Failed to decrypt record ${row.id} in ${tableName} during migration:`, e);
          }
        }
        
        // Decrypt individual legacy encrypted columns recursively
        decryptedRow = decryptAllEncryptedFieldsInObject(decryptedRow);
        
        await destTable.put(decryptedRow);
      }
    }

    console.log("Data migration successfully completed. Deleting Dexie database...");
    
    await new Promise<void>((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        resolve();
        return;
      }
      const req = indexedDB.deleteDatabase(dexieDbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    await setPreference("sqlite_migrated", true);
    console.log("Dexie database deleted successfully. SQLite is now fully active.");
    
    // Notify application views to reload
    window.dispatchEvent(new Event("db-update"));
  } catch (err) {
    console.error("Critical error during database migration to SQLite:", err);
  }
}

// Global debug bridge to query SQLite directly from the browser dev console
if (typeof window !== "undefined") {
  (window as any).localDbQuery = (sql: string, params: any[] = [], table: string = "") => {
    return sendToWorker("QUERY", { sql, params, table });
  };
}
