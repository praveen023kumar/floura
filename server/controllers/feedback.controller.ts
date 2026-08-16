import { Request, Response } from "express";
import { createFeedback, listFeedbacksForUser, listAllFeedbacks, updateFeedbackStatus } from "../models/feedback.model";
import { validateEmail, writeAuditLog } from "../middleware/security.middleware";

export async function submitFeedback(req: Request, res: Response) {
  try {
    const { name, email, category, title, message, rating, imageUrl } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required for feedback." });
    }
    
    if (email && !validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const id = "fb_" + Math.random().toString(36).substring(2) + Date.now();
    const createdAt = new Date().toISOString();
    const status = "Pending";

    await createFeedback(
      id,
      name || "",
      email || "",
      category || "Suggestion",
      title || "",
      message,
      rating !== undefined ? rating : 5,
      imageUrl || "",
      status,
      createdAt
    );

    await writeAuditLog(email || "anonymous", "FEEDBACK_SUBMITTED", { feedbackId: id }, req);

    res.json({
      status: "success",
      feedback: { id, name, email, category, title, message, rating, imageUrl, status, createdAt }
    });
  } catch (err: any) {
    console.error("Feedback submit error:", err);
    res.status(500).json({ error: err.message || "Failed to submit feedback." });
  }
}

export async function getUserFeedbacks(req: Request, res: Response) {
  try {
    const userEmail = (req as any).userEmail;
    const feedbacks = await listFeedbacksForUser(userEmail);
    res.json({ status: "success", feedbacks });
  } catch (err: any) {
    console.error("Get user feedbacks error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch feedbacks." });
  }
}

export async function adminListFeedbacks(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("feedbacks")) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions to view feedbacks." });
    }
    const feedbacks = await listAllFeedbacks();
    res.json({
      status: "success",
      feedbacks
    });
  } catch (err: any) {
    console.error("Fetch feedbacks error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch feedbacks." });
  }
}

export async function adminUpdateFeedbackStatus(req: Request, res: Response) {
  try {
    const adminUser = (req as any).adminUser;
    if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("feedbacks")) {
      return res.status(403).json({ error: "Access Denied: Insufficient permissions to update feedback status." });
    }
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }
    
    await updateFeedbackStatus(id, status);
    await writeAuditLog(adminUser.email, "FEEDBACK_STATUS_UPDATED", { feedbackId: id, status }, req);

    res.json({ status: "success" });
  } catch (err: any) {
    console.error("Update feedback status error:", err);
    res.status(500).json({ error: err.message || "Failed to update feedback status." });
  }
}
