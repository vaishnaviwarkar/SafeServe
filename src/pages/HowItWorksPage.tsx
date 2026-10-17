import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PostmanModal } from "../components/PostmanModal";
import {
  ShieldCheck,
  Building2,
  HeartHandshake,
  Bike,
  QrCode,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export const HowItWorksPage: React.FC = () => {
  const [showPostman, setShowPostman] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Platform Mechanics</span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              How SafeServe Works
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              A transparent, closed-loop food recovery ecosystem engineered for commercial donors, non-profit distribution hubs, and volunteer dispatch.
            </p>
          </div>
        </div>

        {/* 3 Pillars: Donor, NGO, Volunteer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Donor */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">1. Certified Donors</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hotels, cloud kitchens, grocery chains, and event venues list excess prepared or packaged food. The system prompts for prep time, temperature holding, storage container types, and exact GPS coordinates.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero-cost tax deductible surplus logging</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant automated food safety scoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified pickup OTP handoff protection</span>
                </li>
              </ul>
              <div className="pt-4">
                <Link
                  to="/register/donor"
                  className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold text-center block transition"
                >
                  Register As Donor
                </Link>
              </div>
            </div>

            {/* NGO */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">2. Verified NGOs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Charity shelters, soup kitchens, and orphanages get matched in real time with nearby donations that match their capacity and dietary needs. NGOs confirm incoming meals and verify arrivals via QR scan.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Proximity & capacity based smart claims</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Emergency broadcast requisition tool</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Delivery verification with GPS validation</span>
                </li>
              </ul>
              <div className="pt-4">
                <Link
                  to="/register/ngo"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold text-center block transition"
                >
                  Register As NGO
                </Link>
              </div>
            </div>

            {/* Volunteer */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">3. Vetted Volunteers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Community couriers receive instant route notifications. Volunteers accept pickup tasks, navigate to the donor location, verify OTP, and transport food in hygienic conditions to the designated NGO.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Flexible route and task claiming</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Built-in QR scanner & OTP input</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Trust score & impact badge earnings</span>
                </li>
              </ul>
              <div className="pt-4">
                <Link
                  to="/register/volunteer"
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold text-center block transition"
                >
                  Register As Volunteer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenPostman={() => setShowPostman(true)} />
      <PostmanModal isOpen={showPostman} onClose={() => setShowPostman(false)} />
    </div>
  );
};
