import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  User,
  Mail,
  Phone,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Database
} from "lucide-react";
import api from "../services/api";

export const AdminProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    try {
      await api.patch(`/users/${user?._id}`, {
        fullName,
        phone
      });
      await refreshProfile();
      setMsg({ type: "success", text: "Administrator credentials and contact info updated." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to update admin profile." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Admin Security & Account Credentials"
      subtitle="Super Administrator privilege level, system telemetry, and command authentication"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Security Overview */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-900 text-white flex items-center justify-center mx-auto text-2xl font-black shadow-md shadow-purple-200">
              <ShieldAlert className="w-8 h-8 text-purple-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{user?.fullName}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-2 inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-900 border border-purple-300">
                SUPER ADMINISTRATOR
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Privilege Level:</span>
                <span className="font-bold text-slate-900">Root / Full Access</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Audit Logging:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Database Sync:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-600" /> Operational
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Update Profile */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Admin Identity Configuration
            </h3>

            {msg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  msg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{msg.text}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Super Admin Display Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Administrative Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Email is locked to primary root credential for security compliance.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Direct Escalation Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Updating Admin..." : "Save Admin Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
