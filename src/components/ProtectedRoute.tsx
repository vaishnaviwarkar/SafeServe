import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            Validating SafeServe Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!token || !user) {
    // If attempting to access admin route, redirect to admin login
    if (location.pathname.startsWith("/admin")) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if blocked
  if (user.status === "BLOCKED" && !location.pathname.includes("/profile")) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-200 p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h2 className="text-lg font-black text-slate-900">Access Restricted: Account Blocked</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your SafeServe account has been blocked by administrators due to safety compliance or policy issues. Access to operational features is restricted.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Role validation
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center space-y-4">
          <h2 className="text-lg font-black text-slate-900">Unauthorized Access</h2>
          <p className="text-xs text-slate-600">
            Role '{user.role}' does not have authorization to view this operational zone.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
