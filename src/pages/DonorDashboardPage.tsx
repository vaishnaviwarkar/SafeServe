import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import { QRViewerModal } from "../components/QRViewerModal";
import {
  UtensilsCrossed,
  Truck,
  HeartHandshake,
  CheckCircle2,
  PlusCircle,
  QrCode,
  Clock,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FoodDonation } from "../types";
import api from "../services/api";

export const DonorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // QR Modal
  const [activeQrModal, setActiveQrModal] = useState<{
    open: boolean;
    token: string;
    image?: string;
    title: string;
  }>({
    open: false,
    token: "",
    title: ""
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const res = await api.get("/donations/my");
      if (res.data?.donations) {
        setDonations(res.data.donations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalMeals = donations.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const activeRescues = donations.filter((d) =>
    ["APPROVED", "NGO_ASSIGNED", "VOLUNTEER_ASSIGNED", "PICKUP_SCHEDULED", "IN_TRANSIT"].includes(d.status)
  ).length;
  const completedRescues = donations.filter((d) =>
    ["DELIVERED", "DISTRIBUTION_COMPLETED"].includes(d.status)
  ).length;

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.organizationName || user?.fullName}`}
      subtitle="Donor Command Hub • Real-time Food Safety, Logistics & Traceability"
      actions={
        <Link
          to="/donor/create-donation"
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-purple-200"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Surplus Donation</span>
        </Link>
      }
    >
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Donated</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{donations.length}</div>
          <p className="text-[11px] text-slate-500 font-medium">Surplus batches logged</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Rescues</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono">{activeRescues}</div>
          <p className="text-[11px] text-slate-500 font-medium">In transit or scheduled</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meals Provided</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{totalMeals}</div>
          <p className="text-[11px] text-slate-500 font-medium">Safe portions served</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Donor Trust Score</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">{user?.trustScore || 85}/100</div>
          <p className="text-[11px] text-slate-500 font-medium">Verified donor rating</p>
        </div>
      </div>

      {/* Recent Donations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Recent Surplus Donations</h3>
            <p className="text-xs text-slate-500">Live safety status and courier assignment progress</p>
          </div>
          <Link
            to="/donor/donations"
            className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading donor records...</div>
        ) : donations.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No food donations created yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Ready to prevent food waste? Register your first batch of surplus meals with automated safety evaluation.
            </p>
            <div className="pt-2">
              <Link
                to="/donor/create-donation"
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Donation Now</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Food Item & Category</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Safety Score</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {donations.slice(0, 8).map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{d.foodName}</div>
                      <div className="text-[11px] text-slate-400">{d.foodCategory} • {d.storageCondition}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      {d.quantity} {d.unit}
                    </td>
                    <td className="px-5 py-3.5">
                      <SafetyScoreBadge score={d.safetyScore} status={d.safetyStatus} size="sm" />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === "DELIVERED" || d.status === "DISTRIBUTION_COMPLETED"
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
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        to={`/donor/track/${d._id}`}
                        className="p-1.5 inline-flex items-center justify-center text-purple-700 hover:bg-purple-100 rounded-lg transition"
                        title="Live Tracking"
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

      <QRViewerModal
        isOpen={activeQrModal.open}
        onClose={() => setActiveQrModal({ open: false, token: "", title: "" })}
        verificationToken={activeQrModal.token}
        qrCodeImage={activeQrModal.image}
        rescueTitle={activeQrModal.title}
        stepType="PICKUP"
      />
    </DashboardLayout>
  );
};
