import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { GPSLocationPicker } from "../components/GPSLocationPicker";
import {
  Bike,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import api from "../services/api";

export const VolunteerProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [transportation, setTransportation] = useState(user?.transportation || "Two-Wheeler (Motorcycle/Scooter)");
  const [availability, setAvailability] = useState(user?.availability || "Flexible Evenings & Weekends");
  const [availabilityStatus, setAvailabilityStatus] = useState(user?.availabilityStatus || "AVAILABLE");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [latitude, setLatitude] = useState(user?.latitude || 28.6139);
  const [longitude, setLongitude] = useState(user?.longitude || 77.2090);

  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    try {
      await api.patch(`/users/profile/update`, {
        fullName,
        phone,
        transportation,
        availability,
        availabilityStatus,
        address,
        city,
        latitude,
        longitude
      });
      await refreshProfile();
      setMsg({ type: "success", text: "Courier profile details successfully saved." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Courier Profile & Vehicle Fleet Settings"
      subtitle="Configure transit specifications, coverage radius, and view trust score accreditation"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Trust & Badges */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-2xl font-black">
            <Bike className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-extrabold text-base text-slate-900">{user?.fullName}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">
              VETTED VOLUNTEER
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Courier Trust Score
            </span>
            <div className="text-4xl font-black text-blue-700 font-mono">
              {user?.trustScore || 95} / 100
            </div>
            <p className="text-[11px] text-blue-700 font-semibold pt-1">
              Top Tier Volunteer Courier
            </p>
          </div>

          <div className="text-left text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
            <div className="font-bold text-slate-800">Courier Rating Scale:</div>
            <div className="flex justify-between">
              <span>On-time delivery confirmation:</span>
              <strong className="text-emerald-600 font-bold">+3 pts</strong>
            </div>
            <div className="flex justify-between">
              <span>Clean thermal bag usage:</span>
              <strong className="text-emerald-600 font-bold">+1 pt</strong>
            </div>
            <div className="flex justify-between">
              <span>Missed accepted run:</span>
              <strong className="text-rose-600 font-bold">-15 pts</strong>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Courier Dispatch Profile
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
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone (For Dispatch Calls)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transit Vehicle Mode</label>
                <select
                  value={transportation}
                  onChange={(e) => setTransportation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Two-Wheeler (Motorcycle/Scooter)">Two-Wheeler (Motorcycle/Scooter)</option>
                  <option value="Four-Wheeler / Car">Four-Wheeler / Car</option>
                  <option value="Electric Cargo Van">Electric Cargo Van</option>
                  <option value="Bicycle / Walking">Bicycle / Walking</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Dispatch Availability</label>
                <select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="UNAVAILABLE">Unavailable / Offline</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Weekly Availability Window</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Flexible Evenings & Weekends">Flexible Evenings &amp; Weekends</option>
                  <option value="Full Time Day Shift">Full Time Day Shift</option>
                  <option value="Emergency On-Call Only">Emergency On-Call Only</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Operating Base Street Address</label>
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
                  label="Registered Volunteer Hub Coordinates"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Courier Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
