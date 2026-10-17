import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Award,
  Trash2,
  Edit2,
  Check,
  Phone,
  Circle
} from "lucide-react";
import { User, UserRole } from "../types";
import api from "../services/api";

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Trust Score Adjustment modal
  const [trustModal, setTrustModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    currentScore: number;
    newScore: number;
  }>({
    open: false,
    userId: "",
    userName: "",
    currentScore: 80,
    newScore: 80
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      if (res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Aadhaar Document Modal
  const [docModal, setDocModal] = useState<{
    open: boolean;
    userName: string;
    aadharNumber?: string;
    docUrl?: string;
  }>({
    open: false,
    userName: "",
    aadharNumber: "",
    docUrl: ""
  });

  const handleVerifyUser = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/verify`, {});
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: "VERIFIED" } : u))
      );
    } catch (err) {
      alert("Failed to verify user.");
    }
  };

  const handleUpdateTrust = async () => {
    try {
      await api.patch(`/users/${trustModal.userId}/trust-score`, {
        trustScore: trustModal.newScore
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === trustModal.userId ? { ...u, trustScore: trustModal.newScore } : u))
      );
      setTrustModal({ open: false, userId: "", userName: "", currentScore: 0, newScore: 0 });
    } catch (err) {
      alert("Failed to update trust score.");
    }
  };

  const filtered = users.filter((u) => {
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organizationName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <DashboardLayout
      title="User Network Directory & Trust Administration"
      subtitle="Verify commercial food donors, certify charity kitchens, and calibrate participant trust weights"
    >
      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, emails, or brands..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
          >
            <option value="ALL">All Participant Roles</option>
            <option value="DONOR">Donors</option>
            <option value="NGO">NGO Shelters</option>
            <option value="VOLUNTEER">Volunteers</option>
            <option value="ADMIN">Root Admins</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">User & Organization</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Trust Score</th>
                  <th className="px-5 py-3">Verification</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                      {u.organizationName && (
                        <div className="text-[10px] text-purple-700 font-semibold">{u.organizationName}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() =>
                          setTrustModal({
                            open: true,
                            userId: u._id,
                            userName: u.fullName,
                            currentScore: u.trustScore || 80,
                            newScore: u.trustScore || 80
                          })
                        }
                        className="font-mono font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition"
                      >
                        {u.trustScore || 80} / 100 ✎
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        {u.status === "VERIFIED" || (u as any).isVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[9px] uppercase">
                              {u.status || "Pending"}
                            </span>
                            <button
                              onClick={() => handleVerifyUser(u._id)}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-xs"
                            >
                              Verify
                            </button>
                          </div>
                        )}

                        {u.aadharNumber && (
                          <div className="text-[10px] font-mono text-slate-500">
                            Aadhaar: <span className="font-bold text-slate-700">{u.aadharNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}</span>
                          </div>
                        )}

                        {u.verificationDocument && (
                          <button
                            type="button"
                            onClick={() =>
                              setDocModal({
                                open: true,
                                userName: u.fullName,
                                aadharNumber: u.aadharNumber,
                                docUrl: u.verificationDocument
                              })
                            }
                            className="text-[10px] text-purple-700 hover:underline font-bold block"
                          >
                            View Aadhaar / KYC 📄
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                      {u.city || "Delhi"}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === "VOLUNTEER" ? (
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black ${
                            u.availabilityStatus === "BUSY" ? "bg-amber-100 text-amber-800" :
                            u.availabilityStatus === "UNAVAILABLE" ? "bg-slate-200 text-slate-700" :
                            "bg-emerald-100 text-emerald-800"
                          }`}>
                            <Circle className="w-2.5 h-2.5 fill-current" />
                            {u.availabilityStatus || "AVAILABLE"}
                          </span>
                          <a href={`tel:${u.phone}`} className="flex items-center gap-1 text-blue-700 hover:underline text-[10px] font-bold">
                            <Phone className="w-3 h-3" /> Contact Volunteer
                          </a>
                        </div>
                      ) : <span className="text-slate-400 text-[10px]">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() =>
                          setTrustModal({
                            open: true,
                            userId: u._id,
                            userName: u.fullName,
                            currentScore: u.trustScore || 80,
                            newScore: u.trustScore || 80
                          })
                        }
                        className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-slate-100 rounded-lg"
                        title="Calibrate Trust Score"
                      >
                        <Award className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trust Calibration Modal */}
      {trustModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">Adjust Trust Rating</h3>
              <p className="text-xs text-slate-500">{trustModal.userName}</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                Target Score (0 - 100): <span className="font-mono font-black text-purple-700">{trustModal.newScore}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={trustModal.newScore}
                onChange={(e) =>
                  setTrustModal({ ...trustModal, newScore: Number(e.target.value) })
                }
                className="w-full accent-purple-700"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setTrustModal({ open: false, userId: "", userName: "", currentScore: 0, newScore: 0 })
                }
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateTrust}
                className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Save Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC / Aadhaar Document Viewer Modal */}
      {docModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Aadhaar &amp; KYC Verification Record</h3>
                <p className="text-xs text-slate-500">{docModal.userName}</p>
              </div>
              <button
                onClick={() => setDocModal({ open: false, userName: "", aadharNumber: "", docUrl: "" })}
                className="text-slate-400 hover:text-slate-700 font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            {docModal.aadharNumber && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500">Aadhaar / ID: </span>
                <span className="font-mono font-bold text-slate-800">
                  {docModal.aadharNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}
                </span>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center min-h-[220px] max-h-[380px]">
              {docModal.docUrl?.startsWith("data:image") || docModal.docUrl?.startsWith("http") ? (
                <img
                  src={docModal.docUrl}
                  alt="Uploaded KYC Document"
                  className="w-full h-full object-contain max-h-[360px]"
                />
              ) : docModal.docUrl?.startsWith("data:application/pdf") ? (
                <iframe
                  src={docModal.docUrl}
                  title="PDF Document"
                  className="w-full h-80"
                />
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  <p className="font-semibold mb-2">Attached Identity File</p>
                  <a
                    href={docModal.docUrl}
                    download="kyc-document"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-3 py-1.5 bg-purple-700 text-white rounded-xl font-bold hover:bg-purple-800"
                  >
                    Open / Download Document
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDocModal({ open: false, userName: "", aadharNumber: "", docUrl: "" })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
