import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import feedbackRoutes from "./feedback.routes";
import syncRoutes from "./sync.routes";
import securityRoutes from "./security.routes";
import publicRecipeRoutes from "./publicRecipe.routes";
import publicOrderRoutes from "./publicOrder.routes";
import paymentRoutes from "./payment.routes";
import { getResolvedFirebaseConfig } from "../controllers/auth.controller";

const router = Router();

router.get("/health", (req, res) => {
  const fbConfig = getResolvedFirebaseConfig();
  const mask = (str?: string, visible: number = 4) => {
    if (!str) return "(not set)";
    if (str.length <= visible * 2) return "***";
    return `${str.slice(0, visible)}...${str.slice(-visible)} (${str.length} chars)`;
  };

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || "development",
    appUrl: process.env.APP_URL || null,
    backendUrl: process.env.BACKEND_URL || null,
    razorpay: {
      keyIdConfigured: Boolean(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID),
      keyIdMasked: mask(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID, 8),
      secretConfigured: Boolean(process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET)
    },
    firebase: {
      isConfigured: Boolean(fbConfig?.apiKey && fbConfig.apiKey !== "dummy-api-key"),
      projectId: fbConfig?.projectId || null,
      authDomain: fbConfig?.authDomain || null,
      apiKeyMasked: mask(fbConfig?.apiKey, 6)
    }
  });
});

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/payment", paymentRoutes);
router.use("/", feedbackRoutes); // maps /feedbacks and /admin/feedbacks
router.use("/", syncRoutes);     // maps /sync, /fetch, /orders
router.use("/admin/security", securityRoutes); // maps /admin/security/metrics, /admin/security/logs
router.use("/", publicRecipeRoutes); // maps /public/recipes and /admin/public-recipes
router.use("/public/orders", publicOrderRoutes); // maps /public/orders/meta/:orderId and /public/orders/verify

export default router;
