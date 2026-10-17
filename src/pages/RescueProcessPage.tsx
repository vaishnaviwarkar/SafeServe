import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PostmanModal } from "../components/PostmanModal";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Bike,
  CalendarClock,
  ScanQrCode,
  Truck,
  PackageCheck,
  HeartHandshake
} from "lucide-react";

export const RescueProcessPage: React.FC = () => {
  const [showPostman, setShowPostman] = useState(false);

  const steps = [
    {
      num: "01",
      title: "Donation Listing",
      icon: FileText,
      desc: "Donor enters food parameters, quantity, storage mode, and pickup geocoordinates."
    },
    {
      num: "02",
      title: "Automated Safety Evaluation",
      icon: ShieldCheck,
      desc: "Algorithmic safety score (0-100) calculated. Unsafe batches automatically flagged or rejected."
    },
    {
      num: "03",
      title: "Administrative Approval",
      icon: CheckCircle2,
      desc: "Compliance team verifies donor credentials and approves verified lots for network dispatch."
    },
    {
      num: "04",
      title: "Proximity & Capacity NGO Match",
      icon: Building2,
      desc: "Algorithm computes closest NGOs with verified refrigeration capacity and matches batch."
    },
    {
      num: "05",
      title: "Volunteer Courier Assignment",
      icon: Bike,
      desc: "Task published to nearby active volunteer couriers based on transit mode and availability."
    },
    {
      num: "06",
      title: "Secure Pickup Scheduling",
      icon: CalendarClock,
      desc: "System generates a high-resolution QR verification token and 15-minute expiring OTP."
    },
    {
      num: "07",
      title: "Multi-Factor Pickup Verification",
      icon: ScanQrCode,
      desc: "Courier arrives, scans QR or donor validates OTP. Browser GPS verifies courier is within 500m geofence."
    },
    {
      num: "08",
      title: "Hygienic Transit Monitoring",
      icon: Truck,
      desc: "Status updates to 'In Transit'. Real-time timestamp logging prevents route delays."
    },
    {
      num: "09",
      title: "Delivery Hand-off Verification",
      icon: PackageCheck,
      desc: "Receiving NGO inspects food, inputs Delivery OTP, and verifies coordinates at shelter entrance."
    },
    {
      num: "10",
      title: "Community Distribution & Trust Update",
      icon: HeartHandshake,
      desc: "Meals served to beneficiaries. Trust scores incremented (+2 donor, +2 NGO, +3 courier)."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="bg-white border-b border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Operational Integrity</span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              The SafeServe Rescue Protocol
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              10 sequential custody checkpoints guaranteeing food hygiene, accurate inventory accountability, and zero black-market diversion.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black font-mono text-purple-700">{step.num}</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer onOpenPostman={() => setShowPostman(true)} />
      <PostmanModal isOpen={showPostman} onClose={() => setShowPostman(false)} />
    </div>
  );
};
