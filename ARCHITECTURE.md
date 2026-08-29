# 🏛️ Floura — Full Project Architecture & Spec

This document details the system design, code patterns, and folder structure for the **Floura** hybrid platform. It details the offline-first **SQLite.wasm** client-side storage, synchronization protocols, and the Express-based security controls (IP blocking and bot request control).

---

## 📂 Folder Structure

```
floura/
├── .agents/                  # Agent configurations and skill definitions
├── assets/                   # Static media, icons, and platform resources
├── cordova/                  # Cordova hybrid mobile build wrapper (iOS/Android)
├── dist/                     # Bundled production asset output
├── public/                   # Public static files served by Express
├── src/                      # React frontend codebase
│   ├── assets/               # Frontend images, styles, and web-specific assets
│   ├── components/           # UI Views, Modals, Layouts, and Common elements
│   ├── hooks/                # Domain-specific custom hooks (useOrders, useRecipes)
│   ├── utils/                # Helper libraries (encryption, formatters)
│   ├── db-worker.ts          # SQLite.wasm background database worker
│   ├── db.ts                 # Database client interface communicating with Worker
│   ├── firebase.ts           # Firebase configuration and auth helper
│   ├── index.css             # Main stylesheet (Tailwind v4 integration)
│   ├── main.tsx              # React mounting entry point
│   ├── types.ts              # TypeScript type definitions
│   └── App.tsx               # Client router, login handler, and sync coordinator
├── server/                   # Express backend codebase
│   ├── controllers/          # Request handlers (auth, sync, static, settings)
│   ├── middleware/           # Security, auth, and routing middlewares
│   │   ├── auth.middleware.ts      # Token validation and user parsing
│   │   └── security.middleware.ts  # IP blocking, bot protection, and throttling
│   ├── models/               # SQLite interface (database, security, tables)
│   │   ├── db.ts                   # SQLite connector and base schema initializer
│   │   └── security.model.ts       # Database helper for IP blocks and audit logs
│   └── routes/               # API route group registrations (index.ts, etc.)
├── shared/                   # Shared TypeScript models and business logic
│   └── types.ts              # Contract models for sync payloads
├── package.json              # NPM build scripts and dependencies
├── server.ts                 # Express initialization and server starter
├── tsconfig.json             # TypeScript configuration mapping
└── vite.config.ts            # Vite compile and build pipeline configuration
```

---

## 🎨 Frontend Architecture

The frontend is built using **React 19**, **TypeScript**, **Tailwind CSS v4**, **Lucide React**, and **SQLite.wasm** for offline storage.

### 1. SQLite.wasm Integration (`src/db-worker.ts` & `src/db.ts`)
Floura stores all runtime user data inside the browser's **Origin Private File System (OPFS)** using `@sqlite.org/sqlite-wasm`. To keep the UI fluid and prevent blocking the main thread, the SQLite engine is initialised inside a **Web Worker**.

#### Web Worker Layer (`src/db-worker.ts`)
The worker handles:
* Initialization of the SQLite WASM binary.
* Dynamic table creation.
* Field-level encryption using **AES-GCM** with keys derived from the user's password using **PBKDF2**.
* CRUD execution via SQL statements.

```typescript
// db-worker.ts (Simplified SQLite Initialization & Message Routing)
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import CryptoJS from "crypto-js";

let db: any = null;
let userDbKey: any = null;

// Initialize SQLite WASM
sqlite3InitModule().then((sqlite3) => {
  const oo = sqlite3.opfs;
  if (oo) {
    db = new oo.OpfsDb("/patisserie_local.sqlite", "c");
    initializeTables();
    postMessage({ type: "DB_READY" });
  }
});

// Row-level Encryption
async function encryptValue(plainText: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText)
  );
  // Pack IV and ciphertext together
  const packed = new Uint8Array(iv.length + cipherBuffer.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(cipherBuffer), iv.length);
  return "__GCM__:" + btoa(String.fromCharCode(...packed));
}
```

