import { Router } from "express";
import { RescueRequest, FoodDonation, User, VerificationRecord, Notification } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  validateGPSLocation,
  generateOTP,
  recordAuditLog,
  updateActorTrustScore
} from "../services/index";

const router = Router();

// ==========================================
// 1. REGENERATE / RESEND OTP
// ==========================================
router.post("/send-otp", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { rescueId, type } = req.body; // type: 'PICKUP' or 'DELIVERY'
    const rescue = await RescueRequest.findById(rescueId);
    if (!rescue) {
      return res.status(404).json({ success: false, message: "Rescue operation not found" });
    }
    if (!["PICKUP", "DELIVERY"].includes(type)) {
      return res.status(400).json({ success: false, message: "OTP type must be PICKUP or DELIVERY." });
    }
    if (type === "PICKUP" && req.user.role !== "ADMIN" && String(rescue.donorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the donor or admin can regenerate a Pickup OTP." });
    }
    if (type === "DELIVERY" && req.user.role !== "ADMIN" && String(rescue.ngoId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the assigned NGO or admin can regenerate a Delivery OTP." });
    }

    const { otp, expiry } = generateOTP();

    if (type === "PICKUP") {
      await RescueRequest.findByIdAndUpdate(rescueId, {
        pickupOtp: otp,
        pickupOtpExpiry: expiry,
        pickupOtpAttempts: 0
      });

      // Notify Donor
      await Notification.create({
        userId: rescue.donorId,
        title: "New Pickup OTP Generated",
        message: `Your updated SafeServe Pickup OTP is: [${otp}]. It will expire in 15 minutes.`,
        type: "WARNING"
      });

      return res.json({ success: true, message: "Fresh Pickup OTP generated and dispatched to donor." });
    } else {
      await RescueRequest.findByIdAndUpdate(rescueId, {
        deliveryOtp: otp,
        deliveryOtpExpiry: expiry,
        deliveryOtpAttempts: 0
      });

      // Notify NGO
      await Notification.create({
        userId: rescue.ngoId,
        title: "New Delivery OTP Generated",
        message: `Your updated SafeServe Delivery OTP is: [${otp}]. It will expire in 15 minutes.`,
        type: "WARNING"
      });

      return res.json({ success: true, message: "Fresh Delivery OTP generated and dispatched to receiving NGO." });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. MULTI-FACTOR PICKUP VERIFICATION (QR + OTP + GPS + TIMESTAMP)
// ==========================================
router.post("/pickup", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { rescueId, qrToken, otp, latitude, longitude, notes } = req.body;

    if (!rescueId || !qrToken || !otp || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Full multi-factor parameters required: QR Token, OTP, and Browser GPS Coordinates."
      });
    }

    const rescue = await RescueRequest.findById(rescueId);
    if (!rescue) {
      return res.status(404).json({ success: false, message: "Rescue operation not found." });
    }

    const donation = await FoodDonation.findById(rescue.donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Food donation record missing." });
    }

    // Step 1: Backend validates volunteer authorization
    const isVolunteer = String(rescue.volunteerId) === String(req.user._id);
    const isAdmin = req.user.role === "ADMIN";
    if (!isVolunteer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Security Notice: Only the assigned verified volunteer can verify pickup."
      });
    }

    // Step 2: Validate QR Token
    if (rescue.verificationToken !== qrToken.trim()) {
      await recordAuditLog({
        userId: req.user._id,
        userEmail: req.user.email,
        role: req.user.role,
        action: "PICKUP_VERIFICATION_FAILED_QR",
        entityType: "RESCUE_REQUEST",
        entityId: String(rescue._id),
        status: "FAILED",
        description: `Invalid QR verification token supplied: '${qrToken}'.`
      });

      return res.status(400).json({
        success: false,
        message: "Invalid QR Code token. The scanned code does not match this rescue operation."
      });
    }

    // Step 3: Check OTP Expiry & Attempts
    if (rescue.pickupOtpAttempts >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum OTP attempts exceeded (3). Please request a fresh OTP."
      });
    }

    if (!rescue.pickupOtp) {
      return res.status(400).json({
        success: false,
        message: "No active pickup OTP found. Please regenerate an OTP."
      });
    }

    if (rescue.pickupOtpExpiry && new Date() > new Date(rescue.pickupOtpExpiry)) {
      return res.status(400).json({
        success: false,
        message: "Pickup OTP has expired. Please regenerate a new OTP from the donor."
      });
    }

    if (rescue.pickupOtp.trim() !== String(otp).trim()) {
      await RescueRequest.findByIdAndUpdate(rescue._id, {
        $inc: { pickupOtpAttempts: 1 }
      });
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. Attempt ${rescue.pickupOtpAttempts + 1} of 3.`
      });
    }

    // Step 4: GPS Validation against Donor Pickup Coordinates
    const donorLat = donation.latitude || 28.6139;
    const donorLon = donation.longitude || 77.2090;
    const clientLat = Number(latitude);
    const clientLon = Number(longitude);

    const gpsCheck = validateGPSLocation(clientLat, clientLon, donorLat, donorLon, 2000); // 2km radius
    if (!gpsCheck.isValid) {
      // Record failed verification log
      await VerificationRecord.create({
        rescueId: rescue._id,
        type: "PICKUP",
        verifiedBy: req.user._id,
        verifiedByName: req.user.fullName,
        latitude: clientLat,
        longitude: clientLon,
        targetLatitude: donorLat,
        targetLongitude: donorLon,
        distanceDeviationMeters: gpsCheck.deviationMeters,
        status: "FAILED",
        notes: gpsCheck.message
      });

      return res.status(400).json({
        success: false,
        message: gpsCheck.message,
        deviationMeters: gpsCheck.deviationMeters
      });
    }

    // Step 5: Successful Verification - Update Statuses & Invalidate OTP
    const verifiedTime = new Date();
    const updatedRescue = await RescueRequest.findByIdAndUpdate(
      rescue._id,
      {
        status: "IN_TRANSIT",
        pickupTime: verifiedTime,
        pickupLatitude: clientLat,
        pickupLongitude: clientLon,
        pickupVerifiedBy: req.user._id,
        pickupNotes: notes || "Verified at donor premises via QR + OTP + GPS",
        pickupOtp: null // Single-use invalidation
      },
      { new: true }
    );

    await FoodDonation.findByIdAndUpdate(rescue.donationId, {
      status: "IN_TRANSIT"
    });

    // Record Verification Audit Record
    await VerificationRecord.create({
      rescueId: rescue._id,
      type: "PICKUP",
      verifiedBy: req.user._id,
      verifiedByName: req.user.fullName,
      latitude: clientLat,
      longitude: clientLon,
      targetLatitude: donorLat,
      targetLongitude: donorLon,
      distanceDeviationMeters: gpsCheck.deviationMeters,
      timestamp: verifiedTime,
      status: "SUCCESS",
      notes: notes || "Handoff successfully validated."
    });

    // Notify Donor
    await Notification.create({
      userId: rescue.donorId,
      title: "Pickup Completed - Food In Transit",
      message: `Surplus food '${donation.foodName}' has been verified and picked up by volunteer ${req.user.fullName}.`,
      type: "SUCCESS",
      link: `/donor/track/${rescue.donationId}`
    });

    // Notify NGO
    await Notification.create({
      userId: rescue.ngoId,
      title: "Food In Transit to Your Facility",
      message: `Volunteer ${req.user.fullName} is en route with ${donation.quantity} ${donation.unit} of '${donation.foodName}'. Prepare for delivery verification.`,
      type: "INFO",
      link: `/ngo/rescues/${rescue._id}`
    });

    // Audit Log
    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
      action: "PICKUP_VERIFIED",
      entityType: "RESCUE_REQUEST",
      entityId: String(rescue._id),
      description: `Pickup verified via QR + OTP + GPS (${gpsCheck.deviationMeters}m deviation). State: IN_TRANSIT.`
    });

    res.json({
      success: true,
      message: "Pickup verified successfully! Food is now recorded as IN_TRANSIT.",
      rescue: updatedRescue,
      deviationMeters: gpsCheck.deviationMeters,
      timestamp: verifiedTime
    });
  } catch (err: any) {
    console.error("Pickup verification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. MULTI-FACTOR DELIVERY VERIFICATION (QR + OTP + GPS + TIMESTAMP)
// ==========================================
router.post("/delivery", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { rescueId, qrToken, otp, latitude, longitude, notes } = req.body;

    if (!rescueId || !qrToken || !otp || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Full multi-factor parameters required: QR Token, Delivery OTP, and Browser GPS Coordinates."
      });
    }

    const rescue = await RescueRequest.findById(rescueId);
    if (!rescue) {
      return res.status(404).json({ success: false, message: "Rescue operation not found." });
    }

    const donation = await FoodDonation.findById(rescue.donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Food donation record missing." });
    }

    // Business rule: Delivery cannot occur before pickup verification
    if (rescue.status !== "IN_TRANSIT" && rescue.status !== "PICKUP_VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Policy Violation: Delivery cannot occur before pickup verification has been completed."
      });
    }

    // Step 1: Validate QR Token
    if (rescue.verificationToken !== qrToken.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR Code token. The scanned code does not match this rescue operation."
      });
    }

    // Step 2: Validate Delivery OTP
    if (rescue.deliveryOtpAttempts >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum OTP attempts exceeded (3). Please request a fresh OTP."
      });
    }

    if (!rescue.deliveryOtp) {
      return res.status(400).json({
        success: false,
        message: "No active delivery OTP found. Please regenerate an OTP."
      });
    }

    if (rescue.deliveryOtpExpiry && new Date() > new Date(rescue.deliveryOtpExpiry)) {
      return res.status(400).json({
        success: false,
        message: "Delivery OTP has expired. Please regenerate a new OTP."
      });
    }

    if (rescue.deliveryOtp.trim() !== String(otp).trim()) {
      await RescueRequest.findByIdAndUpdate(rescue._id, {
        $inc: { deliveryOtpAttempts: 1 }
      });
      return res.status(400).json({
        success: false,
        message: `Incorrect Delivery OTP. Attempt ${rescue.deliveryOtpAttempts + 1} of 3.`
      });
    }

    // Step 3: GPS Validation against NGO Location
    const ngo = await User.findById(rescue.ngoId);
    const targetLat = ngo ? ngo.latitude || 28.6139 : 28.6139;
    const targetLon = ngo ? ngo.longitude || 77.2090 : 77.2090;
    const clientLat = Number(latitude);
    const clientLon = Number(longitude);

    const gpsCheck = validateGPSLocation(clientLat, clientLon, targetLat, targetLon, 2000); // 2km radius
    if (!gpsCheck.isValid) {
      await VerificationRecord.create({
        rescueId: rescue._id,
        type: "DELIVERY",
        verifiedBy: req.user._id,
        verifiedByName: req.user.fullName,
        latitude: clientLat,
        longitude: clientLon,
        targetLatitude: targetLat,
        targetLongitude: targetLon,
        distanceDeviationMeters: gpsCheck.deviationMeters,
        status: "FAILED",
        notes: gpsCheck.message
      });

      return res.status(400).json({
        success: false,
        message: gpsCheck.message,
        deviationMeters: gpsCheck.deviationMeters
      });
    }

    // Step 4: Complete Delivery Verification
    const deliveredTime = new Date();
    const updatedRescue = await RescueRequest.findByIdAndUpdate(
      rescue._id,
      {
        status: "DELIVERED",
        deliveryTime: deliveredTime,
        deliveryLatitude: clientLat,
        deliveryLongitude: clientLon,
        deliveryVerifiedBy: req.user._id,
        deliveryNotes: notes || "Delivered and safely accepted at NGO facility.",
        deliveryOtp: null // Invalidate OTP
      },
      { new: true }
    );

    await FoodDonation.findByIdAndUpdate(rescue.donationId, {
      status: "DELIVERED"
    });

    // Record Verification Audit Record
    await VerificationRecord.create({
      rescueId: rescue._id,
      type: "DELIVERY",
      verifiedBy: req.user._id,
      verifiedByName: req.user.fullName,
      latitude: clientLat,
      longitude: clientLon,
      targetLatitude: targetLat,
      targetLongitude: targetLon,
      distanceDeviationMeters: gpsCheck.deviationMeters,
      timestamp: deliveredTime,
      status: "SUCCESS",
      notes: notes || "Delivery verified successfully."
    });

    // Update Volunteer Trust Score (+2 points for successful delivery)
    if (rescue.volunteerId) {
      await updateActorTrustScore(String(rescue.volunteerId), +2, "Verified prompt delivery completion");
    }

    // Notifications
    await Notification.create({
      userId: rescue.donorId,
      title: "Food Safely Delivered to NGO!",
      message: `Your surplus food '${donation.foodName}' has safely arrived at ${ngo ? ngo.organizationName : "the NGO"} and is undergoing distribution.`,
      type: "SUCCESS",
      link: `/donor/track/${rescue.donationId}`
    });

    await Notification.create({
      userId: rescue.ngoId,
      title: "Food Delivery Received",
      message: `Handoff verified. Please confirm final community distribution once meals are handed out.`,
      type: "SUCCESS",
      link: `/ngo/rescues/${rescue._id}`
    });

    // Audit Log
    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
      action: "DELIVERY_VERIFIED",
      entityType: "RESCUE_REQUEST",
      entityId: String(rescue._id),
      description: `Delivery verified at NGO premises via QR + OTP + GPS (${gpsCheck.deviationMeters}m deviation). State: DELIVERED.`
    });

    res.json({
      success: true,
      message: "Delivery verified successfully! Food is recorded as DELIVERED.",
      rescue: updatedRescue,
      deviationMeters: gpsCheck.deviationMeters,
      timestamp: deliveredTime
    });
  } catch (err: any) {
    console.error("Delivery verification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. GET VERIFICATION HISTORY FOR A RESCUE
// ==========================================
router.get("/records/:rescueId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const records = await VerificationRecord.find({ rescueId: req.params.rescueId });
    res.json({
      success: true,
      records
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
