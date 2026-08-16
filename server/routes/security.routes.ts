import { Router } from "express";
import * as SecurityController from "../controllers/security.controller";
import { requireAdminAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/metrics", requireAdminAuth, SecurityController.getMetrics);
router.get("/logs", requireAdminAuth, SecurityController.getAuditLogs);

export default router;
