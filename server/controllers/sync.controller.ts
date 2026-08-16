import { Request, Response } from "express";
import { performBulkSync, fetchMasterData, insertSingleOrder } from "../models/sync.model";
import { writeAuditLog } from "../middleware/security.middleware";

export async function sync(req: Request, res: Response) {
  try {
    const userEmail = (req as any).userEmail;
    await performBulkSync(userEmail, req.body);

    const { customers = [], orders = [], inventory = [] } = req.body;
    await writeAuditLog(userEmail, "BULK_SYNC", {
      customersCount: customers.length,
      ordersCount: orders.length,
      inventoryCount: inventory.length
    }, req);

    res.json({
      status: "success",
      syncTime: new Date().toISOString()
    });
  } catch (e: any) {
    console.error("Sync error:", e);
    res.status(500).json({ error: e.message || "Failed to fully synchronize data." });
  }
}

export async function fetchMaster(req: Request, res: Response) {
  try {
    const userEmail = (req as any).userEmail;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;

    const data = await fetchMasterData(userEmail, page, limit);

    res.json({
      status: "success",
      page,
      limit,
      ...data,
      syncTime: new Date().toISOString()
    });
  } catch (e: any) {
    console.error("Fetch master error:", e);
    res.status(500).json({ error: e.message || "Failed to fetch master data." });
  }
}

export async function createSingleOrder(req: Request, res: Response) {
  try {
    const userEmail = (req as any).userEmail;
    await insertSingleOrder(req.body, userEmail);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
