import React from "react";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Bike,
  CalendarClock,
  ScanQrCode,
  Truck,
  PackageCheck,
  HeartHandshake,
  Check,
  Clock
} from "lucide-react";
import { FoodDonation, RescueRequest } from "../types";

interface TrackingTimelineProps {
  donation: FoodDonation;
  rescue?: RescueRequest | null;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ donation, rescue }) => {
  const steps = [
    {
      id: "DONATION_CREATED",
      label: "Donation Created",
      icon: FileText,
      isCompleted: true,
      time: donation.createdAt,
      actor: donation.donorName || "Food Donor",
      role: "DONOR",
      description: `Surplus food registered: ${donation.quantity} ${donation.unit} of ${donation.foodName}`
    },
    {
      id: "SAFETY_ASSESSMENT",
      label: "Safety Assessment",
      icon: ShieldCheck,
      isCompleted: donation.safetyScore > 0,
      time: donation.createdAt,
      actor: "SafeServe Safety Engine v2.1",
      role: "RULE_ENGINE",
      description: `Safety Score: ${donation.safetyScore}/100 (${donation.safetyStatus})`
    },
    {
      id: "DONATION_APPROVED",
      label: "Donation Approved",
      icon: CheckCircle2,
      isCompleted: donation.status !== "PENDING_SAFETY_REVIEW" && donation.status !== "SAFETY_REVIEWED" && donation.status !== "REJECTED",
      time: donation.updatedAt,
      actor: "SafeServe Administration",
      role: "ADMIN",
      description: donation.status === "REJECTED" ? "Declined by Admin" : "Compliance verified & approved for rescue dispatch"
    },
    {
      id: "NGO_ASSIGNED",
      label: "NGO Assigned",
      icon: Building2,
      isCompleted: !!rescue?.ngoId || ["NGO_ASSIGNED", "VOLUNTEER_ASSIGNED", "PICKUP_SCHEDULED", "PICKUP_VERIFIED", "IN_TRANSIT", "DELIVERED", "DISTRIBUTION_COMPLETED"].includes(donation.status),
      time: rescue?.createdAt,
      actor: rescue?.ngo?.fullName || "Assigned NGO Facility",
      role: "NGO",
      description: "NGO matched and confirmed receiving capacity"
    },
    {
      id: "VOLUNTEER_ASSIGNED",
      label: "Volunteer Assigned",
      icon: Bike,
      isCompleted: !!rescue?.volunteerId || ["VOLUNTEER_ASSIGNED", "PICKUP_SCHEDULED", "PICKUP_VERIFIED", "IN_TRANSIT", "DELIVERED", "DISTRIBUTION_COMPLETED"].includes(donation.status),
      time: rescue?.updatedAt,
      actor: rescue?.volunteer?.fullName || "Dispatched Courier",
      role: "VOLUNTEER",
      description: "Courier assigned to transport surplus meals"
    },
    {
      id: "PICKUP_SCHEDULED",
      label: "Pickup Scheduled",
      icon: CalendarClock,
      isCompleted: ["PICKUP_SCHEDULED", "PICKUP_VERIFIED", "IN_TRANSIT", "DELIVERED", "DISTRIBUTION_COMPLETED"].includes(donation.status),
      time: rescue?.updatedAt,
      actor: "Dispatch System",
      role: "SYSTEM",
      description: "QR Token & secure 6-digit Pickup OTP generated"
    },
    {
      id: "PICKUP_VERIFIED",
      label: "Pickup Verified",
      icon: ScanQrCode,
      isCompleted: ["PICKUP_VERIFIED", "IN_TRANSIT", "DELIVERED", "DISTRIBUTION_COMPLETED"].includes(donation.status) || !!rescue?.pickupTime,
      time: rescue?.pickupTime,
      actor: rescue?.volunteer?.fullName || "Verified Courier",
      role: "VOLUNTEER",
      description: "Validated via QR + OTP + GPS Geofence"
    },
    {
      id: "IN_TRANSIT",
      label: "In Transit",
      icon: Truck,
      isCompleted: ["IN_TRANSIT", "DELIVERED", "DISTRIBUTION_COMPLETED"].includes(donation.status) || !!rescue?.pickupTime,
      time: rescue?.pickupTime,
      actor: rescue?.volunteer?.fullName || "Courier",
      role: "LOGISTICS",
      description: "Hygienic container transport en route to NGO facility"
    },
    {
      id: "DELIVERED",
      label: "Delivered & Verified",
      icon: PackageCheck,
      isCompleted: ["DELIVERED", "DISTRIBUTION_COMPLETED"].includes(donation.status) || !!rescue?.deliveryTime,
      time: rescue?.deliveryTime,
      actor: rescue?.ngo?.fullName || "Receiving NGO Coordinator",
      role: "NGO",
      description: "Arrival confirmed via Delivery QR + OTP + GPS validation"
    },
    {
      id: "DISTRIBUTION_COMPLETED",
      label: "Distribution Completed",
      icon: HeartHandshake,
      isCompleted: donation.status === "DISTRIBUTION_COMPLETED" || rescue?.status === "DISTRIBUTION_COMPLETED",
      time: rescue?.distributionCompletedAt,
      actor: rescue?.ngo?.fullName || "NGO Field Team",
      role: "COMMUNITY",
      description: "Surplus meals handed out to community beneficiaries; trust score updated"
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h3 className="font-bold text-base text-slate-900">Rescue Lifecycle Timeline</h3>
          <p className="text-xs text-slate-500">Multi-point verification and live chain-of-custody audit</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Status</span>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
            {donation.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = step.isCompleted;

          return (
            <div key={index} className="relative flex items-start gap-4 group">
              {/* Step indicator circle */}
              <div
                className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  isDone
                    ? "bg-purple-700 text-white ring-4 ring-purple-100"
                    : "bg-slate-100 text-slate-400 border border-slate-300"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px]">{index + 1}</span>}
              </div>

              {/* Content box */}
              <div className="flex-1 bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 hover:border-purple-200 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isDone ? "text-purple-700" : "text-slate-400"}`} />
                    <span className={`text-xs font-bold ${isDone ? "text-slate-900" : "text-slate-500"}`}>
                      {step.label}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold uppercase">
                      {step.role}
                    </span>
                  </div>

                  {step.time && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(step.time).toLocaleDateString()} {new Date(step.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {step.description}
                </p>

                <div className="text-[11px] font-semibold text-purple-700 mt-1">
                  Handler: {step.actor}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
