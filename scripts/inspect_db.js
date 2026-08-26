import sqlite3 from "sqlite3";
import CryptoJS from "crypto-js";

const SECRET_KEY = "floura_kitchen_super_secret_db_key_2026";

function decryptLegacyValue(val) {
  if (typeof val !== "string" || !val.startsWith("__ENC__")) return val;
  const cipher = val.substring(7);
  try {
    const decrypted = CryptoJS.AES.decrypt(cipher, SECRET_KEY).toString(CryptoJS.enc.Utf8);
    if (
      (decrypted.startsWith("[") && decrypted.endsWith("]")) ||
      (decrypted.startsWith("{") && decrypted.endsWith("}"))
    ) {
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    }
    return decrypted;
  } catch (e) {
    console.error("Failed to decrypt:", e);
    return val;
  }
}

const db = new sqlite3.Database("./patisserie.sqlite", (err) => {
  if (err) {
    console.error("Error opening database:", err);
    process.exit(1);
  }
});

db.all("SELECT * FROM recipes", [], (err, rows) => {
  if (err) {
    console.error("Error querying recipes:", err);
  } else {
    console.log("=== RECIPES ===");
    rows.forEach((row) => {
      const decryptedRow = { ...row };
      Object.keys(row).forEach((key) => {
        decryptedRow[key] = decryptLegacyValue(row[key]);
      });
      console.log(JSON.stringify(decryptedRow, null, 2));
    });
  }

  db.all("SELECT * FROM inventory", [], (err, rows) => {
    if (err) {
      console.error("Error querying inventory:", err);
    } else {
      console.log("=== INVENTORY ===");
      rows.forEach((row) => {
        const decryptedRow = { ...row };
        Object.keys(row).forEach((key) => {
          decryptedRow[key] = decryptLegacyValue(row[key]);
        });
        console.log(JSON.stringify(decryptedRow, null, 2));
      });
    }

    db.all("SELECT * FROM orders", [], (err, rows) => {
      if (err) {
        console.error("Error querying orders:", err);
      } else {
        console.log("=== ORDERS ===");
        rows.forEach((row) => {
          const decryptedRow = { ...row };
          Object.keys(row).forEach((key) => {
            decryptedRow[key] = decryptLegacyValue(row[key]);
          });
          console.log(JSON.stringify(decryptedRow, null, 2));
        });
      }
      db.close();
    });
  });
});
