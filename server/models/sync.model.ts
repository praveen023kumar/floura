import { getDb, runSql, querySqlAll } from "./db";
import CryptoJS from "crypto-js";

const SECRET_KEY = "floura_kitchen_super_secret_db_key_2026";

const KEYS_TO_ENCRYPT = [
  "name",
  "mobile",
  "customerName",
  "customerMobile",
  "eventType",
  "venueAddress",
  "cakeShape",
  "cakeWeight",
  "cakeFlavor",
  "preference",
  "layers",
  "cakeInscription",
  "referenceImage",
  "specialInstructions",
  "paymentStatus",
  "paymentHistory",
  "supplier",
  "unit",
  "ingredients",
  "imageUrl",
  "imageBase64",
  "text",
  "title",
  "notes",
  "messageText",
  "bakeryName",
  "email",
  "phone",
  "address",
  "role",
  "currency",
  "dateFormat"
];

function encryptRow(row: any): any {
  if (!row) return row;
  const encrypted: any = {};
  for (const [key, val] of Object.entries(row)) {
    if (KEYS_TO_ENCRYPT.includes(key) && val !== null && val !== undefined) {
      const strVal = typeof val === "object" ? JSON.stringify(val) : String(val);
      encrypted[key] = "__ENC__" + CryptoJS.AES.encrypt(strVal, SECRET_KEY).toString();
    } else {
      encrypted[key] = val;
    }
  }
  return encrypted;
}

function decryptRow(row: any): any {
  if (!row) return row;
  const decrypted: any = {};
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === "string" && val.startsWith("__ENC__")) {
      try {
        const ciphertext = val.substring(7);
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if ((decryptedStr.startsWith("{") && decryptedStr.endsWith("}")) || 
            (decryptedStr.startsWith("[") && decryptedStr.endsWith("]"))) {
          try {
            decrypted[key] = JSON.parse(decryptedStr);
          } catch {
            decrypted[key] = decryptedStr;
          }
        } else {
          decrypted[key] = decryptedStr;
        }
      } catch (err) {
        console.error(`Failed to decrypt field ${key}:`, err);
        decrypted[key] = val;
      }
    } else {
      decrypted[key] = val;
    }
  }
  return decrypted;
}

