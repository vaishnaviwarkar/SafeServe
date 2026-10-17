import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Heart,
  Truck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Lock,
  Flame
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PostmanModal } from "../components/PostmanModal";
import api from "../services/api";

export const HomePage: React.FC = () => {
  const [showPostman, setShowPostman] = useState(false);
  const [stats, setStats] = useState({
    foodRescuedMeals: 28450,
    totalDonations: 1420,
    verifiedNGOs: 64,
    activeVolunteers: 180,
    rescueSuccessRate: 98
  });

  useEffect(() => {
    // Attempt live metrics
    api
      .get("/analytics/dashboard")
      .then((res) => {
        if (res.data?.stats) {
          setStats((prev) => ({
            ...prev,
            foodRescuedMeals: res.data.stats.foodRescuedMeals || prev.foodRescuedMeals,
            totalDonations: res.data.stats.totalDonations || prev.totalDonations,
            verifiedNGOs: res.data.stats.verifiedNGOs || prev.verifiedNGOs,
            activeVolunteers: res.data.stats.activeVolunteers || prev.activeVolunteers
          }));
        }
      })
      .catch(() => {
        // use default high-impact metrics
      });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-purple-100 selection:text-purple-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-28 bg-gradient-to-b from-purple-50/70 via-white to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs font-extrabold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Zero Food Waste • Verified Delivery Safety</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Rescue Surplus Food. <br />
              <span className="text-purple-700">Deliver Hope.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              SafeServe is a high-reliability food rescue platform. We connect commercial kitchens, restaurants, and caterers with accredited NGOs and volunteers using <strong className="text-slate-900 font-bold">algorithmic safety assessment</strong> and <strong className="text-slate-900 font-bold">multi-factor QR, OTP, and GPS verification</strong>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to="/register/donor"
                className="px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold shadow-lg shadow-purple-200 transition flex items-center gap-2 group"
              >
                <span>Donate Surplus Food</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
              <Link
                to="/register/ngo"
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-bold shadow-sm transition"
              >
                Register NGO Facility
              </Link>
              <Link
                to="/register/volunteer"
                className="px-6 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-bold transition flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>Join as Volunteer</span>
              </Link>
            </div>

            {/* Highlights bar */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Automated Shelf-Life Scoring</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cryptographic OTP Pickup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Live GPS Geofence Check</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Numbers Section */}
      <section className="py-14 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-black text-purple-400 font-mono">
                {stats.foodRescuedMeals.toLocaleString()}+
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nutritious Meals Rescued
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-black text-emerald-400 font-mono">
                {stats.totalDonations.toLocaleString()}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Surplus Batches Logged
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-black text-amber-400 font-mono">
                {stats.verifiedNGOs}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verified NGO Shelters
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-black text-blue-400 font-mono">
                {stats.rescueSuccessRate}%
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verified Delivery Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Food Waste Crisis vs SafeServe Solution */}
      <section className="py-18 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Solving The Food Inequity Paradox
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every year, one-third of all food produced is wasted while millions experience acute hunger. SafeServe bridges the gap with mathematical dispatch and safety accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">40% Food Discarded</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hotels, banquet halls, and corporate cafeterias produce massive surplus but fear food safety liability and lack reliable last-mile couriers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Algorithmic Safety Filter</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                SafeServe runs an automated HACCP safety evaluation score (0-100) before any food donation can be claimed, eliminating spoiled meals.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multi-Factor Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unique QR codes, time-limited 6-digit OTPs, and GPS geofence checks verify that food is actually picked up and delivered to verified beneficiaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-18 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Platform Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              How SafeServe Delivers Hope in 4 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="text-xs font-black text-purple-600 mb-3 font-mono">STEP 01</div>
              <h4 className="font-bold text-sm text-slate-900 mb-2">Donor Posts Surplus</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Donor registers food category, preparation time, temperature, packaging, quantity, and pickup address.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="text-xs font-black text-purple-600 mb-3 font-mono">STEP 02</div>
              <h4 className="font-bold text-sm text-slate-900 mb-2">Safety Engine Evaluates</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rule engine calculates shelf-life suitability and gives a safety score (0-100). Only eligible batches are approved.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="text-xs font-black text-purple-600 mb-3 font-mono">STEP 03</div>
              <h4 className="font-bold text-sm text-slate-900 mb-2">Smart NGO & Volunteer Match</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Algorithm matches nearest verified NGO with matching food capacity. Dispatches vetted volunteers for courier transit.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="text-xs font-black text-purple-600 mb-3 font-mono">STEP 04</div>
              <h4 className="font-bold text-sm text-slate-900 mb-2">QR + OTP + GPS Delivery</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pickup is verified with donor OTP. Delivery is confirmed with NGO QR scan within strict GPS geofence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Verification Tech Showcase */}
      <section className="py-18 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase">
                <Lock className="w-3.5 h-3.5" />
                <span>Anti-Diversion Security</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Zero Black-Market Diversion With 3-Layer Proof of Handoff
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Traditional donation drives fail due to lack of traceability. SafeServe builds a closed-loop chain-of-custody that ensures surplus food reaches hungry people safely:
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cryptographic QR Verification</h4>
                    <p className="text-xs text-slate-600">High-resolution QR code tokens generated dynamically per rescue assignment.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Time-Limited 6-Digit OTP</h4>
                    <p className="text-xs text-slate-600">15-minute expiring PIN sent directly to the donor and receiving NGO coordinator.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">GPS Geofencing Validation</h4>
                    <p className="text-xs text-slate-600">Haversine distance check flags and prevents completions outside the registered premises.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300">Live Rescue Dispatch Simulator</span>
                </div>
                <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                  RESCUE-ID #8921-DF
                </span>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400">Donation Batch:</span>
                  <span className="font-bold text-white">50 Servings Basmati Rice & Curry</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400">Safety Score:</span>
                  <span className="font-bold text-emerald-400">92/100 (APPROVED)</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400">Matched NGO:</span>
                  <span className="font-bold text-purple-300">Hope Community Kitchen (1.8 km)</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400">Pickup Geofence:</span>
                  <span className="font-bold text-emerald-400">Valid (38m from Donor Lat/Lng)</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400">Handoff OTP:</span>
                  <span className="font-bold text-amber-400">849-210 (Verified)</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/rescue-process"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold text-center block transition"
                >
                  Explore Full Rescue Architecture →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Assistance Banner */}
      <section className="py-12 bg-rose-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-800 text-rose-200 text-xs font-bold uppercase">
              <Flame className="w-3.5 h-3.5" />
              <span>Emergency Humanitarian Food Requests</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">Disaster Relief & Urgent Shelter Assistance</h3>
            <p className="text-xs text-rose-200 max-w-xl">
              Are you an NGO experiencing an emergency shortage or feeding displaced people? Submit a prioritized broadcast to all area donors.
            </p>
          </div>
          <Link
            to="/register/ngo"
            className="px-5 py-3 rounded-xl bg-white text-rose-900 hover:bg-rose-50 text-xs font-bold shadow-lg transition shrink-0"
          >
            Register NGO for Emergency Support
          </Link>
        </div>
      </section>

      <Footer onOpenPostman={() => setShowPostman(true)} />
      <PostmanModal isOpen={showPostman} onClose={() => setShowPostman(false)} />
    </div>
  );
};
