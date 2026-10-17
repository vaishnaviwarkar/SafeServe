import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Award
} from "lucide-react";
import api from "../services/api";

export const AdminComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints");
      if (res.data?.complaints) {
        setComplaints(res.data.complaints);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (id: string, action: "PENALIZE" | "DISMISS") => {
    try {
      await api.patch(`/complaints/${id}`, { action });
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: action === "PENALIZE" ? "RESOLVED_PENALIZED" : "DISMISSED" } : c))
      );
    } catch (err) {
      alert("Failed to update incident.");
    }
  };

  return (
    <DashboardLayout
      title="Food Safety Incidents & Complaints Audit"
      subtitle="Investigate reported cold-chain temperature violations, damaged seals, and hygiene infractions"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading incident tickets...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800">No active incidents reported</h4>
            <p className="text-xs text-slate-500">All surplus rescue operations report 100% hygiene compliance.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <div key={c._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{c.category}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === "RESOLVED_PENALIZED"
                          ? "bg-rose-100 text-rose-800"
                          : c.status === "DISMISSED"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.status || "PENDING INVESTIGATION"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic">"{c.description}"</p>

                  <div className="text-[11px] text-slate-400">
                    Logged: {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>

                {(!c.status || c.status === "PENDING") && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolve(c._id, "PENALIZE")}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Apply Penalty (-25 pts)</span>
                    </button>
                    <button
                      onClick={() => handleResolve(c._id, "DISMISS")}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                    >
                      Dismiss Report
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
