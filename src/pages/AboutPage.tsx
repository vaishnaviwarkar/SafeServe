import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PostmanModal } from "../components/PostmanModal";
import { Shield, Database, Lock, CheckCircle2, Cpu, FileCheck } from "lucide-react";

export const AboutPage: React.FC = () => {
  const [showPostman, setShowPostman] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="bg-white border-b border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">About SafeServe</span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Engineering A Hunger-Free & Waste-Free Future
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              SafeServe is a mission-critical platform engineered to turn urban surplus into reliable nutrition through rigorous safety logic and transparent technology.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">MERN Stack Architecture</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Built with MongoDB/Mongoose with a resilient offline/file-based fallback engine, Express 4.x REST endpoints, React 18, and Node.js. High availability and enterprise reliability.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Multi-Factor Geofencing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevents fraud and diversion through triple validation: QR verification tokens, 15-minute expiring cryptographic OTPs, and Haversine GPS proximity geofences.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Rule-Based Safety Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enforces HACCP safety protocols, checking storage mode, preparation timestamp, safe consumption window, and packaging integrity before any surplus can be claimed.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenPostman={() => setShowPostman(true)} />
      <PostmanModal isOpen={showPostman} onClose={() => setShowPostman(false)} />
    </div>
  );
};
