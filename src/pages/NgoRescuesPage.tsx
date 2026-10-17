import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import {
  HeartHandshake,
  Truck,
  Bike,
  QrCode,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle
} from "lucide-react";
import { RescueRequest } from "../types";
import api from "../services/api";

export const NgoRescuesPage: React.FC = () => {
  const [rescues, setRescues] = useState<RescueRequest[]>([]);
  const [tab, setTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRescues();
  }, []);

  const fetchRescues = async () => {
    try {
      const res = await api.get("/rescues/my-ngo");
      if (res.data?.rescues) {
        setRescues(res.data.rescues);
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

  const currentList = tab === "ACTIVE" ? activeRescues : completedRescues;

  return (
    <DashboardLayout
      title="Incoming Rescue Shipments & Distributions"
      subtitle="Monitor volunteer transit, verify multi-factor handoffs, and manage beneficiary portions"
      actions={
        <Link
          to="/ngo/delivery"
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <QrCode className="w-4 h-4" />
          <span>Verify Delivery Arrival</span>
        </Link>
      }
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === "ACTIVE"
              ? "bg-purple-700 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Active En Route ({activeRescues.length})
        </button>
        <button
          onClick={() => setTab("COMPLETED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === "COMPLETED"
              ? "bg-purple-700 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Completed Distributions ({completedRescues.length})
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading rescue queue...</div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">
            No {tab === "ACTIVE" ? "active" : "completed"} rescues found
          </h4>
          <p className="text-xs text-slate-500">
            Browse available surplus food donations from local restaurants to start a rescue mission.
          </p>
          {tab === "ACTIVE" && (
            <div className="pt-2">
              <Link
                to="/ngo/donations"
                className="px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1"
              >
                Browse Available Surplus
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentList.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-purple-200 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                    {r.donation?.foodCategory || "Meal Batch"}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                    {r.donation?.foodName || "Surplus Food Lot"}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Donor: <strong className="text-slate-700">{r.donor?.organizationName || r.donor?.fullName}</strong>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                    r.status === "DELIVERED" || r.status === "DISTRIBUTION_COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.status === "IN_TRANSIT"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {r.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Courier info box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="text-slate-500">Assigned Courier:</span>
                  <strong className="text-slate-900">
                    {r.volunteer?.fullName || "Courier matching in progress"}
                  </strong>
                </div>
                {r.volunteer?.phone && (
                  <div className="text-[11px] text-slate-500 pl-6">
                    Direct contact: {r.volunteer.phone} • {r.volunteer.transport}
                  </div>
                )}
                {r.deliveryAddress && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Destination: {r.deliveryAddress}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Link
                  to={`/donor/track/${r.donationId}`}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Timeline Status</span>
                </Link>

                {tab === "ACTIVE" && (
                  <Link
                    to="/ngo/delivery"
                    className="flex-1 py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Confirm Arrival</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
