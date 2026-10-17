import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { TrackingTimeline } from "../components/TrackingTimeline";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import { QRViewerModal } from "../components/QRViewerModal";
import {
  ArrowLeft,
  QrCode,
  Building2,
  Bike,
  MapPin,
  Clock,
  KeyRound,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { FoodDonation, RescueRequest } from "../types";
import api from "../services/api";

export const DonorTrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [donation, setDonation] = useState<FoodDonation | null>(null);
  const [rescue, setRescue] = useState<RescueRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDonationData(id);
    }
  }, [id]);

  const fetchDonationData = async (donationId: string) => {
    try {
      const res = await api.get(`/donations/${donationId}`);
      if (res.data?.donation) {
        setDonation(res.data.donation);
        setRescue(res.data.rescue || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Live Rescue Traceability">
        <div className="py-16 text-center text-xs text-slate-500">
          Loading rescue lifecycle records...
        </div>
      </DashboardLayout>
    );
  }

  if (!donation) {
    return (
      <DashboardLayout title="Donation Not Found">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h4 className="font-bold text-sm text-slate-900">Donation Record Not Found</h4>
          <p className="text-xs text-slate-500">The requested donation ID does not exist or you lack authorization.</p>
          <button
            onClick={() => navigate("/donor/donations")}
            className="px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold"
          >
            Back to Donations
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Live Tracking: ${donation.foodName}`}
      subtitle={`Batch ID: ${donation._id} • Multi-checkpoint Chain of Custody`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/donor/donations")}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          {rescue?.qrCodeImage && (
            <button
              onClick={() => setQrModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-purple-200"
            >
              <QrCode className="w-4 h-4" />
              <span>View QR Pass</span>
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <TrackingTimeline donation={donation} rescue={rescue} />
        </div>

        {/* Right 1 Col: Summary & Actor Info */}
        <div className="space-y-6">
          {/* Food Details & Safety Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Food Safety & Batch Details
            </h4>

            <SafetyScoreBadge
              score={donation.safetyScore}
              status={donation.safetyStatus}
              reason={donation.safetyReason}
            />

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity:</span>
                <span className="font-bold text-slate-900">{donation.quantity} {donation.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span>{donation.foodCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage:</span>
                <span>{donation.storageCondition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Packaging:</span>
                <span>{donation.packagingCondition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Address:</span>
                <span className="text-right max-w-[160px] truncate">{donation.pickupAddress}</span>
              </div>
            </div>
          </div>

          {/* Secure Pickup OTP card (if scheduled) */}
          {rescue?.pickupOtp && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm space-y-2 text-amber-900">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <h4 className="font-bold text-xs uppercase tracking-wide">Pickup Authorization OTP</h4>
              </div>
              <div className="text-2xl font-black font-mono tracking-widest text-amber-950">
                {rescue.pickupOtp}
              </div>
              <p className="text-[11px] text-amber-700 leading-tight">
                Share this OTP with the volunteer courier when they arrive at your pickup address.
              </p>
            </div>
          )}

          {/* Assigned Entities Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Assigned Handlers
            </h4>

            {rescue?.ngo ? (
              <div className="flex items-start gap-3 p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <Building2 className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="text-[10px] font-bold uppercase text-purple-700 block">Matched Receiving NGO</span>
                  <div className="font-bold text-slate-900">{rescue.ngo.fullName}</div>
                  <div className="text-slate-500 mt-0.5">{rescue.ngo.address}</div>
                  <div className="text-slate-500 mt-0.5">{rescue.ngo.phone}</div>
                  {(rescue.ngoDistanceKm !== undefined || rescue.ngoEstimatedTravelMinutes !== undefined) && (
                    <div className="mt-2 pt-2 border-t border-purple-100 flex flex-wrap gap-3 text-[11px] font-bold text-purple-800">
                      {rescue.ngoDistanceKm !== undefined && <span>Distance: {rescue.ngoDistanceKm} km</span>}
                      {rescue.ngoEstimatedTravelMinutes !== undefined && <span>Estimated travel: {rescue.ngoEstimatedTravelMinutes} min</span>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                NGO assignment in progress...
              </div>
            )}

            {rescue?.volunteer ? (
              <div className="flex items-start gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <Bike className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="text-[10px] font-bold uppercase text-blue-700 block">Dispatched Courier</span>
                  <div className="font-bold text-slate-900">{rescue.volunteer.fullName}</div>
                  <div className="text-slate-500 mt-0.5">{rescue.volunteer.phone} • {rescue.volunteer.transport}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                Courier volunteer assignment in progress...
              </div>
            )}
          </div>
        </div>
      </div>

      <QRViewerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        verificationToken={rescue?.verificationToken || ""}
        qrCodeImage={rescue?.qrCodeImage}
        rescueTitle={donation.foodName}
        stepType="PICKUP"
      />
    </DashboardLayout>
  );
};
