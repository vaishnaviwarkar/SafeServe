import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Bell, LogOut, User as UserIcon, Menu, X, CheckCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = async (targetRole: "DONOR" | "NGO" | "VOLUNTEER" | "ADMIN") => {
    setIsSwitchingRole(true);
    const res = await switchRole(targetRole);
    setIsSwitchingRole(false);
    if (res.success) {
      if (targetRole === "ADMIN") navigate("/admin/dashboard");
      else if (targetRole === "DONOR") navigate("/donor/dashboard");
      else if (targetRole === "NGO") navigate("/ngo/dashboard");
      else if (targetRole === "VOLUNTEER") navigate("/volunteer/dashboard");
    }
  };

  const getDashboardUrl = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "DONOR":
        return "/donor/dashboard";
      case "NGO":
        return "/ngo/dashboard";
      case "VOLUNTEER":
        return "/volunteer/dashboard";
      default:
        return "/";
    }
  };

  const getProfileUrl = () => {
    if (!user) return "/login";
    return `/${user.role.toLowerCase()}/profile`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-purple-700 flex items-center justify-center text-white shadow-md shadow-purple-200 group-hover:bg-purple-800 transition">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-slate-900 tracking-tight font-display">
                  Safe<span className="text-purple-700">Serve</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest hidden sm:block">
                Smart Food Rescue & Safety
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            {!isAuthenticated ? (
              <>
                <Link to="/" className={`hover:text-purple-700 transition ${location.pathname === "/" ? "text-purple-700" : ""}`}>
                  Home
                </Link>
                <Link to="/how-it-works" className={`hover:text-purple-700 transition ${location.pathname === "/how-it-works" ? "text-purple-700" : ""}`}>
                  How It Works
                </Link>
                <Link to="/food-safety" className={`hover:text-purple-700 transition ${location.pathname === "/food-safety" ? "text-purple-700" : ""}`}>
                  Food Safety
                </Link>
                <Link to="/rescue-process" className={`hover:text-purple-700 transition ${location.pathname === "/rescue-process" ? "text-purple-700" : ""}`}>
                  Rescue Process
                </Link>
                <Link to="/about" className={`hover:text-purple-700 transition ${location.pathname === "/about" ? "text-purple-700" : ""}`}>
                  About
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={getDashboardUrl()}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 font-bold hover:bg-purple-100 transition"
                >
                  Command Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-purple-700 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition shadow-purple-200"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-600 hover:text-purple-700 hover:bg-slate-100 rounded-lg transition"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-rose-600 rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Notifications ({unreadCount} unread)</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-purple-700 hover:underline font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500">No notifications yet.</div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n._id}
                              onClick={() => {
                                markAsRead(n._id);
                                if (n.link) navigate(n.link);
                                setShowNotifications(false);
                              }}
                              className={`p-3 text-xs cursor-pointer transition hover:bg-slate-50 ${
                                !n.isRead ? "bg-purple-50/60 font-medium" : "text-slate-600"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-bold text-slate-900">{n.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="mt-1 text-slate-600 line-clamp-2">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Switcher & Trust Score Badge */}
                <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  <select
                    value={user?.role}
                    disabled={isSwitchingRole}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="bg-transparent font-black text-purple-900 border-none outline-none cursor-pointer py-0.5 px-1.5 rounded hover:bg-white text-xs transition disabled:opacity-50"
                    title="Switch active user role"
                  >
                    <option value="DONOR">🏢 Donor: Royal Feast</option>
                    <option value="NGO">🍲 NGO: Care Nourish</option>
                    <option value="VOLUNTEER">🚴 Volunteer: City Courier</option>
                    <option value="ADMIN">🛡️ Admin: SafeServe</option>
                  </select>
                  <span className="w-1 h-1 rounded-full bg-slate-400" />
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5 pr-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    {user?.trustScore}/100
                  </span>
                </div>

                {/* Profile Link */}
                <Link
                  to={getProfileUrl()}
                  className="flex items-center gap-2 p-1.5 text-slate-700 hover:text-purple-700 rounded-lg transition"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                    {user?.fullName?.charAt(0) || "U"}
                  </div>
                  <span className="text-xs font-bold hidden sm:inline max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-700 hover:text-purple-700 rounded-lg"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {!isAuthenticated ? (
            <>
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-purple-700 py-1.5"
              >
                Home
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-purple-700 py-1.5"
              >
                How It Works
              </Link>
              <Link
                to="/food-safety"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-purple-700 py-1.5"
              >
                Food Safety Assessment
              </Link>
              <Link
                to="/rescue-process"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-purple-700 py-1.5"
              >
                Rescue Process
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-purple-700 py-1.5"
              >
                About SafeServe
              </Link>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-bold text-slate-700 bg-slate-100 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-bold text-white bg-purple-700 rounded-lg shadow-sm"
                >
                  Create Account
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="pb-3 border-b border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{user?.fullName}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
                <div className="mt-2 inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-xs uppercase">
                  {user?.role} • Trust Score: {user?.trustScore}/100
                </div>
                <div className="mt-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Switch Role Perspective:</label>
                  <select
                    value={user?.role}
                    onChange={(e) => {
                      setIsMobileMenuOpen(false);
                      handleRoleChange(e.target.value as any);
                    }}
                    className="w-full text-xs font-bold text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-200"
                  >
                    <option value="DONOR">🏢 Donor: Royal Feast</option>
                    <option value="NGO">🍲 NGO: Care Nourish</option>
                    <option value="VOLUNTEER">🚴 Volunteer: City Courier</option>
                    <option value="ADMIN">🛡️ Admin: SafeServe</option>
                  </select>
                </div>
              </div>
              <Link
                to={getDashboardUrl()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-bold text-purple-700 py-1.5"
              >
                Go to Dashboard
              </Link>
              <Link
                to={getProfileUrl()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 py-1.5"
              >
                My Profile
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left text-sm font-bold text-rose-600 py-1.5 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
