// File Path: /server.ts
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initDb } from "./server/models/db";
import apiRouter from "./server/routes";
import {
  ipBlockingMiddleware,
  monitoringMiddleware,
  botDetectionMiddleware,
  corsMiddleware,
  securityHeadersMiddleware,
  getRateLimiterMiddleware,
  requestThrottleMiddleware,
  timeoutMiddleware,
  idempotencyMiddleware,
  inputSanitizationMiddleware,
  refreshBlockedIpsCache
} from "./server/middleware/security.middleware";

async function startServer() {
  // Ensure DB and seed data exists (chains initSecurityDb internally)
  await initDb();
  
  // Load initial IP blocklist from database
  await refreshBlockedIpsCache();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Trust reverse proxy (LiteSpeed / Passenger / CloudLinux)
  app.enable("trust proxy");

  // Automatic HTTP -> HTTPS redirection in production
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") {
      const proto = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
      if (proto !== "https") {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
    }
    next();
  });

  // Block direct requests to database files, backups, and environment configurations
  app.use((req, res, next) => {
    const url = req.url.toLowerCase();
    if (
      url.endsWith(".sqlite") ||
      url.endsWith(".sqlite3") ||
      url.endsWith(".db") ||
      url.includes(".env") ||
      url.includes("patisserie.sqlite")
    ) {
      return res.status(403).json({ error: "Access Denied: Protected resource." });
    }
    next();
  });

  // ----- GLOBAL SECURITY MIDDLEWARES -----
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);
  app.use(ipBlockingMiddleware);
  app.use(botDetectionMiddleware);
  app.use(timeoutMiddleware);
  app.use(monitoringMiddleware);

  // Dynamic request size limits (1MB default, 20MB for sync and feedbacks)
  app.use((req, res, next) => {
    const isLargeRoute = req.path === "/api/sync" || req.path === "/api/feedbacks";
    const limit = isLargeRoute ? "20mb" : "1mb";
    express.json({ limit })(req, res, next);
  });
  app.use((req, res, next) => {
    const isLargeRoute = req.path === "/api/sync" || req.path === "/api/feedbacks";
    const limit = isLargeRoute ? "20mb" : "1mb";
    express.urlencoded({ extended: true, limit })(req, res, next);
  });

  // Global Input Sanitization (strips HTML/script tags recursively)
  app.use(inputSanitizationMiddleware);

  // Rate Limiting & Throttling configuration
  const authRateLimiter = getRateLimiterMiddleware(10, 60000); // 10 requests per minute
  const generalRateLimiter = getRateLimiterMiddleware(300, 900000); // 300 requests per 15 minutes

  app.use("/api", (req, res, next) => {
    const isAuthRoute = req.path === "/auth/login" || 
                        req.path === "/admin/login" || 
                        req.path === "/auth/external-start" || 
                        req.path === "/auth/external-complete";
    if (isAuthRoute) {
      return authRateLimiter(req, res, next);
    }
    return generalRateLimiter(req, res, (err) => {
      if (err) return next(err);
      requestThrottleMiddleware(req, res, next);
    });
  });

  // Duplicate request protection (Idempotency keys)
  app.use("/api", idempotencyMiddleware);

  // ----- MVC API ROUTER -----
  app.use("/api", apiRouter);

  // SEO Server-Side Dynamic Meta Tag & JSON-LD Injection for Public Recipe Pages (/calculator/:slug)
  const { seoServerSideInjectionMiddleware } = await import("./server/middleware/seo.middleware");
  app.use(seoServerSideInjectionMiddleware);

  // PWA Service Worker: Never cache sw.js so updates are recognized immediately
  app.get("/sw.js", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/javascript");
    const filePath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "sw.js")
      : path.join(process.cwd(), "public", "sw.js");
    res.sendFile(filePath);
  });

  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    const filePath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "manifest.json")
      : path.join(process.cwd(), "public", "manifest.json");
    res.sendFile(filePath);
  });

  // Serve Frontend with Vite Middleware in Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.set("vite", vite);
    app.use(vite.middlewares);
  } else {
    // Production statics serving
    const distPath = path.join(process.cwd(), "dist");
    const assetsPath = path.join(distPath, "assets");
    app.use("/assets", express.static(assetsPath));
    app.use("*/assets", express.static(assetsPath));
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Floura custom Express/SQLite MVC backend listening on port ${PORT}`);
  });
}

startServer();
