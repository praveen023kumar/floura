import { Router } from "express";
import { getDb, querySqlAll } from "../models/db";
import { decryptRow } from "../models/sync.model";

const router = Router();

// GET /api/public/orders/meta/:orderId - Unauthenticated public endpoint for preview metadata
router.get("/meta/:orderId", async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required." });
  }

  try {
    const db = await getDb();
    const rows = await querySqlAll<any>(
      db,
      `SELECT o.id, o.customerMobile, o.status, o.deliveryDate, o.deliveryTime, o.eventType, o.user_email, o.createdAt,
              b.bakeryName, b.phone as bakeryPhone, b.email as bakeryEmail, b.address as bakeryAddress, b.currency, b.dateFormat
       FROM orders o
       LEFT JOIN bakery_profile b ON o.user_email = b.user_email AND (b.isDeleted IS NULL OR b.isDeleted = 0)
       WHERE o.id = ? AND (o.isDeleted IS NULL OR o.isDeleted = 0)
       ORDER BY b.updatedAt DESC
       LIMIT 1`,
      [orderId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Order not found. Please verify your tracking link." });
    }

    const order = decryptRow(rows[0]);

    // Compute seller-scoped sequence ID (e.g. GT001)
    const createdAt = order.createdAt || new Date().toISOString();
    const countRes = await querySqlAll<any>(
      db,
      `SELECT COUNT(*) as cnt FROM orders 
       WHERE user_email = ? 
         AND (isDeleted IS NULL OR isDeleted = 0)
         AND (createdAt < ? OR (createdAt = ? AND id <= ?))`,
      [order.user_email, createdAt, createdAt, order.id]
    );
    const seqNum = countRes[0]?.cnt || 1;
    const seqId = `GT${String(seqNum).padStart(3, "0")}`;

    // Mask phone number for privacy hint (e.g. ••••••4321)
    const cleanPhone = (order.customerMobile || "").replace(/\D/g, "");
    const maskedPhone = cleanPhone.length >= 4 
      ? `••••••${cleanPhone.slice(-4)}`
      : "••••";

    res.json({
      orderId: order.id,
      seqId,
      bakeryName: order.bakeryName || "Floura Bakery",
      bakeryPhone: order.bakeryPhone || "",
      bakeryAddress: order.bakeryAddress || "",
      currency: order.currency || "$",
      dateFormat: order.dateFormat || "YYYY-MM-DD",
      status: order.status,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      eventType: order.eventType,
      maskedPhone,
    });
  } catch (err: any) {
    console.error("Public order meta retrieval error:", err);
    res.status(500).json({ error: "Failed to load order information." });
  }
});

// POST /api/public/orders/verify - Unlocks order details when phone matches customerMobile
router.post("/verify", async (req, res) => {
  const { orderId, phone } = req.body;
  if (!orderId || !phone) {
    return res.status(400).json({ error: "Order ID and mobile number are required." });
  }

  try {
    const db = await getDb();
    const rows = await querySqlAll<any>(
      db,
      `SELECT o.*,
              b.bakeryName, b.phone as bakeryPhone, b.email as bakeryEmail, b.address as bakeryAddress, b.currency, b.dateFormat
       FROM orders o
       LEFT JOIN bakery_profile b ON o.user_email = b.user_email AND (b.isDeleted IS NULL OR b.isDeleted = 0)
       WHERE o.id = ? AND (o.isDeleted IS NULL OR o.isDeleted = 0)
       ORDER BY b.updatedAt DESC
       LIMIT 1`,
      [orderId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = decryptRow(rows[0]);

    // Normalize phone numbers to the trailing 10 digits
    const normalize = (p: string) => (p || "").replace(/\D/g, "").slice(-10);
    const orderPhone10 = normalize(order.customerMobile);
    const inputPhone10 = normalize(phone);

    if (!orderPhone10 || orderPhone10 !== inputPhone10) {
      return res.status(403).json({
        error: "Mobile number does not match this order. Please enter the 10-digit number used during booking."
      });
    }

    // Compute seller-scoped sequence ID
    const createdAt = order.createdAt || new Date().toISOString();
    const countRes = await querySqlAll<any>(
      db,
      `SELECT COUNT(*) as cnt FROM orders 
       WHERE user_email = ? 
         AND (isDeleted IS NULL OR isDeleted = 0)
         AND (createdAt < ? OR (createdAt = ? AND id <= ?))`,
      [order.user_email, createdAt, createdAt, order.id]
    );
    const seqNum = countRes[0]?.cnt || 1;
    const seqId = `GT${String(seqNum).padStart(3, "0")}`;

    res.json({
      order: {
        id: order.id,
        seqId,
        customerName: order.customerName,
        customerMobile: order.customerMobile,
        eventType: order.eventType,
        eventDate: order.eventDate,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        venueAddress: order.venueAddress,
        cakeFlavor: order.cakeFlavor,
        cakeShape: order.cakeShape,
        cakeWeight: order.cakeWeight,
        layers: order.layers,
        preference: order.preference,
        cakeInscription: order.cakeInscription,
        referenceImage: order.referenceImage,
        specialInstructions: order.specialInstructions,
        status: order.status,
        basePrice: order.basePrice,
        decorationCharge: order.decorationCharge,
        deliveryFee: order.deliveryFee,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
      bakery: {
        bakeryName: order.bakeryName || "Floura Bakery",
        phone: order.bakeryPhone || "",
        email: order.bakeryEmail || order.user_email || "",
        address: order.bakeryAddress || "",
        currency: order.currency || "$",
        dateFormat: order.dateFormat || "YYYY-MM-DD",
      }
    });
  } catch (err: any) {
    console.error("Public order verification error:", err);
    res.status(500).json({ error: "Failed to verify order details." });
  }
});

export default router;