export async function performBulkSync(userEmail: string, payload: any) {
  const {
    customers = [],
    orders = [],
    inventory = [],
    recipes = [],
    checklist = [],
    customEvents = [],
    dispatchedNotifications = [],
    scheduledAlerts = [],
    bakeryProfile = [],
    categories = []
  } = payload;

  const db = await getDb();
  await runSql(db, "BEGIN IMMEDIATE TRANSACTION");
  try {
    // Sync Customers
    for (const rawC of customers as any[]) {
      const c = encryptRow(rawC);
      await runSql(db, `
        INSERT INTO customers (id, name, mobile, type, totalOrders, memberSince, updatedAt, user_email, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          mobile=excluded.mobile,
          type=excluded.type,
          totalOrders=excluded.totalOrders,
          memberSince=excluded.memberSince,
          updatedAt=excluded.updatedAt,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted
        WHERE (excluded.updatedAt > customers.updatedAt OR customers.updatedAt IS NULL)
          AND customers.user_email = excluded.user_email
      `, [c.id, c.name, c.mobile, c.type, c.totalOrders, c.memberSince, c.updatedAt, userEmail, c.isDeleted !== undefined ? c.isDeleted : 0]);
    }

    // Sync Orders
    for (const rawO of orders as any[]) {
      const o = encryptRow(rawO);
      await runSql(db, `
        INSERT INTO orders (
          id, customerId, customerName, customerMobile, eventType, eventDate, deliveryDate, deliveryTime, venueAddress,
          cakeShape, cakeWeight, cakeFlavor, preference, layers, cakeInscription, referenceImage,
          specialInstructions, basePrice, decorationCharge, deliveryFee, totalAmount, status, createdAt, updatedAt, user_email, isDeleted,
          paymentStatus, paidAmount, paymentHistory
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          customerId=excluded.customerId,
          customerName=excluded.customerName,
          customerMobile=excluded.customerMobile,
          eventType=excluded.eventType,
          eventDate=excluded.eventDate,
          deliveryDate=excluded.deliveryDate,
          deliveryTime=excluded.deliveryTime,
          venueAddress=excluded.venueAddress,
          cakeShape=excluded.cakeShape,
          cakeWeight=excluded.cakeWeight,
          cakeFlavor=excluded.cakeFlavor,
          preference=excluded.preference,
          layers=excluded.layers,
          cakeInscription=excluded.cakeInscription,
          referenceImage=excluded.referenceImage,
          specialInstructions=excluded.specialInstructions,
          basePrice=excluded.basePrice,
          decorationCharge=excluded.decorationCharge,
          deliveryFee=excluded.deliveryFee,
          totalAmount=excluded.totalAmount,
          status=excluded.status,
          updatedAt=excluded.updatedAt,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted,
          paymentStatus=excluded.paymentStatus,
          paidAmount=excluded.paidAmount,
          paymentHistory=excluded.paymentHistory
        WHERE (excluded.updatedAt > orders.updatedAt OR orders.updatedAt IS NULL)
          AND orders.user_email = excluded.user_email
      `, [
        o.id, o.customerId, o.customerName, o.customerMobile, o.eventType, o.eventDate, o.deliveryDate || '', o.deliveryTime, o.venueAddress,
        o.cakeShape, o.cakeWeight, o.cakeFlavor, o.preference, o.layers, o.cakeInscription, o.referenceImage,
        o.specialInstructions, o.basePrice, o.decorationCharge, o.deliveryFee, o.totalAmount, o.status, o.createdAt, o.updatedAt, userEmail, o.isDeleted !== undefined ? o.isDeleted : 0,
        o.paymentStatus || 'Unpaid', o.paidAmount || 0, typeof o.paymentHistory === "string" ? o.paymentHistory : JSON.stringify(o.paymentHistory || [])
      ]);
    }

    // Sync Inventory
    for (const rawItem of inventory as any[]) {
      const item = encryptRow(rawItem);
      await runSql(db, `
        INSERT INTO inventory (id, name, category, quantity, unit, minStockLevel, supplier, costPrice, updatedAt, user_email, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          category=excluded.category,
          quantity=excluded.quantity,
          unit=excluded.unit,
          minStockLevel=excluded.minStockLevel,
          supplier=excluded.supplier,
          costPrice=excluded.costPrice,
          updatedAt=excluded.updatedAt,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted
        WHERE (excluded.updatedAt > inventory.updatedAt OR inventory.updatedAt IS NULL)
          AND inventory.user_email = excluded.user_email
      `, [item.id, item.name, item.category, item.quantity, item.unit, item.minStockLevel, item.supplier, item.costPrice, item.updatedAt, userEmail, item.isDeleted !== undefined ? item.isDeleted : 0]);
    }

    // Sync Recipes
    for (const rawR of recipes as any[]) {
      const r = encryptRow(rawR);
      await runSql(db, `
        INSERT INTO recipes (id, name, category, stdYield, yieldUnit, ingredients, imageUrl, imageBase64, updatedAt, user_email, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          category=excluded.category,
          stdYield=excluded.stdYield,
          yieldUnit=excluded.yieldUnit,
          ingredients=excluded.ingredients,
          imageUrl=excluded.imageUrl,
          imageBase64=excluded.imageBase64,
          updatedAt=excluded.updatedAt,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted
        WHERE (excluded.updatedAt > recipes.updatedAt OR recipes.updatedAt IS NULL)
          AND recipes.user_email = excluded.user_email
      `, [r.id, r.name, r.category, r.stdYield, r.yieldUnit, typeof r.ingredients === "string" ? r.ingredients : JSON.stringify(r.ingredients), r.imageUrl ?? "", r.imageBase64 ?? "", r.updatedAt, userEmail, r.isDeleted !== undefined ? r.isDeleted : 0]);
    }

    // Sync Checklist
    for (const rawChk of checklist as any[]) {
      const chk = encryptRow(rawChk);
      await runSql(db, `
        INSERT INTO checklist (id, text, checked, date, updatedAt, user_email, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          text=excluded.text,
          checked=excluded.checked,
          date=excluded.date,
          updatedAt=excluded.updatedAt,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted
        WHERE (excluded.updatedAt > checklist.updatedAt OR checklist.updatedAt IS NULL)
          AND checklist.user_email = excluded.user_email
      `, [chk.id, chk.text, chk.checked ? 1 : 0, chk.date, chk.updatedAt, userEmail, chk.isDeleted !== undefined ? chk.isDeleted : 0]);
    }

    // Sync Custom Events
    for (const rawEv of customEvents as any[]) {
      const ev = encryptRow(rawEv);
      await runSql(db, `
        INSERT INTO custom_events (id, title, date, type, notes, createdAt, user_email, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,
          date=excluded.date,
          type=excluded.type,
          notes=excluded.notes,
          createdAt=excluded.createdAt,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted
        WHERE (excluded.createdAt > custom_events.createdAt OR custom_events.createdAt IS NULL)
          AND custom_events.user_email = excluded.user_email
      `, [ev.id, ev.title, ev.date, ev.type, ev.notes, ev.createdAt, userEmail, ev.isDeleted !== undefined ? ev.isDeleted : 0]);
    }

    // Sync Dispatched Notifications
    for (const rawDn of dispatchedNotifications as any[]) {
      const dn = encryptRow(rawDn);
      await runSql(db, `
        INSERT INTO dispatched_notifications (id, customerName, customerMobile, cakeSpec, messageText, dispatchedAt, status, user_email, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          customerName=excluded.customerName,
          customerMobile=excluded.customerMobile,
          cakeSpec=excluded.cakeSpec,
          messageText=excluded.messageText,
          dispatchedAt=excluded.dispatchedAt,
          status=excluded.status,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted
        WHERE (excluded.dispatchedAt > dispatched_notifications.dispatchedAt OR dispatched_notifications.dispatchedAt IS NULL)
          AND dispatched_notifications.user_email = excluded.user_email
      `, [dn.id, dn.customerName, dn.customerMobile, dn.cakeSpec, dn.messageText, dn.dispatchedAt, dn.status, userEmail, dn.isDeleted !== undefined ? dn.isDeleted : 0]);
    }

    // Sync Scheduled Alerts
    for (const rawSa of scheduledAlerts as any[]) {
      const sa = encryptRow(rawSa);
      await runSql(db, `
        INSERT INTO scheduled_alerts (id, customerName, customerMobile, alertDate, notes, createdAt, user_email, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          customerName=excluded.customerName,
          customerMobile=excluded.customerMobile,
          alertDate=excluded.alertDate,
          notes=excluded.notes,
          createdAt=excluded.createdAt,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted
        WHERE (excluded.createdAt > scheduled_alerts.createdAt OR scheduled_alerts.createdAt IS NULL)
          AND scheduled_alerts.user_email = excluded.user_email
      `, [sa.id, sa.customerName, sa.customerMobile, sa.alertDate, sa.notes, sa.createdAt, userEmail, sa.isDeleted !== undefined ? sa.isDeleted : 0]);
    }

    // Sync Bakery Profile
    for (const rawBp of bakeryProfile as any[]) {
      const bp = encryptRow(rawBp);
      await runSql(db, `
        INSERT INTO bakery_profile (id, bakeryName, email, phone, address, role, currency, dateFormat, updatedAt, user_email, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          bakeryName=excluded.bakeryName,
          email=excluded.email,
          phone=excluded.phone,
          address=excluded.address,
          role=excluded.role,
          currency=excluded.currency,
          dateFormat=excluded.dateFormat,
          updatedAt=excluded.updatedAt,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted
        WHERE (excluded.updatedAt > bakery_profile.updatedAt OR bakery_profile.updatedAt IS NULL)
          AND bakery_profile.user_email = excluded.user_email
      `, [bp.id, bp.bakeryName, bp.email, bp.phone, bp.address, bp.role, bp.currency, bp.dateFormat, bp.updatedAt, userEmail, bp.isDeleted !== undefined ? bp.isDeleted : 0]);
    }

    // Sync Categories
    for (const cat of categories as any[]) {
      await runSql(db, `
        INSERT INTO categories (id, name, type, updatedAt, user_email, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          type=excluded.type,
          updatedAt=excluded.updatedAt,
          user_email=excluded.user_email,
          isDeleted=excluded.isDeleted
        WHERE (excluded.updatedAt > categories.updatedAt OR categories.updatedAt IS NULL)
          AND categories.user_email = excluded.user_email
      `, [cat.id, cat.name, cat.type, cat.updatedAt, userEmail, cat.isDeleted !== undefined ? cat.isDeleted : 0]);
    }

    await runSql(db, "COMMIT");
  } catch (err) {
    await runSql(db, "ROLLBACK");
    throw err;
  }
}

