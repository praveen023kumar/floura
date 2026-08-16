import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/external-start", AuthController.externalStart);
router.post("/external-complete", AuthController.externalComplete);
router.get("/external-poll", AuthController.externalPoll);
router.post("/login", AuthController.login);
router.post("/profile", requireAuth, AuthController.updateProfile);
router.get("/verify", requireAuth, AuthController.verify);

export default router;
