import { Router } from "express";
import { AuditLog } from "../db";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// ==========================================
// 1. GET AUDIT LOGS (Admin Only)
// ==========================================
router.get("/", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const { action, role, search } = req.query;
    const query: any = {};

    if (action && action !== "ALL") query.action = action;
    if (role && role !== "ALL") query.role = role;
    if (search) {
      query.$or = [
        { description: { $regex: String(search), $options: "i" } },
        { userEmail: { $regex: String(search), $options: "i" } },
        { action: { $regex: String(search), $options: "i" } },
        { entityType: { $regex: String(search), $options: "i" } }
      ];
    }

    const logs = await AuditLog.find(query);
    res.json({
      success: true,
      total: logs.length,
      logs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
