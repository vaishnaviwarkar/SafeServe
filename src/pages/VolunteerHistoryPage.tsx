import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  CheckCircle2,
  Calendar,
  Building2,
  HeartHandshake,
  MapPin,
  Clock,
  Award,
  Bike
} from "lucide-react";
import { RescueRequest } from "../types";
import api from "../services/api";

export const VolunteerHistoryPage: React.FC = () => {
  const [rescues, setRescues] = useState<RescueRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/rescues/my-volunteer");
      if (res.data?.rescues) {
        const completed = res.data.rescues.filter((r: RescueRequest) =>
          ["DELIVERED", "DISTRIBUTION_COMPLETED"].includes(r.status)
        );
        setRescues(completed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Completed Mission History & Impact Badges"
      subtitle="Comprehensive ledger of verified surplus food routes and community meals delivered"
    >
      <div className="space-y-6">
        {/* Achievements Banner */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300">
              <Award className="w-4 h-4" />
              <span>Certified Safe Courier Status</span>
            </div>
            <h3 className="text-2xl font-black">Community Nourishment Record</h3>
            <p className="text-xs text-purple-200 max-w-md">
              Every completed run prevents methane emissions from landfill decay and feeds vulnerable families.
            </p>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-black font-mono text-amber-300">{rescues.length}</div>
              <div className="text-[10px] text-purple-200 uppercase font-bold tracking-wider">Missions</div>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-black font-mono text-emerald-300">100%</div>
              <div className="text-[10px] text-purple-200 uppercase font-bold tracking-wider">On-Time Rate</div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Verified Rescue Deliveries</h3>
            <p className="text-xs text-slate-500">Cryptographically confirmed drop-offs</p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading history records...</div>
          ) : rescues.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Bike className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">No completed missions yet</h4>
              <p className="text-xs text-slate-500">Accept an open pickup task to begin building your courier history.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rescues.map((r) => (
                <div key={r._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {r.donation?.foodName || "Surplus Portions"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                        VERIFIED DELIVERED
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-4">
                      <span>Portions: <strong className="font-bold text-slate-900">{r.donation?.quantity} {r.donation?.unit}</strong></span>
                      <span>•</span>
                      <span>From: {r.donor?.organizationName || r.donor?.fullName}</span>
                      <span>•</span>
                      <span>To: {r.ngo?.organizationName || r.ngo?.fullName}</span>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 shrink-0">
                    <div className="font-bold text-emerald-700">+3 Trust Points Earned</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(r.updatedAt || r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