#### Frontend Client Layer & Two-Stage Routing (`src/App.tsx` & `src/db.ts`)
The application divides routing into two distinct route trees based on authentication state to guarantee that the database worker is never initialized on public pages:

1. **Public Routes (Database-Free)**:
   - Covers `/landing`, `/login` (standard login page), and `/admin` (admin login/dashboard).
   - These components (e.g., `LandingPage` and `LoginView`) do not call database APIs or mount `useAppEngine()`.
   - Allows users to open multiple tabs of the landing/login pages concurrently without lock contentions.

2. **Private Workspace Routes (SQLite.wasm-Active)**:
   - Gated via `AppContentGate`. Only renders the `MainAppContent` component when an authenticated Chef session exists.
   - On mounting, `MainAppContent` executes the `useAppEngine()` hook, which lazily spins up the Web Worker, derives the AES keys, and opens the SQLite connection.
   - If this is a fresh login (marked by `isFreshLogin: true`), it cleans up previous data, downloads master backup data, and saves session info. Otherwise, it restores the session directly.

```typescript
// db.ts (Lazy Client API & Lock Release)
let worker: Worker | null = null;
let dbReady = false;

function getWorker(): Worker {
  if (!worker) {
    console.log("[DB] Lazily initializing SQLite database worker...");
    worker = new Worker(new URL("./db-worker.ts", import.meta.url), { type: "module" });
    setupWorkerListeners(worker);
  }
  return worker;
}

export function closeDatabase() {
  if (worker) {
    console.log("[DB] Terminating database worker to release OPFS locks...");
    worker.terminate();
    worker = null;
    dbReady = false;
  }
}
```

### 2. Styling & Icons (Tailwind & Lucide)
* **Tailwind CSS v4**: Built-in compiler is bundled through `@tailwindcss/vite`. Layouts use native variables and high-performance flex/grid combinations.
* **Lucide React**: High-quality SVG icons imported dynamically:
  ```tsx
  import { Shield, HardDrive, Wifi, RefreshCw } from "lucide-react";
  ```

---

## 🔄 Data Fetching & Sync Protocol

Data flows using a **Local-First, Offline-Safe** pipeline based on authentication state:

```
                  ┌───────────────┐
                  │  User Action  │
                  └───────┬───────┘
                          │ Write
                          ▼
                ┌──────────────────┐
                │ SQLite.wasm Local│ (localChange = 1)
                └─────────┬────────┘
                          │
                  ┌───────┴───────┐
         Offline  │   Log in?     │  No / Offline
      ┌───────────┤   Online?     ├───────────┐
      │           └───────┬───────┘           │
      ▼                   │ Yes               ▼
┌───────────┐             │             ┌───────────┐
│Queue Sync │             ▼             │Idle Local │
└───────────┘       ┌───────────┐       └───────────┘
                    │POST /sync │
                    └─────┬─────┘
                          │ Server Ack (200 OK)
                          ▼
                ┌──────────────────┐
                │ localChange = 0  │
                └──────────────────┘
```

### 1. Anonymous State (Local Store Mode)
* **No network fetching is allowed.**
* Every insert, edit, and deletion (soft delete using `isDeleted = 1`) is written immediately to **SQLite.wasm** locally.
* Every written row is flagged with `localChange = 1` and stamped with an ISO timestamp (`updatedAt`).

### 2. Authenticated State (Sync Mode)
Upon user login:
1. **Initial Master Fetch**:
   * The app checks if local stores are empty.
   * If empty, it calls `GET /api/fetch` to download all historical records scoped to the user's email.
   * The local database is seeded with this response, and `localChange` is set to `0`.
2. **Background Sync Sync Loop**:
   * When online, a sync schedule runs every **30 seconds** (or when the window receives an `online` event, or after manual user updates).
   * It compiles all dirty records (`localChange = 1`) into a single structured payload and posts it to the backend.

