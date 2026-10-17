import React, { useState } from "react";
import { X, ScanQrCode, Camera, Check, Sparkles } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (token: string) => void;
  title?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scan SafeServe QR Code"
}) => {
  const [manualToken, setManualToken] = useState("");

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      onScanSuccess(manualToken.trim());
    }
  };

  const handleQuickPreset = (preset: string) => {
    onScanSuccess(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
          <ScanQrCode className="w-3.5 h-3.5" />
          <span>Optical Scanner</span>
        </div>

        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">
          Position the SafeServe QR pass in front of your camera or enter the pass token.
        </p>

        {/* Animated Viewfinder */}
        <div className="relative w-48 h-48 mx-auto bg-slate-950 rounded-2xl border-2 border-purple-500 overflow-hidden flex items-center justify-center shadow-inner">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Camera className="w-8 h-8 opacity-40 animate-pulse text-purple-400" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              Camera Active
            </span>
          </div>

          {/* Corner Guides */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400" />

          {/* Laser animation */}
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce shadow-md shadow-amber-400" />
        </div>

        {/* Quick Demo Scan Presets */}
        <div className="space-y-1.5 text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Simulate Instant Camera Read:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickPreset("SAFESERVE-DONOR-PASS-7720")}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold rounded-lg border border-purple-200 transition"
            >
              ⚡ Donor Pickup Pass
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("SAFESERVE-NGO-RECEIPT-9104")}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-lg border border-emerald-200 transition"
            >
              ⚡ NGO Delivery Receipt
            </button>
          </div>
        </div>

        {/* Manual String Form */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Or enter token manually..."
              className="flex-1 text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!manualToken.trim()}
              className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
