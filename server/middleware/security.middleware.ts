import express from "express";
import CryptoJS from "crypto-js";
import {
  insertBlockedIp,
  deleteBlockedIp,
  getActiveBlockedIps,
  findProcessedIdempotencyKey,
  saveProcessedIdempotencyKey,
  getFailedLogins,
  incrementFailedLoginCount,
  deleteFailedLogins,
  insertAuditLog
} from "../models/security.model";

// --- IP BLOCKING MIDDLEWARE ---

const blockedIpsCache = new Map<string, { blockedUntil: number; reason: string }>();

export async function refreshBlockedIpsCache() {
  try {
    const nowStr = new Date().toISOString();
    const activeBlocks = await getActiveBlockedIps(nowStr);

    blockedIpsCache.clear();
    for (const block of activeBlocks) {
      const blockedUntilTime = new Date(block.blocked_until).getTime();
      blockedIpsCache.set(block.ip, { blockedUntil: blockedUntilTime, reason: block.reason });
    }
  } catch (err) {
    console.error("[IP Block] Failed to refresh blocked IPs cache:", err);
  }
}

// Refresh cache immediately and start background task
// Start background task
setInterval(refreshBlockedIpsCache, 15000);

export async function blockIp(ip: string, reason: string, durationMinutes: number) {
  try {
    const blockUntil = await insertBlockedIp(ip, reason, durationMinutes);
    blockedIpsCache.set(ip, {
      blockedUntil: new Date(blockUntil).getTime(),
      reason
    });
    console.warn(`[IP Block] IP ${ip} blocked for ${durationMinutes} mins. Reason: ${reason}`);
  } catch (err) {
    console.error(`[IP Block] Failed to block IP ${ip}:`, err);
  }
}

export async function unblockIp(ip: string) {
  try {
    await deleteBlockedIp(ip);
    blockedIpsCache.delete(ip);
    console.log(`[IP Block] IP ${ip} unblocked.`);
  } catch (err) {
    console.error(`[IP Block] Failed to unblock IP ${ip}:`, err);
  }
}

export function ipBlockingMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Exempt loopback IP from blocking to prevent developer lockout
  const isLoopback = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "localhost" || ip === "unknown";
  if (isLoopback) {
    return next();
  }

  const cached = blockedIpsCache.get(ip);
  if (cached) {
    if (cached.blockedUntil > Date.now()) {
      trackSecurityMetric("blockedIpsHits");
      return res.status(403).json({
        error: `Access Denied: Your IP is temporarily blocked. Reason: ${cached.reason}`
      });
    } else {
      blockedIpsCache.delete(ip);
      unblockIp(ip).catch(console.error);
    }
  }
  next();
}

// --- MONITORING & ALERTS ---

interface TrafficMetrics {
  totalRequests: number;
  error4xx: number;
  error5xx: number;
  rateLimitHits: number;
  blockedIpsHits: number;
  botDetections: number;
  lastReset: number;
}

const metrics: TrafficMetrics = {
  totalRequests: 0,
  error4xx: 0,
  error5xx: 0,
  rateLimitHits: 0,
  blockedIpsHits: 0,
  botDetections: 0,
  lastReset: Date.now()
};

let rateLimitMultiplier = 1.0;
let mitigationActiveUntil = 0;

function trackSecurityMetric(metric: keyof Omit<TrafficMetrics, "lastReset">) {
  metrics[metric]++;
}

export function getSecurityMetrics() {
  return {
    ...metrics,
    mitigationActive: Date.now() < mitigationActiveUntil,
    rateLimitMultiplier
  };
}

// Reset and check metrics every minute
setInterval(() => {
  if (metrics.rateLimitHits > 50 || metrics.error4xx > 30 || metrics.botDetections > 5) {
    console.error(`[SECURITY ALERT] Abnormal traffic detected! 4xx: ${metrics.error4xx}, Bot triggers: ${metrics.botDetections}, RateLimit hits: ${metrics.rateLimitHits}`);
    rateLimitMultiplier = 0.5;
    mitigationActiveUntil = Date.now() + 10 * 60 * 1000;
  } else if (Date.now() > mitigationActiveUntil && rateLimitMultiplier < 1.0) {
    rateLimitMultiplier = 1.0;
    console.log("[SECURITY] Restoring normal rate limits.");
  }

  metrics.totalRequests = 0;
  metrics.error4xx = 0;
  metrics.error5xx = 0;
  metrics.rateLimitHits = 0;
  metrics.blockedIpsHits = 0;
  metrics.botDetections = 0;
  metrics.lastReset = Date.now();
}, 60000);