export async function fetchMasterData(userEmail: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const db = await getDb();

  // Fetch paginated user-scoped records for customers and orders (which grow day by day)
  const allCustomers = await querySqlAll<any>(
    db, 
    "SELECT * FROM customers WHERE user_email = ? ORDER BY updatedAt DESC LIMIT ? OFFSET ?", 
    [userEmail, limit, offset]
  );
  const allOrders = await querySqlAll<any>(
    db, 
    "SELECT * FROM orders WHERE user_email = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?", 
    [userEmail, limit, offset]
  );

  // For other tables, which are typically small (inventory, recipes, checklist, etc.), we only fetch on page 1
  let allInventory: any[] = [];
  let allRecipes: any[] = [];
  let allChecklist: any[] = [];
  let allCustomEvents: any[] = [];
  let allDispatchedNotifications: any[] = [];
  let allScheduledAlerts: any[] = [];
  let allBakeryProfile: any[] = [];
  let allCategories: any[] = [];

  if (page === 1) {
    allInventory = await querySqlAll<any>(db, "SELECT * FROM inventory WHERE user_email = ? ORDER BY updatedAt DESC", [userEmail]);
    allRecipes = await querySqlAll<any>(db, "SELECT * FROM recipes WHERE user_email = ?", [userEmail]);
    allChecklist = await querySqlAll<any>(db, "SELECT * FROM checklist WHERE user_email = ?", [userEmail]);
    allCustomEvents = await querySqlAll<any>(db, "SELECT * FROM custom_events WHERE user_email = ? ORDER BY createdAt DESC", [userEmail]);
    allDispatchedNotifications = await querySqlAll<any>(db, "SELECT * FROM dispatched_notifications WHERE user_email = ? ORDER BY dispatchedAt DESC", [userEmail]);
    allScheduledAlerts = await querySqlAll<any>(db, "SELECT * FROM scheduled_alerts WHERE user_email = ? ORDER BY createdAt DESC", [userEmail]);
    allBakeryProfile = await querySqlAll<any>(db, "SELECT * FROM bakery_profile WHERE user_email = ? ORDER BY updatedAt DESC", [userEmail]);
    allCategories = await querySqlAll<any>(db, "SELECT * FROM categories WHERE user_email = ?", [userEmail]);
  }
  db.close();

  const decryptedCustomers = allCustomers.map(decryptRow);
  const decryptedOrders = allOrders.map(decryptRow);
  const decryptedInventory = allInventory.map(decryptRow);
  const decryptedRecipes = allRecipes.map(decryptRow);
  const decryptedChecklist = allChecklist.map(decryptRow);
  const decryptedCustomEvents = allCustomEvents.map(decryptRow);
  const decryptedDispatchedNotifications = allDispatchedNotifications.map(decryptRow);
  const decryptedScheduledAlerts = allScheduledAlerts.map(decryptRow);
  const decryptedBakeryProfile = allBakeryProfile.map(decryptRow);

  // Format orders on response to deserialize JSON string fields
  const formattedOrders = decryptedOrders.map((o) => {
    let parsedHistory = [];
    try {
      parsedHistory = o.paymentHistory ? (typeof o.paymentHistory === "string" ? JSON.parse(o.paymentHistory) : o.paymentHistory) : [];
    } catch (err) {
      console.error("Failed to parse paymentHistory for order:", o.id, err);
    }
    return {
      ...o,
      paymentHistory: parsedHistory
    };
  });

  // Format recipes on response
  const formattedRecipes = decryptedRecipes.map((r) => {
    let parsedIngredients = [];
    try {
      parsedIngredients = r.ingredients ? (typeof r.ingredients === "string" ? JSON.parse(r.ingredients) : r.ingredients) : [];
    } catch (err) {
      console.error("Failed to parse ingredients for recipe:", r.id, err);
    }
    return {
      ...r,
      ingredients: parsedIngredients
    };
  });

  const formattedChecklist = decryptedChecklist.map((c) => ({
    ...c,
    checked: c.checked === 1 || c.checked === true
  }));

  const hasMore = decryptedCustomers.length === limit || decryptedOrders.length === limit;

  return {
    hasMore,
    customers: decryptedCustomers,
    orders: formattedOrders,
    inventory: decryptedInventory,
    recipes: formattedRecipes,
    checklist: formattedChecklist,
    customEvents: decryptedCustomEvents,
    dispatchedNotifications: decryptedDispatchedNotifications,
    scheduledAlerts: decryptedScheduledAlerts,
    bakeryProfile: decryptedBakeryProfile,
    categories: allCategories
  };
}

