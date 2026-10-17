import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ShieldCheck
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import api from "../services/api";

type ForgotStep = "REQUEST_OTP" | "VERIFY_OTP" | "RESET_PASSWORD" | "SUCCESS";

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlToken = searchParams.get("token") || "";
  const urlEmail = searchParams.get("email") || "";

  // Form State
  const [step, setStep] = useState<ForgotStep>("REQUEST_OTP");
  const [email, setEmail] = useState(urlEmail);
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Initialize from URL params if token is provided
  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
      if (urlEmail) setEmail(urlEmail);
      setStep("RESET_PASSWORD");
      setSuccessMsg("Secure reset link verified. Please enter your new password below.");
    }
  }, [urlToken, urlEmail]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Step 1: Send OTP to registered user's email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid registered email address.");
      return;
    }

    if (resendCooldown > 0) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setIsLoading(false);
      setSuccessMsg(res.data?.message || `Password reset link and OTP have been sent to ${email.trim()}.`);
      setResendCooldown(60);
      setStep("VERIFY_OTP");
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(
        err.response?.data?.message || "Unable to send reset instructions. Please verify your email or try again later."
      );
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit OTP received in your email.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.post("/auth/verify-otp", {
        email: email.trim(),
        otp: otp.trim()
      });
      setIsLoading(false);
      setSuccessMsg(res.data?.message || "OTP verified successfully. Please enter your new password.");
      setStep("RESET_PASSWORD");
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    }
  };

  // Step 3: Set New Password & Confirm
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setErrorMsg("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        newPassword,
        confirmPassword
      };

      if (token) {
        payload.token = token;
      }
      if (email) {
        payload.email = email.trim();
      }
      if (otp) {
        payload.otp = otp.trim();
      }

      const res = await api.post("/auth/reset-password", payload);
      setIsLoading(false);
      setSuccessMsg(res.data?.message || "Password reset successfully. Please login with your new password.");
      setStep("SUCCESS");
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.response?.data?.message || "Failed to reset password. Please request a new OTP or reset link.");
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
              {step === "SUCCESS" ? <CheckCircle2 className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {step === "REQUEST_OTP" && "Forgot Password"}
              {step === "VERIFY_OTP" && "Enter Verification OTP"}
              {step === "RESET_PASSWORD" && "Create New Password"}
              {step === "SUCCESS" && "Password Reset Complete"}
            </h1>
            <p className="text-xs text-slate-500">
              {step === "REQUEST_OTP" && "Enter your registered email address to receive a secure OTP"}
              {step === "VERIFY_OTP" && `We sent a 6-digit code to ${email}`}
              {step === "RESET_PASSWORD" && "Enter and confirm your new password"}
              {step === "SUCCESS" && "Your password has been successfully updated"}
            </p>
          </div>

          {/* Stepper indicator */}
          {step !== "SUCCESS" && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === "REQUEST_OTP"
                    ? "w-8 bg-purple-700"
                    : "w-4 bg-purple-200"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === "VERIFY_OTP"
                    ? "w-8 bg-purple-700"
                    : step === "RESET_PASSWORD"
                    ? "w-4 bg-purple-200"
                    : "w-2 bg-slate-200"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === "RESET_PASSWORD"
                    ? "w-8 bg-purple-700"
                    : "w-2 bg-slate-200"
                }`}
              />
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && step !== "SUCCESS" && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === "REQUEST_OTP" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.org"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  A 6-digit verification OTP will be sent to this email address.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? "Sending OTP..." : "Send OTP"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === "VERIFY_OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  6-Digit OTP Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 text-base font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none text-center font-bold text-purple-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                  Check your inbox and spam folder. OTP is valid for 10 minutes.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading || resendCooldown > 0}
                  className={`font-semibold flex items-center gap-1 transition ${
                    resendCooldown > 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-purple-700 hover:underline cursor-pointer"
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setStep("REQUEST_OTP");
                  }}
                  className="text-slate-500 hover:text-slate-700 font-medium"
                >
                  Change Email
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? "Verifying OTP..." : "Verify OTP"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === "RESET_PASSWORD" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 flex items-center gap-2 text-xs text-purple-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <span>{token ? (email ? `Reset Token Verified for ${email}` : "Secure Reset Token Verified") : `OTP Verified for ${email}`}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? "Resetting Password..." : "Reset Password"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS SCREEN */}
          {step === "SUCCESS" && (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <p className="text-sm text-emerald-900 font-bold">
                  Password reset successfully. Please login with your new password.
                </p>
                <p className="text-xs text-emerald-700">
                  You can now use your updated credentials to access SafeServe.
                </p>
              </div>

              <Link
                to="/login"
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};
