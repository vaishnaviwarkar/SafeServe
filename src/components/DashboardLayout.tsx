import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, ShieldAlert, Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Mobile Sidebar Toggle Bar */}
          <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-700"
            >
              <Menu className="w-5 h-5 text-purple-700" />
              <span>Menu / Operations</span>
            </button>
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {user?.role} Portal
            </span>
          </div>

          {/* Pending Verification Notice */}
          {user?.status === "PENDING" && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Account Status: PENDING VERIFICATION</h4>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Your profile has been submitted to SafeServe compliance team for verification. Food donation publishing, rescue assignments, and distribution confirmations will activate as soon as an administrator verifies your documentation.
                </p>
              </div>
            </div>
          )}

          {/* Blocked Notice */}
          {user?.status === "BLOCKED" && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Account Status: SUSPENDED / BLOCKED</h4>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  Administrator intervention has suspended this account from active rescue operations. Please reach out to operations@safeserve.org to appeal this resolution.
                </p>
              </div>
            </div>
          )}

          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>

          {/* Main Content Area */}
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
