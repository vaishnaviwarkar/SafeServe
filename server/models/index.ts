import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// ==========================================
// 1. SCHEMAS
// ==========================================

// User Schema
export const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["ADMIN", "DONOR", "NGO", "VOLUNTEER"], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["PENDING", "VERIFIED", "REJECTED", "BLOCKED"], 
    default: "PENDING" 
  },
  trustScore: { type: Number, default: 85 }, // 0 to 100
  // Password Reset fields
  resetPasswordToken: { type: String },
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
  // Donor specific
  organizationName: { type: String },
  // Address & Geolocation
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  latitude: { type: Number, default: 28.6139 },
  longitude: { type: Number, default: 77.2090 },
  // NGO specific
  contactPerson: { type: String },
  verificationDocument: { type: String },
  aadharNumber: { type: String },
  foodCapacity: { type: Number, default: 200 }, // meals per day
  serviceArea: { type: String },
  requiredFoodCategories: [{ type: String }],
  // Volunteer specific
  transportation: { type: String, default: "Two-Wheeler" },
  availability: { type: String, default: "Immediate" },
  availabilityStatus: { type: String, enum: ["AVAILABLE", "BUSY", "UNAVAILABLE"], default: "AVAILABLE" },
  // Statistics
  completedPickups: { type: Number, default: 0 },
  completedDeliveries: { type: Number, default: 0 },
  totalDonationsCount: { type: Number, default: 0 },
  totalFoodRescuedKg: { type: Number, default: 0 }
}, { timestamps: true });

// Food Donation Schema
export const foodDonationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  donorName: { type: String },
  donorOrg: { type: String },
  donorPhone: { type: String },
  foodName: { type: String, required: true },
  foodCategory: { 
    type: String, 
    enum: ["Cooked Meals", "Baked Goods", "Packaged Food", "Fresh Produce", "Dairy Products", "Beverages", "Mixed Grocery"],
    required: true 
  },
  quantity: { type: Number, required: true },
  peopleServed: { type: Number },
  unit: { type: String, enum: ["kg", "meals", "liters", "boxes", "packets"], default: "meals" },
  preparationDate: { type: String, required: true },
  preparationTime: { type: String, required: true },
  expiryDate: { type: String, required: true },
  expiryTime: { type: String, required: true },
  storageCondition: { 
    type: String, 
    enum: ["Room Temperature", "Refrigerated (0-4°C)", "Frozen (< -18°C)", "Hot Held (> 60°C)", "Dry & Cool"], 
    required: true 
  },
  packagingCondition: { 
    type: String, 
    enum: ["Sealed Commercial Packaging", "Food Grade Airtight Containers", "Aluminum Foil Packs", "Clean Covered Vessels", "Partially Damaged / Opened"], 
    required: true 
  },
  pickupAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  description: { type: String },
  imageUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String },
  
  // Rule-based safety assessment
  safetyScore: { type: Number, default: 0 },
  safetyStatus: { 
    type: String, 
    enum: ["PENDING", "ELIGIBLE", "REVIEW_REQUIRED", "NOT_ELIGIBLE", "EXPIRED"],
    default: "PENDING"
  },
  safetyReason: { type: String },
  
  // Overall workflow status
  status: {
    type: String,
    enum: [
      "PENDING_SAFETY_REVIEW",
      "SAFETY_REVIEWED",
      "APPROVED",
      "REJECTED",
      "NGO_ASSIGNED",
      "VOLUNTEER_ASSIGNED",
      "PICKUP_SCHEDULED",
      "PICKUP_VERIFIED",
      "IN_TRANSIT",
      "DELIVERED",
      "DISTRIBUTION_COMPLETED",
      "CANCELLED"
    ],
    default: "PENDING_SAFETY_REVIEW"
  },
  
  adminRejectionReason: { type: String },
  assignedNgoId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedVolunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rescueRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RescueRequest" }
}, { timestamps: true });

// Food Safety Assessment Log Schema
export const foodSafetyAssessmentSchema = new mongoose.Schema({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodDonation", required: true },
  score: { type: Number, required: true },
  status: { type: String, enum: ["ELIGIBLE", "REVIEW_REQUIRED", "NOT_ELIGIBLE", "EXPIRED"], required: true },
  reason: { type: String, required: true },
  hoursRemaining: { type: Number },
  storageSuitability: { type: String },
  packagingIntegrity: { type: String },
  evaluatedAt: { type: Date, default: Date.now },
  evaluatedBy: { type: String, default: "RuleEngine:v2.1" }
}, { timestamps: true });

