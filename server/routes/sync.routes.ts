import { Router } from "express";
import * as SyncController from "../controllers/sync.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/sync", requireAuth, SyncController.sync);
router.get("/fetch", requireAuth, SyncController.fetchMaster);
router.post("/orders", requireAuth, SyncController.createSingleOrder);

export default router;
