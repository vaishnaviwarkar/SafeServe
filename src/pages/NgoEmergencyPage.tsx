import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Flame,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Send,
  Sparkles
} from "lucide-react";
import { EmergencyRequest } from "../types";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export const NgoEmergencyPage: React.FC = () => {
  const { user } = useAuth();

  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form
  const [requiredFood, setRequiredFood] = useState("");
  const [requiredQuantity, setRequiredQuantity] = useState<number>(50);
  const [unit, setUnit] = useState("Meals");
  const [urgency, setUrgency] = useState<"HIGH" | "CRITICAL">("HIGH");
  const [deadlineHours, setDeadlineHours] = useState<number>(4);
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState(user?.address || "Shelter Center, Delhi");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmergencyRequests();
  }, []);

  const fetchEmergencyRequests = async () => {
    try {
      const res = await api.get("/emergency");
      if (res.data?.requests) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setMsg(null);

    if (!requiredFood || !requiredQuantity || !reason) {
      setFormError("Please fill in all required emergency requisition details.");
      return;
    }

    setIsSubmitting(true);

    const deadline = new Date(Date.now() + deadlineHours * 3600000).toISOString();

    try {
      const res = await api.post("/emergency", {
        requiredFood,
        quantity: requiredQuantity,
        requiredQuantity,
        unit,
        urgency,
        location: location || user?.address || "Shelter Center, Delhi",
        requiredTime: deadline,
        deadline,
        description: reason,
        reason
      });

      if (res.data?.success) {
        setMsg("Emergency requisition broadcasted to all active food donors in your sector!");
        setShowForm(false);
        setRequiredFood("");
        setReason("");
        fetchEmergencyRequests();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to post emergency request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Emergency Food Requisitions"
      subtitle="Broadcast critical shortage alerts to commercial kitchens, catering networks & local donors"
      actions={
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Flame className="w-4 h-4" />
          <span>{showForm ? "Cancel Broadcast" : "Post Emergency Need"}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {msg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {/* Emergency Broadcast Form */}
        {showForm && (
          <form
            onSubmit={handleCreateEmergency}
            className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Broadcast High-Priority Requisition</h3>
                <p className="text-xs text-slate-500">
                  Direct SMS & push notifications are dispatched to nearby commercial donors.
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Required Food Type / Items *</label>
                <input
                  type="text"
                  required
                  value={requiredFood}
                  onChange={(e) => setRequiredFood(e.target.value)}
                  placeholder="e.g. Prepared hot meals or cooked rice / chapati / lentils"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Delivery / Distribution Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Shelter #4, Near Anand Vihar Terminal, Delhi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Urgency Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as "HIGH" | "CRITICAL")}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-rose-800 focus:ring-2 focus:ring-rose-500"
                >
                  <option value="HIGH">HIGH (Needed within 6 hours)</option>
                  <option value="CRITICAL">CRITICAL (Needed within 2-3 hours)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Required Quantity</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={requiredQuantity}
                    onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Meals">Meals</option>
                    <option value="kg">kg</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Required By Window: Within {deadlineHours} Hours
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={deadlineHours}
                  onChange={(e) => setDeadlineHours(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Reason / Situation Detail *</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Unexpected arrival of 40 displaced families at night shelter. Kitchen ran out of supplies."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Broadcasting..." : "Broadcast Requisition"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Existing Requisitions List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Active Emergency Requisitions</h3>
            <p className="text-xs text-slate-500">Network-wide priority broadcasts requiring rapid response</p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading requisitions...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Flame className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">No active emergency requisitions</h4>
              <p className="text-xs text-slate-500">All local shelters currently report normal supply levels.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((r) => (
                <div key={r._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{r.requiredFood}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          r.urgency === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.urgency}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Required: <strong className="font-mono text-slate-900">{r.requiredQuantity} {r.unit}</strong> • Shelter: {r.ngo?.organizationName || r.ngo?.fullName}
                    </p>
                    <p className="text-xs text-slate-500 italic">"{r.reason}"</p>
                  </div>

                  <div className="text-right text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-1 font-mono text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Expires: {new Date(r.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
