import React, { useState } from "react";
import { X, Download, Terminal, Check, Copy, ExternalLink, Code } from "lucide-react";

interface PostmanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostmanModal: React.FC<PostmanModalProps> = ({ isOpen, onClose }) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("auth");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const endpointGroups = [
    {
      id: "auth",
      name: "Authentication",
      endpoints: [
        { method: "POST", path: "/api/auth/register", desc: "Register public user (DONOR, NGO, VOLUNTEER)" },
        { method: "POST", path: "/api/auth/login", desc: "Login with email & password" },
        { method: "POST", path: "/api/auth/admin/login", desc: "Command center admin login" },
        { method: "GET", path: "/api/auth/me", desc: "Get current authenticated profile & trust score" },
        { method: "POST", path: "/api/auth/logout", desc: "Server session revocation" }
      ]
    },
    {
      id: "users",
      name: "Users & Compliance",
      endpoints: [
        { method: "GET", path: "/api/users", desc: "List all platform users (Admin only)" },
        { method: "GET", path: "/api/users/donors", desc: "List verified food donors" },
        { method: "GET", path: "/api/users/ngos", desc: "List registered NGOs & capacities" },
        { method: "GET", path: "/api/users/volunteers", desc: "List active courier volunteers" },
        { method: "PATCH", path: "/api/users/:id/verify", desc: "Admin verify/approve organization" },
        { method: "PATCH", path: "/api/users/:id/block", desc: "Admin block or unblock account" }
      ]
    },
    {
      id: "donations",
      name: "Food Donations",
      endpoints: [
        { method: "POST", path: "/api/donations", desc: "Create surplus donation & run safety eval (Multipart/JSON)" },
        { method: "GET", path: "/api/donations", desc: "List donations with filter by status/category" },
        { method: "GET", path: "/api/donations/my", desc: "List donations created by current donor" },
        { method: "GET", path: "/api/donations/available", desc: "List approved donations awaiting rescue" },
        { method: "GET", path: "/api/donations/:id", desc: "Get single donation record with safety breakdown" },
        { method: "PATCH", path: "/api/donations/:id/approve", desc: "Admin approve donation for dispatch" },
        { method: "PATCH", path: "/api/donations/:id/reject", desc: "Admin reject unsafe donation" }
      ]
    },
    {
      id: "safety",
      name: "Food Safety Rule Engine",
      endpoints: [
        { method: "POST", path: "/api/safety/assess", desc: "Run standalone food safety scoring calculation" },
        { method: "GET", path: "/api/safety/assessments/:donationId", desc: "Get safety audit report for donation" }
      ]
    },
    {
      id: "rescue",
      name: "Rescue Operations",
      endpoints: [
        { method: "POST", path: "/api/rescues/claim", desc: "NGO claims available donation" },
        { method: "POST", path: "/api/rescues/assign-volunteer", desc: "Assign volunteer courier to rescue" },
        { method: "GET", path: "/api/rescues/available-tasks", desc: "Volunteer browse open courier requests" },
        { method: "POST", path: "/api/rescues/:id/accept-task", desc: "Volunteer accepts rescue assignment" },
        { method: "POST", path: "/api/rescues/:id/schedule-pickup", desc: "Schedule pickup & generate QR/OTP" },
        { method: "POST", path: "/api/rescues/:id/complete-distribution", desc: "NGO completes meal distribution" }
      ]
    },
    {
      id: "verification",
      name: "Multi-Factor Verification",
      endpoints: [
        { method: "POST", path: "/api/verification/verify-pickup", desc: "Verify pickup via QR + OTP + GPS Geofence" },
        { method: "POST", path: "/api/verification/verify-delivery", desc: "Verify delivery via QR + OTP + GPS Geofence" },
        { method: "POST", path: "/api/verification/resend-otp", desc: "Regenerate time-limited OTP" },
        { method: "GET", path: "/api/verification/rescue/:id", desc: "Get verification audit log records" }
      ]
    },
    {
      id: "complaints",
      name: "Complaints & Quality",
      endpoints: [
        { method: "POST", path: "/api/complaints", desc: "Submit food safety or operational complaint" },
        { method: "GET", path: "/api/complaints", desc: "List all complaints (Admin/User filtered)" },
        { method: "PATCH", path: "/api/complaints/:id/resolve", desc: "Admin resolve complaint & adjust trust score" }
      ]
    },
    {
      id: "emergency",
      name: "Emergency Requests",
      endpoints: [
        { method: "POST", path: "/api/emergency", desc: "NGO creates high-urgency disaster request" },
        { method: "GET", path: "/api/emergency", desc: "List open emergency food requests" },
        { method: "PATCH", path: "/api/emergency/:id/fulfill", desc: "Mark emergency request fulfilled" }
      ]
    },
    {
      id: "analytics",
      name: "Analytics & Reports",
      endpoints: [
        { method: "GET", path: "/api/analytics/dashboard", desc: "Get aggregated dashboard metrics & charts" }
      ]
    },
    {
      id: "audit",
      name: "Audit Trail",
      endpoints: [
        { method: "GET", path: "/api/audit", desc: "Immutable system action audit trail (Admin only)" }
      ]
    }
  ];

  const handleExportPostman = () => {
    const postmanCollection = {
      info: {
        name: "SafeServe Platform API Suite v2.1",
        description: "Official REST API collection for SafeServe Smart Food Rescue & Safety Management.",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: endpointGroups.map(group => ({
        name: group.name,
        item: group.endpoints.map(ep => ({
          name: ep.desc,
          request: {
            method: ep.method,
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{JWT_TOKEN}}" }
            ],
            url: {
              raw: `{{BASE_URL}}${ep.path}`,
              host: ["{{BASE_URL}}"],
              path: ep.path.replace(/^\//, "").split("/")
            }
          }
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SafeServe_Postman_Collection_v2.1.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentGroup = endpointGroups.find(g => g.id === selectedGroup) || endpointGroups[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">SafeServe REST API & Postman Suite</h2>
              <p className="text-xs text-slate-400">Complete documentation of all 11 backend service modules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPostman}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Postman Collection</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Side Menu */}
          <div className="w-full md:w-56 bg-slate-50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              API Modules
            </div>
            {endpointGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-between ${
                  selectedGroup === group.id
                    ? "bg-purple-700 text-white font-bold"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{group.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${selectedGroup === group.id ? "bg-purple-900 text-purple-200" : "bg-slate-200 text-slate-600"}`}>
                  {group.endpoints.length}
                </span>
              </button>
            ))}
          </div>

          {/* Endpoints List */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">{currentGroup.name} Endpoints</h3>
              <span className="text-xs text-slate-500 font-mono">Base URL: /api</span>
            </div>

            <div className="space-y-3">
              {currentGroup.endpoints.map((ep, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded font-mono ${
                        ep.method === "GET"
                          ? "bg-blue-100 text-blue-800"
                          : ep.method === "POST"
                          ? "bg-emerald-100 text-emerald-800"
                          : ep.method === "PATCH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">{ep.path}</span>
                  </div>
                  <p className="text-xs text-slate-600">{ep.desc}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Headers: <code className="text-purple-700 font-semibold">Authorization: Bearer &lt;token&gt;</code>
                  </div>
                </div>
              ))}
            </div>

            {/* Test Helper */}
            <div className="mt-6 p-4 rounded-xl bg-purple-50 border border-purple-200">
              <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-purple-700" />
                <span>Quick Test Tip</span>
              </h4>
              <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                Click <strong>"Export Postman Collection"</strong> above to import into Postman, Insomnia, or Thunder Client. Environment variables needed: <code>BASE_URL = http://localhost:3000</code> and <code>JWT_TOKEN = &lt;login token&gt;</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
