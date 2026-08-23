// File Path: /src/db.ts
import Dexie, { type Table } from "dexie";
import { Customer, Order, InventoryItem, Recipe, ChecklistItem, CustomEvent, DispatchedNotification, CustomScheduledAlert, BakeryProfile, Category } from "./types";
import CryptoJS from "crypto-js";

const SECRET_KEY = "floura_kitchen_super_secret_db_key_2026";

export function encryptData(data: any): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}

export function decryptData(ciphertext: string): any {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

function normalizeOrderStatus(status: string): string {
  if (!status) return "Pending";
  const lower = status.trim().toLowerCase();
  if (lower === "pending") return "Pending";
  if (lower === "ordered ingredients" || lower === "ingredients ordered") return "Ordered Ingredients";
  if (lower === "in progress" || lower === "inprogress") return "In Progress";
  if (lower === "decorating") return "Decorating";
  if (lower === "ready for pickup" || lower === "ready for pick up" || lower === "readyforpickup") return "Ready for Pickup";
  if (lower === "completed") return "Completed";
  if (lower === "cancelled" || lower === "canceled") return "Cancelled";
  return status;
}

function setupTableEncryption(table: any) {
  const primKeyName = table.name === "preferences" ? "key" : "id";

  table.hook("creating", (primKey: any, obj: any) => {
    if (!obj) return;
    
    // Check if it's already encrypted
    if (obj.encryptedData && Object.keys(obj).length <= 4) {
      return;
    }
    
    const localChange = obj.localChange !== undefined ? obj.localChange : 0;
    const isDeleted = obj.isDeleted !== undefined ? obj.isDeleted : 0;
    const updatedAt = obj.updatedAt;
    const createdAt = obj.createdAt;
    
    const rest = { ...obj };
    delete rest[primKeyName];
    delete rest.localChange;
    delete rest.isDeleted;
    delete rest.updatedAt;
    delete rest.createdAt;
    
    if (table.name === "orders" && rest.status) {
      rest.status = normalizeOrderStatus(rest.status);
    }
    
    const encrypted = encryptData(rest);
    
    // Mutate the original object in-place for Dexie/IndexedDB to store
    for (const key of Object.keys(obj)) {
      if (key !== primKeyName && key !== "localChange" && key !== "isDeleted" && key !== "updatedAt" && key !== "createdAt") {
        delete obj[key];
      }
    }
    obj.encryptedData = encrypted;
    obj.localChange = localChange;
    obj.isDeleted = isDeleted;
    if (updatedAt !== undefined) obj.updatedAt = updatedAt;
    if (createdAt !== undefined) obj.createdAt = createdAt;
  });

  table.hook("updating", (mods: any, primKey: any, obj: any) => {
    if (!obj) return mods;
    // If mods has encryptedData already, we don't need to do anything
    if (mods.encryptedData && Object.keys(mods).length <= 3) {
      return mods;
    }
    
    const decryptedObj = obj.encryptedData ? decryptData(obj.encryptedData) : {};
    const mergedFull = { ...obj, ...decryptedObj, ...mods };
    
    const localChange = mergedFull.localChange !== undefined ? mergedFull.localChange : 0;
    const isDeleted = mergedFull.isDeleted !== undefined ? mergedFull.isDeleted : 0;
    const updatedAt = mergedFull.updatedAt;
    const createdAt = mergedFull.createdAt;
    
    const rest = { ...mergedFull };
    delete rest[primKeyName];
    delete rest.localChange;
    delete rest.isDeleted;
    delete rest.encryptedData;
    delete rest.updatedAt;
    delete rest.createdAt;
    
    if (table.name === "orders" && rest.status) {
      rest.status = normalizeOrderStatus(rest.status);
    }
    
    const encrypted = encryptData(rest);

    const updatedMods: any = {
      encryptedData: encrypted,
      localChange,
      isDeleted
    };
    if (updatedAt !== undefined) updatedMods.updatedAt = updatedAt;
    if (createdAt !== undefined) updatedMods.createdAt = createdAt;

    // Set other properties to undefined so they are deleted from IndexedDB
    for (const key of Object.keys(mods)) {
      if (key !== primKeyName && key !== "localChange" && key !== "isDeleted" && key !== "encryptedData" && key !== "updatedAt" && key !== "createdAt") {
        updatedMods[key] = undefined;
      }
    }
    
    return updatedMods;
  });

  table.hook("reading", (obj: any) => {
    if (!obj || !obj.encryptedData) return obj;
    try {
      const decrypted = decryptData(obj.encryptedData);
      const result: any = {
        localChange: obj.localChange !== undefined ? obj.localChange : 0,
        isDeleted: obj.isDeleted !== undefined ? obj.isDeleted : 0,
        updatedAt: obj.updatedAt,
        createdAt: obj.createdAt,
        ...decrypted
      };
      result[primKeyName] = obj[primKeyName];
      
      if (table.name === "orders" && result.status) {
        result.status = normalizeOrderStatus(result.status);
      }
      
      return result;
    } catch (err) {
      console.error("Transparent decryption failed on database read:", err);
      return obj;
    }
  });
}

export class PatisserieDatabase extends Dexie {
  customers!: Table<Customer & { localChange?: number }>;
  orders!: Table<Order & { localChange?: number }>;
  inventory!: Table<InventoryItem & { localChange?: number }>;
  recipes!: Table<Recipe & { localChange?: number }>;
  checklist!: Table<ChecklistItem & { localChange?: number }>;
  customEvents!: Table<CustomEvent & { localChange?: number }>;
  dispatchedNotifications!: Table<DispatchedNotification & { localChange?: number }>;
  scheduledAlerts!: Table<CustomScheduledAlert & { localChange?: number }>;
  bakeryProfile!: Table<BakeryProfile & { localChange?: number }>;
  categories!: Table<Category & { localChange?: number }>;
  preferences!: Table<{ key: string; value: any }>;

  constructor() {
    super("PatisserieDatabaseV1");
    this.version(1).stores({
      customers: "id, updatedAt, localChange, isDeleted",
      orders: "id, createdAt, updatedAt, localChange, isDeleted",
      inventory: "id, updatedAt, localChange, isDeleted",
      recipes: "id, updatedAt, localChange, isDeleted",
      checklist: "id, updatedAt, localChange, isDeleted",
      customEvents: "id, createdAt, localChange, isDeleted",
      dispatchedNotifications: "id, localChange, isDeleted",
      scheduledAlerts: "id, createdAt, localChange, isDeleted",
      bakeryProfile: "id, updatedAt, localChange, isDeleted",
      categories: "id, updatedAt, localChange, isDeleted",
      preferences: "key"
    });

    const tablesToEncrypt = ["customers", "orders", "inventory", "recipes", "checklist", "customEvents", "dispatchedNotifications", "scheduledAlerts", "bakeryProfile", "categories", "preferences"];
    for (const tableName of tablesToEncrypt) {
      const table = this.table(tableName);
      setupTableEncryption(table);
    }
  }
}

export const localDb = new PatisserieDatabase();

export async function getPreference(key: string, defaultValue: any = null): Promise<any> {
  try {
    const pref = await localDb.preferences.get(key);
    return pref ? pref.value : defaultValue;
  } catch (e) {
    console.error("Failed to get preference for key:", key, e);
    return defaultValue;
  }
}

export async function setPreference(key: string, value: any): Promise<void> {
  try {
    await localDb.preferences.put({ key, value });
  } catch (e) {
    console.error("Failed to set preference for key:", key, e);
  }
}

export async function removePreference(key: string): Promise<void> {
  try {
    await localDb.preferences.delete(key);
  } catch (e) {
    console.error("Failed to remove preference for key:", key, e);
  }
}

// Utility helper to seed local indexedDB from server payload
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
  await localDb.transaction("rw", [
    localDb.customers,
    localDb.orders,
    localDb.inventory,
    localDb.recipes,
    localDb.checklist,
    localDb.customEvents,
    localDb.dispatchedNotifications,
    localDb.scheduledAlerts,
    localDb.bakeryProfile,
    localDb.categories
  ], async () => {


    // We only update if there are no localChanges pending, or we resolve server wins
    for (const c of payload.customers) {
      const existing = await localDb.customers.get(c.id);
      if (!existing || !existing.localChange || new Date(c.updatedAt) > new Date(existing.updatedAt)) {
        await localDb.customers.put({ ...c, localChange: 0 });
      }
    }

    for (const o of payload.orders) {
      const existing = await localDb.orders.get(o.id);
      if (!existing || !existing.localChange || new Date(o.updatedAt) > new Date(existing.updatedAt)) {
        await localDb.orders.put({ ...o, localChange: 0 });
      }
    }

    for (const item of payload.inventory) {
      const existing = await localDb.inventory.get(item.id);
      if (!existing || !existing.localChange || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
        await localDb.inventory.put({ ...item, localChange: 0 });
      }
    }

    for (const r of payload.recipes) {
      const existing = await localDb.recipes.get(r.id);
      if (!existing || !existing.localChange || new Date(r.updatedAt) > new Date(existing.updatedAt)) {
        await localDb.recipes.put({ ...r, localChange: 0 });
      }
    }

    for (const chk of payload.checklist) {
      const existing = await localDb.checklist.get(chk.id);
      if (!existing || !existing.localChange || new Date(chk.updatedAt) > new Date(existing.updatedAt)) {
        await localDb.checklist.put({ ...chk, localChange: 0 });
      }
    }

    for (const ev of payload.customEvents) {
      const existing = await localDb.customEvents.get(ev.id);
      if (!existing || !existing.localChange || new Date(ev.createdAt) > new Date(existing.createdAt || 0)) {
        await localDb.customEvents.put({ ...ev, localChange: 0 });
      }
    }

    for (const dn of payload.dispatchedNotifications) {
      const existing = await localDb.dispatchedNotifications.get(dn.id);
      if (!existing || !existing.localChange || new Date(dn.dispatchedAt) > new Date(existing.dispatchedAt || 0)) {
        await localDb.dispatchedNotifications.put({ ...dn, localChange: 0 });
      }
    }

    for (const sa of payload.scheduledAlerts) {
      const existing = await localDb.scheduledAlerts.get(sa.id);
      if (!existing || !existing.localChange || new Date(sa.createdAt) > new Date(existing.createdAt || 0)) {
        await localDb.scheduledAlerts.put({ ...sa, localChange: 0 });
      }
    }

    if (payload.bakeryProfile) {
      for (const bp of payload.bakeryProfile) {
        const existing = await localDb.bakeryProfile.get(bp.id);
        if (!existing || !existing.localChange || new Date(bp.updatedAt) > new Date(existing.updatedAt || 0)) {
          await localDb.bakeryProfile.put({ ...bp, localChange: 0 });
        }
      }
    }

    if (payload.categories) {
      for (const cat of payload.categories) {
        const existing = await localDb.categories.get(cat.id);
        if (!existing || !existing.localChange || new Date(cat.updatedAt) > new Date(existing.updatedAt || 0)) {
          await localDb.categories.put({ ...cat, localChange: 0 });
        }
      }
    }
  });
}
