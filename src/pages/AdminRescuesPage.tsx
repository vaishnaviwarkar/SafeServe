import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Truck,
  HeartHandshake,
  Bike,
  Building2,
  KeyRound,
  QrCode,
  CheckCircle2,
  Eye,
  Clock,
  Search,
  Filter
} from "lucide-react";
import { RescueRequest } from "../types";
import api from "../services/api";

export const AdminRescuesPage: React.FC = () => {
  const [rescues, setRescues] = useState<RescueRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRescues();
  }, []);

  const fetchRescues = async () => {
    try {
      const res = await api.get("/rescues");
      if (res.data?.rescues) {
        setRescues(res.data.rescues);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = rescues.filter((r) => {
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (r.donation?.foodName || "").toLowerCase().includes(query) ||
      (r.donor?.fullName || r.donor?.organizationName || "").toLowerCase().includes(query) ||
      (r.ngo?.fullName || r.ngo?.organizationName || "").toLowerCase().includes(query) ||
      (r.volunteer?.fullName || "").toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout
      title="Global Chain of Custody Tracker"
      subtitle="Full audit trail of pickup tokens, delivery OTPs, and real-time courier hand-offs"
    >
      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish, donor, shelter, or courier..."
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
            <option value="ALL">All Rescue States</option>
            <option value="NGO_ASSIGNED">NGO Assigned</option>
            <option value="VOLUNTEER_ASSIGNED">Volunteer Dispatched</option>
            <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DISTRIBUTION_COMPLETED">Distribution Completed</option>
          </select>
        </div>
      </div>

      {/* Rescues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading rescue streams...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Consignment</th>
                  <th className="px-5 py-3">Food Donor</th>
                  <th className="px-5 py-3">Receiving NGO</th>
                  <th className="px-5 py-3">Volunteer Courier</th>
                  <th className="px-5 py-3">Tokens / OTP</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{r.donation?.foodName || "Meal Batch"}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.donation?.quantity} {r.donation?.unit}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{r.donor?.organizationName || r.donor?.fullName}</div>
                      <div className="text-[10px] text-slate-400">{r.donor?.phone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{r.ngo?.organizationName || r.ngo?.fullName}</div>
                      <div className="text-[10px] text-slate-400">{r.ngo?.phone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-purple-900">{r.volunteer?.fullName || "Unassigned"}</div>
                      <div className="text-[10px] text-slate-400">{r.volunteer?.transport}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      <div className="text-slate-600">Pickup OTP: <strong className="text-amber-800">{r.pickupOtp || "—"}</strong></div>
                      <div className="text-slate-600">Delivery OTP: <strong className="text-emerald-800">{r.deliveryOtp || "—"}</strong></div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === "DELIVERED" || r.status === "DISTRIBUTION_COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.status === "IN_TRANSIT"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/donor/track/${r.donationId}`}
                        className="p-1.5 inline-flex items-center justify-center text-purple-700 hover:bg-purple-100 rounded-lg transition"
                        title="View Full Custody Lifecycle"
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