```typescript
// Background sync triggers (App.tsx)
const triggerSync = async () => {
  if (isSyncingRef.current || !navigator.onLine) return;
  isSyncingRef.current = true;

  try {
    // Gather all dirty records from local SQLite.wasm
    const dirtyPayload = {
      customers: await executeQuery("getDirty", "customers", {}),
      orders: await executeQuery("getDirty", "orders", {}),
    };

    const hasChanges = Object.values(dirtyPayload).some((arr) => arr.length > 0);
    if (!hasChanges) {
      isSyncingRef.current = false;
      return;
    }

    // Sync to Express Server
    const response = await fetch(`${serverUrl}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(dirtyPayload)
    });

    if (response.ok) {
      // Clear dirty flags in local database
      await executeQuery("markClean", "customers", { records: dirtyPayload.customers });
      await executeQuery("markClean", "orders", { records: dirtyPayload.orders });
    }
  } catch (error) {
    console.error("Sync failed, retrying in next loop...", error);
  } finally {
    isSyncingRef.current = false;
  }
};
```

---

## 🖥️ Backend Architecture & Security

The server is built with **Node.js, Express, and SQLite3**, hardened with advanced security middlewares.

### 1. IP Blocking Middleware
The server tracks malicious users and handles manual/automatic bans by maintaining a cached blacklist of IP addresses.

* **Database Table (`security_blocks`)**: Tracks IP address, block reason, and expiration timestamp.
* **Cache Management**: A fast-lookup in-memory `blockedIpsCache` Map is synced from the database every **15 seconds** to prevent slow disk lookups on every request.

```typescript
// IP check logic (server/middleware/security.middleware.ts)
const blockedIpsCache = new Map<string, { blockedUntil: number; reason: string }>();

export async function ipBlockingMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Bypass local development to prevent lockout
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return next();
  }

  const cachedBlock = blockedIpsCache.get(ip);
  if (cachedBlock) {
    if (cachedBlock.blockedUntil > Date.now()) {
      return res.status(403).json({
        error: `Access Denied: Your IP is temporarily blocked. Reason: ${cachedBlock.reason}`
      });
    } else {
      // Expired block - cleanup
      blockedIpsCache.delete(ip);
      unblockIpInDb(ip).catch(console.error);
    }
  }
  next();
}
```

### 2. Bot Request Control & DDoS Mitigation
Protects API routes from scrapers, brute-force attempts, and denial-of-service patterns:

1. **User-Agent Filtering**:
   * Scans headers for common bot tools (`curl`, `wget`, `python`, `postman`, `headless`, `sqlmap`).
   * Blocks the offending IP address for **60 minutes** on match.
2. **Request Rate Profiling**:
   * Limits single-IP clients to a maximum of **35 API requests per second** within a sliding window.
   * If a client violates this limit, the IP is automatically blocked for **120 minutes**.
3. **Abnormal Traffic Mitigation**:
   * A metrics analyzer runs every 1 minute.
   * If global rate limit hits, HTTP 4xx failures, or bot detections exceed configured thresholds, the server triggers **Mitigation Mode** for **10 minutes**, which cuts active API rate limits in half.

```typescript
// Bot & Rate check (server/middleware/security.middleware.ts)
const clientRequestTimestamps = new Map<string, number[]>();

