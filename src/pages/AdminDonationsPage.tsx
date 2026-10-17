import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import {
  UtensilsCrossed,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { FoodDonation } from "../types";
import api from "../services/api";

export const AdminDonationsPage: React.FC = () => {
  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const res = await api.get("/donations");
      if (res.data?.donations) {
        setDonations(res.data.donations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (donationId: string, newStatus: string) => {
    try {
      await api.patch(`/donations/${donationId}/status`, { status: newStatus });
      setDonations((prev) =>
        prev.map((d) => (d._id === donationId ? { ...d, status: newStatus as any } : d))
      );
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const filtered = donations.filter((d) => {
    const matchesStatus = filterStatus === "ALL" || d.status === filterStatus;
    const foodName = (d.foodName || "").toLowerCase();
    const foodCategory = (d.foodCategory || "").toLowerCase();
    const donorName = (d.donor?.organizationName || d.donor?.fullName || d.donorOrg || d.donorName || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = foodName.includes(query) || foodCategory.includes(query) || donorName.includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout
      title="Platform Food Surplus Auditing"
      subtitle="Inspect incoming surplus batches, override automated safety flags, and authorize NGO network distribution"
    >
      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish, category, or donor..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_SAFETY_REVIEW">Pending Safety Review</option>
            <option value="APPROVED">Approved</option>
            <option value="NGO_ASSIGNED">NGO Assigned</option>
            <option value="VOLUNTEER_ASSIGNED">Volunteer Dispatched</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading food lots...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Food & Category</th>
                  <th className="px-5 py-3">Donor Facility</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Safety Score</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{d.foodName}</div>
                      <div className="text-[11px] text-slate-400">{d.foodCategory} • {d.storageCondition}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{d.donor?.organizationName || d.donor?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{d.pickupAddress}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                      {d.quantity} {d.unit}
                    </td>
                    <td className="px-5 py-3.5">
                      <SafetyScoreBadge score={d.safetyScore} status={d.safetyStatus} size="sm" />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          d.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : d.status === "IN_TRANSIT"
                            ? "bg-blue-100 text-blue-800"
                            : d.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {(d.status === "PENDING_SAFETY_REVIEW" || d.status === ("SAFETY_REVIEWED" as any)) && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(d._id, "APPROVED")}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(d._id, "REJECTED")}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      {d.status === "APPROVED" && (
                        <button
                          onClick={() => handleUpdateStatus(d._id, "REJECTED")}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold transition inline-flex items-center gap-1 border border-rose-200"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      )}
                      <Link
                        to={`/donor/track/${d._id}`}
                        className="p-1.5 inline-flex items-center justify-center text-purple-700 hover:bg-purple-100 rounded-lg transition"
                        title="Live Chain of Custody"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
