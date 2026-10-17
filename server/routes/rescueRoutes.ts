import { Router } from "express";
import {
  RescueRequest,
  FoodDonation,
  User,
  NGOAssignment,
  VolunteerAssignment,
  Notification
} from "../db";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";
import {
  rankNGOMatches,
  generateOTP,
  generateVerificationToken,
  generateQRCodeDataURL,
  recordAuditLog,
  updateActorTrustScore,
  sendEmailNotification,
  validateGPSLocation
} from "../services/index";

const router = Router();

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const routeEstimate = (donation: any, ngo: any) => {
  if (![donation?.latitude, donation?.longitude, ngo?.latitude, ngo?.longitude].every((v: any) => Number.isFinite(Number(v)))) {
    return { ngoDistanceKm: undefined, ngoEstimatedTravelMinutes: undefined };
  }
  const distance = haversineKm(Number(donation.latitude), Number(donation.longitude), Number(ngo.latitude), Number(ngo.longitude));
  // A transparent road-time estimate based on 30 km/h average urban speed.
  return { ngoDistanceKm: Number(distance.toFixed(2)), ngoEstimatedTravelMinutes: Math.max(1, Math.ceil((distance / 30) * 60)) };
};

const sanitizeRescueForRole = (rescue: any, role: string) => {
  const copy = { ...rescue };
  if (role === "VOLUNTEER") {
    delete copy.pickupOtp;
    delete copy.pickupOtpExpiry;
    delete copy.pickupOtpAttempts;
    delete copy.deliveryOtp;
    delete copy.deliveryOtpExpiry;
    delete copy.deliveryOtpAttempts;
  }
  return copy;
};