export function monitoringMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  metrics.totalRequests++;
  
  const originalSend = res.send.bind(res);
  res.send = (body: any) => {
    if (res.statusCode >= 500) {
      trackSecurityMetric("error5xx");
    } else if (res.statusCode >= 400) {
      trackSecurityMetric("error4xx");
    }
    return originalSend(body);
  };
  
  next();
}

// --- BOT DETECTION MIDDLEWARE ---

const clientRequestTimestamps = new Map<string, number[]>();

export function botDetectionMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Exempt loopback IP from bot detection to prevent developer lockout
  const isLoopback = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "localhost" || ip === "unknown";
  if (isLoopback) {
    return next();
  }

  // Only apply bot detection to API requests (static assets can load in large parallel bursts on refresh)
  if (!req.path.startsWith("/api")) {
    return next();
  }

  const userAgent = req.headers["user-agent"] || "";

  const suspiciousUserAgents = [
    /curl/i, /wget/i, /python/i, /postman/i, /headless/i, /sqlmap/i, /nikto/i, /nmap/i
  ];
  const isSuspiciousAgent = suspiciousUserAgents.some(regex => regex.test(userAgent));
  if (isSuspiciousAgent) {
    trackSecurityMetric("botDetections");
    console.warn(`[Bot Detected] Suspicious User Agent from IP ${ip}: ${userAgent}`);
    blockIp(ip, "Automated tools or suspicious User-Agent prohibited.", 60).catch(console.error);
    return res.status(403).json({ error: "Access Denied: Automated bots are restricted." });
  }

  const now = Date.now();
  let timestamps = clientRequestTimestamps.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < 1000);
  timestamps.push(now);
  clientRequestTimestamps.set(ip, timestamps);

  if (timestamps.length > 35) {
    trackSecurityMetric("botDetections");
    console.warn(`[Bot Detected] Rapid request rate from IP ${ip}: ${timestamps.length} req/sec`);
    blockIp(ip, "DDoS or bot request pattern detected.", 120).catch(console.error);
    return res.status(403).json({ error: "Access Denied: Request rate pattern flags bot behavior." });
  }

  next();
}

// --- CORS MIDDLEWARE ---

const TRUSTED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8080",
  "tauri://localhost",
  "http://localhost"
];

export function corsMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const origin = req.headers.origin;
  
  if (origin) {
    const isLocalhost = origin.startsWith("http://localhost:") || 
                        origin === "http://localhost" ||
                        origin.startsWith("http://127.0.0.1:") ||
                        origin === "http://127.0.0.1" ||
                        origin === "https://localhost" ||
                        origin.startsWith("tauri://");

    if (isLocalhost || TRUSTED_ORIGINS.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      console.warn(`[CORS Reject] Blocked access from untrusted origin: ${origin}`);
      return res.status(403).json({ error: "Access Denied: CORS origin not trusted." });
    }
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-email, idempotency-key, x-idempotency-key");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}

// --- SECURITY HEADERS MIDDLEWARE ---

export function securityHeadersMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // CSP Config supporting development servers, Firebase Auth, Google APIs, and Tauri
  const csp = [
    "default-src 'self' tauri://localhost http://localhost:*",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://www.gstatic.com https://apis.google.com https://*.firebaseapp.com",
    "style-src 'self' 'unsafe-inline' http://localhost:* https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: http://localhost:* https://images.unsplash.com https://*.googleusercontent.com",
    "connect-src 'self' http://localhost:* ws://localhost:* https://www.gstatic.com https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com",
    "frame-src 'self' https://*.firebaseapp.com https://apis.google.com"
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);
  
  next();
}

// --- RATE LIMITING & THROTTLING ---

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function getRateLimiterMiddleware(limit: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const route = req.path;
    const key = `${ip}:${route}`;
    const now = Date.now();

    const adjustedLimit = Math.floor(limit * rateLimitMultiplier);

    let record = rateLimitStore.get(key);
    if (!record || record.resetTime <= now) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count++;
    rateLimitStore.set(key, record);

    const remaining = Math.max(0, adjustedLimit - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.set("X-RateLimit-Limit", String(adjustedLimit));
    res.set("X-RateLimit-Remaining", String(remaining));
    res.set("X-RateLimit-Reset", String(resetSeconds));

    if (record.count > adjustedLimit) {
      trackSecurityMetric("rateLimitHits");
      return res.status(429).json({
        error: "Too Many Requests: Please slow down and try again later.",
        retryAfter: resetSeconds
      });
    }

    (req as any).rateLimitRemaining = remaining;
    (req as any).rateLimitMax = adjustedLimit;

    next();
  };
}

