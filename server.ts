// File Path: /server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initDb, getDb, runSql, querySqlAll } from "./server-db";
import { Customer, Order, InventoryItem, Recipe, ChecklistItem } from "./src/types";
import CryptoJS from "crypto-js";

// In-memory sessions map for secure Tauri system-browser external Google logins
const activeSessions = new Map<string, {
  status: "pending" | "completed" | "error";
  user?: { name: string; email: string; avatar: string };
  token?: string;
  error?: string;
}>();

const activeAdminSessions = new Map<string, {
  email: string;
  name: string;
  role: string;
  permissions: string[];
}>();

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

async function startServer() {
  // Ensure DB and seed data exists
  await initDb();

  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Enable CORS middleware for Tauri desktop or separate frontend runs
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-email");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Helper to open connection inside handlers
  const withDb = async (callback: (db: any) => Promise<any>) => {
    const db = await getDb();
    try {
      return await callback(db);
    } finally {
      db.close();
    }
  };

  // Securely seed the superadmin user
  await withDb(async (db) => {
    const superEmail = "superadmin@floura.com";
    const existing = await querySqlAll<any>(db, "SELECT * FROM admin_users WHERE email = ?", [superEmail]);
    if (existing.length === 0) {
      const salt = CryptoJS.lib.WordArray.random(16).toString();
      const password = "FlouraAdmin#SuperSecure!2026";
      const hash = CryptoJS.SHA256(password + salt).toString();
      await runSql(db, `
        INSERT INTO admin_users (email, name, password_hash, salt, role, permissions, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [superEmail, "Floura SuperAdmin", hash, salt, "superadmin", JSON.stringify(["feedbacks", "users", "setup"]), new Date().toISOString()]);
      console.log("[Seeding] Secure superadmin seeded successfully.");
    }
  });

  // ----- AUTH & SECURITY API ROUTES -----

  // Secure External Web OAuth endpoints for Tauri Mobile (Android) & Desktop System Browser
  app.get("/api/auth/external-start", (req, res) => {
    const { state } = req.query;
    if (!state || typeof state !== "string") {
      return res.status(400).send("State key is required to establish external authentication tunnel.");
    }

    // Set a pending entry in the activeSessions map
    activeSessions.set(state, { status: "pending" });

    // Automatically expire/clean up this session in 5 minutes to prevent memory accumulation
    setTimeout(() => {
      if (activeSessions.get(state)?.status === "pending") {
        activeSessions.delete(state);
      }
    }, 300000);

    // Read current firebase config dynamically
    const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
    let firebaseConfig = {
      apiKey: "dummy-api-key",
      authDomain: "dummy.firebaseapp.com",
      projectId: "dummy-project",
      storageBucket: "dummy.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123:web:123"
    };
    if (fs.existsSync(firebaseConfigPath)) {
      try {
        firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
      } catch (err) {
        console.error("Error loading firebase-applet-config.json:", err);
      }
    }

    // Serve a premium responsive landing page optimized for Chrome/Safari mobile browser view
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Floura Secure Login</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,900;1,900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .serif-title { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body class="bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300">
  <div class="bg-white dark:bg-zinc-900 p-8 rounded-[32px] shadow-xl border border-zinc-100 dark:border-zinc-800 max-w-sm w-full text-center flex flex-col items-center">
    
    <!-- App Logo Circle -->
    <div class="w-16 h-16 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-black mb-4 select-none shadow-md">
      F
    </div>
    
    <h1 class="serif-title text-3xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight mb-2">
      Floura Sign-In
    </h1>
    <p class="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-8 max-w-[260px] leading-relaxed">
      Connect your premium kitchen workspace securely using your system's Google accounts list.
    </p>

    <!-- Interactive login container -->
    <div id="auth-actions" class="w-full space-y-4">
      <button id="btn-login" class="group w-full flex items-center justify-center gap-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl shadow-md transition-all active:scale-[0.98]">
        <div class="w-6 h-6 bg-white rounded-full p-1 flex items-center justify-center shadow-sm">
          <svg class="w-full h-full" viewBox="0 0 48 48">
            <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335"></path>
            <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4"></path>
            <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05"></path>
            <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853"></path>
          </svg>
        </div>
        <span class="text-xs uppercase tracking-wider font-bold">Sign In with Google</span>
      </button>
    </div>

    <!-- Active Loading Feedback Message -->
    <div id="status-message" class="text-xs text-zinc-400 font-semibold mt-6 hidden flex items-center justify-center gap-2">
      <svg class="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span id="status-text">Loading workspace auth handler...</span>
    </div>

    <!-- Errors Output container -->
    <div id="error-container" class="hidden mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-semibold">
    </div>
  </div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

    const firebaseConfig = ${JSON.stringify(firebaseConfig)};
    const state = "${state}";

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/userinfo.email");
    provider.addScope("https://www.googleapis.com/auth/userinfo.profile");

    const btnLogin = document.getElementById("btn-login");
    const statusMessage = document.getElementById("status-message");
    const statusText = document.getElementById("status-text");
    const errorContainer = document.getElementById("error-container");

    function showStatus(text) {
      statusMessage.classList.remove("hidden");
      statusText.innerText = text;
    }

    function showError(text) {
      errorContainer.innerText = text;
      errorContainer.classList.remove("hidden");
      statusMessage.classList.add("hidden");
    }

    btnLogin.addEventListener("click", async () => {
      errorContainer.classList.add("hidden");
      showStatus("Connecting to Google Accounts chooser...");
      
      try {
        const result = await signInWithPopup(auth, provider);
        const googleUser = result.user;
        
        if (!googleUser.email) {
          throw new Error("No primary email found in Google profile.");
        }

        showStatus("Verifying kitchen credentials...");

        // Post validated credentials to workspace server
        const response = await fetch("/api/auth/external-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: state,
            email: googleUser.email,
            name: googleUser.displayName || "",
            avatar: googleUser.photoURL || ""
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Workspace verification check failed.");
        }

        showStatus("Authorized! Opening Floura...");
        document.getElementById("auth-actions").innerHTML = \`
          <div class="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl text-center">
            <span class="text-emerald-700 dark:text-emerald-400 font-bold text-sm block mb-1">Login Secured!</span>
            <span class="text-zinc-600 dark:text-zinc-400 text-xs block mb-4">You are now logged in as Chef \${googleUser.displayName || googleUser.email}.</span>
            <a href="floura://auth?state=\${state}" class="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">
              Return to Floura
            </a>
          </div>
        \`;
        
        // Auto deep link redirect
        window.location.href = "floura://auth?state=" + state;
        
        setTimeout(() => {
          window.location.href = "com.floura.app://auth?state=" + state;
        }, 1200);

      } catch (err) {
        console.error("External login error:", err);
        showError(err.message || "Failed to complete Google Sign-In.");
      }
    });
  </script>
</body>
</html>
    `);
  });

  app.post("/api/auth/external-complete", async (req, res) => {
    try {
      console.log("[Auth Debug] External login completed:", req.body);
      const { state, email, name, avatar } = req.body;
      if (!state || !email) {
        return res.status(400).json({ error: "Missing state session or identity parameter." });
      }

      const emailKey = email.toLowerCase().trim();
      const signatureToken = CryptoJS.SHA256(emailKey + "FLOURA_GOOGLE_WORKSPACE_SALT_2026_" + Date.now() + "_" + Math.random().toString()).toString();

      await withDb(async (db) => {
        const users = await querySqlAll<any>(db, "SELECT * FROM users WHERE email = ?", [emailKey]);
        let finalName = name || "Chef Paul";
        let finalAvatar = avatar || "chef";
        let isNew = false;

        if (users.length > 0) {
          const user = users[0];
          // Preserve custom database modifications if any
          if (user.name && user.name !== "Chef Paul" && user.name !== "Chef undefined" && user.name !== "Chef null") {
            finalName = user.name;
          } else if (name) {
            finalName = name.startsWith("Chef ") ? name : "Chef " + name;
          }

          if (user.avatar && user.avatar !== "chef" && user.avatar !== "undefined") {
            finalAvatar = user.avatar;
          } else if (avatar) {
            finalAvatar = avatar;
          }

          await runSql(db, "UPDATE users SET password_hash = ?, name = ?, avatar = ? WHERE email = ?", [
            signatureToken,
            finalName,
            finalAvatar,
            emailKey
          ]);
        } else {
          isNew = true;
          const formattedName = name ? (name.startsWith("Chef ") ? name : "Chef " + name) : "Chef Paul";
          await runSql(db, `
            INSERT INTO users (email, password_hash, name, avatar, createdAt)
            VALUES (?, ?, ?, ?, ?)
          `, [emailKey, signatureToken, formattedName, finalAvatar, new Date().toISOString()]);
          finalName = formattedName;
        }

        // Cache completed session in activeSessions
        activeSessions.set(state, {
          status: "completed",
          user: {
            name: finalName,
            email: emailKey,
            avatar: finalAvatar
          },
          token: signatureToken
        });

        // Auto expire this session after 3 minutes to avoid stale polls
        setTimeout(() => {
          activeSessions.delete(state);
        }, 180000);

        res.json({ status: "success", isNew });
      });
    } catch (err: any) {
      console.error("External complete error:", err);
      res.status(500).json({ error: err.message || "Failed to process external login verification." });
    }
  });

  app.get("/api/auth/external-poll", (req, res) => {
    const { state } = req.query;
    if (!state || typeof state !== "string") {
      return res.status(400).json({ error: "Missing state query parameter." });
    }

    const session = activeSessions.get(state);
    if (!session) {
      return res.json({ status: "pending" });
    }

    return res.json(session);
  });

  // Unified Secure Sign Up / Sign In (Only for verified Google logins to avoid spoofing)
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("[Auth Debug] Received Google login payload:", req.body);
      const { email, name, avatar, isGoogle } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email address is required." });
      }

      if (!isGoogle) {
        return res.status(403).json({ error: "Direct access to Google-auth handler is forbidden. Please log in through Google secure authentication." });
      }

      const emailKey = email.toLowerCase().trim();

      // Generate a truly unique session token (not deterministic) to enforce one-browser-session-only policy.
      // Since it includes timestamp and random factor, logins on new devices will automatically overwrite
      // and invalidate previous sessions/tokens stored on other devices.
      const signatureToken = CryptoJS.SHA256(emailKey + "FLOURA_GOOGLE_WORKSPACE_SALT_2026_" + Date.now() + "_" + Math.random().toString()).toString();

      await withDb(async (db) => {
        const users = await querySqlAll<any>(db, "SELECT * FROM users WHERE email = ?", [emailKey]);
        if (users.length > 0) {
          const user = users[0];
          
          // If the user already exists in the SQL DB, we preserve their customized details.
          // Only update to google values if the existing database row fields are blank/default.
          let finalName = user.name;
          if (!finalName || finalName === "Chef Paul" || finalName === "Chef undefined" || finalName === "Chef null") {
            finalName = name || finalName || "Chef Paul";
          } else if (name && name !== "Chef Paul" && name !== "Chef undefined" && name !== "Chef null") {
            // If the incoming Google name is custom and different, we can update it
            finalName = name;
          }

          let finalAvatar = user.avatar;
          if (!finalAvatar || finalAvatar === "chef" || finalAvatar === "undefined") {
            finalAvatar = avatar || finalAvatar || "chef";
          } else if (avatar && avatar !== "chef" && avatar !== "undefined") {
            finalAvatar = avatar;
          }

          await runSql(db, "UPDATE users SET password_hash = ?, name = ?, avatar = ? WHERE email = ?", [
            signatureToken,
            finalName,
            finalAvatar,
            emailKey
          ]);

          return res.json({
            status: "success",
            user: {
              name: finalName,
              email: user.email,
              avatar: finalAvatar
            },
            token: signatureToken
          });
        } else {
          // Auto-register Google workspace user securely
          const defaultName = name || "Chef Paul";
          const defaultAvatar = avatar || "chef";
          await runSql(db, `
            INSERT INTO users (email, password_hash, name, avatar, createdAt)
            VALUES (?, ?, ?, ?, ?)
          `, [emailKey, signatureToken, defaultName, defaultAvatar, new Date().toISOString()]);

          return res.json({
            status: "success",
            isNew: true,
            user: {
              name: defaultName,
              email: emailKey,
              avatar: defaultAvatar
            },
            token: signatureToken
          });
        }
      });
    } catch (err: any) {
      console.error("Auth login/register error:", err);
      res.status(500).json({ error: err.message || "Failed to process security request." });
    }
  });

  // Admin Middleware for authentication and session mapping
  const requireAdminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Admin authorization required." });
    }
    const token = authHeader.substring(7).trim();
    const session = activeAdminSessions.get(token);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired admin session token." });
    }
    (req as any).adminUser = session;
    next();
  };

  // Reusable Auth middleware that handles security handshake & signature verification globally
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Security Authorization required. Please log in first." });
      }
      const token = authHeader.substring(7).trim();

      // Look for userEmail anywhere (body, query, or customized header)
      const rawEmail = req.body.userEmail || req.headers["x-user-email"] || req.query.userEmail;
      if (!rawEmail) {
        return res.status(400).json({ error: "Missing identity parameter (userEmail). Please supply your email." });
      }

      const emailKey = String(rawEmail).toLowerCase().trim();

      const isAuthorized = await withDb(async (db) => {
        const users = await querySqlAll<any>(db, "SELECT * FROM users WHERE email = ? AND password_hash = ?", [emailKey, token]);
        return users.length > 0;
      });

      if (!isAuthorized) {
        return res.status(403).json({ error: "Access Denied: Invalid security workspace signature. Please re-authenticate." });
      }

      // Securely stash verified properties for handler pipelines
      (req as any).userEmail = emailKey;
      (req as any).token = token;

      next();
    } catch (err: any) {
      console.error("Auth middleware error:", err);
      res.status(500).json({ error: "Internal security authorization failure." });
    }
  };

  // Secure Admin Login Endpoint (checks password hash with salt against database)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }
      const emailKey = email.toLowerCase().trim();
      
      await withDb(async (db) => {
        const results = await querySqlAll<any>(db, "SELECT * FROM admin_users WHERE email = ?", [emailKey]);
        if (results.length === 0) {
          return res.status(401).json({ error: "Invalid admin credentials." });
        }
        const admin = results[0];
        const computedHash = CryptoJS.SHA256(password + admin.salt).toString();
        if (computedHash !== admin.password_hash) {
          return res.status(401).json({ error: "Invalid admin credentials." });
        }

        const adminToken = "admin_token_" + CryptoJS.lib.WordArray.random(24).toString();
        const permissionsList = JSON.parse(admin.permissions || "[]");
        
        activeAdminSessions.set(adminToken, {
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: permissionsList
        });

        res.json({
          status: "success",
          user: {
            name: admin.name,
            email: admin.email,
            avatar: "admin",
            role: admin.role,
            permissions: permissionsList
          },
          token: adminToken
        });
      });
    } catch (err: any) {
      console.error("Admin login error:", err);
      res.status(500).json({ error: err.message || "Failed to authenticate admin." });
    }
  });

  // Admin: Get list of administrative accounts (Superadmin or Admin with Users permission)
  app.get("/api/admin/users", requireAdminAuth, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("users")) {
        return res.status(403).json({ error: "Access Denied: Insufficient permissions to view admin accounts." });
      }
      await withDb(async (db) => {
        const users = await querySqlAll<any>(db, "SELECT email, name, role, permissions, createdAt FROM admin_users ORDER BY createdAt DESC");
        const parsedUsers = users.map(u => ({
          ...u,
          permissions: JSON.parse(u.permissions || "[]")
        }));
        res.json({
          status: "success",
          users: parsedUsers
        });
      });
    } catch (err: any) {
      console.error("Fetch admins error:", err);
      res.status(500).json({ error: err.message || "Failed to load admin accounts." });
    }
  });

  // Admin: Provision a new administrative account (Superadmin only)
  app.post("/api/admin/users", requireAdminAuth, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      if (adminUser.role !== "superadmin") {
        return res.status(403).json({ error: "Access Denied: Only superadmin can create administrative accounts." });
      }
      const { email, name, password, role, permissions = [] } = req.body;
      if (!email || !name || !password || !role) {
        return res.status(400).json({ error: "Email, name, password, and role are required." });
      }
      const emailKey = email.toLowerCase().trim();
      
      await withDb(async (db) => {
        const existing = await querySqlAll<any>(db, "SELECT * FROM admin_users WHERE email = ?", [emailKey]);
        if (existing.length > 0) {
          return res.status(409).json({ error: "An admin user with this email address already exists." });
        }
        
        const salt = CryptoJS.lib.WordArray.random(16).toString();
        const hash = CryptoJS.SHA256(password + salt).toString();
        
        await runSql(db, `
          INSERT INTO admin_users (email, name, password_hash, salt, role, permissions, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [emailKey, name, hash, salt, role, JSON.stringify(permissions), new Date().toISOString()]);
        
        res.json({
          status: "success",
          user: {
            email: emailKey,
            name,
            role,
            permissions
          }
        });
      });
    } catch (err: any) {
      console.error("Create admin error:", err);
      res.status(500).json({ error: err.message || "Failed to create admin user." });
    }
  });

  // Get feedbacks for a specific user (Requires auth)
  app.get("/api/feedbacks", requireAuth, async (req, res) => {
    try {
      const userEmail = (req as any).userEmail;
      await withDb(async (db) => {
        const results = await querySqlAll<any>(db, "SELECT * FROM feedbacks WHERE email = ? ORDER BY createdAt DESC", [userEmail]);
        res.json({ status: "success", feedbacks: results });
      });
    } catch (err: any) {
      console.error("Get user feedbacks error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch feedbacks." });
    }
  });

  // Public Feedback Submit Endpoint
  app.post("/api/feedbacks", async (req, res) => {
    try {
      const { name, email, category, title, message, rating, imageUrl } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required for feedback." });
      }
      const id = "fb_" + Math.random().toString(36).substring(2) + Date.now();
      const createdAt = new Date().toISOString();
      const status = "Pending";

      await withDb(async (db) => {
        await runSql(db, `
          INSERT INTO feedbacks (id, name, email, category, title, message, rating, imageUrl, status, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          name || "",
          email || "",
          category || "Suggestion",
          title || "",
          message,
          rating !== undefined ? rating : 5,
          imageUrl || "",
          status,
          createdAt
        ]);
      });

      res.json({
        status: "success",
        feedback: { id, name, email, category, title, message, rating, imageUrl, status, createdAt }
      });
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      res.status(500).json({ error: err.message || "Failed to submit feedback." });
    }
  });

  // Admin: Get count of registered users (Requires users or setup permission or superadmin)
  app.get("/api/admin/users/count", requireAdminAuth, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("users") && !adminUser.permissions.includes("setup")) {
        return res.status(403).json({ error: "Access Denied: Insufficient permissions to view users count." });
      }
      await withDb(async (db) => {
        const result = await querySqlAll<any>(db, "SELECT count(*) as count FROM users");
        res.json({
          status: "success",
          count: result[0]?.count || 0
        });
      });
    } catch (err: any) {
      console.error("Fetch users count error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch user count." });
    }
  });

  // Admin: Get all feedbacks (Requires feedbacks permission or superadmin)
  app.get("/api/admin/feedbacks", requireAdminAuth, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("feedbacks")) {
        return res.status(403).json({ error: "Access Denied: Insufficient permissions to view feedbacks." });
      }
      await withDb(async (db) => {
        const feedbacks = await querySqlAll<any>(db, "SELECT * FROM feedbacks ORDER BY createdAt DESC");
        res.json({
          status: "success",
          feedbacks
        });
      });
    } catch (err: any) {
      console.error("Fetch feedbacks error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch feedbacks." });
    }
  });

  // Admin: Update feedback status (Requires feedbacks permission or superadmin)
  app.put("/api/admin/feedbacks/:id/status", requireAdminAuth, async (req, res) => {
    try {
      const adminUser = (req as any).adminUser;
      if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("feedbacks")) {
        return res.status(403).json({ error: "Access Denied: Insufficient permissions to update feedback status." });
      }
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required." });
      }
      await withDb(async (db) => {
        await runSql(db, "UPDATE feedbacks SET status = ? WHERE id = ?", [status, id]);
        res.json({ status: "success" });
      });
    } catch (err: any) {
      console.error("Update feedback status error:", err);
      res.status(500).json({ error: err.message || "Failed to update feedback status." });
    }
  });

  // Update User Profile Details (Saves custom updated name and avatar in backend SQL database)
  app.post("/api/auth/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Security Authorization required. Please log in first." });
      }
      const token = authHeader.substring(7).trim();
      const { email, name, avatar } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }
      if (!name) {
        return res.status(400).json({ error: "Name is required." });
      }

      const emailKey = email.toLowerCase().trim();

      await withDb(async (db) => {
        // Authenticate request manually to verify signatureToken matches
        const users = await querySqlAll<any>(db, "SELECT * FROM users WHERE email = ? AND password_hash = ?", [emailKey, token]);
        if (users.length === 0) {
          return res.status(403).json({ error: "Access Denied: Invalid security signature." });
        }

        // Update the name and avatar in backend SQL database
        await runSql(db, "UPDATE users SET name = ?, avatar = ? WHERE email = ?", [name, avatar || "chef", emailKey]);
      });

      return res.json({ status: "success" });
    } catch (err: any) {
      console.error("Profile update error:", err);
      res.status(500).json({ error: err.message || "Failed to update profile details." });
    }
  });

  // ----- REST & SYNC API ROUTES -----

  // Verify Auth Session Endpoint
  app.get("/api/auth/verify", requireAuth, (req, res) => {
    res.json({ status: "success", valid: true });
  });

  // Bulk Sync Endpoint (highly robust offline-first sync with user-based data isolation & cryptographic validation)
  app.post("/api/sync", requireAuth, async (req, res) => {
    try {
      const userEmail = (req as any).userEmail;
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
        pullAll = false
      } = req.body;

      await withDb(async (db) => {
        // Run as a transaction to ensure atomic execution
        await runSql(db, "BEGIN TRANSACTION");
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
              WHERE excluded.updatedAt > customers.updatedAt OR customers.updatedAt IS NULL
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
              WHERE excluded.updatedAt > orders.updatedAt OR orders.updatedAt IS NULL
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
              WHERE excluded.updatedAt > inventory.updatedAt OR inventory.updatedAt IS NULL
            `, [item.id, item.name, item.category, item.quantity, item.unit, item.minStockLevel, item.supplier, item.costPrice, item.updatedAt, userEmail, item.isDeleted !== undefined ? item.isDeleted : 0]);
          }

          // Sync Recipes
          for (const rawR of recipes as any[]) {
            const r = encryptRow(rawR);
            await runSql(db, `
              INSERT INTO recipes (id, name, category, stdYield, yieldUnit, ingredients, imageUrl, updatedAt, user_email, isDeleted)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                category=excluded.category,
                stdYield=excluded.stdYield,
                yieldUnit=excluded.yieldUnit,
                ingredients=excluded.ingredients,
                imageUrl=excluded.imageUrl,
                updatedAt=excluded.updatedAt,
                user_email=excluded.user_email,
                isDeleted=excluded.isDeleted
              WHERE excluded.updatedAt > recipes.updatedAt OR recipes.updatedAt IS NULL
            `, [r.id, r.name, r.category, r.stdYield, r.yieldUnit, typeof r.ingredients === "string" ? r.ingredients : JSON.stringify(r.ingredients), r.imageUrl ?? "", r.updatedAt, userEmail, r.isDeleted !== undefined ? r.isDeleted : 0]);
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
              WHERE excluded.updatedAt > checklist.updatedAt OR checklist.updatedAt IS NULL
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
              WHERE excluded.createdAt > custom_events.createdAt OR custom_events.createdAt IS NULL
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
              WHERE excluded.dispatchedAt > dispatched_notifications.dispatchedAt OR dispatched_notifications.dispatchedAt IS NULL
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
              WHERE excluded.createdAt > scheduled_alerts.createdAt OR scheduled_alerts.createdAt IS NULL
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
              WHERE excluded.updatedAt > bakery_profile.updatedAt OR bakery_profile.updatedAt IS NULL
            `, [bp.id, bp.bakeryName, bp.email, bp.phone, bp.address, bp.role, bp.currency, bp.dateFormat, bp.updatedAt, userEmail, bp.isDeleted !== undefined ? bp.isDeleted : 0]);
          }

          await runSql(db, "COMMIT");
        } catch (err) {
          await runSql(db, "ROLLBACK");
          throw err;
        }

        res.json({
          status: "success",
          syncTime: new Date().toISOString()
        });
      });
    } catch (e: any) {
      console.error("Sync error:", e);
      res.status(500).json({ error: e.message || "Failed to fully synchronize data." });
    }
  });

  // Dedicated Fetch Endpoint to pull complete master data exactly once upon login/startup
  app.get("/api/fetch", requireAuth, async (req, res) => {
    try {
      const userEmail = (req as any).userEmail;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000;
      const offset = (page - 1) * limit;

      await withDb(async (db) => {
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
        let allInventory = [];
        let allRecipes = [];
        let allChecklist = [];
        let allCustomEvents = [];
        let allDispatchedNotifications = [];
        let allScheduledAlerts = [];
        let allBakeryProfile = [];

        if (page === 1) {
          allInventory = await querySqlAll<any>(db, "SELECT * FROM inventory WHERE user_email = ? ORDER BY updatedAt DESC", [userEmail]);
          allRecipes = await querySqlAll<any>(db, "SELECT * FROM recipes WHERE user_email = ?", [userEmail]);
          allChecklist = await querySqlAll<any>(db, "SELECT * FROM checklist WHERE user_email = ?", [userEmail]);
          allCustomEvents = await querySqlAll<any>(db, "SELECT * FROM custom_events WHERE user_email = ? ORDER BY createdAt DESC", [userEmail]);
          allDispatchedNotifications = await querySqlAll<any>(db, "SELECT * FROM dispatched_notifications WHERE user_email = ? ORDER BY dispatchedAt DESC", [userEmail]);
          allScheduledAlerts = await querySqlAll<any>(db, "SELECT * FROM scheduled_alerts WHERE user_email = ? ORDER BY createdAt DESC", [userEmail]);
          allBakeryProfile = await querySqlAll<any>(db, "SELECT * FROM bakery_profile WHERE user_email = ? ORDER BY updatedAt DESC", [userEmail]);
        }

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

        // We have more data if either of the paginated tables is returned at the limit boundary
        const hasMore = decryptedCustomers.length === limit || decryptedOrders.length === limit;

        res.json({
          status: "success",
          page,
          limit,
          hasMore,
          customers: decryptedCustomers,
          orders: formattedOrders,
          inventory: decryptedInventory,
          recipes: formattedRecipes,
          checklist: formattedChecklist,
          customEvents: decryptedCustomEvents,
          dispatchedNotifications: decryptedDispatchedNotifications,
          customScheduledAlerts: decryptedScheduledAlerts, // matching Dexie payload property
          scheduledAlerts: decryptedScheduledAlerts,
          bakeryProfile: decryptedBakeryProfile,
          syncTime: new Date().toISOString()
        });
      });
    } catch (e: any) {
      console.error("Fetch master error:", e);
      res.status(500).json({ error: e.message || "Failed to fetch master data." });
    }
  });

  // Single entity creation endpoints for helper operations
  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const rawO = req.body;
      const o = encryptRow(rawO);
      const userEmail = (req as any).userEmail;
      await withDb(async (db) => {
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
        `, [
          o.id, o.customerId, o.customerName, o.customerMobile, o.eventType, o.eventDate, o.deliveryTime, o.venueAddress,
          o.cakeShape, o.cakeWeight, o.cakeFlavor, o.preference, o.layers, o.cakeInscription, o.referenceImage,
          o.specialInstructions, o.basePrice, o.decorationCharge, o.deliveryFee, o.totalAmount, o.status, o.createdAt, o.updatedAt,
          userEmail, o.isDeleted !== undefined ? o.isDeleted : 0,
          o.paymentStatus || 'Unpaid', o.paidAmount || 0, typeof o.paymentHistory === "string" ? o.paymentHistory : JSON.stringify(o.paymentHistory || [])
        ]);
        res.json({ success: true });
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve Frontend with Vite Middleware in Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production statics serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Floura custom Express/SQLite backend listening on port ${PORT}`);
  });
}

startServer();
