import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  AlertTriangle,
  Upload,
  Send,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Clock
} from "lucide-react";
import { RescueRequest } from "../types";
import api from "../services/api";

export const NgoComplaintsPage: React.FC = () => {
  const [rescues, setRescues] = useState<RescueRequest[]>([]);
  const [selectedRescueId, setSelectedRescueId] = useState("");
  const [category, setCategory] = useState("Temperature Abuse (Food Arrived Lukewarm)");
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchRescues();
  }, []);

  const fetchRescues = async () => {
    try {
      const res = await api.get("/rescues/my-ngo");
      if (res.data?.rescues) {
        setRescues(res.data.rescues);
        if (res.data.rescues.length > 0) {
          setSelectedRescueId(res.data.rescues[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!description) {
      setErrorMsg("Please provide details of the incident.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send incident report
      await api.post("/complaints", {
        rescueId: selectedRescueId || undefined,
        category,
        description
      });

      setSuccessMsg("Incident ticket successfully dispatched to Safety Compliance Officers.");
      setDescription("");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Incident & Food Quality Reporting"
      subtitle="Submit formal temperature deviation or hygiene inspection notices for immediate review"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Official Quality Deviation Notice</h3>
              <p className="text-xs text-slate-500">
                Reports are audited against donor and courier records to maintain platform safety.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Related Consignment / Rescue</label>
              <select
                value={selectedRescueId}
                onChange={(e) => setSelectedRescueId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- General Quality / Platform Incident (No specific consignment) --</option>
                {rescues.map((r) => (
                  <option key={r._id} value={r._id}>
                    📦 {r.donation?.foodName || "Food Consignment"} • Status: {r.status} • Donor: {r.donor?.fullName || r.donor?.org || "Commercial Donor"}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Select from your assigned rescue consignments or report an unlisted quality/sanitary incident.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Deviation Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
              >
                <option value="Temperature Abuse (Food Arrived Lukewarm)">
                  Temperature Abuse (Food Arrived Lukewarm)
                </option>
                <option value="Damaged or Unsealed Packaging">Damaged or Unsealed Packaging</option>
                <option value="Spoiled Odor / Sensory Deterioration">
                  Spoiled Odor / Sensory Deterioration
                </option>
                <option value="Significant Transit Delay (> 2 hours)">
                  Significant Transit Delay (&gt; 2 hours)
                </option>
                <option value="Quantity / Dish Discrepancy">Quantity / Dish Discrepancy</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Detailed Incident Description *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe observations upon opening containers, measured temperature if thermometer available, etc."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-amber-200 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting Incident..." : "Submit Incident Report"}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