export function requestThrottleMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const remaining = (req as any).rateLimitRemaining;
  const limit = (req as any).rateLimitMax;

  if (remaining !== undefined && limit !== undefined) {
    const usagePercent = (limit - remaining) / limit;
    if (usagePercent > 0.8) {
      const delayMs = Math.min(2000, (limit - remaining) * 100);
      return setTimeout(() => next(), delayMs);
    }
  }
  next();
}

// --- TIMEOUT MIDDLEWARE ---

export function timeoutMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const timeoutMs = req.path === "/api/sync" ? 30000 : 10000;
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({ error: "Service Unavailable: Request timed out." });
    }
  }, timeoutMs);

  res.on("finish", () => clearTimeout(timer));
  res.on("close", () => clearTimeout(timer));
  next();
}

// --- IDEMPOTENCY MIDDLEWARE ---

export async function idempotencyMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.headers["idempotency-key"] || req.headers["x-idempotency-key"];
  if (!key || typeof key !== "string" || req.method === "GET" || req.method === "OPTIONS") {
    return next();
  }
  const userEmail = (req as any).userEmail || "anonymous";

  try {
    const cached = await findProcessedIdempotencyKey(key);
    if (cached) {
      if (cached.user_email !== userEmail) {
        return res.status(403).json({ error: "Access Denied: Idempotency key signature mismatch." });
      }
      res.status(cached.response_status);
      res.set("X-Cache-Idempotency", "HIT");
      return res.send(JSON.parse(cached.response_body));
    }
  } catch (err) {
    console.error("[Idempotency] Lookup error:", err);
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body: any) => {
    let bodyStr = typeof body === "string" ? body : JSON.stringify(body);
    saveProcessedIdempotencyKey(key, userEmail, res.statusCode || 200, bodyStr)
      .catch(err => console.error("[Idempotency] Failed to write cache:", err));
    return originalJson(body);
  };

  res.send = (body: any) => {
    let bodyStr = "";
    if (typeof body === "string") {
      bodyStr = body;
    } else {
      try {
        bodyStr = JSON.stringify(body);
      } catch {
        bodyStr = String(body);
      }
    }
    saveProcessedIdempotencyKey(key, userEmail, res.statusCode || 200, bodyStr)
      .catch(err => console.error("[Idempotency] Failed to write cache:", err));
    return originalSend(body);
  };

  next();
}

// --- INPUT SANITIZATION MIDDLEWARE ---

function sanitizeValue(val: any): any {
  if (typeof val === "string") {
    return val.replace(/<[^>]*>/g, "").trim();
  } else if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  } else if (typeof val === "object" && val !== null) {
    const sanitized: any = {};
    for (const [k, v] of Object.entries(val)) {
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return val;
}

export function inputSanitizationMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// --- LOGIN LOCKOUTS ---

export async function checkLoginLockout(email: string, ip: string): Promise<{ locked: boolean; timeLeftSec: number }> {
  const now = new Date().toISOString();
  const emailKey = email.toLowerCase().trim();
  const lockouts = await getFailedLogins(emailKey, ip);

  const isLoopback = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "localhost" || ip === "unknown";

  for (const lockout of lockouts) {
    // Exempt loopback IP lockout matching
    if (lockout.key === ip && isLoopback) {
      continue;
    }
    if (lockout.lockout_until && new Date(lockout.lockout_until) > new Date(now)) {
      const timeLeft = Math.ceil((new Date(lockout.lockout_until).getTime() - Date.now()) / 1000);
      return { locked: true, timeLeftSec: timeLeft };
    }
  }

  return { locked: false, timeLeftSec: 0 };
}

export async function recordFailedLoginAttempt(email: string, ip: string) {
  const emailKey = email.toLowerCase().trim();
  await incrementFailedLoginCount(emailKey, 5); // limit 5 for emails

  // Only track failed login limits for non-loopback IPs
  const isLoopback = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "localhost" || ip === "unknown";
  if (!isLoopback) {
    await incrementFailedLoginCount(ip, 10);      // limit 10 for IPs
  }
}

export async function resetFailedLoginAttempts(email: string, ip: string) {
  const emailKey = email.toLowerCase().trim();
  await deleteFailedLogins(emailKey, ip);
}

export async function writeAuditLog(userEmail: string, action: string, details: any, req: express.Request) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  await insertAuditLog(userEmail, action, details, ip);
}
