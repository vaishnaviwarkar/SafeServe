export type UserRole = "ADMIN" | "DONOR" | "NGO" | "VOLUNTEER";
export type UserStatus = "PENDING" | "VERIFIED" | "REJECTED" | "BLOCKED";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  trustScore: number;
  organizationName?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  contactPerson?: string;
  verificationDocument?: string;
  aadharNumber?: string;
  foodCapacity?: number;
  serviceArea?: string;
  requiredFoodCategories?: string[];
  transportation?: string;
  availability?: string;
  availabilityStatus?: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  completedPickups?: number;
  completedDeliveries?: number;
  totalDonationsCount?: number;
  totalFoodRescuedKg?: number;
  createdAt: string;
  updatedAt: string;
}

export type FoodCategory =
  | "Cooked Meals"
  | "Baked Goods"
  | "Packaged Food"
  | "Fresh Produce"
  | "Dairy Products"
  | "Beverages"
  | "Mixed Grocery";

export type StorageCondition =
  | "Room Temperature"
  | "Refrigerated (0-4°C)"
  | "Frozen (< -18°C)"
  | "Hot Held (> 60°C)"
  | "Dry & Cool";

export type PackagingCondition =
  | "Sealed Commercial Packaging"
  | "Food Grade Airtight Containers"
  | "Aluminum Foil Packs"
  | "Clean Covered Vessels"
  | "Partially Damaged / Opened";

export type DonationStatus =
  | "PENDING_SAFETY_REVIEW"
  | "SAFETY_REVIEWED"
  | "APPROVED"
  | "REJECTED"
  | "NGO_ASSIGNED"
  | "VOLUNTEER_ASSIGNED"
  | "PICKUP_SCHEDULED"
  | "PICKUP_VERIFIED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "DISTRIBUTION_COMPLETED"
  | "CANCELLED";

export type SafetyStatus = "PENDING" | "ELIGIBLE" | "REVIEW_REQUIRED" | "NOT_ELIGIBLE" | "EXPIRED";

export interface FoodDonation {
  _id: string;
  donorId: string;
  donorName: string;
  donorOrg: string;
  donorPhone: string;
  foodName: string;
  foodCategory: FoodCategory;
  quantity: number;
  peopleServed?: number;
  unit: string;
  preparationDate: string;
  preparationTime: string;
  expiryDate: string;
  expiryTime: string;
  storageCondition: StorageCondition;
  packagingCondition: PackagingCondition;
  pickupAddress: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  safetyScore: number;
  safetyStatus: SafetyStatus;
  safetyReason?: string;
  status: DonationStatus;
  adminRejectionReason?: string;
  assignedNgoId?: string;
  assignedVolunteerId?: string;
  selectedNgo?: { _id: string; name: string; phone?: string; address: string; latitude?: number; longitude?: number };
  ngoDistanceKm?: number;
  ngoEstimatedTravelMinutes?: number;
  rescueRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodSafetyAssessment {
  _id?: string;
  donationId: string;
  score: number;
  status: SafetyStatus;
  reason: string;
  hoursRemaining?: number;
  storageSuitability?: string;
  packagingIntegrity?: string;
  evaluatedAt: string;
  evaluatedBy?: string;
}

export type RescueStatus =
  | "MATCHED"
  | "NGO_ASSIGNED"
  | "VOLUNTEER_ASSIGNED"
  | "PICKUP_SCHEDULED"
  | "PICKUP_VERIFIED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "DISTRIBUTION_COMPLETED"
  | "CANCELLED";

export interface RescueRequest {
  _id: string;
  donationId: string;
  donorId: string;
  ngoId?: string;
  volunteerId?: string;
  status: RescueStatus;
  verificationToken: string;
  qrCodeImage?: string;
  // OTP values are intentionally not returned to volunteers.
  pickupOtp?: string;
  pickupOtpExpiry?: string;
  pickupOtpAttempts?: number;
  deliveryOtp?: string;
  deliveryOtpExpiry?: string;
  deliveryOtpAttempts?: number;
  pickupTime?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupVerifiedBy?: string;
  pickupNotes?: string;
  deliveryTime?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryVerifiedBy?: string;
  deliveryNotes?: string;
  distributionCompletedAt?: string;
  matchScore: number;
  createdAt: string;
  updatedAt: string;
  donation?: FoodDonation;
  donor?: { fullName: string; phone: string; org?: string; address: string };
  ngo?: { fullName: string; phone: string; address: string };
  volunteer?: { fullName: string; phone: string; transport?: string };
}

export interface VerificationRecord {
  _id: string;
  rescueId: string;
  type: "PICKUP" | "DELIVERY";
  verifiedBy: string;
  verifiedByName?: string;
  verificationMethod: string;
  latitude: number;
  longitude: number;
  targetLatitude?: number;
  targetLongitude?: number;
  distanceDeviationMeters: number;
  timestamp: string;
  status: "SUCCESS" | "FAILED";
  notes?: string;
  createdAt: string;
}

export interface Complaint {
  _id: string;
  submittedBy: string;
  submittedByName: string;
  role: string;
  category: string;
  description: string;
  relatedDonationId?: string;
  relatedRescueId?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidenceImageUrl?: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
  adminNotes?: string;
  resolutionDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyRequest {
  _id: string;
  ngoId: string;
  organizationName: string;
  contactPerson: string;
  phone: string;
  requiredFood: string;
  quantity: number;
  unit: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location: string;
  city: string;
  state: string;
  requiredTime: string;
  description?: string;
  status: "OPEN" | "FULFILLED" | "CANCELLED";
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  role?: string;
  action: string;
  entityType: string;
  entityId?: string;
  status: string;
  description: string;
  ipAddress: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}
