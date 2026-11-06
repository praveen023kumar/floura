// File Path: /server/controllers/payment.controller.ts
import { Request, Response } from "express";
import crypto from "crypto";
import { recordPayment, recordPaymentFailure } from "../models/admin.model";
import { findUserByEmail } from "../models/user.model";

export const SUBSCRIPTION_PLANS = [
  { id: "1_month", months: 1, name: "1 Month Pro", price: 99, currency: "INR", discount: 0, description: "Monthly Bakery Pro Access" },
  { id: "3_months", months: 3, name: "3 Months Pro", price: 269, currency: "INR", discount: 10, description: "Quarterly Access (Save 10%)" },
  { id: "6_months", months: 6, name: "6 Months Pro", price: 499, currency: "INR", discount: 15, description: "Half-Year Access (Save 15%)" },
  { id: "12_months", months: 12, name: "12 Months Pro", price: 899, currency: "INR", discount: 25, description: "Annual Access (Save 25%)" }
];

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";
  const isConfigured = keyId.length > 0 && keySecret.length > 0 && !keyId.includes("your_key_id");
  return { keyId, keySecret, webhookSecret, isConfigured };
}

/**
 * Public configuration endpoint for Razorpay Checkout
 */
export async function getConfig(req: Request, res: Response) {
  try {
    const { keyId, isConfigured } = getRazorpayCredentials();
    res.json({
      status: "success",
      keyId: isConfigured ? keyId : "rzp_test_placeholder",
      isLive: keyId.startsWith("rzp_live"),
      isConfigured,
      currency: "INR",
      plans: SUBSCRIPTION_PLANS
    });
  } catch (err: any) {
    console.error("[Payment Config Error]:", err);
    res.status(500).json({ error: "Failed to fetch payment configuration." });
  }
}

/**
 * Create a new Razorpay Order for subscription purchase or validity extension
 */
