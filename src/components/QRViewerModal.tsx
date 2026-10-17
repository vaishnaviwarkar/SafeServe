import React from "react";
import { X, QrCode, Copy, Check, Download, ShieldCheck } from "lucide-react";

interface QRViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeImage?: string;
  verificationToken: string;
  rescueTitle?: string;
  stepType?: "PICKUP" | "DELIVERY";
}

export const QRViewerModal: React.FC<QRViewerModalProps> = ({
  isOpen,
  onClose,
  qrCodeImage,
  verificationToken,
  rescueTitle = "Food Rescue Verification",
  stepType = "PICKUP"
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{stepType} VERIFICATION PASS</span>
        </div>

        <h3 className="text-lg font-black text-slate-900">{rescueTitle}</h3>
        <p className="text-xs text-slate-500">
          Present this QR code to the verified courier/NGO at the pickup/delivery checkpoint.
        </p>

        {/* QR Code Canvas */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
          {qrCodeImage ? (
            <img
              src={qrCodeImage}
              alt="SafeServe Verification QR"
              className="w-48 h-48 mx-auto object-contain"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400">
              <QrCode className="w-16 h-16 animate-pulse" />
            </div>
          )}
        </div>

        {/* Verification Token */}
        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Digital Token</span>
            <span className="text-xs font-mono font-bold text-slate-900 truncate block max-w-[200px]">
              {verificationToken}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 bg-white hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 transition"
            title="Copy token"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 leading-tight">
          Cryptographically signed token verified against SafeServe secure rescue registry.
        </p>
      </div>
    </div>
  );
};