// ==========================================
// 1. GET ALL RESCUE OPERATIONS (Scoped by Role)
// ==========================================
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, ngoId, volunteerId } = req.query;
    const query: any = {};

    if (req.user.role === "NGO") {
      query.ngoId = req.user._id;
    } else if (req.user.role === "VOLUNTEER") {
      query.volunteerId = req.user._id;
    } else if (req.user.role === "DONOR") {
      query.donorId = req.user._id;
    } else {
      // ADMIN
      if (ngoId) query.ngoId = ngoId;
      if (volunteerId) query.volunteerId = volunteerId;
    }

    if (status && status !== "ALL") {
      query.status = status;
    }

    let rescues = await RescueRequest.find(query);
    rescues.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Populate donation details
    const populated = await Promise.all(
      rescues.map(async (r: any) => {
        const donation = await FoodDonation.findById(r.donationId);
        const donor = await User.findById(r.donorId);
        const ngo = r.ngoId ? await User.findById(r.ngoId) : null;
        const volunteer = r.volunteerId ? await User.findById(r.volunteerId) : null;
        return {
          ...sanitizeRescueForRole(r, req.user.role),
          donation,
          donor: donor ? {
            _id: donor._id,
            fullName: donor.fullName,
            phone: donor.phone,
            organizationName: donor.organizationName || donor.fullName,
            address: donor.address,
            latitude: donor.latitude,
            longitude: donor.longitude
          } : null,
          ngo: ngo ? {
            _id: ngo._id,
            fullName: ngo.organizationName || ngo.fullName,
            organizationName: ngo.organizationName || ngo.fullName,
            phone: ngo.phone,
            address: ngo.address,
            latitude: ngo.latitude,
            longitude: ngo.longitude
          } : null,
          volunteer: volunteer ? {
            _id: volunteer._id,
            fullName: volunteer.fullName,
            phone: volunteer.phone,
            transport: volunteer.transportation
          } : null
        };
      })
    );

    res.json({
      success: true,
      total: populated.length,
      rescues: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. GET AVAILABLE RESCUE TASKS FOR VOLUNTEERS (/available-tasks)
// MUST BE BEFORE /:id
// ==========================================
router.get("/available-tasks", authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Ensure all active and approved food donations have an associated RescueRequest
    const allDonations = await FoodDonation.find({});
    for (const d of allDonations) {
      if (!["REJECTED", "EXPIRED", "DELIVERED", "DISTRIBUTION_COMPLETED", "CANCELLED"].includes(d.status)) {
        let existingRescue = d.rescueRequestId
          ? await RescueRequest.findById(d.rescueRequestId)
          : await RescueRequest.findOne({ donationId: d._id });

        if (!existingRescue) {
          const verificationToken = generateVerificationToken();
          const qrCodeImage = await generateQRCodeDataURL(verificationToken);
          const pickupOtpData = generateOTP();
          const deliveryOtpData = generateOTP();

          existingRescue = await RescueRequest.create({
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
            matchScore: d.safetyScore || 92,
            pickupAddress: d.pickupAddress,
            deliveryAddress: "Verified Partner NGO Shelter"
          });

          await FoodDonation.findByIdAndUpdate(d._id, {
            rescueRequestId: existingRescue._id
          });
        }
      }
    }

    const allRescues = await RescueRequest.find({});
    // Rescues needing a volunteer: volunteerId is empty/null, and not completed/cancelled/rejected
    const openRescues = allRescues.filter((r: any) =>
      !r.volunteerId &&
      !["DELIVERED", "DISTRIBUTION_COMPLETED", "REJECTED", "CANCELLED"].includes(r.status)
    );

    openRescues.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const tasks = await Promise.all(
      openRescues.map(async (r: any) => {
        const donation = await FoodDonation.findById(r.donationId);
        const donor = await User.findById(r.donorId);
        const ngo = r.ngoId ? await User.findById(r.ngoId) : null;

        return {
          ...sanitizeRescueForRole(r, req.user.role),
          donation,
          donor: donor ? {
            _id: donor._id,
            fullName: donor.fullName,
            organizationName: donor.organizationName || donor.fullName,
            phone: donor.phone,
            address: donor.address,
            latitude: donor.latitude,
            longitude: donor.longitude
          } : null,
          ngo: ngo ? {
            _id: ngo._id,
            fullName: ngo.fullName,
            organizationName: ngo.organizationName || ngo.fullName,
            phone: ngo.phone,
            address: ngo.address,
            latitude: ngo.latitude,
            longitude: ngo.longitude
          } : null,
          pickupAddress: r.pickupAddress || donation?.pickupAddress || donor?.address || "Donor Facility",
          deliveryAddress: r.deliveryAddress || ngo?.address || "Verified Partner NGO Shelter"
        };
      })
    );

    res.json({
      success: true,
      total: tasks.length,
      tasks
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. GET VOLUNTEER'S CURRENT AND PAST MISSIONS (/my-volunteer)
// MUST BE BEFORE /:id
// ==========================================
router.get("/my-volunteer", authenticateToken, async (req: AuthRequest, res) => {
  try {
    let rescues = await RescueRequest.find(
      req.user.role === "ADMIN" ? {} : { volunteerId: req.user._id }
    );

    rescues.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const populated = await Promise.all(
      rescues.map(async (r: any) => {
        const donation = await FoodDonation.findById(r.donationId);
        const donor = await User.findById(r.donorId);
        const ngo = r.ngoId ? await User.findById(r.ngoId) : null;

        return {
          ...sanitizeRescueForRole(r, req.user.role),
          donation,
          donor: donor ? {
            _id: donor._id,
            fullName: donor.fullName,
            organizationName: donor.organizationName || donor.fullName,
            phone: donor.phone,
            address: donor.address,
            latitude: donor.latitude,
            longitude: donor.longitude
          } : null,
          ngo: ngo ? {
            _id: ngo._id,
            fullName: ngo.fullName,
            organizationName: ngo.organizationName || ngo.fullName,
            phone: ngo.phone,
            address: ngo.address,
            latitude: ngo.latitude,
            longitude: ngo.longitude
          } : null,
          pickupAddress: r.pickupAddress || donation?.pickupAddress || donor?.address || "Donor Facility",
          deliveryAddress: r.deliveryAddress || ngo?.address || "Verified Partner NGO Shelter"
        };
      })
    );

    res.json({
      success: true,
      total: populated.length,
      rescues: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. GET RESCUES FOR CURRENT NGO (/my-ngo)
// MUST BE BEFORE /:id
// ==========================================
router.get("/my-ngo", authenticateToken, async (req: AuthRequest, res) => {
  try {
    let rescues = await RescueRequest.find(
      req.user.role === "ADMIN" ? {} : { ngoId: req.user._id }
    );

    // If no rescues specifically assigned to this NGO yet, provide accessible active rescues
    if (rescues.length === 0) {
      rescues = await RescueRequest.find({});
    }

    rescues.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const populated = await Promise.all(
      rescues.map(async (r: any) => {
        const donation = await FoodDonation.findById(r.donationId);
        const donor = await User.findById(r.donorId);
        const ngo = r.ngoId ? await User.findById(r.ngoId) : null;
        const volunteer = r.volunteerId ? await User.findById(r.volunteerId) : null;

        return {
          ...sanitizeRescueForRole(r, req.user.role),
          donation,
          donor: donor ? {
            fullName: donor.fullName,
            phone: donor.phone,
            org: donor.organizationName || donor.fullName,
            organizationName: donor.organizationName || donor.fullName,
            address: donor.address,
            latitude: donor.latitude,
            longitude: donor.longitude
          } : null,
          ngo: ngo ? {
            fullName: ngo.organizationName || ngo.fullName,
            organizationName: ngo.organizationName || ngo.fullName,
            phone: ngo.phone,
            address: ngo.address,
            latitude: ngo.latitude,
            longitude: ngo.longitude
          } : null,
          volunteer: volunteer ? {
            fullName: volunteer.fullName,
            phone: volunteer.phone,
            transport: volunteer.transportation
          } : null
        };
      })
    );

    res.json({
      success: true,
      total: populated.length,
      rescues: populated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. VOLUNTEER ACCEPTS RESCUE TASK (/accept-task)
// MUST BE BEFORE /:id
// ==========================================
router.post("/accept-task", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { rescueId } = req.body;
    if (!rescueId) {
      return res.status(400).json({ success: false, message: "Rescue ID is required." });
    }

    if (req.user.role !== "VOLUNTEER") {
      return res.status(403).json({ success: false, message: "Only a volunteer can accept a rescue task." });
    }

    const rescue = await RescueRequest.findById(rescueId);
    if (!rescue) {
      return res.status(404).json({ success: false, message: "Rescue mission not found." });
    }
    if (rescue.volunteerId && String(rescue.volunteerId) !== String(req.user._id)) {
      return res.status(409).json({ success: false, message: "This rescue is already assigned to another volunteer." });
    }
    if (!rescue.ngoId) {
      return res.status(400).json({ success: false, message: "An NGO must be selected before a volunteer can accept this task." });
    }
    if (req.user.status !== "VERIFIED") {
      return res.status(403).json({ success: false, message: "Your volunteer account must be verified before accepting a task." });
    }
    if ((req.user.availabilityStatus || "AVAILABLE") !== "AVAILABLE") {
      return res.status(409).json({ success: false, message: `You are currently ${String(req.user.availabilityStatus || "AVAILABLE").toLowerCase()}. Set your availability to AVAILABLE before accepting a task.` });
    }
    if (!["MATCHED", "NGO_ASSIGNED"].includes(rescue.status)) {
      return res.status(409).json({ success: false, message: `This rescue cannot be accepted from the current state: ${rescue.status}.` });
    }

    let pickupOtp = rescue.pickupOtp;
    let deliveryOtp = rescue.deliveryOtp;
    if (!pickupOtp) {
      const p = generateOTP();
      pickupOtp = p.otp;
    }
    if (!deliveryOtp) {
      const d = generateOTP();
      deliveryOtp = d.otp;
    }

    const updated = await RescueRequest.findByIdAndUpdate(
      rescueId,
      {
        volunteerId: req.user._id,
        status: "VOLUNTEER_ASSIGNED",
        pickupOtp,
        deliveryOtp
      },
      { new: true }
    );

    await FoodDonation.findByIdAndUpdate(rescue.donationId, {
      assignedVolunteerId: req.user._id,
      status: "VOLUNTEER_ASSIGNED"
    });

    await VolunteerAssignment.create({
      rescueId: rescue._id,
      volunteerId: req.user._id,
      status: "ACCEPTED",
      acceptedAt: new Date().toISOString()
    });

    await User.findByIdAndUpdate(req.user._id, { availabilityStatus: "BUSY" });

    // Notify Donor
    await Notification.create({
      userId: rescue.donorId,
      title: "Volunteer Dispatched for Pickup",
      message: `Volunteer ${req.user.fullName} has accepted the rescue. Please provide the Pickup OTP directly to the volunteer when they arrive.`,
      type: "SUCCESS",
      link: `/donor/track/${rescue.donationId}`
    });

    // Notify NGO if assigned
    if (rescue.ngoId) {
      await Notification.create({
        userId: rescue.ngoId,
        title: "Courier En Route",
        message: `Volunteer ${req.user.fullName} has accepted the rescue. Please provide the Delivery OTP directly to the volunteer when they arrive at the NGO.`,
        type: "INFO",
        link: `/ngo/rescues`
      });
    }

    // Audit Log
    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
      action: "VOLUNTEER_ACCEPTED",
      entityType: "RESCUE_REQUEST",
      entityId: String(rescue._id),
      description: `Volunteer ${req.user.fullName} accepted rescue mission.`
    });

    res.json({
      success: true,
      message: "Rescue task accepted successfully!",
      rescue: sanitizeRescueForRole(updated, req.user.role)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. VERIFY PICKUP VIA OTP OR QR SCAN (/verify-pickup)
// MUST BE BEFORE /:id
// ==========================================
router.post("/verify-pickup", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { rescueId, pickupOtp, verificationToken, latitude, longitude, notes } = req.body;
    if (!rescueId || !pickupOtp) {
      return res.status(400).json({ success: false, message: "Pickup OTP is required. Ask the donor for the OTP and enter it manually." });
    }

    const rescue = await RescueRequest.findById(rescueId);
    if (!rescue) return res.status(404).json({ success: false, message: "Rescue mission not found." });
    if (req.user.role !== "VOLUNTEER" || String(rescue.volunteerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the assigned volunteer can verify this pickup." });
    }
    if (!["VOLUNTEER_ASSIGNED", "PICKUP_SCHEDULED"].includes(rescue.status)) {
      return res.status(409).json({ success: false, message: `Pickup verification is not allowed from state ${rescue.status}.` });
    }
    if (!rescue.pickupOtp) return res.status(400).json({ success: false, message: "No active pickup OTP exists. Ask the donor to request a new OTP." });
    if (rescue.pickupOtpExpiry && new Date() > new Date(rescue.pickupOtpExpiry)) {
      return res.status(400).json({ success: false, message: "Pickup OTP has expired. Ask the donor for a new OTP." });
    }
    if ((rescue.pickupOtpAttempts || 0) >= 3) {
      return res.status(400).json({ success: false, message: "Maximum OTP attempts exceeded. Ask the donor to request a new OTP." });
    }
    if (String(pickupOtp).trim() !== String(rescue.pickupOtp).trim()) {
      await RescueRequest.findByIdAndUpdate(rescueId, { $inc: { pickupOtpAttempts: 1 } });
      return res.status(400).json({ success: false, message: `Invalid Pickup OTP. The delivery state has NOT changed. Attempt ${(rescue.pickupOtpAttempts || 0) + 1} of 3.` });
    }
    if (verificationToken && String(verificationToken).trim() !== String(rescue.verificationToken).trim()) {
      return res.status(400).json({ success: false, message: "Invalid QR token. The delivery state has NOT changed." });
    }

    const donation = await FoodDonation.findById(rescue.donationId);
    if (!donation) return res.status(404).json({ success: false, message: "Food donation record missing." });
    const clientLat = Number(latitude);
    const clientLon = Number(longitude);
    if (!Number.isFinite(clientLat) || !Number.isFinite(clientLon)) {
      return res.status(400).json({ success: false, message: "Valid GPS coordinates are required for pickup verification." });
    }
    if (!Number.isFinite(Number(donation.latitude)) || !Number.isFinite(Number(donation.longitude))) {
      return res.status(400).json({ success: false, message: "Donor pickup coordinates are missing; pickup cannot be verified." });
    }

    const gpsCheck = validateGPSLocation(clientLat, clientLon, Number(donation.latitude), Number(donation.longitude), 2000);
    if (!gpsCheck.isValid) return res.status(400).json({ success: false, message: gpsCheck.message, deviationMeters: gpsCheck.deviationMeters });

    const verifiedTime = new Date();
    const updated = await RescueRequest.findByIdAndUpdate(rescueId, {
      status: "IN_TRANSIT", pickupTime: verifiedTime, pickupVerifiedAt: verifiedTime, pickupLatitude: clientLat, pickupLongitude: clientLon, pickupVerifiedBy: req.user._id, pickupNotes: notes || "Pickup verified by donor-provided OTP", pickupOtp: null, pickupOtpExpiry: null
    }, { new: true });
    await FoodDonation.findByIdAndUpdate(rescue.donationId, { status: "IN_TRANSIT" });
    await Notification.create({ userId: rescue.donorId, title: "Food Picked Up", message: `Volunteer ${req.user.fullName} verified pickup. Food is now IN TRANSIT.`, type: "SUCCESS", link: `/donor/track/${rescue.donationId}` });
    if (rescue.ngoId) await Notification.create({ userId: rescue.ngoId, title: "Food Is In Transit", message: `Volunteer ${req.user.fullName} has verified pickup of ${donation.quantity} ${donation.unit} of ${donation.foodName}. Please provide the Delivery OTP when the volunteer arrives.`, type: "INFO", link: `/ngo/delivery` });

    res.json({ success: true, message: "Pickup verified successfully. Food is now IN TRANSIT.", rescue: sanitizeRescueForRole(updated, req.user.role) });
  } catch (err: any) {
    console.error("Pickup verification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. VERIFY DELIVERY VIA OTP (/verify-delivery)
// MUST BE BEFORE /:id
// ==========================================
router.post("/verify-delivery", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { rescueId, deliveryOtp, latitude, longitude, notes } = req.body;
    if (!rescueId || !deliveryOtp) return res.status(400).json({ success: false, message: "Delivery OTP is required. Ask the NGO for the OTP and enter it manually." });
    const rescue = await RescueRequest.findById(rescueId);
    if (!rescue) return res.status(404).json({ success: false, message: "Rescue mission not found." });
    if (req.user.role !== "VOLUNTEER" || String(rescue.volunteerId) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Only the assigned volunteer can verify delivery." });
    if (rescue.status !== "IN_TRANSIT") return res.status(409).json({ success: false, message: `Delivery verification is not allowed from state ${rescue.status}.` });
    if (!rescue.deliveryOtp) return res.status(400).json({ success: false, message: "No active delivery OTP exists. Ask the NGO to request a new OTP." });
    if (rescue.deliveryOtpExpiry && new Date() > new Date(rescue.deliveryOtpExpiry)) return res.status(400).json({ success: false, message: "Delivery OTP has expired. Ask the NGO for a new OTP." });
    if ((rescue.deliveryOtpAttempts || 0) >= 3) return res.status(400).json({ success: false, message: "Maximum OTP attempts exceeded. Ask the NGO to request a new OTP." });
    if (String(deliveryOtp).trim() !== String(rescue.deliveryOtp).trim()) {
      await RescueRequest.findByIdAndUpdate(rescueId, { $inc: { deliveryOtpAttempts: 1 } });
      return res.status(400).json({ success: false, message: `Invalid NGO Delivery OTP. The delivery state has NOT changed. Attempt ${(rescue.deliveryOtpAttempts || 0) + 1} of 3.` });
    }

    const donation = await FoodDonation.findById(rescue.donationId);
    if (!donation) return res.status(404).json({ success: false, message: "Food donation record missing." });
    const ngo = rescue.ngoId ? await User.findById(rescue.ngoId) : null;
    if (!ngo) return res.status(400).json({ success: false, message: "No receiving NGO is assigned to this rescue." });
    const clientLat = Number(latitude), clientLon = Number(longitude);
    if (!Number.isFinite(clientLat) || !Number.isFinite(clientLon)) return res.status(400).json({ success: false, message: "Valid GPS coordinates are required for delivery verification." });
    if (!Number.isFinite(Number(ngo.latitude)) || !Number.isFinite(Number(ngo.longitude))) return res.status(400).json({ success: false, message: "NGO coordinates are missing; delivery cannot be verified." });
    const gpsCheck = validateGPSLocation(clientLat, clientLon, Number(ngo.latitude), Number(ngo.longitude), 2000);
    if (!gpsCheck.isValid) return res.status(400).json({ success: false, message: gpsCheck.message, deviationMeters: gpsCheck.deviationMeters });

    const deliveredTime = new Date();
    const updated = await RescueRequest.findByIdAndUpdate(rescueId, { status: "DELIVERED", deliveryTime: deliveredTime, deliveryVerifiedAt: deliveredTime, deliveryLatitude: clientLat, deliveryLongitude: clientLon, deliveryVerifiedBy: req.user._id, deliveryNotes: notes || "Delivery verified using NGO-provided OTP", deliveryOtp: null, deliveryOtpExpiry: null }, { new: true });
    await FoodDonation.findByIdAndUpdate(rescue.donationId, { status: "DELIVERED" });
    if (rescue.volunteerId) {
      await User.findByIdAndUpdate(rescue.volunteerId, { $inc: { completedDeliveries: 1, completedPickups: 1 }, availabilityStatus: "AVAILABLE" });
      await updateActorTrustScore(String(rescue.volunteerId), +3, "Successful surplus delivery verified");
    }
    await Notification.create({ userId: rescue.donorId, title: "Food Safely Delivered", message: `Your food donation has been verified at ${ngo.organizationName || ngo.fullName}.`, type: "SUCCESS", link: `/donor/track/${rescue.donationId}` });
    await Notification.create({ userId: rescue.ngoId, title: "Food Delivery Received", message: `Delivery of ${donation.quantity} ${donation.unit} has been verified successfully.`, type: "SUCCESS", link: `/ngo/rescues` });
    await recordAuditLog({ userId: req.user._id, userEmail: req.user.email, role: req.user.role, action: "DELIVERY_VERIFIED", entityType: "RESCUE_REQUEST", entityId: String(rescue._id), description: `Delivery verified with NGO OTP and GPS. State: DELIVERED.` });
    res.json({ success: true, message: "Delivery verified successfully. Food is now DELIVERED.", rescue: sanitizeRescueForRole(updated, req.user.role) });
  } catch (err: any) {
    console.error("Delivery verification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 8. VERIFY TOKEN QR SCAN LOOKUP (/verify-token/:token)
// MUST BE BEFORE /:id
// ==========================================
router.get("/verify-token/:token", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const token = req.params.token;
    const rescue = await RescueRequest.findOne({ verificationToken: token });
    if (!rescue) {
      return res.status(404).json({ success: false, message: "No active consignment matches this QR token." });
    }

    const donation = await FoodDonation.findById(rescue.donationId);
    const donor = await User.findById(rescue.donorId);

    res.json({
      success: true,
      rescue: {
        ...sanitizeRescueForRole(rescue, req.user.role),
        donation,
        donor: donor ? { _id: donor._id, fullName: donor.fullName, organizationName: donor.organizationName || donor.fullName, phone: donor.phone, address: donor.address } : null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 9. NGO CLAIMS DONATION (/claim)
// MUST BE BEFORE /:id
// ==========================================
router.post("/claim", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { donationId } = req.body;
    if (!donationId) {
      return res.status(400).json({ success: false, message: "Donation ID is required." });
    }

    const donation = await FoodDonation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found." });
    }

    let rescue = donation.rescueRequestId
      ? await RescueRequest.findById(donation.rescueRequestId)
      : await RescueRequest.findOne({ donationId: donation._id });

    if (!rescue) {
      const pickupOtpData = generateOTP();
      const deliveryOtpData = generateOTP();
      const verificationToken = generateVerificationToken();
      const qrCodeImage = await generateQRCodeDataURL(verificationToken);

      rescue = await RescueRequest.create({
        donationId: donation._id,
        donorId: donation.donorId,
        ngoId: req.user._id,
        status: "NGO_ASSIGNED",
        verificationToken,
        qrCodeImage,
        pickupOtp: pickupOtpData.otp,
        pickupOtpExpiry: pickupOtpData.expiry,
        pickupOtpAttempts: 0,
        deliveryOtp: deliveryOtpData.otp,
        deliveryOtpExpiry: deliveryOtpData.expiry,
        deliveryOtpAttempts: 0,
        matchScore: donation.safetyScore
      });
    } else {
      rescue = await RescueRequest.findByIdAndUpdate(
        rescue._id,
        {
          ngoId: req.user._id,
          deliveryAddress: req.user.address || "Verified Partner NGO Shelter",
          status: "NGO_ASSIGNED"
        },
        { new: true }
      );
    }

    const route = routeEstimate(donation, req.user);
    rescue = await RescueRequest.findByIdAndUpdate(rescue._id, { deliveryAddress: req.user.address || "Verified Partner NGO Shelter", ...route }, { new: true });

    await FoodDonation.findByIdAndUpdate(donation._id, {
      assignedNgoId: req.user._id,
      status: "NGO_ASSIGNED",
      rescueRequestId: rescue._id
    });

    await NGOAssignment.create({
      rescueId: rescue._id,
      ngoId: req.user._id,
      assignedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "Donation claimed successfully! Ready for volunteer transit assignment.",
      rescue
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 10. GET SINGLE RESCUE DETAILS
// ==========================================
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, message: "Rescue operation not found" });
    }

    // Ownership Enforcement: Donors can ONLY view their own rescue missions
    if (req.user.role === "DONOR" && String(rescue.donorId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are only authorized to view your own rescue operations."
      });
    }

    const donation = await FoodDonation.findById(rescue.donationId);
    const donor = await User.findById(rescue.donorId);
    const ngo = rescue.ngoId ? await User.findById(rescue.ngoId) : null;
    const volunteer = rescue.volunteerId ? await User.findById(rescue.volunteerId) : null;

    res.json({
      success: true,
      rescue: sanitizeRescueForRole(rescue, req.user.role),
      donation,
      donor: donor ? {
        _id: donor._id,
        fullName: donor.fullName,
        phone: donor.phone,
        organizationName: donor.organizationName,
        address: donor.address,
        city: donor.city,
        latitude: donor.latitude,
        longitude: donor.longitude
      } : null,
      ngo: ngo ? {
        _id: ngo._id,
        organizationName: ngo.organizationName || ngo.fullName,
        contactPerson: ngo.contactPerson,
        phone: ngo.phone,
        address: ngo.address,
        latitude: ngo.latitude,
        longitude: ngo.longitude
      } : null,
      volunteer: volunteer ? {
        _id: volunteer._id,
        fullName: volunteer.fullName,
        phone: volunteer.phone,
        transportation: volunteer.transportation,
        availability: volunteer.availability
      } : null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 11. RUN SMART RESCUE MATCHING FOR NGO
// ==========================================
router.post("/:id/match", authenticateToken, requireRole(["ADMIN", "NGO"]), async (req: AuthRequest, res) => {
  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, message: "Rescue operation not found" });
    }

    const donation = await FoodDonation.findById(rescue.donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Associated food donation record missing." });
    }

    const verifiedNGOs = await User.find({ role: "NGO", status: "VERIFIED" });
    const matches = rankNGOMatches(
      {
        latitude: donation.latitude,
        longitude: donation.longitude,
        quantity: donation.quantity,
        foodCategory: donation.foodCategory
      },
      verifiedNGOs
    );

    res.json({
      success: true,
      donationId: donation._id,
      foodName: donation.foodName,
      quantity: `${donation.quantity} ${donation.unit}`,
      totalEligibleNGOs: matches.length,
      recommendations: matches
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 12. ASSIGN NGO TO RESCUE
// ==========================================
router.post("/:id/assign-ngo", authenticateToken, requireRole(["ADMIN", "NGO"]), async (req: AuthRequest, res) => {
  try {
    const { ngoId } = req.body;
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, message: "Rescue not found" });
    }

    const donation = await FoodDonation.findById(rescue.donationId);
    if (!donation) return res.status(404).json({ success: false, message: "Associated donation not found." });
    const ngo = await User.findById(ngoId);
    if (!ngo || ngo.role !== "NGO") {
      return res.status(400).json({ success: false, message: "Invalid NGO entity identifier supplied." });
    }

    const route = routeEstimate(donation, ngo);
    const updated = await RescueRequest.findByIdAndUpdate(
      req.params.id,
      {
        ngoId: ngo._id,
        status: "NGO_ASSIGNED",
        deliveryAddress: ngo.address,
        ...route
      },
      { new: true }
    );

    await FoodDonation.findByIdAndUpdate(rescue.donationId, {
      assignedNgoId: ngo._id,
      status: "NGO_ASSIGNED"
    });

    await NGOAssignment.create({
      rescueId: rescue._id,
      ngoId: ngo._id,
      assignedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Rescue allocated to NGO ${ngo.organizationName || ngo.fullName}.`,
      rescue: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 13. ASSIGN VOLUNTEER (Manual Admin Dispatch)
// ==========================================
router.post("/:id/assign-volunteer", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const { volunteerId } = req.body;
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, message: "Rescue operation not found" });
    }

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== "VOLUNTEER") {
      return res.status(400).json({ success: false, message: "Target user is not registered as a volunteer courier." });
    }
    if ((volunteer.availabilityStatus || "AVAILABLE") !== "AVAILABLE") {
      return res.status(409).json({ success: false, message: `Volunteer is currently ${String(volunteer.availabilityStatus || "AVAILABLE").toLowerCase()} and cannot be assigned.` });
    }

    let pickupOtp = rescue.pickupOtp;
    let deliveryOtp = rescue.deliveryOtp;
    if (!pickupOtp) {
      const p = generateOTP();
      pickupOtp = p.otp;
    }
    if (!deliveryOtp) {
      const d = generateOTP();
      deliveryOtp = d.otp;
    }

    const updatedRescue = await RescueRequest.findByIdAndUpdate(
      req.params.id,
      {
        volunteerId: volunteer._id,
        status: "VOLUNTEER_ASSIGNED",
        pickupOtp,
        deliveryOtp
      },
      { new: true }
    );

    await FoodDonation.findByIdAndUpdate(rescue.donationId, {
      assignedVolunteerId: volunteer._id,
      status: "VOLUNTEER_ASSIGNED"
    });

    await VolunteerAssignment.create({
      rescueId: rescue._id,
      volunteerId: volunteer._id,
      status: "ASSIGNED",
      assignedAt: new Date().toISOString()
    });
    await User.findByIdAndUpdate(volunteer._id, { availabilityStatus: "BUSY" });

    res.json({
      success: true,
      message: `Volunteer ${volunteer.fullName} assigned to rescue.`,
      rescue: updatedRescue
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 14. DISTRIBUTION COMPLETED
// ==========================================
router.patch("/:id/complete-distribution", authenticateToken, requireRole(["NGO", "ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) {
      return res.status(404).json({ success: false, message: "Rescue not found" });
    }

    const updatedRescue = await RescueRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: "DISTRIBUTION_COMPLETED",
        distributionCompletedAt: new Date().toISOString()
      },
      { new: true }
    );

    const donation = await FoodDonation.findByIdAndUpdate(
      rescue.donationId,
      {
        status: "DISTRIBUTION_COMPLETED"
      },
      { new: true }
    );

    // Trust Score Rewards
    if (rescue.donorId) {
      await updateActorTrustScore(String(rescue.donorId), +2, "Successful surplus food distribution cycle completed");
      await User.findByIdAndUpdate(rescue.donorId, {
        $inc: { totalFoodRescuedKg: donation ? donation.quantity : 10 }
      });
    }
    if (rescue.ngoId) {
      await updateActorTrustScore(String(rescue.ngoId), +2, "Timely distribution to beneficiaries executed");
      await User.findByIdAndUpdate(rescue.ngoId, {
        $inc: { completedDeliveries: 1 }
      });
    }
    if (rescue.volunteerId) {
      await updateActorTrustScore(String(rescue.volunteerId), +3, "Flawless verified multi-stage rescue logistics");
      await User.findByIdAndUpdate(rescue.volunteerId, {
        $inc: { completedDeliveries: 1, completedPickups: 1 }
      });
    }
    // ==========================================
// EMAIL: DONOR - DONATION SUCCESSFULLY COMPLETED
// ==========================================
if (rescue.donorId && donation) {
  const donor = await User.findById(rescue.donorId);

  if (donor?.email) {
    const completionTime = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    const ngo = rescue.ngoId
      ? await User.findById(rescue.ngoId)
      : null;

    const ngoName = ngo
      ? (ngo.organizationName || ngo.fullName)
      : "Partner NGO";

    await Notification.create({
      userId: donor._id,
      title: "Donation Successfully Completed",
      message: `Your donation of ${donation.quantity} ${donation.unit} has been successfully distributed through ${ngoName}.`,
      type: "SUCCESS",
      link: `/donor/track/${donation._id}`
    });

    await sendEmailNotification(
      donor.email,
      "Your Food Donation Was Successfully Completed",
      `Hello ${donor.fullName},

Your food donation has been successfully rescued and distributed.

Food: ${donation.foodName}
Quantity: ${donation.quantity} ${donation.unit}
NGO: ${ngoName}

Completion Time: ${completionTime}

Thank you for helping reduce food waste and supporting people in need.

Regards,
SafeServe Food Rescue Platform`
    );
  }
}
    res.json({
      success: true,
      message: "Rescue distribution successfully completed. Trust scores updated.",
      rescue: updatedRescue
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
