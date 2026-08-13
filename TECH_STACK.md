# 🛠️ Tech Stack — Floura

> A full reference of every technology, library, and tool used in this project.

---

## 📌 Project Overview

**Floura** is a premium baking & event management platform with a unified hybrid architecture — a single codebase that serves a **web app** (via browser) and **native mobile apps** (via Apache Cordova).

---

## 🎨 Frontend

| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | `^19.0.1` | Core UI framework (component-based, declarative) |
| [TypeScript](https://www.typescriptlang.org/) | `~5.8.2` | Static typing for JavaScript |
| [Tailwind CSS](https://tailwindcss.com/) | `^4.3.2` | Utility-first CSS framework for styling |
| [Vite](https://vite.dev/) | `^6.2.3` | Frontend build tool and dev server with HMR |
| [react-router-dom](https://reactrouter.com/) | `^7.18.0` | Client-side routing and navigation |
| [lucide-react](https://lucide.dev/) | `^0.546.0` | Icon library (SVG-based) |
| [Motion (Framer Motion)](https://motion.dev/) | `^12.23.24` | Animation and transitions library |
| [react-select](https://react-select.com/) | `^5.10.2` | Customisable dropdown/select component |
| [Recharts](https://recharts.org/) | `^3.10.1` | Composable chart and data visualisation library |

---

## 🖥️ Backend

| Technology | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18.x | JavaScript runtime for the server |
| [Express](https://expressjs.com/) | `^4.21.2` | HTTP server framework and REST API router |
| [TypeScript](https://www.typescriptlang.org/) | `~5.8.2` | Static typing for server-side code |
| [tsx](https://tsx.is/) | `^4.21.0` | TypeScript execution engine for dev mode |
| [esbuild](https://esbuild.github.io/) | `^0.25.0` | Bundles the server for production |
| [dotenv](https://github.com/motdotla/dotenv) | `^17.2.3` | Loads environment variables from `.env` |

---

## 🗄️ Database

| Technology | Version | Purpose |
|---|---|---|
| [SQLite3](https://www.sqlite.org/) | `^5.1.7` | Server-side relational database (via `sqlite3` npm package) |
| [Dexie.js](https://dexie.org/) | `^4.4.4` | IndexedDB wrapper for client-side local database |
| [CryptoJS](https://cryptojs.gitbook.io/docs/) | `^4.2.0` | AES encryption for sensitive data at rest (both client & server) |

> **Architecture Note:** Floura uses a dual-database, offline-first strategy. SQLite persists data on the server; Dexie (IndexedDB) mirrors it on the client with AES-256 encrypted fields, enabling full offline operation and sync-on-reconnect.

---

## ☁️ Cloud & Authentication

| Technology | Version | Purpose |
|---|---|---|
| [Firebase](https://firebase.google.com/) | `^12.15.0` | Google OAuth / Authentication provider |
| [Firebase Auth](https://firebase.google.com/docs/auth) | (bundled) | Sign-in with Google (popup flow) |

---

## 🤖 AI / ML

| Technology | Version | Purpose |
|---|---|---|
| [Google GenAI SDK (`@google/genai`)](https://ai.google.dev/) | `^2.4.0` | Gemini API integration for kitchen suggestions and analytics |

> **Config:** `GEMINI_API_KEY` is required via the `.env` file (see `.env.example`).

---

## 📦 State Management & Data Fetching

| Technology | Version | Purpose |
|---|---|---|
| [TanStack Query (React Query)](https://tanstack.com/query) | `^5.101.0` | Server-state management, caching, and background refetching |
| React built-in hooks | — | Local component state (`useState`, `useReducer`, `useContext`) |
| Custom hooks (`/src/hooks/`) | — | Domain-specific business logic encapsulation |

---

## 📱 Mobile

| Technology | Version | Purpose |
|---|---|---|
| [Apache Cordova](https://cordova.apache.org/) | `^12.0.0` | Wraps the web build into native iOS & Android apps |
| `cordova-plugin-inappbrowser` | — | Opens system browser for Google OAuth on mobile |
| `cordova-plugin-customurlscheme` | — | Deep-link handling (`floura://auth`) for post-auth redirect |
| [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) | `^3.1.1` | AsyncStorage bridge for Cordova-compatible persistent storage |

---

## 🧰 Dev Tooling

| Technology | Version | Purpose |
|---|---|---|
| [TypeScript](https://www.typescriptlang.org/) | `~5.8.2` | Compile-time type checking (`tsc --noEmit`) |
| [Vite](https://vite.dev/) | `^6.2.3` | Dev server with HMR; production bundler |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | `^5.0.4` | Vite plugin for React (Babel-based fast refresh) |
| [@tailwindcss/vite](https://tailwindcss.com/docs/installation/using-vite) | `^4.1.14` | Tailwind CSS v4 Vite integration |
| [Autoprefixer](https://github.com/postcss/autoprefixer) | `^10.4.21` | CSS vendor prefix automation |
| [@rollup/rollup-darwin-x64](https://rollupjs.org/) | `^4.62.2` | Optional Rollup native binding for macOS (x64 builds) |

---

## 🌐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for AI features |
| `APP_URL` | ✅ Yes | Base URL of the hosted server (used for OAuth callbacks) |

> See [`.env.example`](file:///Users/praveen/antigravity/floura/.env.example) for the template.

---

## 📁 Project Structure Summary

```
floura/
├── src/                  # React frontend source
│   ├── components/       # UI components (views, modals, shared)
│   ├── hooks/            # Custom React hooks (domain logic)
│   ├── db.ts             # Dexie IndexedDB client + encryption
│   ├── firebase.ts       # Firebase Auth setup
│   └── App.tsx           # Root component & routing
├── server.ts             # Express backend server (REST API + Vite middleware)
├── server-db.ts          # SQLite database layer (server-side)
├── shared/               # Shared types/utilities between client & server
├── cordova/              # Apache Cordova mobile project
├── public/               # Static assets served directly
├── dist/                 # Production build output
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # NPM scripts & dependencies
```

---

*Last updated: August 2026*