export async function createOrder(req: Request, res: Response) {
  try {
    const { userEmail, planId, customMonths, customAmount } = req.body;
    if (!userEmail) {
      return res.status(400).json({ error: "User email is required to initiate payment." });
    }

    const emailKey = String(userEmail).toLowerCase().trim();
    let months = 1;
    let amount = 99;
    let planName = "1 Month Pro";

    if (customMonths && customAmount) {
      months = Math.max(1, parseInt(customMonths, 10) || 1);
      amount = Math.max(10, parseFloat(customAmount) || 99);
      planName = `${months} Months Custom Pro`;
    } else if (planId) {
      const selected = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (selected) {
        months = selected.months;
        amount = selected.price;
        planName = selected.name;
      }
    }

    const amountInPaise = Math.round(amount * 100);
    const { keyId, keySecret, isConfigured } = getRazorpayCredentials();

    if (isConfigured) {
      // Direct REST API call to Razorpay Orders API
      const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const orderPayload = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `floura_rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        notes: {
          userEmail: emailKey,
          months: String(months),
          planName
        }
      };

      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("[Razorpay API Error]:", data);
        return res.status(response.status).json({
          error: data.error?.description || "Failed to create Razorpay order."
        });
      }

      return res.json({
        status: "success",
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
        keyId,
        months,
        planName
      });
    }

    // Mock Simulation Mode (when Razorpay keys are not yet provided in .env)
    const mockOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return res.json({
      status: "success",
      orderId: mockOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: "rzp_test_simulated",
      isSimulation: true,
      months,
      planName
    });
  } catch (err: any) {
    console.error("[Create Order Error]:", err);
    res.status(500).json({ error: err.message || "Internal server error creating order." });
  }
}

/**
 * Verify Razorpay payment signature & activate or extend user subscription
 */
export async function verifyPayment(req: Request, res: Response) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userEmail,
      months,
      amount,
      planName
    } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "User email is required for payment verification." });
    }

    const emailKey = String(userEmail).toLowerCase().trim();
    const parsedMonths = Math.max(1, parseInt(months, 10) || 1);
    const parsedAmount = parseFloat(amount) || 99;
    const { keySecret, isConfigured } = getRazorpayCredentials();

    const isSimulationOrder = typeof razorpay_order_id === "string" && razorpay_order_id.startsWith("order_sim_");

    if (isConfigured && !isSimulationOrder) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required payment parameters for verification." });
      }

      // Verify HMAC SHA256 Signature
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpay_signature) {
        console.warn(`[Razorpay Signature Mismatch] for email: ${emailKey}`);
        await recordPaymentFailure({
          userEmail: emailKey,
          amount: parsedAmount,
          currency: "INR",
          months: parsedMonths,
          paymentMethod: "Razorpay",
          referenceId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          failureReason: "HMAC signature verification failed"
        });

        return res.status(400).json({
          status: "failed",
          error: "Invalid payment signature. Transaction could not be verified."
        });
      }
    }

    // Payment is verified! Record transaction and extend subscription
    const paymentResult = await recordPayment({
      userEmail: emailKey,
      amount: parsedAmount,
      currency: "INR",
      months: parsedMonths,
      paymentMethod: isSimulationOrder ? "Razorpay (Test Simulation)" : "Razorpay Online",
      referenceId: razorpay_payment_id || `sim_${Date.now()}`,
      razorpayOrderId: razorpay_order_id || "",
      status: "success",
      recordedBy: isSimulationOrder ? "razorpay_simulator" : "razorpay_gateway",
      notes: `Subscription payment for ${parsedMonths} ${parsedMonths === 1 ? "month" : "months"} (${planName || "Pro"})`
    });

    const updatedUser = await findUserByEmail(emailKey);

    return res.json({
      status: "success",
      message: `Successfully extended subscription validity by ${parsedMonths} ${parsedMonths === 1 ? "month" : "months"}!`,
      newExpiry: paymentResult.newExpiry,
      paymentId: paymentResult.paymentId,
      subscription_status: "active",
      subscription_expires_at: paymentResult.newExpiry,
      user: updatedUser
    });
  } catch (err: any) {
    console.error("[Verify Payment Error]:", err);
    res.status(500).json({ error: err.message || "Failed to verify payment." });
  }
}

/**
 * Record a failed, cancelled, or dismissed payment attempt
 */
export async function recordFailure(req: Request, res: Response) {
  try {
    const {
      userEmail,
      amount,
      months,
      orderId,
      paymentId,
      errorCode,
      errorDescription
    } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "User email is required." });
    }

    const emailKey = String(userEmail).toLowerCase().trim();
    const parsedAmount = parseFloat(amount) || 99;
    const parsedMonths = Math.max(1, parseInt(months, 10) || 1);
    const reason = errorDescription || errorCode || "Payment cancelled or dismissed by customer";

    await recordPaymentFailure({
      userEmail: emailKey,
      amount: parsedAmount,
      currency: "INR",
      months: parsedMonths,
      paymentMethod: "Razorpay",
      referenceId: paymentId || orderId || "",
      razorpayOrderId: orderId || "",
      failureReason: reason,
      notes: `Failed Attempt: ${errorCode ? `[${errorCode}] ` : ""}${reason}`
    });

    res.json({
      status: "success",
      message: "Failure logged."
    });
  } catch (err: any) {
    console.error("[Record Failure Error]:", err);
    res.status(500).json({ error: "Failed to record payment failure." });
  }
}

/**
 * Asynchronous webhook handler for Razorpay server-to-server notifications
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    const { webhookSecret } = getRazorpayCredentials();
    const signature = req.headers["x-razorpay-signature"] as string;

    if (webhookSecret && signature) {
      const bodyStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(bodyStr)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.warn("[Razorpay Webhook] Invalid signature received.");
        return res.status(400).send("Invalid webhook signature.");
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const userEmail = notes.userEmail;
      const months = parseInt(notes.months, 10) || 1;
      const amount = (paymentEntity?.amount || 9900) / 100;

      if (userEmail) {
        await recordPayment({
          userEmail: String(userEmail).toLowerCase().trim(),
          amount,
          currency: paymentEntity?.currency || "INR",
          months,
          paymentMethod: "Razorpay Webhook",
          referenceId: paymentEntity?.id || "",
          razorpayOrderId: paymentEntity?.order_id || "",
          status: "success",
          recordedBy: "razorpay_webhook",
          notes: `Webhook captured payment: ${event}`
        });
        console.log(`[Razorpay Webhook] Payment verified and logged for ${userEmail}`);
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const userEmail = notes.userEmail;
      const months = parseInt(notes.months, 10) || 1;
      const amount = (paymentEntity?.amount || 9900) / 100;

      if (userEmail) {
        await recordPaymentFailure({
          userEmail: String(userEmail).toLowerCase().trim(),
          amount,
          currency: paymentEntity?.currency || "INR",
          months,
          paymentMethod: "Razorpay Webhook",
          referenceId: paymentEntity?.id || "",
          razorpayOrderId: paymentEntity?.order_id || "",
          failureReason: paymentEntity?.error_description || "Webhook payment.failed event",
          notes: `Webhook reported failed payment: ${paymentEntity?.error_code || ""}`
        });
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (err: any) {
    console.error("[Razorpay Webhook Error]:", err);
    res.status(500).json({ error: "Webhook processing error." });
  }
}
