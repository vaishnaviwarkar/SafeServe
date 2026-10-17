import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { GPSLocationPicker } from "../components/GPSLocationPicker";
import {
  PackageCheck,
  KeyRound,
  QrCode,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  Building2,
  Bike
} from "lucide-react";
import { RescueRequest } from "../types";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export const NgoDeliveryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rescues, setRescues] = useState<RescueRequest[]>([]);
  const [selectedRescueId, setSelectedRescueId] = useState<string>("");
  const [deliveryOtp, setDeliveryOtp] = useState<string>("");
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [useTokenMode, setUseTokenMode] = useState<boolean>(false);

  const [currentLat, setCurrentLat] = useState<number>(user?.latitude || 28.6139);
  const [currentLng, setCurrentLng] = useState<number>(user?.longitude || 77.2090);

  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  useEffect(() => {
    fetchActiveRescues();
  }, []);

  const fetchActiveRescues = async () => {
    try {
      const res = await api.get("/rescues/my-ngo");
      if (res.data?.rescues) {
        // Filter those pending delivery verification
        const pending = res.data.rescues.filter((r: RescueRequest) =>
          ["IN_TRANSIT", "PICKUP_SCHEDULED", "VOLUNTEER_ASSIGNED"].includes(r.status)
        );
        setRescues(pending);
        if (pending.length > 0) {
          setSelectedRescueId(pending[0]._id);
          // NGO is authorized to view its own Delivery OTP so it can tell the volunteer
          if (pending[0].deliveryOtp) {
            setDeliveryOtp(pending[0].deliveryOtp);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescueSelect = (rId: string) => {
    setSelectedRescueId(rId);
    const found = rescues.find((r) => r._id === rId);
    if (found?.deliveryOtp) {
      setDeliveryOtp(found.deliveryOtp);
    }
  };

  const handleVerifyDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedRescue) return;
    setErrorMsg("The NGO does not submit the Delivery OTP. Give the displayed OTP to the arriving volunteer; the volunteer enters it and the backend verifies it.");
  };

  const handleCompleteDistribution = async () => {
    if (!selectedRescueId) return;
    try {
      await api.patch(`/rescues/${selectedRescueId}/complete-distribution`);
      alert("Distribution successfully marked as complete! Trust score boosted +5 points.");
      navigate("/ngo/rescues");
    } catch (err) {
      alert("Failed to complete distribution.");
    }
  };

  const selectedRescue = rescues.find((r) => r._id === selectedRescueId);

  return (
    <DashboardLayout
      title="Shelter Delivery Hand-off & Verification"
      subtitle="Multi-factor chain of custody verification via cryptographic OTP and GPS geofencing"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Confirmation Card */}
        {successResult ? (
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 shadow-xl text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md shadow-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                Delivery Verification Complete
              </span>
              <h2 className="text-2xl font-black text-slate-900">Food Safe & Received</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Cryptographic token validated and shelter GPS proximity confirmed within safety tolerance.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Trust Score Earned:</span>
                <strong className="text-emerald-700 font-bold">+2 Points Added</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Consignment Status:</span>
                <strong className="text-emerald-700 font-bold">DELIVERED & VERIFIED</strong>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCompleteDistribution}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Mark Food Distributed To Beneficiaries (+5 pts)</span>
              </button>
              <Link
                to="/ngo/rescues"
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition text-center"
              >
                Return to Rescue Queue
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleVerifyDelivery}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Receiving Consignment Check</h3>
                <p className="text-xs text-slate-500">
                  Inspect incoming food packaging, confirm courier token, and register receipt.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Select Rescue Batch */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Select Arriving Rescue Batch *
              </label>
              {rescues.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  No active incoming consignments requiring delivery verification right now.
                </div>
              ) : (
                <select
                  value={selectedRescueId}
                  onChange={(e) => handleRescueSelect(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-purple-600"
                >
                  {rescues.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.donation?.foodName || "Surplus Batch"} • {r.donation?.quantity} {r.donation?.unit} (Courier: {r.volunteer?.fullName || "Courier"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedRescue && (
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Donor Facility:</span>
                  <strong className="text-slate-900">{selectedRescue.donor?.organizationName || selectedRescue.donor?.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Food Quantity:</span>
                  <strong className="text-slate-900">{selectedRescue.donation?.quantity} {selectedRescue.donation?.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">People Served:</span>
                  <strong className="text-slate-900">{selectedRescue.donation?.peopleServed ?? selectedRescue.donation?.quantity ?? "—"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivering Volunteer:</span>
                  <strong className="text-purple-900">{selectedRescue.volunteer?.fullName || "Volunteer Courier"}</strong>
                </div>
                {selectedRescue.deliveryOtp && (
                  <div className="flex justify-between pt-1 border-t border-purple-100 font-mono">
                    <span className="text-slate-500">NGO Delivery OTP:</span>
                    <strong className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded">{selectedRescue.deliveryOtp}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-3">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">NGO Delivery OTP</span>
              {selectedRescue?.deliveryOtp ? (
                <>
                  <div className="text-3xl font-black font-mono tracking-widest text-amber-950">{selectedRescue.deliveryOtp}</div>
                  <p className="text-xs text-amber-700">Tell this 6-digit code to the assigned volunteer only when the food reaches your NGO. The volunteer will enter it manually.</p>
                </>
              ) : (
                <p className="text-xs text-amber-700">No active Delivery OTP is available. Ask an administrator to regenerate it.</p>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900">Delivery responsibility</div>
              <div className="text-slate-600">The NGO provides the OTP. The assigned volunteer enters it. Only the backend can mark the rescue as DELIVERED.</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              Once the volunteer enters the correct OTP at your NGO location, the backend will record the delivery and notify the relevant parties.
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};
