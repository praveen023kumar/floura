import { Request, Response } from "express";
import { getSecurityMetrics } from "../middleware/security.middleware";
import { getAllAuditLogs } from "../models/security.model";

export function getMetrics(req: Request, res: Response) {
  const adminUser = (req as any).adminUser;
  if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("setup")) {
    return res.status(403).json({ error: "Access Denied: Insufficient permissions." });
  }
  res.json({ status: "success", metrics: getSecurityMetrics() });
}

export async function getAuditLogs(req: Request, res: Response) {
  const adminUser = (req as any).adminUser;
  if (adminUser.role !== "superadmin" && !adminUser.permissions.includes("setup")) {
    return res.status(403).json({ error: "Access Denied: Insufficient permissions." });
  }
  try {
    const logs = await getAllAuditLogs(200);
    res.json({ status: "success", logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
