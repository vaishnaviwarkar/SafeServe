import { Router } from "express";
import { User, Notification } from "../db";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";
import { recordAuditLog, sendEmailNotification } from "../services/index";

const router = Router();

// ==========================================
// 1. GET ALL USERS (Admin Only - Search, Filter, Sort, Pagination)
// ==========================================
router.get("/", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const { role, status, search, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (role && role !== "ALL") {
      query.role = role;
    }
    if (status && status !== "ALL") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: String(search), $options: "i" } },
        { email: { $regex: String(search), $options: "i" } },
        { organizationName: { $regex: String(search), $options: "i" } },
        { city: { $regex: String(search), $options: "i" } }
      ];
    }

    const allUsers = await User.find(query);
    const sanitized = allUsers.map((u: any) => {
      const copy = { ...u };
      delete copy.password;
      return copy;
    });

    res.json({
      success: true,
      total: sanitized.length,
      users: sanitized
    });
  } catch (err: any) {
    console.error("Get users error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to fetch users" });
  }
});

// ==========================================
// 1.5 SELF VERIFY (DEMO / TESTING SHORTCUT)
// ==========================================
router.patch("/self/verify-demo", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { status: "VERIFIED" },
      { new: true }
    );
    const clean = { ...updated };
    delete clean.password;
    res.json({ success: true, message: "Account successfully verified!", user: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. GET SPECIFIC USER
// ==========================================
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const clean = { ...user };
    delete clean.password;
    res.json({ success: true, user: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. ADMIN VERIFY USER
// ==========================================
router.patch("/:id", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const { status, isVerified } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newStatus = isVerified ? "VERIFIED" : (status || targetUser.status);
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true }
    );

    const clean = { ...updated };
    delete clean.password;
    res.json({ success: true, message: "User updated successfully", user: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:id/verify", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "VERIFIED" },
      { new: true }
    );

    // Notify user
    await Notification.create({
      userId: targetUser._id,
      title: "Account Verified Successfully",
      message: "Your SafeServe account has been verified by administrators. You now have full access to rescue operations.",
      type: "SUCCESS",
      link: `/${targetUser.role.toLowerCase()}/dashboard`
    });

    // Audit log
    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: "ADMIN",
      action: "USER_VERIFIED",
      entityType: "USER",
      entityId: String(targetUser._id),
      description: `Administrator verified account for ${targetUser.email} (${targetUser.role}).`
    });

    // Email
    sendEmailNotification(
      targetUser.email,
      "SafeServe Account Verified",
      `Hello ${targetUser.fullName},\n\nYour SafeServe ${targetUser.role} account has been formally approved and verified. You may now log in to access the platform.`
    );

    const clean = { ...updated };
    delete clean.password;
    res.json({ success: true, message: "User status updated to VERIFIED", user: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. ADMIN REJECT USER
// ==========================================
router.patch("/:id/reject", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "REJECTED" },
      { new: true }
    );

    await Notification.create({
      userId: targetUser._id,
      title: "Verification Request Declined",
      message: `Your account verification was rejected. Reason: ${reason || "Information could not be validated."}`,
      type: "DANGER"
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: "ADMIN",
      action: "USER_REJECTED",
      entityType: "USER",
      entityId: String(targetUser._id),
      description: `Administrator rejected verification for ${targetUser.email}. Reason: ${reason || "Unspecified"}`
    });

    const clean = { ...updated };
    delete clean.password;
    res.json({ success: true, message: "User status updated to REJECTED", user: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. ADMIN BLOCK USER
// ==========================================
router.patch("/:id/block", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (targetUser.role === "ADMIN") {
      return res.status(400).json({ success: false, message: "Administrator accounts cannot be blocked." });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "BLOCKED" },
      { new: true }
    );

    await Notification.create({
      userId: targetUser._id,
      title: "Account Suspended",
      message: `Your account access has been blocked. Reason: ${reason || "Violation of SafeServe guidelines."}`,
      type: "DANGER"
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: "ADMIN",
      action: "USER_BLOCKED",
      entityType: "USER",
      entityId: String(targetUser._id),
      description: `Administrator BLOCKED access for ${targetUser.email}. Reason: ${reason || "Policy enforcement"}`
    });

    const clean = { ...updated };
    delete clean.password;
    res.json({ success: true, message: "User has been BLOCKED", user: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. ADMIN UNBLOCK USER
// ==========================================
router.patch("/:id/unblock", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "VERIFIED" },
      { new: true }
    );

    await Notification.create({
      userId: targetUser._id,
      title: "Account Reinstated",
      message: "Your SafeServe account has been unblocked. Full privileges are restored.",
      type: "SUCCESS"
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: "ADMIN",
      action: "USER_UNBLOCKED",
      entityType: "USER",
      entityId: String(targetUser._id),
      description: `Administrator UNBLOCKED account for ${targetUser.email}.`
    });

    const clean = { ...updated };
    delete clean.password;
    res.json({ success: true, message: "User has been unblocked and restored to VERIFIED", user: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. UPDATE PROFILE (Self)
// ==========================================
router.patch("/profile/update", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      fullName,
      phone,
      organizationName,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      contactPerson,
      foodCapacity,
      serviceArea,
      requiredFoodCategories,
      transportation,
      availability,
      availabilityStatus
    } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        fullName: fullName || req.user.fullName,
        phone: phone || req.user.phone,
        organizationName: organizationName || req.user.organizationName,
        address: address || req.user.address,
        city: city || req.user.city,
        state: state || req.user.state,
        pincode: pincode || req.user.pincode,
        latitude: latitude ? Number(latitude) : req.user.latitude,
        longitude: longitude ? Number(longitude) : req.user.longitude,
        contactPerson: contactPerson || req.user.contactPerson,
        foodCapacity: foodCapacity ? Number(foodCapacity) : req.user.foodCapacity,
        serviceArea: serviceArea || req.user.serviceArea,
        requiredFoodCategories: requiredFoodCategories || req.user.requiredFoodCategories,
        transportation: transportation || req.user.transportation,
        availability: availability || req.user.availability,
        availabilityStatus: ["AVAILABLE", "BUSY", "UNAVAILABLE"].includes(availabilityStatus) ? availabilityStatus : req.user.availabilityStatus
      },
      { new: true }
    );

    const clean = { ...updated };
    delete clean.password;
    res.json({ success: true, message: "Profile updated successfully", user: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
