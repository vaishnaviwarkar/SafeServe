import { Router } from "express";
import multer from "multer";
import { FoodDonation, FoodSafetyAssessment, User, RescueRequest, Notification } from "../db";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";
import {
  evaluateFoodSafety,
  uploadImageBuffer,
  generateVerificationToken,
  generateQRCodeDataURL,
  generateOTP,
  recordAuditLog,
  sendEmailNotification
} from "../services/index";

const router = Router();

const sanitizeRescueForRole = (rescue: any, role: string) => {
  if (!rescue) return rescue;
  const copy = { ...rescue };
  if (role === "VOLUNTEER") {
    delete copy.pickupOtp; delete copy.pickupOtpExpiry; delete copy.pickupOtpAttempts;
    delete copy.deliveryOtp; delete copy.deliveryOtpExpiry; delete copy.deliveryOtpAttempts;
  }
  return copy;
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// ==========================================
// 1. CREATE FOOD DONATION (Donor Only)
// ==========================================
router.post(
  "/",
  authenticateToken,
  requireRole(["DONOR", "ADMIN"]),
  upload.any(),
  async (req: AuthRequest, res) => {
    try {
      // Auto-verify donor in active testing mode if pending
      if (req.user.status === "PENDING") {
        await User.findByIdAndUpdate(req.user._id, { status: "VERIFIED" });
        req.user.status = "VERIFIED";
      }

      const {
        foodName,
        foodCategory,
        quantity,
        peopleServed,
        unit,
        preparationDate,
        preparationTime,
        expiryDate,
        expiryTime,
        storageCondition,
        packagingCondition,
        pickupAddress,
        city,
        state,
        latitude,
        longitude,
        description
      } = req.body;

      if (!foodName || !foodCategory || !quantity || !preparationDate || !preparationTime || !expiryDate || !expiryTime || !storageCondition || !packagingCondition || !pickupAddress) {
        return res.status(400).json({
          success: false,
          message: "All mandatory food donation and safety parameters must be supplied."
        });
      }

      // Handle Image: Prefer Cloudinary upload if file attached
      let imageUrl = req.body.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
      let cloudinaryPublicId: string | undefined = undefined;

      const files = req.files as Express.Multer.File[];
      const imageFile = files && files.length > 0 ? files[0] : (req as any).file;

      if (imageFile && imageFile.buffer) {
        const uploadRes = await uploadImageBuffer(imageFile.buffer, "safeserve_food_donations");
        if (uploadRes) {
          imageUrl = uploadRes.imageUrl;
          cloudinaryPublicId = uploadRes.cloudinaryPublicId;
        }
      }

      // Step 1: Run FSSAI Compliant Algorithmic Food Safety Assessment
      const assessment = evaluateFoodSafety({
        foodCategory,
        preparationDate,
        preparationTime,
        expiryDate,
        expiryTime,
        storageCondition,
        packagingCondition,
        quantity: Number(quantity)
      });

      let initialStatus = "APPROVED";
      if (assessment.status === "EXPIRED" || assessment.status === "NOT_ELIGIBLE") {
        initialStatus = "REJECTED";
      } else if (assessment.status === "REVIEW_REQUIRED") {
        initialStatus = "PENDING_SAFETY_REVIEW";
      } else {
        initialStatus = "APPROVED";
      }

      // Step 2: Create Donation Record in MongoDB / Datastore
      const donation = await FoodDonation.create({
        donorId: req.user._id,
        donorName: req.user.fullName,
        donorOrg: req.user.organizationName || req.user.fullName,
        donorPhone: req.user.phone,
        foodName,
        foodCategory,
        quantity: Number(quantity),
        peopleServed: peopleServed ? Number(peopleServed) : Number(quantity),
        unit: unit || "meals",
        preparationDate,
        preparationTime,
        expiryDate,
        expiryTime,
        storageCondition,
        packagingCondition,
        pickupAddress,
        city: city || req.user.city || "New Delhi",
        state: state || req.user.state || "Delhi",
        latitude: Number(latitude) || req.user.latitude || 28.6139,
        longitude: Number(longitude) || req.user.longitude || 77.2090,
        description: description || "",
        imageUrl,
        cloudinaryPublicId,
        safetyScore: assessment.score,
        safetyStatus: assessment.status,
        safetyReason: assessment.reason,
        status: initialStatus
      });

      // Step 3: Record Food Safety Assessment History
      await FoodSafetyAssessment.create({
        donationId: donation._id,
        score: assessment.score,
        status: assessment.status,
        reason: assessment.reason,
        hoursRemaining: assessment.hoursRemaining,
        storageSuitability: assessment.storageSuitability,
        packagingIntegrity: assessment.packagingIntegrity,
        evaluatedAt: new Date().toISOString()
      });

      // Step 4: Automatically initialize Rescue Operation & Token for all viable food lots
      let rescue: any = null;
      if (initialStatus !== "REJECTED") {
        const verificationToken = generateVerificationToken();
        const qrCodeImage = await generateQRCodeDataURL(verificationToken);
        const pickupOtpData = generateOTP();
        const deliveryOtpData = generateOTP();

        rescue = await RescueRequest.create({
          donationId: donation._id,
          donorId: req.user._id,
          status: "MATCHED",
          verificationToken,
          qrCodeImage,
          pickupOtp: pickupOtpData.otp,
          pickupOtpExpiry: pickupOtpData.expiry,
          pickupOtpAttempts: 0,
          deliveryOtp: deliveryOtpData.otp,
          deliveryOtpExpiry: deliveryOtpData.expiry,
          deliveryOtpAttempts: 0,
          matchScore: assessment.score,
          pickupAddress: pickupAddress || req.user.address || "Donor Kitchen Facility",
          deliveryAddress: "Verified Partner NGO Shelter"
        });

        // Link rescueRequestId to donation
        await FoodDonation.findByIdAndUpdate(donation._id, {
          rescueRequestId: rescue._id
        });
        donation.rescueRequestId = rescue._id;
      }

      // Update donor donation stats
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalDonationsCount: 1 }
      });

      // Audit Log
      await recordAuditLog({
        userId: req.user._id,
        userEmail: req.user.email,
        role: req.user.role,
        action: "DONATION_CREATED",
        entityType: "FOOD_DONATION",
        entityId: String(donation._id),
        description: `Food donation created: ${foodName} (${quantity} ${unit}). Safety Score: ${assessment.score}/100 (${assessment.status}).`
      });

      // Notifications
      await Notification.create({
        userId: req.user._id,
        title: "Donation Published Successfully",
        message: `Your donation '${foodName}' scored ${assessment.score}/100 and is now live in the rescue network.`,
        type: assessment.status === "ELIGIBLE" ? "SUCCESS" : "WARNING",
        link: `/donor/track/${donation._id}`
      });
      // ==========================================
// EMAIL ALERT: NEW DONATION AVAILABLE
// ==========================================
if (initialStatus !== "REJECTED") {
  const availableResponders = await User.find({
    role: { $in: ["NGO", "VOLUNTEER"] },
    status: "VERIFIED"
  });

  const donationTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  for (const responder of availableResponders) {
    await Notification.create({
      userId: responder._id,
      title: "New Food Donation Available",
      message: `A new food donation is available: ${foodName} - ${quantity} ${unit}. Please check SafeServe and claim/accept it before expiry.`,
      type: "INFO",
      link: `/ngo/rescues`
    });

    await sendEmailNotification(
      responder.email,
      "New Food Donation Available",
      `Hello ${responder.fullName},

A new food donation is available on SafeServe.

Food: ${foodName}
Quantity: ${quantity} ${unit}
Category: ${foodCategory}
Pickup Location: ${pickupAddress}
Expiry: ${expiryDate} ${expiryTime}

Safety Score: ${assessment.score}/100
Remaining Shelf Life: ${assessment.hoursRemaining} hours

Donation Published Time: ${donationTime}

Please log in to SafeServe and check the available donation so that it can be rescued before it expires.

Regards,
SafeServe Food Rescue Platform`
    );
  }
}
      // Alert Admins
      const admins = await User.find({ role: "ADMIN" });
      for (const adm of admins) {
        await Notification.create({
          userId: adm._id,
          title: "New Surplus Food Donation",
          message: `${req.user.fullName} listed ${quantity} ${unit} of '${foodName}'. Safety Score: ${assessment.score}/100.`,
          type: "INFO",
          link: `/admin/donations`
        });
      }

      res.status(201).json({
        success: true,
        message: "Food donation registered and preliminary safety assessment completed.",
        donation,
        assessment,
        rescue
      });
    } catch (err: any) {
      console.error("Create donation error:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to create donation" });
    }
  }
);

