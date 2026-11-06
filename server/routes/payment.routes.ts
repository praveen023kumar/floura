// File Path: /server/routes/payment.routes.ts
import { Router } from "express";
import * as PaymentController from "../controllers/payment.controller";

const router = Router();

router.get("/config", PaymentController.getConfig);

// Informative GET fallbacks for browser testing
router.get("/create-order", (req, res) => {
  res.status(200).json({
    status: "info",
    message: "Razorpay Create Order API is active.",
    method_required: "POST",
    endpoint: "/api/payment/create-order",
    required_body_fields: {
      userEmail: "customer@example.com",
      planId: "1_month | 3_months | 6_months | 12_months (or customMonths & customAmount)"
    }
  });
});

router.get("/verify", (req, res) => {
  res.status(200).json({
    status: "info",
    message: "Razorpay Payment Verification API is active.",
    method_required: "POST",
    endpoint: "/api/payment/verify",
    required_body_fields: {
      userEmail: "customer@example.com",
      razorpay_order_id: "order_...",
      razorpay_payment_id: "pay_...",
      razorpay_signature: "..."
    }
  });
});

router.post("/create-order", PaymentController.createOrder);
router.post("/verify", PaymentController.verifyPayment);
router.post("/failed", PaymentController.recordFailure);
router.post("/webhook", PaymentController.handleWebhook);

export default router;
