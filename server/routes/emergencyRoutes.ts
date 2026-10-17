import { Router } from "express";
import { EmergencyRequest, Notification } from "../db";
import { authenticateToken, requireRole, requireVerified, AuthRequest } from "../middleware/auth";
import { recordAuditLog } from "../services/index";

const router = Router();

// ==========================================
// 1. CREATE EMERGENCY REQUEST (NGO Only - Verified)
// ==========================================
router.post("/", authenticateToken, requireRole(["NGO", "ADMIN"]), requireVerified, async (req: AuthRequest, res) => {
  try {
    const {
      organizationName,
      contactPerson,
      phone,
      requiredFood,
      quantity,
      requiredQuantity,
      unit,
      urgency,
      location,
      city,
      state,
      requiredTime,
      deadline,
      description,
      reason
    } = req.body;

    const actualQuantity = Number(quantity || requiredQuantity);
    const actualTime = requiredTime || deadline || new Date(Date.now() + 4 * 3600000).toISOString();
    const actualLocation = location || req.user.address || `${req.user.organizationName || req.user.fullName || "Shelter Center"}, ${req.user.city || "Delhi"}`;
    const actualDescription = description || reason || "";

    if (!requiredFood || !actualQuantity) {
      return res.status(400).json({ success: false, message: "Required food and quantity must be specified." });
    }

    const emergency = await EmergencyRequest.create({
      ngoId: req.user._id,
      organizationName: organizationName || req.user.organizationName || req.user.fullName,
      contactPerson: contactPerson || req.user.contactPerson || req.user.fullName,
      phone: phone || req.user.phone,
      requiredFood,
      quantity: actualQuantity,
      unit: unit || "meals",
      urgency: urgency || "HIGH",
      location: actualLocation,
      city: city || req.user.city || "Delhi",
      state: state || req.user.state || "Delhi",
      requiredTime: actualTime,
      description: actualDescription,
      status: "OPEN"
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
      action: "EMERGENCY_REQUEST_CREATED",
      entityType: "EMERGENCY_REQUEST",
      entityId: String(emergency._id),
      description: `Emergency Food Request created by ${organizationName}: ${quantity} ${unit || "meals"} (${urgency} urgency).`
    });

    res.status(201).json({
      success: true,
      message: "Emergency food requisition broadcasted with priority tag.",
      emergency
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. GET EMERGENCY REQUESTS
// ==========================================
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, urgency } = req.query;
    const query: any = {};
    if (status && status !== "ALL") query.status = status;
    if (urgency && urgency !== "ALL") query.urgency = urgency;

    const requests = await EmergencyRequest.find(query);
    res.json({
      success: true,
      total: requests.length,
      requests
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. GET SINGLE EMERGENCY REQUEST
// ==========================================
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const emergency = await EmergencyRequest.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ success: false, message: "Emergency request not found" });
    }
    res.json({ success: true, emergency });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. UPDATE STATUS (Admin or Owning NGO)
// ==========================================
router.patch("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const emergency = await EmergencyRequest.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ success: false, message: "Emergency request not found" });
    }

    if (req.user.role !== "ADMIN" && String(emergency.ngoId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this request" });
    }

    const updated = await EmergencyRequest.findByIdAndUpdate(
      req.params.id,
      { status: status || emergency.status },
      { new: true }
    );

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
      action: "EMERGENCY_REQUEST_UPDATED",
      entityType: "EMERGENCY_REQUEST",
      entityId: String(emergency._id),
      description: `Emergency request status updated to '${status}'.`
    });

    res.json({ success: true, emergency: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
