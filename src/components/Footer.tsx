import React from "react";
import { Link } from "react-router-dom";
import { Shield, Heart, Terminal, Lock } from "lucide-react";

export const Footer: React.FC<{ onOpenPostman?: () => void }> = ({ onOpenPostman }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">SafeServe</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart Food Rescue & Safety Management Platform. Uniting certified food donors, verified NGOs, and vetted volunteers with multi-factor QR/OTP/GPS verification and rule-based safety evaluation.
            </p>
            <p className="text-xs font-semibold text-purple-400 italic">
              "Rescue Surplus Food. Deliver Hope."
            </p>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Rescue Platform</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-purple-400 transition">Home Overview</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-purple-400 transition">How It Works</Link>
              </li>
              <li>
                <Link to="/food-safety" className="hover:text-purple-400 transition">Food Safety Assessment</Link>
              </li>
              <li>
                <Link to="/rescue-process" className="hover:text-purple-400 transition">Rescue Operations Flow</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-purple-400 transition">About Architecture</Link>
              </li>
            </ul>
          </div>

          {/* User Portals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Operations Portals</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/login" className="hover:text-purple-400 transition">Standard Sign In</Link>
              </li>
              <li>
                <Link to="/register/donor" className="hover:text-purple-400 transition">Food Donor Registration</Link>
              </li>
              <li>
                <Link to="/register/ngo" className="hover:text-purple-400 transition">NGO Organization Registration</Link>
              </li>
              <li>
                <Link to="/register/volunteer" className="hover:text-purple-400 transition">Volunteer Courier Registration</Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  Admin Command Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Technical & Compliance */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Developer & Security</h4>
            <p className="text-xs text-slate-400 mb-3">
              Compliant MERN stack architecture with JWT, bcrypt, QR/OTP/GPS multi-factor verification, and rule-based safety screening.
            </p>
            {onOpenPostman && (
              <button
                onClick={onOpenPostman}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-purple-300 border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Terminal className="w-4 h-4 text-purple-400" />
                Postman REST API Specs
              </button>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} SafeServe Platform. All rights reserved. Zero-food-waste initiative.
          </div>
          <div className="flex items-center gap-6">
            <span className="text-slate-400">Privacy Policy</span>
            <span className="text-slate-400">Terms of Service</span>
            <span className="text-slate-400">Food Safety Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
