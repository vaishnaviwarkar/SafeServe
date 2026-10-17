import crypto from "crypto";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";
import { AuditLog, User } from "../db";

// ==========================================
// 1. FOOD SAFETY ASSESSMENT SERVICE
// ==========================================
export interface SafetyEvaluationResult {
  score: number;
  status: "ELIGIBLE" | "REVIEW_REQUIRED" | "NOT_ELIGIBLE" | "EXPIRED";
  reason: string;
  hoursRemaining: number;
  storageSuitability: string;
  packagingIntegrity: string;
}

export function evaluateFoodSafety(donationData: {
  foodCategory: string;
  preparationDate: string;
  preparationTime: string;
  expiryDate: string;
  expiryTime: string;
  storageCondition: string;
  packagingCondition: string;
  quantity: number;
}): SafetyEvaluationResult {
  let score = 100;
  const reasons: string[] = [];

  const now = new Date();
  const prepDateTime = new Date(`${donationData.preparationDate}T${donationData.preparationTime}:00`);
  const expiryDateTime = new Date(`${donationData.expiryDate}T${donationData.expiryTime}:00`);

  // 1. Expiry Check
  const msRemaining = expiryDateTime.getTime() - now.getTime();
  const hoursRemaining = Math.round((msRemaining / (1000 * 60 * 60)) * 10) / 10;

  if (hoursRemaining <= 0) {
    return {
      score: 15,
      status: "EXPIRED",
      reason: "Food item has passed its declared expiry timestamp. Unsafe for human consumption.",
      hoursRemaining: 0,
      storageSuitability: "Unfit (Expired)",
      packagingIntegrity: donationData.packagingCondition
    };
  }

  // 2. Remaining Shelf Life Deduction
  if (hoursRemaining < 2) {
    score -= 35;
    reasons.push("Critical shelf life: less than 2 hours remaining until expiry.");
  } else if (hoursRemaining < 4) {
    score -= 20;
    reasons.push("Urgent window: between 2 to 4 hours remaining.");
  } else if (hoursRemaining < 8) {
    score -= 8;
    reasons.push("Moderate shelf life window (under 8 hours).");
  }

  // 3. Storage Condition Suitability
  const storage = donationData.storageCondition;
  const category = donationData.foodCategory;

  if (category === "Cooked Meals") {
    if (storage === "Room Temperature") {
      score -= 25;
      reasons.push("Cooked meals stored at ambient room temperature carry elevated microbial growth risk if held beyond 2 hours.");
    } else if (storage === "Hot Held (> 60°C)" || storage === "Refrigerated (0-4°C)") {
      score += 0; // Ideal
    }
  } else if (category === "Dairy Products") {
    if (storage !== "Refrigerated (0-4°C)" && storage !== "Frozen (< -18°C)") {
      score -= 35;
      reasons.push("Dairy products require continuous refrigeration to prevent spoilage.");
    }
  } else if (category === "Fresh Produce") {
    if (storage === "Frozen (< -18°C)") {
      score -= 10;
      reasons.push("Fresh produce cell structures degrade when improperly frozen.");
    }
  }

  // 4. Packaging Condition Integrity
  const packaging = donationData.packagingCondition;
  if (packaging === "Partially Damaged / Opened") {
    score -= 40;
    reasons.push("Damaged or open packaging exposes food to foreign contaminants.");
  } else if (packaging === "Clean Covered Vessels") {
    score -= 5;
    reasons.push("Covered vessels are acceptable but airtight packaging is preferred for transit.");
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine status
  let status: "ELIGIBLE" | "REVIEW_REQUIRED" | "NOT_ELIGIBLE" | "EXPIRED" = "ELIGIBLE";
  if (score < 40 || packaging === "Partially Damaged / Opened") {
    status = "NOT_ELIGIBLE";
  } else if (score < 75) {
    status = "REVIEW_REQUIRED";
  } else {
    status = "ELIGIBLE";
  }

  const finalReason = reasons.length > 0 
    ? reasons.join("; ") 
    : "Food complies with safety, temperature hold, and hygienic containment criteria.";

  return {
    score,
    status,
    reason: finalReason,
    hoursRemaining: Math.max(0, hoursRemaining),
    storageSuitability: storage,
    packagingIntegrity: packaging
  };
}

// ==========================================
// 2. SMART RESCUE MATCHING ENGINE
// ==========================================
export interface NGOMatchResult {
  ngoId: string;
  organizationName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  distanceKm: number;
  capacity: number;
  trustScore: number;
  matchScore: number;
  availability: "HIGH" | "MEDIUM" | "NORMAL";
  matchedCategories: string[];
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function rankNGOMatches(
  donation: {
    latitude: number;
    longitude: number;
    quantity: number;
    foodCategory: string;
  },
  verifiedNGOs: any[]
): NGOMatchResult[] {
  const results: NGOMatchResult[] = [];

  for (const ngo of verifiedNGOs) {
    const ngoLat = ngo.latitude || 28.6139;
    const ngoLon = ngo.longitude || 77.2090;
    const distanceKm = calculateDistanceKm(donation.latitude, donation.longitude, ngoLat, ngoLon);

    let matchScore = 100;

    // 1. Distance penalty: 2.5 points deducted per km over 1km
    if (distanceKm > 1) {
      matchScore -= Math.min(45, Math.round((distanceKm - 1) * 2.5));
    }

    // 2. Capacity ratio
    const capacity = ngo.foodCapacity || 200;
    if (capacity < donation.quantity) {
      matchScore -= 25; // Capacity shortage
    } else {
      matchScore += 5; // Adequate room
    }

    // 3. Category preference match
    const acceptedCategories: string[] = ngo.requiredFoodCategories || [];
    const categoryMatched = acceptedCategories.length === 0 || acceptedCategories.includes(donation.foodCategory);
    if (categoryMatched) {
      matchScore += 10;
    } else {
      matchScore -= 20;
    }

    // 4. Trust score multiplier
    const ngoTrust = ngo.trustScore || 85;
    if (ngoTrust >= 90) matchScore += 5;
    else if (ngoTrust < 75) matchScore -= 15;

    matchScore = Math.max(10, Math.min(99, matchScore));

    let availability: "HIGH" | "MEDIUM" | "NORMAL" = "NORMAL";
    if (distanceKm < 5 && capacity >= donation.quantity) {
      availability = "HIGH";
    } else if (distanceKm < 12) {
      availability = "MEDIUM";
    }

    results.push({
      ngoId: String(ngo._id),
      organizationName: ngo.organizationName || ngo.fullName,
      contactPerson: ngo.contactPerson || ngo.fullName,
      phone: ngo.phone,
      email: ngo.email,
      address: ngo.address,
      distanceKm,
      capacity,
      trustScore: ngoTrust,
      matchScore,
      availability,
      matchedCategories: acceptedCategories
    });
  }

  // Sort descending by matchScore
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

// ==========================================
// 3. OTP GENERATION & VERIFICATION SERVICE
// ==========================================
export function generateOTP(): { otp: string; expiry: Date } {
  // Generate real cryptographically randomized 6-digit OTP
  const buffer = crypto.randomBytes(3);
  const num = (buffer.readUIntBE(0, 3) % 900000) + 100000;
  const otp = num.toString();
  // 15 minutes validity
  const expiry = new Date(Date.now() + 15 * 60 * 1000);
  return { otp, expiry };
}

// ==========================================
// 4. QR CODE SERVICE
// ==========================================
export function generateVerificationToken(): string {
  // Secure random hex token containing only identifier
  return `SSR-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
}

export async function generateQRCodeDataURL(token: string): Promise<string> {
  try {
    const qrData = JSON.stringify({
      app: "SafeServe",
      token: token,
      verifiedDomain: "safeserve.org"
    });
    return await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#4a044e", // Deep purple
        light: "#ffffff"
      },
      width: 320
    });
  } catch (err) {
    console.error("QR Code Generation Error:", err);
    return "";
  }
}

// ==========================================
// 5. GPS DISTANCE TOLERANCE VALIDATION
// ==========================================
export function validateGPSLocation(
  clientLat: number,
  clientLon: number,
  targetLat: number,
  targetLon: number,
  toleranceMeters: number = 1500 // 1.5km urban tolerance
): { isValid: boolean; deviationMeters: number; message: string } {
  const distanceKm = calculateDistanceKm(clientLat, clientLon, targetLat, targetLon);
  const deviationMeters = Math.round(distanceKm * 1000);

  if (deviationMeters <= toleranceMeters) {
    return {
      isValid: true,
      deviationMeters,
      message: `GPS validation successful within ${deviationMeters} meters of designated coordinate.`
    };
  } else {
    return {
      isValid: false,
      deviationMeters,
      message: `Location verification failed. You are approximately ${deviationMeters} meters away from the registered coordinates (tolerance is ${toleranceMeters}m).`
    };
  }
}

// ==========================================
// 6. TRUST SCORE RECALCULATION
// ==========================================
export async function updateActorTrustScore(userId: string, delta: number, reason: string) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    const current = user.trustScore ?? 85;
    const newScore = Math.max(10, Math.min(100, current + delta));
    await User.findByIdAndUpdate(userId, { trustScore: newScore });
    console.log(`Updated Trust Score for ${user.email}: ${current} -> ${newScore} (${reason})`);
  } catch (err) {
    console.error("Trust score update error:", err);
  }
}

// ==========================================
// 7. NODEMAILER EMAIL NOTIFICATIONS
// ==========================================
// ==========================================
// 7. NODEMAILER EMAIL NOTIFICATIONS
// ==========================================

export async function sendEmailNotification(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  if (!to) return;

  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.log(
        `[Email Mock Service - No SMTP config] To: ${to} | Subject: ${subject} | Content: ${text.substring(0, 80)}...`
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });

    await transporter.sendMail({
      from: `"SafeServe Food Rescue" <${emailUser}>`,
      to,
      subject: `[SafeServe] ${subject}`,
      text,
      html: html || `<p>${text}</p>`
    });

    console.log(`Email dispatched to ${to}: ${subject}`);
  } catch (err: any) {
    console.warn(`Email delivery notice (non-fatal): ${err.message}`);
  }
}

// ==========================================
// 8. CLOUDINARY UPLOADER WITH BUFFER RESILIENCE
// ==========================================
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export async function uploadImageBuffer(buffer: Buffer, originalFilename: string = "food_image.jpg"): Promise<{ imageUrl: string; cloudinaryPublicId: string }> {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "safeserve_donations", resource_type: "image" },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error("Cloudinary returned empty result"));
            }
            resolve({
              imageUrl: result.secure_url,
              cloudinaryPublicId: result.public_id
            });
          }
        );
        uploadStream.end(buffer);
      });
    } catch (err) {
      console.warn("Cloudinary upload failed, using high-fidelity inline data URL fallback:", err);
    }
  }

  // Graceful High-Fidelity Data URL fallback
  const base64 = buffer.toString("base64");
  const dataUrl = `data:image/jpeg;base64,${base64}`;
  const mockPublicId = `ss_local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  return {
    imageUrl: dataUrl,
    cloudinaryPublicId: mockPublicId
  };
}

// ==========================================
// 9. AUDIT LOGGER
// ==========================================
export async function recordAuditLog(params: {
  userId?: string;
  userEmail?: string;
  role?: string;
  action: string;
  entityType: string;
  entityId?: string;
  status?: string;
  description: string;
  ipAddress?: string;
}) {
  try {
    await AuditLog.create({
      userId: params.userId,
      userEmail: params.userEmail || "system",
      role: params.role || "SYSTEM",
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || "N/A",
      status: params.status || "SUCCESS",
      description: params.description,
      ipAddress: params.ipAddress || "127.0.0.1",
      timestamp: new Date()
    });
  } catch (err) {
    console.error("Audit log recording failure:", err);
  }
}
