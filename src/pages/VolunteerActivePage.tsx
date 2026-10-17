import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { GPSLocationPicker } from "../components/GPSLocationPicker";
import { QRScannerModal } from "../components/QRScannerModal";
import {
  Bike,
  Building2,
  HeartHandshake,
  KeyRound,
  QrCode,
  ScanQrCode,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  Phone,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { RescueRequest } from "../types";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export const VolunteerActivePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeRescue, setActiveRescue] = useState<RescueRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verification Inputs
  const [pickupOtp, setPickupOtp] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  // Delivery step inputs
  const [deliveryOtp, setDeliveryOtp] = useState("");

  // GPS coordinates
  const [lat, setLat] = useState<number>(user?.latitude || 28.6139);
  const [lng, setLng] = useState<number>(user?.longitude || 77.2090);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveRescue();
  }, []);

  const fetchActiveRescue = async () => {
    try {
      const res = await api.get("/rescues/my-volunteer");
      if (res.data?.rescues) {
        const active = res.data.rescues.find((r: RescueRequest) =>
          ["VOLUNTEER_ASSIGNED", "PICKUP_SCHEDULED", "IN_TRANSIT"].includes(r.status)
        );
        setActiveRescue(active || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRescue) return;
    setErrorMsg(null);
    setSuccessNotice(null);

    if (!pickupOtp) {
      setErrorMsg("Please enter the 6-digit pickup OTP provided by the food donor.");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await api.post("/rescues/verify-pickup", {
        rescueId: activeRescue._id,
        pickupOtp,
        latitude: lat,
        longitude: lng
      });

      if (res.data?.success) {
        setSuccessNotice("Pickup verified successfully! Food is now marked IN TRANSIT.");
        fetchActiveRescue();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to verify pickup. Check OTP and GPS.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQrScanned = (token: string) => {
    setScannerOpen(false);
    // If scanning QR pass at pickup
    if (activeRescue && activeRescue.status !== "IN_TRANSIT") {
      api.post("/rescues/verify-pickup", {
        rescueId: activeRescue._id,
        verificationToken: token,
        latitude: lat,
        longitude: lng
      }).then(() => {
        setSuccessNotice("QR Pass scanned & verified! Food lot is in transit.");
        fetchActiveRescue();
      }).catch((err) => {
        setErrorMsg(err.response?.data?.message || "Invalid QR token.");
      });
    }
  };

  const handleConfirmDelivered = async () => {
    if (!activeRescue) return;
    if (!deliveryOtp || deliveryOtp.length !== 6) {
      setErrorMsg("Ask the NGO for their 6-digit Delivery OTP and enter it manually.");
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await api.post("/rescues/verify-delivery", {
        rescueId: activeRescue._id,
        deliveryOtp,
        latitude: lat,
        longitude: lng
      });

      if (res.data?.success) {
        setSuccessNotice("Mission Accomplished! Safe food delivery verified and trust points awarded.");
        fetchActiveRescue();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to confirm delivery.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout
      title="Active Mission Cockpit"
      subtitle="Real-time route navigation, geofence verification, and chain-of-custody tokens"
      actions={
        <button
          onClick={() => setScannerOpen(true)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <ScanQrCode className="w-4 h-4" />
          <span>Open QR Scanner</span>
        </button>
      }
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading mission state...</div>
        ) : !activeRescue ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">No active run in progress!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are completely free. Check available rescue tasks to claim a new delivery mission.
            </p>
            <div className="pt-2">
              <Link
                to="/volunteer/tasks"
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <span>Browse Open Pickups</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mission Overview Banner */}
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-purple-500/30 text-purple-300 font-mono">
                  MISSION STATUS: {activeRescue.status.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-bold font-mono text-slate-400">
                  Batch #{activeRescue._id.slice(-6)}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black">{activeRescue.donation?.foodName || "Prepared Food Batch"}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Quantity: {activeRescue.donation?.quantity} {activeRescue.donation?.unit} • Storage: {activeRescue.donation?.storageCondition}
                </p>
              </div>

              {/* Progress 2-step bar */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`p-3 rounded-2xl border ${
                    activeRescue.status === "IN_TRANSIT"
                      ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
                      : "bg-purple-950/60 border-purple-700/60 text-purple-300"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Step 1: Donor Pickup</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {activeRescue.status === "IN_TRANSIT" ? "Completed" : "Awaiting Verification"}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-2xl border ${
                    activeRescue.status === "IN_TRANSIT"
                      ? "bg-purple-950/60 border-purple-700/60 text-purple-300"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    <span>Step 2: Shelter Delivery</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {activeRescue.status === "IN_TRANSIT" ? "In Transit to Destination" : "Pending Pickup"}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Verification at Donor (if not in transit yet) */}
            {activeRescue.status !== "IN_TRANSIT" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900">Step 1: Arrive at Donor Facility</h4>
                    <p className="text-xs text-slate-500">
                      Donor: {activeRescue.donor?.organizationName || activeRescue.donor?.fullName}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Pickup Address:</span>
                      <span className="text-slate-600">{activeRescue.pickupAddress || activeRescue.donation?.pickupAddress}</span>
                    </div>
                  </div>
                  {activeRescue.donor?.phone && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      <Phone className="w-4 h-4 text-purple-700 shrink-0" />
                      <span className="font-bold text-slate-900">Contact Phone:</span>
                      <a href={`tel:${activeRescue.donor.phone}`} className="text-purple-700 font-semibold underline">
                        {activeRescue.donor.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Hand-off OTP validation form */}
                <form onSubmit={handleVerifyPickup} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Enter 6-Digit Pickup OTP (Provided by Donor) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        className="text-[11px] font-bold text-purple-700 flex items-center gap-1 hover:underline"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Or Scan Donor's QR Pass</span>
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={pickupOtp}
                        onChange={(e) => setPickupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-9 pr-3 py-2.5 text-base bg-slate-50 border border-slate-300 rounded-xl font-mono font-black tracking-widest text-slate-900 focus:ring-2 focus:ring-purple-600 text-center"
                      />
                    </div>
                  </div>

                  {/* GPS Coordinates Geofence */}
                  <div>
                    <GPSLocationPicker
                      latitude={lat}
                      longitude={lng}
                      onChange={(c) => {
                        setLat(c.latitude);
                        setLng(c.longitude);
                      }}
                      label="Your Current GPS Coordinates (Geofenced within 500m of Donor)"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessing ? "Verifying Pickup Token..." : "Verify Pickup & Begin Transit"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Transit to Shelter Destination */}
            {activeRescue.status === "IN_TRANSIT" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900">Step 2: Transit to Shelter Facility</h4>
                    <p className="text-xs text-slate-500">
                      Destination: {activeRescue.ngo?.organizationName || activeRescue.ngo?.fullName}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Shelter Street Address:</span>
                      <span className="text-slate-600">{activeRescue.deliveryAddress || "Registered NGO Facility"}</span>
                    </div>
                  </div>
                  {activeRescue.ngo?.phone && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-slate-900">Shelter Contact:</span>
                      <a href={`tel:${activeRescue.ngo.phone}`} className="text-emerald-700 font-semibold underline">
                        {activeRescue.ngo.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* NGO-provided Delivery OTP */}
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Ask the NGO for the Delivery OTP
                  </span>
                  <p className="text-xs text-amber-700">The NGO coordinator provides the OTP when you arrive. The OTP is never displayed in your volunteer account.</p>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={deliveryOtp}
                      onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP from NGO"
                      className="w-full pl-9 pr-3 py-2.5 text-base bg-white border border-amber-300 rounded-xl font-mono font-black tracking-widest text-slate-900 text-center"
                    />
                  </div>
                </div>

                {/* Direct Courier Delivery Hand-off button */}
                <div className="space-y-3 pt-2">
                  <GPSLocationPicker
                    latitude={lat}
                    longitude={lng}
                    onChange={(c) => {
                      setLat(c.latitude);
                      setLng(c.longitude);
                    }}
                    label="Current GPS Location (Validating Shelter Arrival)"
                  />

                  <button
                    type="button"
                    onClick={handleConfirmDelivered}
                    disabled={isProcessing}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isProcessing ? "Confirming..." : "Confirm Delivery Handed to Shelter (+3 pts)"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleQrScanned}
        title="Scan Donor / Consignment QR Code"
      />
    </DashboardLayout>
  );
};