// ==========================================
// 2. GET CURRENT DONOR'S DONATIONS (/my)
// ==========================================
router.get("/my", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!["DONOR", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only donors and admins can access donor donation records." });
    }
    const donations = req.user.role === "ADMIN"
      ? await FoodDonation.find({})
      : await FoodDonation.find({ donorId: req.user._id });

    donations.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const populated = await Promise.all(
      donations.map(async (d: any) => {
        let rescue = d.rescueRequestId
          ? await RescueRequest.findById(d.rescueRequestId)
          : await RescueRequest.findOne({ donationId: d._id });

        if (!rescue && !["REJECTED", "EXPIRED", "DELIVERED", "DISTRIBUTION_COMPLETED"].includes(d.status)) {
          const verificationToken = generateVerificationToken();
          const qrCodeImage = await generateQRCodeDataURL(verificationToken);
          const pickupOtpData = generateOTP();
          const deliveryOtpData = generateOTP();
          rescue = await RescueRequest.create({
            donationId: d._id,
            donorId: d.donorId,
            ngoId: d.assignedNgoId || null,
            status: d.assignedNgoId ? "NGO_ASSIGNED" : "MATCHED",
            verificationToken,
            qrCodeImage,
            pickupOtp: pickupOtpData.otp,
            pickupOtpExpiry: pickupOtpData.expiry,
            pickupOtpAttempts: 0,
            deliveryOtp: deliveryOtpData.otp,
            deliveryOtpExpiry: deliveryOtpData.expiry,
            deliveryOtpAttempts: 0,
            matchScore: d.safetyScore || 90,
            pickupAddress: d.pickupAddress || req.user.address || "Donor Facility",
            deliveryAddress: "Verified Partner NGO Shelter"
          });
          await FoodDonation.findByIdAndUpdate(d._id, { rescueRequestId: rescue._id });
        }

        const assignedNgo = rescue?.ngoId ? await User.findById(rescue.ngoId) : null;
        const distance = assignedNgo && Number.isFinite(Number(d.latitude)) && Number.isFinite(Number(d.longitude)) && Number.isFinite(Number(assignedNgo.latitude)) && Number.isFinite(Number(assignedNgo.longitude))
          ? haversineKm(Number(d.latitude), Number(d.longitude), Number(assignedNgo.latitude), Number(assignedNgo.longitude)) : undefined;
        const enrichedRescue = rescue ? { ...rescue, ngo: assignedNgo ? { _id: assignedNgo._id, fullName: assignedNgo.organizationName || assignedNgo.fullName, phone: assignedNgo.phone, address: assignedNgo.address, latitude: assignedNgo.latitude, longitude: assignedNgo.longitude } : null, ngoDistanceKm: distance !== undefined ? Number(distance.toFixed(2)) : rescue.ngoDistanceKm, ngoEstimatedTravelMinutes: distance !== undefined ? Math.max(1, Math.ceil((distance / 30) * 60)) : rescue.ngoEstimatedTravelMinutes } : null;
        return {
          ...d,
          rescueRequestId: rescue ? rescue._id : d.rescueRequestId,
          pickupOtp: rescue?.pickupOtp,
          deliveryOtp: rescue?.deliveryOtp,
          verificationToken: rescue?.verificationToken,
          qrCodeImage: rescue?.qrCodeImage,
          assignedNgo: assignedNgo ? { _id: assignedNgo._id, name: assignedNgo.organizationName || assignedNgo.fullName, phone: assignedNgo.phone, address: assignedNgo.address, latitude: assignedNgo.latitude, longitude: assignedNgo.longitude } : undefined,
          ngoDistanceKm: distance !== undefined ? Number(distance.toFixed(2)) : rescue?.ngoDistanceKm,
          ngoEstimatedTravelMinutes: distance !== undefined ? Math.max(1, Math.ceil((distance / 30) * 60)) : rescue?.ngoEstimatedTravelMinutes,
          rescue: enrichedRescue,
          donor: {
            fullName: req.user.fullName,
            organizationName: req.user.organizationName || req.user.fullName,
            phone: req.user.phone,
            address: req.user.address
          }
        };
      })
    );

    res.json({
      success: true,
      total: populated.length,
      donations: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. GET AVAILABLE DONATIONS FOR CLAIMING (/available)
// ==========================================
router.get("/available", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const all = await FoodDonation.find({});
    const available = all.filter((d: any) =>
      !["REJECTED", "EXPIRED", "DELIVERED", "DISTRIBUTION_COMPLETED", "CANCELLED"].includes(d.status)
    );
    available.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const populated = await Promise.all(
      available.map(async (d: any) => {
        const donor = await User.findById(d.donorId);
        return {
          ...d,
          donor: donor ? {
            _id: donor._id,
            fullName: donor.fullName,
            organizationName: donor.organizationName || donor.fullName,
            phone: donor.phone,
            address: donor.address
          } : null
        };
      })
    );

    res.json({
      success: true,
      total: populated.length,
      donations: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. GET ALL DONATIONS (Filtered by Role / Query)
// ==========================================
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, category, search, donorId } = req.query;
    const query: any = {};

    // Scoping: If the requester is a DONOR, strictly filter by their own authenticated user ID
    if (req.user.role === "DONOR") {
      query.donorId = req.user._id;
    } else if (donorId) {
      query.donorId = donorId;
    }

    if (status && status !== "ALL") {
      query.status = status;
    }
    if (category && category !== "ALL") {
      query.foodCategory = category;
    }
    if (search) {
      query.$or = [
        { foodName: { $regex: String(search), $options: "i" } },
        { city: { $regex: String(search), $options: "i" } },
        { donorOrg: { $regex: String(search), $options: "i" } }
      ];
    }

    const donations = await FoodDonation.find(query);
    donations.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const populated = await Promise.all(
      donations.map(async (d: any) => {
        const donor = await User.findById(d.donorId);
        const rescue = d.rescueRequestId
          ? await RescueRequest.findById(d.rescueRequestId)
          : await RescueRequest.findOne({ donationId: d._id });

        return {
          ...d,
          rescueRequestId: rescue ? rescue._id : d.rescueRequestId,
          rescue,
          donor: donor ? {
            _id: donor._id,
            fullName: donor.fullName,
            organizationName: donor.organizationName || donor.fullName,
            phone: donor.phone,
            address: donor.address
          } : null
        };
      })
    );

    res.json({
      success: true,
      total: populated.length,
      donations: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. GET SPECIFIC DONATION DETAILS
// ==========================================
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    // Ownership Enforcement: Donors can ONLY view their own donations
    if (req.user.role === "DONOR" && String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are only authorized to view your own donations."
      });
    }

    const assessment = await FoodSafetyAssessment.findOne({ donationId: donation._id });
    const rescue = donation.rescueRequestId
      ? await RescueRequest.findById(donation.rescueRequestId)
      : await RescueRequest.findOne({ donationId: donation._id });
    const donor = await User.findById(donation.donorId);

    const assignedNgo = rescue?.ngoId ? await User.findById(rescue.ngoId) : null;
    const enrichedRescue = rescue ? {
      ...rescue,
      ngo: assignedNgo ? { _id: assignedNgo._id, fullName: assignedNgo.organizationName || assignedNgo.fullName, phone: assignedNgo.phone, address: assignedNgo.address, latitude: assignedNgo.latitude, longitude: assignedNgo.longitude } : null,
      ngoDistanceKm: assignedNgo && Number.isFinite(Number(donation.latitude)) && Number.isFinite(Number(donation.longitude)) && Number.isFinite(Number(assignedNgo.latitude)) && Number.isFinite(Number(assignedNgo.longitude)) ? Number(haversineKm(Number(donation.latitude), Number(donation.longitude), Number(assignedNgo.latitude), Number(assignedNgo.longitude)).toFixed(2)) : rescue.ngoDistanceKm,
      ngoEstimatedTravelMinutes: assignedNgo && Number.isFinite(Number(donation.latitude)) && Number.isFinite(Number(donation.longitude)) && Number.isFinite(Number(assignedNgo.latitude)) && Number.isFinite(Number(assignedNgo.longitude)) ? Math.max(1, Math.ceil((haversineKm(Number(donation.latitude), Number(donation.longitude), Number(assignedNgo.latitude), Number(assignedNgo.longitude)) / 30) * 60)) : rescue.ngoEstimatedTravelMinutes
    } : null;
    res.json({
      success: true,
      donation,
      assessment,
      rescue: sanitizeRescueForRole(enrichedRescue, req.user.role),
      donor: donor ? {
        _id: donor._id,
        fullName: donor.fullName,
        organizationName: donor.organizationName || donor.fullName,
        phone: donor.phone,
        address: donor.address
      } : null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. ADMIN UPDATE STATUS (APPROVE / REJECT / ETC)
// ==========================================
router.patch("/:id/status", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const { status, reason } = req.body;
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    if (status === "APPROVED" && donation.safetyStatus === "EXPIRED") {
      return res.status(400).json({
        success: false,
        message: "Policy Violation: Expired food lot cannot be approved under FSSAI regulations."
      });
    }

    let rescue = donation.rescueRequestId
      ? await RescueRequest.findById(donation.rescueRequestId)
      : await RescueRequest.findOne({ donationId: donation._id });

    if (status === "APPROVED") {
      if (!rescue) {
        const verificationToken = generateVerificationToken();
        const qrCodeImage = await generateQRCodeDataURL(verificationToken);
        const pickupOtpData = generateOTP();
        const deliveryOtpData = generateOTP();

        rescue = await RescueRequest.create({
          donationId: donation._id,
          donorId: donation.donorId,
          status: "MATCHED",
          verificationToken,
          qrCodeImage,
          pickupOtp: pickupOtpData.otp,
          pickupOtpExpiry: pickupOtpData.expiry,
          deliveryOtp: deliveryOtpData.otp,
          deliveryOtpExpiry: deliveryOtpData.expiry,
          matchScore: donation.safetyScore
        });
      } else {
        rescue = await RescueRequest.findByIdAndUpdate(
          rescue._id,
          { status: "MATCHED" },
          { new: true }
        );
      }
    } else if (status === "REJECTED") {
      if (rescue) {
        await RescueRequest.findByIdAndUpdate(rescue._id, { status: "CANCELLED" });
      }
    }

    const updated = await FoodDonation.findByIdAndUpdate(
      req.params.id,
      {
        status,
        rescueRequestId: rescue ? rescue._id : donation.rescueRequestId,
        adminRejectionReason: status === "REJECTED" ? (reason || "Rejected by platform admin") : undefined
      },
      { new: true }
    );

    // Audit Log
    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: "ADMIN",
      action: `DONATION_${status}`,
      entityType: "FOOD_DONATION",
      entityId: String(donation._id),
      description: `Administrator updated donation status to ${status}.`
    });

    res.json({
      success: true,
      message: `Donation status updated to ${status}.`,
      donation: updated,
      rescue
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. ADMIN APPROVE DONATION
// ==========================================
router.patch("/:id/approve", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    if (donation.safetyStatus === "EXPIRED") {
      return res.status(400).json({
        success: false,
        message: "Policy Violation: Expired food cannot be approved under any circumstances."
      });
    }

    let rescue = donation.rescueRequestId
      ? await RescueRequest.findById(donation.rescueRequestId)
      : await RescueRequest.findOne({ donationId: donation._id });

    if (!rescue) {
      const verificationToken = generateVerificationToken();
      const qrCodeImage = await generateQRCodeDataURL(verificationToken);
      const pickupOtpData = generateOTP();
      const deliveryOtpData = generateOTP();

      rescue = await RescueRequest.create({
        donationId: donation._id,
        donorId: donation.donorId,
        status: "MATCHED",
        verificationToken,
        qrCodeImage,
        pickupOtp: pickupOtpData.otp,
        pickupOtpExpiry: pickupOtpData.expiry,
        deliveryOtp: deliveryOtpData.otp,
        deliveryOtpExpiry: deliveryOtpData.expiry,
        matchScore: donation.safetyScore
      });
    } else {
      rescue = await RescueRequest.findByIdAndUpdate(rescue._id, { status: "MATCHED" }, { new: true });
    }

    const updatedDonation = await FoodDonation.findByIdAndUpdate(
      req.params.id,
      {
        status: "APPROVED",
        rescueRequestId: rescue._id
      },
      { new: true }
    );

    await Notification.create({
      userId: donation.donorId,
      title: "Donation Approved for Rescue!",
      message: `Your donation of ${donation.foodName} has been approved and entered into the Smart Rescue Matching engine.`,
      type: "SUCCESS",
      link: `/donor/track/${donation._id}`
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: "ADMIN",
      action: "DONATION_APPROVED",
      entityType: "FOOD_DONATION",
      entityId: String(donation._id),
      description: `Administrator approved donation '${donation.foodName}'. Rescue token active.`
    });

    const donor = await User.findById(donation.donorId);

if (donor?.email) {
  const approvalTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  await sendEmailNotification(
    donor.email,
    "Donation Approved for Rescue",
    `Hello ${donor.fullName},

Your food donation has been verified and approved for rescue.

Food: ${donation.foodName}
Quantity: ${donation.quantity} ${donation.unit}

Approval Time: ${approvalTime}

SafeServe Food Rescue Platform`
  );
}
    res.json({
      success: true,
      message: "Donation approved and initialized for smart rescue matching.",
      donation: updatedDonation,
      rescue
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 8. ADMIN REJECT DONATION
// ==========================================
router.patch("/:id/reject", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    const updated = await FoodDonation.findByIdAndUpdate(
      req.params.id,
      {
        status: "REJECTED",
        adminRejectionReason: reason || "Did not meet food safety hygiene criteria."
      },
      { new: true }
    );

    if (donation.rescueRequestId) {
      await RescueRequest.findByIdAndUpdate(donation.rescueRequestId, { status: "CANCELLED" });
    }

    await Notification.create({
      userId: donation.donorId,
      title: "Donation Declined",
      message: `Donation '${donation.foodName}' was declined by administration. Reason: ${reason || "Safety compliance issue."}`,
      type: "DANGER",
      link: `/donor/donations/${donation._id}`
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: "ADMIN",
      action: "DONATION_REJECTED",
      entityType: "FOOD_DONATION",
      entityId: String(donation._id),
      description: `Donation '${donation.foodName}' rejected. Reason: ${reason || "Safety policy failure."}`
    });

    res.json({
      success: true,
      message: "Donation rejected.",
      donation: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