// Rescue Request Schema
export const rescueRequestSchema = new mongoose.Schema({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodDonation", required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { 
    type: String, 
    enum: [
      "MATCHED",
      "NGO_ASSIGNED",
      "VOLUNTEER_ASSIGNED",
      "PICKUP_SCHEDULED",
      "PICKUP_VERIFIED",
      "IN_TRANSIT",
      "DELIVERED",
      "DISTRIBUTION_COMPLETED",
      "CANCELLED"
    ],
    default: "MATCHED"
  },
  verificationToken: { type: String, required: true, unique: true },
  qrCodeImage: { type: String }, // Base64 Data URL
  
  // OTP management
  pickupOtp: { type: String },
  pickupOtpExpiry: { type: Date },
  pickupOtpAttempts: { type: Number, default: 0 },
  
  deliveryOtp: { type: String },
  deliveryOtpExpiry: { type: Date },
  deliveryOtpAttempts: { type: Number, default: 0 },
  
  // Verification data
  pickupTime: { type: Date },
  pickupLatitude: { type: Number },
  pickupLongitude: { type: Number },
  pickupVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pickupNotes: { type: String },

  deliveryTime: { type: Date },
  deliveryLatitude: { type: Number },
  deliveryLongitude: { type: Number },
  deliveryVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deliveryNotes: { type: String },
  
  distributionCompletedAt: { type: Date },
  matchScore: { type: Number, default: 85 },
  ngoDistanceKm: { type: Number },
  ngoEstimatedTravelMinutes: { type: Number },
  pickupVerifiedAt: { type: Date },
  deliveryVerifiedAt: { type: Date }
}, { timestamps: true });

// NGO Assignment Log
export const ngoAssignmentSchema = new mongoose.Schema({
  rescueId: { type: mongoose.Schema.Types.ObjectId, ref: "RescueRequest", required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  matchScore: { type: Number, required: true },
  distanceKm: { type: Number, required: true },
  status: { type: String, enum: ["ASSIGNED", "ACCEPTED", "DECLINED"], default: "ASSIGNED" },
  assignedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date }
}, { timestamps: true });

// Volunteer Assignment Log
export const volunteerAssignmentSchema = new mongoose.Schema({
  rescueId: { type: mongoose.Schema.Types.ObjectId, ref: "RescueRequest", required: true },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"], default: "ASSIGNED" },
  assignedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date }
}, { timestamps: true });

// Verification Records (Audit of QR + OTP + GPS + Timestamp verification)
export const verificationRecordSchema = new mongoose.Schema({
  rescueId: { type: mongoose.Schema.Types.ObjectId, ref: "RescueRequest", required: true },
  type: { type: String, enum: ["PICKUP", "DELIVERY"], required: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  verifiedByName: { type: String },
  verificationMethod: { type: String, default: "QR + OTP + GPS + Timestamp" },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  targetLatitude: { type: Number },
  targetLongitude: { type: Number },
  distanceDeviationMeters: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["SUCCESS", "FAILED"], default: "SUCCESS" },
  notes: { type: String }
}, { timestamps: true });

// Complaints Schema
export const complaintSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submittedByName: { type: String },
  role: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      "Food Quality Issue",
      "Pickup Problem",
      "Delivery Problem",
      "Incorrect Information",
      "Volunteer Issue",
      "NGO Issue",
      "Other"
    ],
    required: true 
  },
  description: { type: String, required: true },
  relatedDonationId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodDonation" },
  relatedRescueId: { type: mongoose.Schema.Types.ObjectId, ref: "RescueRequest" },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
  evidenceImageUrl: { type: String },
  status: { type: String, enum: ["OPEN", "UNDER_REVIEW", "RESOLVED", "CLOSED"], default: "OPEN" },
  adminNotes: { type: String },
  resolutionDetails: { type: String }
}, { timestamps: true });

// Emergency Food Requests Schema
export const emergencyRequestSchema = new mongoose.Schema({
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  organizationName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  phone: { type: String, required: true },
  requiredFood: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: "meals" },
  urgency: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "HIGH" },
  location: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  requiredTime: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["OPEN", "FULFILLED", "CANCELLED"], default: "OPEN" }
}, { timestamps: true });

// Audit Log Schema
export const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userEmail: { type: String },
  role: { type: String },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },
  status: { type: String, default: "SUCCESS" },
  description: { type: String, required: true },
  ipAddress: { type: String, default: "127.0.0.1" }
}, { timestamps: true });

// Notification Schema
export const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "INFO" },
  isRead: { type: Boolean, default: false },
  link: { type: String }
}, { timestamps: true });
