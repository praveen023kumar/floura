import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import feedbackRoutes from "./feedback.routes";
import syncRoutes from "./sync.routes";
import securityRoutes from "./security.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/", feedbackRoutes); // maps /feedbacks and /admin/feedbacks
router.use("/", syncRoutes);     // maps /sync, /fetch, /orders
router.use("/admin/security", securityRoutes); // maps /admin/security/metrics, /admin/security/logs

export default router;
