import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  ShieldAlert,
  Users,
  UtensilsCrossed,
  Truck,
  HeartHandshake,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Award,
  ArrowRight,
  Terminal,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    donorsCount: 0,
    ngosCount: 0,
    volunteersCount: 0,
    totalDonations: 0,
    totalRescues: 0,
    completedRescues: 0,
    totalMeals: 0,
    availableVolunteers: 0,
    busyVolunteers: 0,
    unavailableVolunteers: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    setIsLoading(true);
    try {
      const [usersRes, donRes, rescueRes] = await Promise.all([
        api.get("/users"),
        api.get("/donations"),
        api.get("/rescues")
      ]);

      const users = usersRes.data?.users || [];
      const donations = donRes.data?.donations || [];
      const rescues = rescueRes.data?.rescues || [];

      const donorsCount = users.filter((u: any) => u.role === "DONOR").length;
      const ngosCount = users.filter((u: any) => u.role === "NGO").length;
      const volunteers = users.filter((u: any) => u.role === "VOLUNTEER");
      const volunteersCount = volunteers.length;
      const availableVolunteers = volunteers.filter((u: any) => (u.availabilityStatus || "AVAILABLE") === "AVAILABLE").length;
      const busyVolunteers = volunteers.filter((u: any) => u.availabilityStatus === "BUSY").length;
      const unavailableVolunteers = volunteers.filter((u: any) => u.availabilityStatus === "UNAVAILABLE").length;

      const completed = rescues.filter((r: any) =>
        ["DELIVERED", "DISTRIBUTION_COMPLETED"].includes(r.status)
      ).length;

      const meals = donations.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 0), 0);

      setStats({
        totalUsers: users.length,
        donorsCount,
        ngosCount,
        volunteersCount,
        totalDonations: donations.length,
        totalRescues: rescues.length,
        completedRescues: completed,
        totalMeals: meals,
        availableVolunteers,
        busyVolunteers,
        unavailableVolunteers
      });

      setRecentUsers(users.slice(0, 5));
      setRecentDonations(donations.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="SafeServe Command Center"
      subtitle="Network-Wide Oversight • Role-Based Access Control, Safety Thresholds & Chain of Custody Audit"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminMetrics}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Metrics</span>
          </button>
          <Link
            to="/admin/users"
            className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage All Users</span>
          </Link>
        </div>
      }
    >
      {/* 4 Metric Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Network</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalUsers}</div>
          <p className="text-[11px] text-slate-500 font-medium">
            {stats.donorsCount} Donors • {stats.ngosCount} NGOs • {stats.volunteersCount} Volunteers
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surplus Batches</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono">{stats.totalDonations}</div>
          <p className="text-[11px] text-slate-500 font-medium">{stats.totalMeals} Total Portions Logged</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Rescues</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{stats.completedRescues}</div>
          <p className="text-[11px] text-slate-500 font-medium">Verified Delivered Hand-offs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Trust Score</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">92.4 / 100</div>
          <p className="text-[11px] text-slate-500 font-medium">SafeServe Platform Rating</p>
        </div>
      </div>

      {/* Live Volunteer Availability */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Live Volunteer Availability</h3>
            <p className="text-[11px] text-slate-500">Backend/database-driven dispatch status</p>
          </div>
          <Link to="/admin/volunteers" className="text-xs font-bold text-purple-700 hover:underline">Manage Volunteers</Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="text-[10px] uppercase font-black text-emerald-700">Available</div>
            <div className="text-2xl font-black text-emerald-800 font-mono">{stats.availableVolunteers}</div>
            <div className="text-[10px] text-emerald-700">Ready for dispatch</div>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <div className="text-[10px] uppercase font-black text-amber-700">Busy</div>
            <div className="text-2xl font-black text-amber-800 font-mono">{stats.busyVolunteers}</div>
            <div className="text-[10px] text-amber-700">On delivery</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
            <div className="text-[10px] uppercase font-black text-slate-600">Unavailable</div>
            <div className="text-2xl font-black text-slate-800 font-mono">{stats.unavailableVolunteers}</div>
            <div className="text-[10px] text-slate-600">Offline / unavailable</div>
          </div>
        </div>
      </div>

      {/* Tables: Recent Users & Recent Donations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Recent Network Registrations</h3>
            <Link to="/admin/users" className="text-xs font-bold text-purple-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentUsers.map((u) => (
              <div key={u._id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">{u.fullName}</div>
                  <div className="text-slate-500 text-[11px]">{u.email} • {u.organizationName || u.city}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === "ADMIN"
                        ? "bg-amber-100 text-amber-800"
                        : u.role === "DONOR"
                        ? "bg-purple-100 text-purple-800"
                        : u.role === "NGO"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {u.role}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Trust: {u.trustScore || 80}/100
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Surplus Food Listings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Recent Surplus Batches</h3>
            <Link to="/admin/donations" className="text-xs font-bold text-purple-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentDonations.map((d) => (
              <div key={d._id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">{d.foodName}</div>
                  <div className="text-slate-500 text-[11px]">
                    {d.quantity} {d.unit} • {d.foodCategory}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.safetyScore >= 70
                        ? "bg-emerald-100 text-emerald-800"
                        : d.safetyScore >= 40
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    Score: {d.safetyScore}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{d.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
