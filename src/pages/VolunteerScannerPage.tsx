import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { QRScannerModal } from "../components/QRScannerModal";
import { ScanQrCode, QrCode, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../services/api";

export const VolunteerScannerPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(true);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleVerify = async (token: string) => {
    setIsVerifying(true);
    setFeedback(null);
    setScannedResult(token);

    try {
      // Look up or verify rescue with this token
      const res = await api.get(`/rescues/verify-token/${token}`).catch(() => null);
      if (res?.data?.rescue) {
        setFeedback({
          type: "success",
          text: `Consignment identified: ${res.data.rescue.donation?.foodName || "Surplus Batch"}. Now ask the donor for the Pickup OTP and enter it in Active Mission.`
        });
      } else {
        setFeedback({ type: "error", text: "QR token could not be matched to an active consignment." });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Could not validate QR verification token."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <DashboardLayout
      title="Universal QR Scanner & Token Validator"
      subtitle="Verify pickup passes, consignments, and delivery arrival QR codes on mobile or desktop"
    >
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-md shadow-purple-100">
            <ScanQrCode className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900">Scan QR Code Token</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Use your device camera or input the manual verification string from the donor or receiving NGO pass.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-purple-200"
            >
              <ScanQrCode className="w-4 h-4" />
              <span>Launch Camera QR Scanner</span>
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold">Or Enter Manual Token</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="e.g. SAFESERVE-f94a821e"
              className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleVerify(manualToken)}
              disabled={!manualToken || isVerifying}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              Verify
            </button>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 text-left ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>
      </div>

      <QRScannerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onScanSuccess={(tok) => {
          setModalOpen(false);
          handleVerify(tok);
        }}
        title="SafeServe QR Optical Scanner"
      />
    </DashboardLayout>
  );
};
