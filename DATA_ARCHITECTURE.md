# 📦 Floura — Data Architecture

> How data is stored, encrypted, and synchronized across the frontend and backend.

---

## Table of Contents

1. [Overview](#overview)
2. [Data Flow Diagram](#data-flow-diagram)
3. [Shared Data Models](#shared-data-models)
4. [Frontend Storage (IndexedDB)](#frontend-storage-indexeddb)
5. [Backend Storage (SQLite)](#backend-storage-sqlite)
6. [Data Encryption](#data-encryption)
7. [Authentication & Session Management](#authentication--session-management)
8. [Sync Protocol](#sync-protocol)
9. [Conflict Resolution](#conflict-resolution)
10. [API Reference](#api-reference)

---

## Overview

Floura is an **offline-first** bakery management app. All data is stored locally in the browser's **IndexedDB** and periodically synchronized to a **self-hosted Express + SQLite** backend server.

```
┌─────────────────────────────────┐       ┌─────────────────────────────────────┐
│         FRONTEND (React)         │       │         BACKEND (Express + SQLite)   │
│                                  │       │                                      │
│  ┌──────────────────────────┐    │       │   ┌──────────────────────────────┐   │
│  │  IndexedDB (Dexie)       │    │ HTTP  │   │  patisserie.sqlite            │   │
│  │  "PatisserieDatabaseV1"  │◄───┼──────►│   │  (field-level AES encryption) │   │
│  │  (AES blob encryption)   │    │ sync  │   └──────────────────────────────┘   │
│  └──────────────────────────┘    │       │                                      │
│                                  │       │   ┌──────────────────────────────┐   │
│  Shared Types & Logic            │       │   │  In-memory session maps       │   │
│  (/shared/types.ts)              │       │   │  (activeSessions, adminSessions│  │
│  (/shared/calculations.ts)       │       │   └──────────────────────────────┘   │
└─────────────────────────────────┘       └─────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Action
    │
    ▼
Frontend (React hook)
    │  write to localDb (IndexedDB)
    │  mark record: localChange = 1
    ▼
IndexedDB (Dexie — encrypted at rest)
    │
    │  On sync trigger (manual or periodic)
    ▼
POST /api/sync  ──────────────────────────────►  Express Server
    │  Bearer token + x-user-email header         │
    │  Body: {customers[], orders[], ...}          │  Per-field AES encrypt
    │                                              │  UPSERT with timestamp guard
    │                                              │  SQLite (patisserie.sqlite)
    ◄──────────────────────────────────────────────│
    │  Response: {customers[], orders[], ...}      │  Full table dump for user
    │             all server records               │
    ▼
seedLocalDbFromPayload()
    │  Compare updatedAt timestamps
    │  Server wins if newer & no pending localChange
    ▼
IndexedDB updated — UI re-renders
```

---

## Shared Data Models

All TypeScript interfaces live in `/shared/types.ts` and are imported by **both** the frontend and backend.

| Interface | Description |
|---|---|
| `Customer` | Bakery customer profile with type, order count, and membership date |
| `Order` | Full cake order with event info, cake specs, pricing, and payment history |
| `PaymentInstallment` | A single payment record linked to an Order |
| `InventoryItem` | Stock item with quantity, supplier, cost, and low-stock threshold |
| `Recipe` | Recipe with scaled ingredients and yield |
| `RecipeIngredient` | A single ingredient within a recipe |
| `ChecklistItem` | Daily/recurring task item |
| `CustomEvent` | Calendar event, reminder, or preparation alert |
| `DispatchedNotification` | WhatsApp/SMS notification log entry |
| `CustomScheduledAlert` | Customer follow-up alert with date |
| `BakeryProfile` | Bakery settings (name, currency, date format, etc.) |
| `SyncPayload` | Request body shape for `POST /api/sync` |
| `SyncResponse` | Response shape from `POST /api/sync` |

### Key Field Conventions

| Field | Type | Purpose |
|---|---|---|
| `id` | `string` (UUID) | Client-generated unique ID. Never server-assigned. |
| `updatedAt` | ISO string | Used for conflict resolution during sync |
| `isDeleted` | `number` (0 or 1) | Soft-delete flag. Records are never hard-deleted. |
| `localChange` | `number` (0 or 1) | Frontend-only: marks unsynchronized mutations |

---

## Frontend Storage (IndexedDB)

**File:** `src/db.ts`
**Library:** [Dexie.js](https://dexie.org/) — a typed IndexedDB wrapper
**Database name:** `PatisserieDatabaseV1`

### Tables

| Dexie Table | Indexed Fields |
|---|---|
| `customers` | `id, name, mobile, type, totalOrders, memberSince, updatedAt, localChange, isDeleted` |
| `orders` | `id, customerId, customerName, eventType, eventDate, status, createdAt, updatedAt, localChange, isDeleted` |
| `inventory` | `id, name, category, quantity, unit, minStockLevel, updatedAt, localChange, isDeleted` |
| `recipes` | `id, name, category, stdYield, updatedAt, localChange, isDeleted` |
| `checklist` | `id, text, checked, date, updatedAt, localChange, isDeleted` |
| `customEvents` | `id, title, date, type, createdAt, localChange, isDeleted` |
| `dispatchedNotifications` | `id, customerName, dispatchedAt, status, localChange, isDeleted` |
| `scheduledAlerts` | `id, customerName, alertDate, createdAt, localChange, isDeleted` |
| `bakeryProfile` | `id, bakeryName, email, updatedAt, localChange, isDeleted` |
| `preferences` | `key` (unencrypted — stores server URL, last sync time, etc.) |

### What is stored in `preferences`

| Key | Value |
|---|---|
| `serverUrl` | User-configured backend server URL |
| `lastSyncTime` | ISO timestamp of the last successful sync |
| `user` | Logged-in user object `{name, email, avatar, token}` |

---

## Backend Storage (SQLite)

**File:** `server-db.ts`
**Database file:** `patisserie.sqlite` (in project root)
**Library:** `sqlite3` (Node.js)

All business-data tables include `user_email` and `isDeleted` columns for multi-user isolation and soft deletes.

### `customers`
```sql
id TEXT PRIMARY KEY, name TEXT, mobile TEXT, type TEXT,
totalOrders INTEGER, memberSince TEXT, updatedAt TEXT,
user_email TEXT, isDeleted INTEGER DEFAULT 0
```

### `orders`
```sql
id TEXT PRIMARY KEY, customerId TEXT, customerName TEXT, customerMobile TEXT,
eventType TEXT, eventDate TEXT, deliveryDate TEXT, deliveryTime TEXT,
venueAddress TEXT, cakeShape TEXT, cakeWeight TEXT, cakeFlavor TEXT,
preference TEXT, layers TEXT, cakeInscription TEXT, referenceImage TEXT,
specialInstructions TEXT, basePrice REAL, decorationCharge REAL,
deliveryFee REAL, totalAmount REAL, status TEXT,
paymentStatus TEXT, paidAmount REAL, paymentHistory TEXT,
createdAt TEXT, updatedAt TEXT, user_email TEXT, isDeleted INTEGER DEFAULT 0
```

### `inventory`
```sql
id TEXT PRIMARY KEY, name TEXT, category TEXT, quantity REAL,
unit TEXT, minStockLevel REAL, supplier TEXT, costPrice REAL,
updatedAt TEXT, user_email TEXT, isDeleted INTEGER DEFAULT 0
```

### `recipes`
```sql
id TEXT PRIMARY KEY, name TEXT, category TEXT, stdYield REAL,
yieldUnit TEXT, ingredients TEXT, imageUrl TEXT,
updatedAt TEXT, user_email TEXT, isDeleted INTEGER DEFAULT 0
```

### `checklist`
```sql
id TEXT PRIMARY KEY, text TEXT, checked INTEGER, date TEXT,
updatedAt TEXT, user_email TEXT, isDeleted INTEGER DEFAULT 0
```

### `custom_events`
```sql
id TEXT PRIMARY KEY, title TEXT, date TEXT, type TEXT,
notes TEXT, createdAt TEXT, user_email TEXT, isDeleted INTEGER DEFAULT 0
```

### `dispatched_notifications`
```sql
id TEXT PRIMARY KEY, customerName TEXT, customerMobile TEXT,
cakeSpec TEXT, messageText TEXT, dispatchedAt TEXT,
status TEXT, user_email TEXT, isDeleted INTEGER DEFAULT 0
```

### `scheduled_alerts`
```sql
id TEXT PRIMARY KEY, customerName TEXT, customerMobile TEXT,
alertDate TEXT, notes TEXT, createdAt TEXT,
user_email TEXT, isDeleted INTEGER DEFAULT 0
```

### `bakery_profile`
```sql
id TEXT PRIMARY KEY, bakeryName TEXT, email TEXT, phone TEXT,
address TEXT, role TEXT, currency TEXT, dateFormat TEXT,
updatedAt TEXT, user_email TEXT, isDeleted INTEGER DEFAULT 0
```

### `users` (authentication)
```sql
email TEXT PRIMARY KEY, password_hash TEXT, name TEXT,
avatar TEXT, createdAt TEXT
```

> **Note:** `password_hash` stores the Google UID returned after Firebase Auth — it acts as the session bearer token for all subsequent API calls.

### `feedbacks`
```sql
id TEXT PRIMARY KEY, name TEXT, email TEXT, category TEXT,
title TEXT, message TEXT, rating INTEGER, imageUrl TEXT,
status TEXT DEFAULT 'Pending', createdAt TEXT
```

### `admin_users`
```sql
email TEXT PRIMARY KEY, name TEXT, password_hash TEXT,
salt TEXT, role TEXT, permissions TEXT, createdAt TEXT
```

---

## Data Encryption

Floura uses **AES-256** (via `crypto-js`) at **two independent layers**:

### Layer 1 — Frontend (IndexedDB at rest)

**File:** `src/db.ts`

Dexie hooks intercept all read/write operations transparently:

- **On write:** The full record (excluding `id`, `localChange`, `isDeleted`) is JSON-serialized and AES-encrypted into a single `encryptedData` blob. Only metadata stays in plaintext so Dexie can index it.
- **On read:** The `encryptedData` blob is decrypted and merged back before returning to the app.

```
Stored in IndexedDB:
{
  id: "uuid-123",
  localChange: 1,
  isDeleted: 0,
  encryptedData: "U2FsdGVkX1..."   // AES encrypted blob of all other fields
}
```

### Layer 2 — Backend (SQLite at rest)

**File:** `server.ts`

Individual sensitive fields are encrypted **per-column** before being written to SQLite.

**Encrypted fields:**
`name`, `mobile`, `customerName`, `customerMobile`, `eventType`, `venueAddress`, `cakeShape`, `cakeWeight`, `cakeFlavor`, `preference`, `layers`, `cakeInscription`, `referenceImage`, `specialInstructions`, `paymentStatus`, `paymentHistory`, `supplier`, `unit`, `ingredients`, `imageUrl`, `text`, `title`, `notes`, `messageText`, `bakeryName`, `email`, `phone`, `address`, `role`, `currency`, `dateFormat`

Encrypted values are prefixed with `__ENC__` as a sentinel:

```sql
name   = "__ENC__U2FsdGVkX1+abc..."
mobile = "__ENC__U2FsdGVkX1+xyz..."
```

> **Warning:** Both layers share the AES key `floura_kitchen_super_secret_db_key_2026` hardcoded in `src/db.ts` and `server.ts`. In production, move this to a secure environment variable.

---

## Authentication & Session Management

**Files:** `src/firebase.ts`, `src/hooks/useLogin.ts`, `server.ts`

### Flow 1 — Web / Desktop (Firebase Popup)

```
User clicks "Sign in with Google"
    │
    ▼
Firebase Auth → signInWithPopup()  →  { email, displayName, photoURL, uid }
    │
    ▼
POST /api/auth/login  { email, name, avatar, isGoogle: true }
    │
    ▼
Server: INSERT OR UPDATE users  (password_hash = Google UID as bearer token)
    │
    ▼
Response: { token, user: { name, email, avatar } }
    │
    ▼
Frontend: saves to IndexedDB preferences
All API calls include:  Authorization: Bearer <token>  +  x-user-email: <email>
```

### Flow 2 — Mobile / Tauri Native (External Browser + Polling)

```
App opens system browser:  GET /api/auth/external-start?state=<random_key>
    │
    ▼
Server renders Firebase-powered HTML login page
    │
    ▼
User completes Google sign-in in browser
    │
    ▼
Browser: POST /api/auth/external-complete  { state, email, name, avatar }
    │
    ▼
Server: activeSessions.set(state, { status: "completed", token, user })
    │
    ▼
App polls every 2s:  GET /api/auth/external-poll?state=<key>
    │  until status === "completed"
    ▼
App receives token → proceeds as normal
```

### Session Token Summary

| Token type | Storage | Lifetime |
|---|---|---|
| User Bearer Token | SQLite `users.password_hash` + IndexedDB `preferences` | Persistent until re-login |
| External Auth Session | In-memory `activeSessions` Map | Auto-cleared after 5 min |
| Admin Session | In-memory `activeAdminSessions` Map | Process lifetime |

---

## Sync Protocol

**Endpoint:** `POST /api/sync`
**Auth:** `Authorization: Bearer <token>` + `x-user-email: <email>` header

### Request Body (`SyncPayload`)

```typescript
{
  customers: Customer[],
  orders: Order[],
  inventory: InventoryItem[],
  recipes: Recipe[],
  checklist: ChecklistItem[],
  customEvents: CustomEvent[],
  dispatchedNotifications: DispatchedNotification[],
  scheduledAlerts: CustomScheduledAlert[],
  bakeryProfile: BakeryProfile[],
  lastSyncTime: string,
  pullAll?: boolean
}
```

### Response Body (`SyncResponse`)

```typescript
{
  status: "success",
  customers: Customer[],
  orders: Order[],
  inventory: InventoryItem[],
  recipes: Recipe[],
  checklist: ChecklistItem[],
  customEvents: CustomEvent[],
  dispatchedNotifications: DispatchedNotification[],
  scheduledAlerts: CustomScheduledAlert[],
  bakeryProfile: BakeryProfile[],
  syncTime: string
}
```

### Server-Side Steps

1. **Authenticate** — verify bearer token + email against `users` table
2. **Upsert** each record: `INSERT ... ON CONFLICT(id) DO UPDATE ... WHERE excluded.updatedAt > table.updatedAt`
3. **Encrypt** sensitive fields via `encryptRow()` before SQLite write
4. **Pull** all records for `user_email` from each table
5. **Decrypt** each row via `decryptRow()` before sending in the response

### Frontend-Side Merge (`seedLocalDbFromPayload`)

```
For each record from server:
  NOT in local IndexedDB  →  insert it
  In local IndexedDB:
    localChange = 0  →  overwrite with server version
    localChange = 1  →  only overwrite if server.updatedAt > local.updatedAt
```

---

## Conflict Resolution

Floura uses a **last-write-wins with `localChange` guard** strategy:

| Scenario | Resolution |
|---|---|
| Server record is newer, no local pending changes | Server wins — local overwritten |
| Local has `localChange=1`, server is newer | Server wins (timestamp) |
| Local has `localChange=1`, local is newer | Local pushed to server, overwrites it |
| Record only exists locally | Pushed to server on next sync |
| Record only exists on server | Pulled to local on next sync |
| Both soft-deleted | `isDeleted=1` propagates through sync |

> Records are **never hard-deleted** — only soft-deleted (`isDeleted=1`) so deletions propagate across all synced clients.

---

## API Reference

### Auth Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | None | Google OAuth sign-in / register |
| `GET` | `/api/auth/external-start` | None | Start external browser OAuth flow |
| `POST` | `/api/auth/external-complete` | None | Complete external OAuth |
| `GET` | `/api/auth/external-poll` | None | Poll for OAuth completion |

### Data Sync

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/sync` | Bearer | Bidirectional sync of all data tables |

### Feedback

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/feedbacks` | Bearer | Get user's submitted feedbacks |
| `POST` | `/api/feedbacks` | None | Submit feedback (public) |

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/admin/login` | None | Admin login (email + password) |
| `GET` | `/api/admin/users` | Admin Bearer | List admin accounts |
| `POST` | `/api/admin/users` | Admin Bearer (superadmin) | Create admin account |

---

## Key Files Summary

| File | Role |
|---|---|
| `shared/types.ts` | Single source of truth for all data models (frontend + backend) |
| `shared/calculations.ts` | Shared business logic (order totals, recipe scaling, dashboard stats) |
| `shared/api-config.ts` | Server URL constants and URL builder utility |
| `shared/format.ts` | Shared date/currency formatting utilities |
| `src/db.ts` | IndexedDB schema, AES encryption hooks, sync seeding logic |
| `src/firebase.ts` | Firebase Auth initialization |
| `src/hooks/useLogin.ts` | Google sign-in logic for web and native platforms |
| `server.ts` | Express server — API routes, auth middleware, field-level encryption |
| `server-db.ts` | SQLite initialization, table creation, schema migrations |
| `patisserie.sqlite` | SQLite database file (auto-created on first run) |
