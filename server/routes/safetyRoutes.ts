import { Router } from "express";
import { FoodSafetyAssessment, FoodDonation } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { evaluateFoodSafety } from "../services/index";

const router = Router();

// ==========================================
// 1. LIVE DRY-RUN SAFETY ASSESSMENT PREVIEW
// ==========================================
router.post("/assess", (req, res) => {
  try {
    const {
      foodCategory,
      preparationDate,
      preparationTime,
      expiryDate,
      expiryTime,
      storageCondition,
      packagingCondition,
      quantity
    } = req.body;

    if (!foodCategory || !preparationDate || !preparationTime || !expiryDate || !expiryTime || !storageCondition || !packagingCondition) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters for safety evaluation."
      });
    }

    const evaluation = evaluateFoodSafety({
      foodCategory,
      preparationDate,
      preparationTime,
      expiryDate,
      expiryTime,
      storageCondition,
      packagingCondition,
      quantity: Number(quantity) || 1
    });

    res.json({
      success: true,
      assessment: evaluation
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. GET SAFETY RECORD BY DONATION ID
// ==========================================
router.get("/:donationId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const donation = await FoodDonation.findById(req.params.donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation record not found." });
    }

    if (req.user.role === "DONOR" && String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view safety records for your own donations."
      });
    }

    const assessment = await FoodSafetyAssessment.findOne({ donationId: req.params.donationId });
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Safety assessment record not found." });
    }

    res.json({
      success: true,
      assessment
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
