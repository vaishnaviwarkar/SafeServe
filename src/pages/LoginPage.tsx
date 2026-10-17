import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      // Look up user role to navigate correctly
      const saved = localStorage.getItem("safeserve_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === "ADMIN") navigate("/admin/dashboard");
        else if (u.role === "DONOR") navigate("/donor/dashboard");
        else if (u.role === "NGO") navigate("/ngo/dashboard");
        else if (u.role === "VOLUNTEER") navigate("/volunteer/dashboard");
        else navigate("/");
      } else {
        navigate("/");
      }
    } else {
      setErrorMsg(res.message || "Invalid email or password.");
    }
  };

  const setDemoCredentials = (role: "ADMIN" | "DONOR" | "NGO" | "VOLUNTEER") => {
    if (role === "ADMIN") {
      setEmail("admin@safeserve.org");
      setPassword("AdminSafeServe2026!");
    } else if (role === "DONOR") {
      setEmail("donor@royalfeast.com");
      setPassword("Donor123!");
    } else if (role === "NGO") {
      setEmail("ngo@carenourish.org");
      setPassword("Ngo123!");
    } else if (role === "VOLUNTEER") {
      setEmail("volunteer@cityrescue.org");
      setPassword("Volunteer123!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center mx-auto shadow-md shadow-purple-200">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-xs text-slate-500">
              Sign in to your SafeServe rescue operations portal
            </p>
          </div>

          {/* Quick Demo Logins Bar */}
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Instant Test Credentials</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoCredentials("ADMIN")}
                className="py-1 px-2 rounded-lg bg-purple-900 text-white hover:bg-purple-800 text-[11px] font-bold transition shadow-xs"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("DONOR")}
                className="py-1 px-2 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-[11px] font-bold text-purple-900 transition"
              >
                Food Donor
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("NGO")}
                className="py-1 px-2 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-[11px] font-bold text-purple-900 transition"
              >
                NGO Shelter
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("VOLUNTEER")}
                className="py-1 px-2 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-[11px] font-bold text-purple-900 transition"
              >
                Volunteer
              </button>
            </div>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-purple-700 font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? "Authenticating..." : "Sign In to SafeServe"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Links */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-center text-xs">
            <div>
              <span className="text-slate-500">Don't have an account? </span>
              <Link to="/register" className="font-bold text-purple-700 hover:underline">
                Create Account
              </Link>
            </div>
            <div>
              <Link
                to="/admin/login"
                className="text-[11px] font-bold text-slate-500 hover:text-purple-700 flex items-center justify-center gap-1"
              >
                <Lock className="w-3 h-3" />
                <span>Administrator Command Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
