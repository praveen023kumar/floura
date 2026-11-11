import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/external-start", AuthController.externalStart);
router.post("/external-complete", AuthController.externalComplete);
router.get("/external-poll", AuthController.externalPoll);
router.post("/send-otp", AuthController.sendOtp);
router.post("/verify-otp", AuthController.verifyOtpHandler);
router.post("/login", AuthController.login);
router.post("/demo-login", AuthController.demoLogin);
router.post("/profile", requireAuth, AuthController.updateProfile);
router.get("/verify", requireAuth, AuthController.verify);
router.get("/subscription-status", AuthController.getSubscriptionStatus);

export default router;
