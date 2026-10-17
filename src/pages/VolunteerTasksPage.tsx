import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import {
  Bike,
  Building2,
  HeartHandshake,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { RescueRequest } from "../types";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export const VolunteerTasksPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<RescueRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableTasks();
  }, []);

  const fetchAvailableTasks = async () => {
    try {
      const res = await api.get("/rescues/available-tasks");
      if (res.data?.tasks) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    setAcceptingId(taskId);
    setErrorMsg(null);

    try {
      const res = await api.post("/rescues/accept-task", { rescueId: taskId });
      if (res.data?.success) {
        navigate("/volunteer/active");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to accept rescue mission.");
    } finally {
      setAcceptingId(null);
    }
  };

  // Distance helper
  const computeDistance = (lat?: number, lon?: number) => {
    if (!user?.latitude || !user?.longitude || !lat || !lon) return null;
    const R = 6371;
    const dLatRad = ((lat - user.latitude) * Math.PI) / 180;
    const dLonRad = ((lon - user.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos((user.latitude * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLonRad / 2) *
        Math.sin(dLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  return (
    <DashboardLayout
      title="Available Food Rescue Missions"
      subtitle="Accept route-optimized pickups to safely transit surplus food from donors to non-profit kitchens"
    >
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Scanning region for active transport dispatches...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <Bike className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-base text-slate-800">All available runs claimed!</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're currently in standby mode. Keep notifications enabled to be notified the second a donor lists surplus meals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => {
            const distance = computeDistance(
              task.donation?.latitude,
              task.donation?.longitude
            );

            return (
              <div
                key={task._id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 hover:border-purple-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                        {task.donation?.foodCategory || "Prepared Meal Batch"}
                      </span>
                      <h3 className="font-black text-lg text-slate-900 mt-0.5">
                        {task.donation?.foodName || "Surplus Portions"}
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Quantity: <strong className="text-slate-800 font-bold">{task.donation?.quantity || 1} {task.donation?.unit || "meals"}</strong>
                      </div>
                    </div>

                    {distance && (
                      <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 text-xs font-bold flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-purple-600" />
                        <span>{distance} km away</span>
                      </span>
                    )}
                  </div>

                  {/* Route Overview */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Building2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>Pickup: {task.donor?.organizationName || task.donor?.fullName || "Verified Donor Facility"}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-5 truncate">
                        {task.pickupAddress || task.donation?.pickupAddress || "Donor Facility Location"}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <HeartHandshake className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Drop-off: {task.ngo?.organizationName || task.ngo?.fullName || "Verified NGO Partner Shelter"}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-5 truncate">
                        {task.deliveryAddress || "Registered NGO Shelter"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Safe Window:</span>
                    <strong className="text-slate-800 font-bold">
                      Expires: {task.donation?.expiryDate || "Today"} ({task.donation?.expiryTime || "23:59"})
                    </strong>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleAcceptTask(task._id)}
                    disabled={acceptingId === task._id}
                    className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{acceptingId === task._id ? "Claiming Run..." : "Accept & Start Rescue Mission (+3 pts)"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};
