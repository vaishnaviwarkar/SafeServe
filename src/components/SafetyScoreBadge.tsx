import React from "react";
import { ShieldCheck, AlertTriangle, XCircle, Clock } from "lucide-react";
import { SafetyStatus } from "../types";

interface SafetyScoreBadgeProps {
  score: number;
  status: SafetyStatus;
  reason?: string;
  size?: "sm" | "md" | "lg";
}

export const SafetyScoreBadge: React.FC<SafetyScoreBadgeProps> = ({
  score,
  status,
  reason,
  size = "md"
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case "ELIGIBLE":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
          icon: ShieldCheck,
          label: "ELIGIBLE",
          color: "text-emerald-700"
        };
      case "REVIEW_REQUIRED":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          icon: AlertTriangle,
          label: "REVIEW REQUIRED",
          color: "text-amber-700"
        };
      case "NOT_ELIGIBLE":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-800",
          icon: XCircle,
          label: "NOT ELIGIBLE",
          color: "text-rose-700"
        };
      case "EXPIRED":
        return {
          bg: "bg-red-950 border-red-800 text-red-200",
          icon: Clock,
          label: "EXPIRED",
          color: "text-red-400"
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-200 text-slate-700",
          icon: ShieldCheck,
          label: "PENDING REVIEW",
          color: "text-slate-600"
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${config.bg}`}>
        <Icon className="w-3 h-3 shrink-0" />
        <span>{score}/100</span>
        <span className="opacity-70">({config.label})</span>
      </span>
    );
  }

  return (
    <div className={`p-3 rounded-xl border ${config.bg} flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 shrink-0" />
          <span className="font-extrabold text-sm uppercase tracking-wide">{config.label}</span>
        </div>
        <span className="text-lg font-black">{score}/100</span>
      </div>
      {reason && (
        <p className="text-xs opacity-90 leading-relaxed mt-1">
          {reason}
        </p>
      )}
    </div>
  );
};
