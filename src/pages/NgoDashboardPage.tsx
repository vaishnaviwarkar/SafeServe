import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import {
  HeartHandshake,
  Truck,
  UtensilsCrossed,
  Flame,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { RescueRequest, FoodDonation } from "../types";
import api from "../services/api";

export const NgoDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [rescues, setRescues] = useState<RescueRequest[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rescueRes, availRes] = await Promise.all([
        api.get("/rescues/my-ngo"),
        api.get("/donations/available")
      ]);

      if (rescueRes.data?.rescues) {
        setRescues(rescueRes.data.rescues);
      }
      if (availRes.data?.donations) {
        setAvailableCount(availRes.data.donations.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeRescues = rescues.filter((r) =>
    !["DELIVERED", "DISTRIBUTION_COMPLETED", "CANCELLED"].includes(r.status)
  );

  const completedRescues = rescues.filter((r) =>
    ["DELIVERED", "DISTRIBUTION_COMPLETED"].includes(r.status)
  );

  return (
    <DashboardLayout
      title={`NGO Operations: ${user?.organizationName || user?.fullName}`}
      subtitle="Shelter Command Center • Surplus Claims, Courier Handoff & Geofenced Delivery"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/ngo/emergency"
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Flame className="w-4 h-4" />
            <span>Post Emergency Need</span>
          </Link>
          <Link
            to="/ngo/donations"
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-purple-200"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Browse Available Surplus</span>
          </Link>
        </div>
      }
    >
      {/* Top 4 Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Surplus</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">{availableCount}</div>
          <p className="text-[11px] text-slate-500 font-medium">Approved for claiming</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Incoming Deliveries</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono">{activeRescues.length}</div>
          <p className="text-[11px] text-slate-500 font-medium">En route or scheduled</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Batches</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{completedRescues.length}</div>
          <p className="text-[11px] text-slate-500 font-medium">Verified distributed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">NGO Trust Score</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">{user?.trustScore || 90}/100</div>
          <p className="text-[11px] text-slate-500 font-medium">Verified facility rating</p>
        </div>
      </div>

      {/* Incoming Active Deliveries */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Active Incoming Rescues</h3>
            <p className="text-xs text-slate-500">Live courier tracking & delivery verification actions</p>
          </div>
          <Link
            to="/ngo/delivery"
            className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-xs font-bold flex items-center gap-1 transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Verify Delivery Arrival</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading rescue streams...</div>
        ) : activeRescues.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No active incoming deliveries right now</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Check out surplus donations listed by nearby restaurants, caterers, and hotels.
            </p>
            <div className="pt-2">
              <Link
                to="/ngo/donations"
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <span>Browse Available Donations</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeRescues.map((r) => (
              <div key={r._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{r.donation?.foodName || "Surplus Meal Batch"}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Quantity: <strong className="text-slate-800 font-bold">{r.donation?.quantity} {r.donation?.unit}</strong> • Donor: {r.donor?.fullName || "Commercial Kitchen"}
                  </p>
                  <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-2">
                    <span>Assigned Volunteer: {r.volunteer?.fullName || "Awaiting courier dispatch"}</span>
                    {r.volunteer?.phone && <span>({r.volunteer.phone})</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    to={`/donor/track/${r.donationId}`}
                    className="flex-1 sm:flex-initial px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition text-center"
                  >
                    View Status
                  </Link>
                  <Link
                    to="/ngo/delivery"
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Confirm Delivery</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
