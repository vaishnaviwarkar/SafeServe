import { Router } from "express";
import multer from "multer";
import { Complaint, Notification } from "../db";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";
import { uploadImageBuffer, recordAuditLog, updateActorTrustScore } from "../services/index";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ==========================================
// 1. SUBMIT COMPLAINT
// ==========================================
router.post("/", authenticateToken, upload.single("evidenceImage"), async (req: AuthRequest, res) => {
  try {
    const { category, description, relatedDonationId, relatedRescueId, priority } = req.body;

    if (!category || !description) {
      return res.status(400).json({ success: false, message: "Complaint category and description are required." });
    }

    let evidenceImageUrl = req.body.evidenceImageUrl;
    if (req.file) {
      const uploadRes = await uploadImageBuffer(req.file.buffer, req.file.originalname);
      evidenceImageUrl = uploadRes.imageUrl;
    }

    const complaint = await Complaint.create({
      submittedBy: req.user._id,
      submittedByName: req.user.fullName,
      role: req.user.role,
      category,
      description,
      relatedDonationId: relatedDonationId || null,
      relatedRescueId: relatedRescueId || null,
      priority: priority || "MEDIUM",
      evidenceImageUrl: evidenceImageUrl || "",
      status: "OPEN"
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
      action: "COMPLAINT_SUBMITTED",
      entityType: "COMPLAINT",
      entityId: String(complaint._id),
      description: `Complaint filed by ${req.user.email} under '${category}' (Priority: ${priority || "MEDIUM"}).`
    });

    res.status(201).json({
      success: true,
      message: "Complaint registered. SafeServe trust & safety team has been notified.",
      complaint
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. GET COMPLAINTS (Admin sees all; users see self)
// ==========================================
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, priority } = req.query;
    const query: any = {};

    if (req.user.role !== "ADMIN") {
      query.submittedBy = req.user._id;
    }

    if (status && status !== "ALL") query.status = status;
    if (priority && priority !== "ALL") query.priority = priority;

    const complaints = await Complaint.find(query);
    res.json({
      success: true,
      total: complaints.length,
      complaints
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. GET SINGLE COMPLAINT
// ==========================================
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint record not found" });
    }
    res.json({ success: true, complaint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. ADMIN UPDATE COMPLAINT (Status, notes, resolution)
// ==========================================
router.patch("/:id", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const { status, adminNotes, resolutionDetails, penalizeUserId, penaltyPoints } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint record not found" });
    }

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: status || complaint.status,
        adminNotes: adminNotes !== undefined ? adminNotes : complaint.adminNotes,
        resolutionDetails: resolutionDetails !== undefined ? resolutionDetails : complaint.resolutionDetails
      },
      { new: true }
    );

    // Optional trust score adjustment
    if (penalizeUserId && penaltyPoints) {
      await updateActorTrustScore(penalizeUserId, -Math.abs(Number(penaltyPoints)), `Complaint penalty resolution: ${complaint.category}`);
    }

    // Notify complainant
    await Notification.create({
      userId: complaint.submittedBy,
      title: `Complaint Status Updated: ${status || complaint.status}`,
      message: `Your complaint #${String(complaint._id).slice(-6)} has been reviewed. Note: ${adminNotes || resolutionDetails || "Updated"}`,
      type: status === "RESOLVED" ? "SUCCESS" : "INFO"
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: "ADMIN",
      action: "COMPLAINT_UPDATED",
      entityType: "COMPLAINT",
      entityId: String(complaint._id),
      description: `Complaint status updated to '${status || complaint.status}'. Resolution details logged.`
    });

    res.json({
      success: true,
      message: "Complaint updated successfully.",
      complaint: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
