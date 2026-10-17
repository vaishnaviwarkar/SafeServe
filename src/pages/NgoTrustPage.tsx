import React from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Award, TrendingUp, CheckCircle2, AlertTriangle, HeartHandshake } from "lucide-react";

export const NgoTrustPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="NGO Trust Score & Compliance Rating"
      subtitle="Transparent evaluation mechanics governing shelter food reception and community distribution"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-black">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-extrabold text-base text-slate-900">{user?.organizationName || user?.fullName}</h3>
            <p className="text-xs text-slate-500">Verified Charity Partner</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Reliability Score
            </span>
            <div className="text-4xl font-black text-emerald-700 font-mono">
              {user?.trustScore || 90} / 100
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold pt-1">
              Top 5% Highest Rated Regional Distribution Hub
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
            Automated Scoring System Mechanics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Delivery OTP Verification</span>
                <span className="font-bold text-emerald-700 font-mono">+2 pts</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Awarded immediately upon valid OTP / QR handshake with the volunteer courier.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Beneficiary Distribution Logged</span>
                <span className="font-bold text-emerald-700 font-mono">+5 pts</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Awarded when meals are safely plated and distributed at the shelter.
              </p>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Unclaimed Batch Cancellation</span>
                <span className="font-bold text-rose-700 font-mono">-10 pts</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Deducted if shelter claims surplus but cancels without 2 hours prior notice.
              </p>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Frivolous Incident Report</span>
                <span className="font-bold text-rose-700 font-mono">-15 pts</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Deducted if quality complaints are disproven by administrative inspection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
