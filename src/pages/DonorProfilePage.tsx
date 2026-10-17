import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { GPSLocationPicker } from "../components/GPSLocationPicker";
import {
  User,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Save
} from "lucide-react";
import api from "../services/api";

export const DonorProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [organizationName, setOrganizationName] = useState(user?.organizationName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [pincode, setPincode] = useState(user?.pincode || "");
  const [latitude, setLatitude] = useState(user?.latitude || 28.6139);
  const [longitude, setLongitude] = useState(user?.longitude || 77.2090);

  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    try {
      await api.patch(`/users/${user?._id}`, {
        fullName,
        organizationName,
        phone,
        address,
        city,
        state,
        pincode,
        latitude,
        longitude
      });
      await refreshProfile();
      setMsg({ type: "success", text: "Profile details successfully updated." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Donor Organization Profile & Trust Rating"
      subtitle="Manage commercial credentials, geofence calibration, and compliance standing"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Trust Score & Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mx-auto text-2xl font-black">
              {user?.fullName?.charAt(0) || "D"}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{user?.organizationName || user?.fullName}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-2 inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-800">
                {user?.role} ACCOUNT
              </div>
            </div>

            {/* Trust Rating Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Donor Integrity Score
              </span>
              <div className="text-3xl font-black text-purple-700 font-mono">
                {user?.trustScore || 85} / 100
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Tier 1 Verified Donor</span>
              </div>
            </div>

            {/* Scoring mechanics */}
            <div className="text-left text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-800">Trust Engine Rules:</div>
              <div className="flex justify-between">
                <span>On-time pickup handoff:</span>
                <strong className="text-emerald-600 font-bold">+2 pts</strong>
              </div>
              <div className="flex justify-between">
                <span>HACCP safety compliance:</span>
                <strong className="text-emerald-600 font-bold">+1 pt</strong>
              </div>
              <div className="flex justify-between">
                <span>Late cancellation:</span>
                <strong className="text-rose-600 font-bold">-10 pts</strong>
              </div>
              <div className="flex justify-between">
                <span>Spoiled food complaint:</span>
                <strong className="text-rose-600 font-bold">-25 pts</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Operational Details & Location
            </h3>

            {msg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  msg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{msg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Organization / Commercial Brand</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Person Lead</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Primary Pickup Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <GPSLocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  onChange={(c) => {
                    setLatitude(c.latitude);
                    setLongitude(c.longitude);
                  }}
                  label="Registered Hub GPS Coordinates"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Profile Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
