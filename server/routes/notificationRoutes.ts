import { Router } from "express";
import { Notification } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// ==========================================
// 1. GET CURRENT USER'S NOTIFICATIONS
// ==========================================
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id });
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    res.json({
      success: true,
      total: notifications.length,
      unreadCount,
      notifications
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. MARK SPECIFIC AS READ
// ==========================================
router.patch("/:id/read", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, notification: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. MARK ALL AS READ
// ==========================================
router.patch("/read-all", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id });
    for (const notif of notifications) {
      if (!notif.isRead) {
        await Notification.findByIdAndUpdate(notif._id, { isRead: true });
      }
    }
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