export async function insertSingleOrder(rawO: any, userEmail: string) {
  const o = encryptRow(rawO);
  const db = await getDb();
  await runSql(db, `
    INSERT INTO orders (
      id, customerId, customerName, customerMobile, eventType, eventDate, deliveryTime, venueAddress,
      cakeShape, cakeWeight, cakeFlavor, preference, layers, cakeInscription, referenceImage,
      specialInstructions, basePrice, decorationCharge, deliveryFee, totalAmount, status, createdAt, updatedAt, user_email, isDeleted,
      paymentStatus, paidAmount, paymentHistory
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      customerId=excluded.customerId,
      customerName=excluded.customerName,
      customerMobile=excluded.customerMobile,
      eventType=excluded.eventType,
      eventDate=excluded.eventDate,
      deliveryTime=excluded.deliveryTime,
      venueAddress=excluded.venueAddress,
      cakeShape=excluded.cakeShape,
      cakeWeight=excluded.cakeWeight,
      cakeFlavor=excluded.cakeFlavor,
      preference=excluded.preference,
      layers=excluded.layers,
      cakeInscription=excluded.cakeInscription,
      referenceImage=excluded.referenceImage,
      specialInstructions=excluded.specialInstructions,
      basePrice=excluded.basePrice,
      decorationCharge=excluded.decorationCharge,
      deliveryFee=excluded.deliveryFee,
      totalAmount=excluded.totalAmount,
      status=excluded.status,
      updatedAt=excluded.updatedAt,
      user_email=excluded.user_email,
      isDeleted=excluded.isDeleted,
      paymentStatus=excluded.paymentStatus,
      paidAmount=excluded.paidAmount,
      paymentHistory=excluded.paymentHistory
    WHERE orders.user_email = excluded.user_email
  `, [
    o.id, o.customerId, o.customerName, o.customerMobile, o.eventType, o.eventDate, o.deliveryTime, o.venueAddress,
    o.cakeShape, o.cakeWeight, o.cakeFlavor, o.preference, o.layers, o.cakeInscription, o.referenceImage,
    o.specialInstructions, o.basePrice, o.decorationCharge, o.deliveryFee, o.totalAmount, o.status, o.createdAt, o.updatedAt,
    userEmail, o.isDeleted !== undefined ? o.isDeleted : 0,
    o.paymentStatus || 'Unpaid', o.paidAmount || 0, typeof o.paymentHistory === "string" ? o.paymentHistory : JSON.stringify(o.paymentHistory || [])
  ]);
  db.close();
}
