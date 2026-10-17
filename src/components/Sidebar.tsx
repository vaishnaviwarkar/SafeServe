import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  HeartHandshake,
  Bike,
  UtensilsCrossed,
  Truck,
  ShieldCheck,
  QrCode,
  AlertCircle,
  Flame,
  FileSpreadsheet,
  BarChart3,
  Settings,
  PlusCircle,
  ListOrdered,
  Clock,
  Bell,
  UserCheck,
  CheckCircle2,
  LogOut,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getAdminLinks = () => [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Users & Approvals", icon: Users, path: "/admin/users" },
    { label: "Food Donations", icon: UtensilsCrossed, path: "/admin/donations" },
    { label: "Rescue Operations", icon: Truck, path: "/admin/rescues" },
    { label: "Complaints & Quality", icon: AlertCircle, path: "/admin/complaints" },
    { label: "Reports & Analytics", icon: BarChart3, path: "/admin/reports" },
    { label: "Notifications", icon: Bell, path: "/admin/notifications" },
    { label: "Security & Profile", icon: UserCheck, path: "/admin/profile" }
  ];

  const getDonorLinks = () => [
    { label: "Dashboard", icon: LayoutDashboard, path: "/donor/dashboard" },
    { label: "Create Donation", icon: PlusCircle, path: "/donor/create-donation" },
    { label: "My Donations", icon: UtensilsCrossed, path: "/donor/donations" },
    { label: "Notifications", icon: Bell, path: "/donor/notifications" },
    { label: "Profile & Hub", icon: UserCheck, path: "/donor/profile" }
  ];

  const getNgoLinks = () => [
    { label: "Dashboard", icon: LayoutDashboard, path: "/ngo/dashboard" },
    { label: "Available Donations", icon: UtensilsCrossed, path: "/ngo/donations" },
    { label: "Assigned Rescues", icon: Truck, path: "/ngo/rescues" },
    { label: "Delivery Confirmation", icon: QrCode, path: "/ngo/delivery" },
    { label: "Emergency Request", icon: Flame, path: "/ngo/emergency" },
    { label: "Trust Score", icon: CheckCircle2, path: "/ngo/trust" },
    { label: "Quality Complaints", icon: AlertCircle, path: "/ngo/complaints" },
    { label: "Notifications", icon: Bell, path: "/ngo/notifications" },
    { label: "Shelter Profile", icon: UserCheck, path: "/ngo/profile" }
  ];

  const getVolunteerLinks = () => [
    { label: "Dashboard", icon: LayoutDashboard, path: "/volunteer/dashboard" },
    { label: "Available Tasks", icon: ListOrdered, path: "/volunteer/tasks" },
    { label: "Active Rescue", icon: Truck, path: "/volunteer/active" },
    { label: "QR Scanner & OTP", icon: QrCode, path: "/volunteer/scanner" },
    { label: "Rescue History", icon: CheckCircle2, path: "/volunteer/history" },
    { label: "Notifications", icon: Bell, path: "/volunteer/notifications" },
    { label: "Courier Profile", icon: UserCheck, path: "/volunteer/profile" }
  ];

  const getLinks = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return getAdminLinks();
      case "DONOR":
        return getDonorLinks();
      case "NGO":
        return getNgoLinks();
      case "VOLUNTEER":
        return getVolunteerLinks();
      default:
        return [];
    }
  };

  const links = getLinks(user.role);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
            {user.role} PORTAL
          </div>
          <div className="text-sm font-bold text-white truncate max-w-[170px]">
            {user.organizationName || user.fullName}
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill */}
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 text-xs flex items-center justify-between">
        <span className="font-semibold text-slate-400">Status</span>
        <span
          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
            user.status === "VERIFIED"
              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
              : user.status === "PENDING"
              ? "bg-amber-950 text-amber-300 border border-amber-800"
              : "bg-rose-950 text-rose-300 border border-rose-800"
          }`}
        >
          {user.status}
        </span>
      </div>

      {/* Links Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {links.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={index}
              to={item.path}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isActive
                  ? "bg-purple-700 text-white font-bold shadow-sm shadow-purple-900"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
