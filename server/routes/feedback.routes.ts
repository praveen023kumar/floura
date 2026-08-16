import { Router } from "express";
import * as FeedbackController from "../controllers/feedback.controller";
import { requireAuth, requireAdminAuth } from "../middleware/auth.middleware";

const router = Router();

// User endpoints
router.post("/feedbacks", FeedbackController.submitFeedback);
router.get("/feedbacks", requireAuth, FeedbackController.getUserFeedbacks);

// Admin endpoints
router.get("/admin/feedbacks", requireAdminAuth, FeedbackController.adminListFeedbacks);
router.put("/admin/feedbacks/:id/status", requireAdminAuth, FeedbackController.adminUpdateFeedbackStatus);

export default router;