export function botDetectionMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  
  if (!req.path.startsWith("/api")) {
    return next(); // Exempt static assets from bot check
  }

  // 1. User Agent Check
  const userAgent = req.headers["user-agent"] || "";
  const suspiciousAgents = [/curl/i, /wget/i, /python/i, /postman/i, /headless/i];
  if (suspiciousAgents.some(agent => agent.test(userAgent))) {
    blockIp(ip, "Automated scraping or CLI tools detected", 60);
    return res.status(403).json({ error: "Access Denied: Bot traffic restricted." });
  }

  // 2. Sliding Rate Check (35 req/sec limit)
  const now = Date.now();
  let timestamps = clientRequestTimestamps.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < 1000);
  timestamps.push(now);
  clientRequestTimestamps.set(ip, timestamps);

  if (timestamps.length > 35) {
    blockIp(ip, "DDoS / Bot request pattern flagged", 120);
    return res.status(403).json({ error: "Access Denied: Request limit exceeded." });
  }

  next();
}
```

### 3. Server Sync Handler (`POST /api/sync`)
The sync handler runs inside an atomic SQLite transaction. It updates records only if incoming changes are newer, and uses **AES-256** to encrypt sensitive columns before storing.

```typescript
// UPSERT structure (server.ts)
const syncTransaction = db.transaction((payload, userEmail) => {
  for (const customer of payload.customers) {
    // AES encrypt customer data on server
    const encName = encryptValue(customer.name);
    const encMobile = encryptValue(customer.mobile);

    db.prepare(`
      INSERT INTO customers (id, name, mobile, type, totalOrders, memberSince, updatedAt, user_email, isDeleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        mobile = excluded.mobile,
        type = excluded.type,
        totalOrders = excluded.totalOrders,
        updatedAt = excluded.updatedAt,
        isDeleted = excluded.isDeleted
      WHERE excluded.updatedAt > customers.updatedAt OR customers.updatedAt IS NULL
    `).run(customer.id, encName, encMobile, customer.type, customer.totalOrders, customer.memberSince, customer.updatedAt, userEmail, customer.isDeleted);
  }
});
```

---

## 🎛️ Session & Multi-Tab Coordination

Floura enforces robust data isolation and consistency across multiple tabs by coordinating authentication states and database access using native browser APIs.

### 1. Multi-Tab Logout Synchronization
To prevent unauthorized access or session leaks, logging out from any open tab instantly broadcasts a logout command to all other open tabs of the same application. This is coordinated via the browser’s **BroadcastChannel API**.

```typescript
// useAppEngine.ts (Logout Broadcast listener)
useEffect(() => {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

  const channel = new BroadcastChannel("floura_db_sync");
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === "logout") {
      // Pass 'true' to signal it was initiated by a broadcast, avoiding infinite broadcast loops
      handleLogoutRef.current(true);
    }
  };

  channel.addEventListener("message", handleMessage);
  return () => {
    channel.removeEventListener("message", handleMessage);
    channel.close();
  };
}, []);

// trigger logout locally and broadcast
async function handleLogout(isFromBroadcast = false) {
  setUser(null);
  localStorage.removeItem("patisserie_user");
  
  await localDb.delete();
  await localDb.open();

  if (!isFromBroadcast && "BroadcastChannel" in window) {
    const channel = new BroadcastChannel("floura_db_sync");
    channel.postMessage({ type: "logout" });
    channel.close();
  }
  navigate("/");
}
```

### 2. Single Active Tab Enforcement
Because SQLite.wasm operates on the client using the browser's **Origin Private File System (OPFS)**, standard file locks restrict write access to a single active handle at a time. The system leverages this restriction to enforce a single-tab policy **specifically for authenticated sessions**, preventing concurrency conflicts and database corruption.

* **Landing Page Multi-Tab Support**: If a user is not logged in (anonymous/landing page state), the database worker is not instantiated. Consequently, the OPFS database is not locked, and users can open as many landing page tabs/windows as they want.
* **Post-Login Concurrency Lock**: Once a user logs in, the worker is initialized and opens the database. If a user logs in or is already active on one tab, and attempts to open a second tab inside the authenticated portal, the second tab's worker fails to acquire the OPFS lock, throws a `NoModificationAllowedError`, and dispatches the `DB_LOCKED` event to trigger the lock UI modal.
* **Logout Lock Release**: When a user logs out, the worker is explicitly terminated via `closeDatabase()`, releasing the file lock immediately so other tabs can gain access.

