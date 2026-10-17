import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Bike,
  Truck,
  CheckCircle2,
  ScanQrCode,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  HeartHandshake
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { RescueRequest } from "../types";
import api from "../services/api";

export const VolunteerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTask, setActiveTask] = useState<RescueRequest | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVolunteerData();
  }, []);

  const fetchVolunteerData = async () => {
    try {
      const [myRes, availRes] = await Promise.all([
        api.get("/rescues/my-volunteer"),
        api.get("/rescues/available-tasks")
      ]);

      if (myRes.data?.rescues) {
        const active = myRes.data.rescues.find((r: RescueRequest) =>
          ["VOLUNTEER_ASSIGNED", "PICKUP_SCHEDULED", "IN_TRANSIT"].includes(r.status)
        );
        setActiveTask(active || null);

        const done = myRes.data.rescues.filter((r: RescueRequest) =>
          ["DELIVERED", "DISTRIBUTION_COMPLETED"].includes(r.status)
        ).length;
        setCompletedCount(done);
      }

      if (availRes.data?.tasks) {
        setAvailableCount(availRes.data.tasks.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title={`Courier Dispatch: ${user?.fullName}`}
      subtitle="Volunteer Rescue Operations • Zero-Waste Route Navigation & OTP Verification"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/volunteer/scanner"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <ScanQrCode className="w-4 h-4" />
            <span>QR Scanner Tool</span>
          </Link>
          <Link
            to="/volunteer/tasks"
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-purple-200"
          >
            <Bike className="w-4 h-4" />
            <span>Find Open Missions</span>
          </Link>
        </div>
      }
    >
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Run</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono">
            {activeTask ? "1 Active" : "Idle"}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {activeTask ? "In transit / pickup" : "Ready for mission"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Missions Nearby</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">{availableCount}</div>
          <p className="text-[11px] text-slate-500 font-medium">Ready for dispatch</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rescues Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{completedCount}</div>
          <p className="text-[11px] text-slate-500 font-medium">Verified missions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Courier Trust</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">{user?.trustScore || 95}/100</div>
          <p className="text-[11px] text-slate-500 font-medium">Level 5 Gold Courier</p>
        </div>
      </div>

      {/* Active Mission Banner / Card */}
      {activeTask ? (
        <div className="bg-gradient-to-r from-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-amber-400 text-slate-950 inline-block font-mono">
                CURRENT ACTIVE MISSION: {activeTask.status.replace(/_/g, " ")}
              </span>
              <h3 className="text-xl font-black">{activeTask.donation?.foodName || "Surplus Rescue Lot"}</h3>
              <p className="text-xs text-slate-300">
                Batch: {activeTask.donation?.quantity} {activeTask.donation?.unit} • Storage: {activeTask.donation?.storageCondition}
              </p>
            </div>

            <Link
              to="/volunteer/active"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-950"
            >
              <span>Open Mission Controls</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Route coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Building2 className="w-4 h-4" />
                <span>PICKUP LOCATION (Donor)</span>
              </div>
              <div className="text-xs font-semibold">{activeTask.donor?.organizationName || activeTask.donor?.fullName}</div>
              <div className="text-[11px] text-slate-300">{activeTask.pickupAddress || activeTask.donation?.pickupAddress}</div>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <HeartHandshake className="w-4 h-4" />
                <span>DELIVERY DESTINATION (NGO)</span>
              </div>
              <div className="text-xs font-semibold">{activeTask.ngo?.organizationName || activeTask.ngo?.fullName}</div>
              <div className="text-[11px] text-slate-300">{activeTask.deliveryAddress || "Shelter Hub"}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">No active run assigned</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Surplus meals are waiting to be transported from restaurants and wedding venues to nearby shelters.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/volunteer/tasks"
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-sm shadow-purple-200"
            >
              <span>Browse Available Pickups</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
