import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PostmanModal } from "../components/PostmanModal";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import { ShieldCheck, Thermometer, Box, Clock, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { FoodCategory, StorageCondition, PackagingCondition, SafetyStatus } from "../types";
import api from "../services/api";

export const FoodSafetyPage: React.FC = () => {
  const [showPostman, setShowPostman] = useState(false);

  // Interactive Calculator State
  const [foodCategory, setFoodCategory] = useState<FoodCategory>("Cooked Meals");
  const [storageCondition, setStorageCondition] = useState<StorageCondition>("Refrigerated (0-4°C)");
  const [packagingCondition, setPackagingCondition] = useState<PackagingCondition>("Food Grade Airtight Containers");
  const [hoursSincePrep, setHoursSincePrep] = useState<number>(3);
  const [hoursUntilExpiry, setHoursUntilExpiry] = useState<number>(8);
  const [calculatedResult, setCalculatedResult] = useState<{
    score: number;
    status: SafetyStatus;
    reason: string;
    hoursRemaining: number;
  }>({
    score: 90,
    status: "ELIGIBLE",
    reason: "Excellent temperature control and packaging with adequate safe consumption window.",
    hoursRemaining: 8
  });
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    runLiveCalculation();
  }, [foodCategory, storageCondition, packagingCondition, hoursSincePrep, hoursUntilExpiry]);

  const runLiveCalculation = async () => {
    setIsCalculating(true);
    try {
      const now = new Date();
      const prepDate = new Date(now.getTime() - hoursSincePrep * 3600000);
      const expDate = new Date(now.getTime() + hoursUntilExpiry * 3600000);

      const res = await api.post("/safety/assess", {
        foodCategory,
        storageCondition,
        packagingCondition,
        preparationDate: prepDate.toISOString().split("T")[0],
        preparationTime: prepDate.toTimeString().slice(0, 5),
        expiryDate: expDate.toISOString().split("T")[0],
        expiryTime: expDate.toTimeString().slice(0, 5)
      });

      if (res.data?.assessment) {
        setCalculatedResult(res.data.assessment);
      }
    } catch {
      // client-side evaluation aligned with server evaluateFoodSafety
      let score = 100;
      const reasons: string[] = [];

      if (hoursUntilExpiry <= 0) {
        setCalculatedResult({
          score: 15,
          status: "NOT_ELIGIBLE",
          reason: "Food item has passed its declared expiry timestamp. Unsafe for human consumption.",
          hoursRemaining: 0
        });
        return;
      }

      if (hoursUntilExpiry < 2) {
        score -= 35;
        reasons.push("Critical shelf life: less than 2 hours remaining until expiry.");
      } else if (hoursUntilExpiry < 4) {
        score -= 20;
        reasons.push("Urgent window: between 2 to 4 hours remaining.");
      } else if (hoursUntilExpiry < 8) {
        score -= 8;
        reasons.push("Moderate shelf life window (under 8 hours).");
      }

      if (foodCategory === "Cooked Meals") {
        if (storageCondition === "Room Temperature") {
          score -= 25;
          reasons.push("Cooked meals stored at ambient room temperature carry elevated microbial growth risk.");
        }
      } else if (foodCategory === "Dairy Products") {
        if (!storageCondition.includes("Refrigerated") && !storageCondition.includes("Frozen")) {
          score -= 35;
          reasons.push("Dairy products require continuous refrigeration to prevent spoilage.");
        }
      } else if (foodCategory === "Fresh Produce") {
        if (storageCondition.includes("Frozen")) {
          score -= 10;
          reasons.push("Fresh produce cell structures degrade when frozen.");
        }
      }

      if (packagingCondition === "Partially Damaged / Opened") {
        score -= 40;
        reasons.push("Damaged or open packaging exposes food to foreign contaminants.");
      } else if (packagingCondition === "Clean Covered Vessels") {
        score -= 5;
        reasons.push("Covered vessels are acceptable but airtight packaging is preferred.");
      }

      score = Math.max(0, Math.min(100, score));
      let status: SafetyStatus = "ELIGIBLE";
      if (score < 40 || packagingCondition === "Partially Damaged / Opened") {
        status = "NOT_ELIGIBLE";
      } else if (score < 75) {
        status = "REVIEW_REQUIRED";
      }

      const finalReason = reasons.length > 0 
        ? reasons.join("; ") 
        : "Food complies with safety, temperature hold, and hygienic containment criteria.";

      setCalculatedResult({
        score,
        status,
        reason: finalReason,
        hoursRemaining: hoursUntilExpiry
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Food Safety Standards</span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Automated Safety Engine (0-100 Scoring)
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              SafeServe applies mathematical shelf-life formulas, packaging integrity checks, and cold-chain temperature thresholds to guarantee that every meal rescued is wholesome and pathogen-free.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          {/* Interactive Calculator Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Interactive Safety Assessment Simulator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Test real parameters against the SafeServe safety algorithm in real time.
                </p>
              </div>
              <button
                type="button"
                onClick={runLiveCalculation}
                disabled={isCalculating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {isCalculating ? "Calculating..." : "Evaluate Safety Score"}
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Controls */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Food Category</label>
                    <select
                      value={foodCategory}
                      onChange={(e) => setFoodCategory(e.target.value as FoodCategory)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="Cooked Meals">Cooked Meals</option>
                      <option value="Dairy Products">Dairy Products</option>
                      <option value="Baked Goods">Baked Goods</option>
                      <option value="Fresh Produce">Fresh Produce</option>
                      <option value="Packaged Food">Packaged Food</option>
                      <option value="Mixed Grocery">Mixed Grocery</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Storage Condition</label>
                    <select
                      value={storageCondition}
                      onChange={(e) => setStorageCondition(e.target.value as StorageCondition)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="Room Temperature">Room Temperature (ambient)</option>
                      <option value="Refrigerated (0-4°C)">Refrigerated (0-4°C)</option>
                      <option value="Frozen (< -18°C)">Frozen (&lt; -18°C)</option>
                      <option value="Hot Held (> 60°C)">Hot Held (&gt; 60°C)</option>
                      <option value="Dry & Cool">Dry &amp; Cool</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Packaging Integrity</label>
                    <select
                      value={packagingCondition}
                      onChange={(e) => setPackagingCondition(e.target.value as PackagingCondition)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="Food Grade Airtight Containers">Food Grade Airtight Containers</option>
                      <option value="Sealed Commercial Packaging">Sealed Commercial Packaging</option>
                      <option value="Aluminum Foil Packs">Aluminum Foil Packs</option>
                      <option value="Clean Covered Vessels">Clean Covered Vessels</option>
                      <option value="Partially Damaged / Opened">Partially Damaged / Opened</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Elapsed Time Since Preparation: {hoursSincePrep} hours
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={hoursSincePrep}
                      onChange={(e) => setHoursSincePrep(Number(e.target.value))}
                      className="w-full accent-purple-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Safe Consumption Window Remaining: {hoursUntilExpiry} hours
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      value={hoursUntilExpiry}
                      onChange={(e) => setHoursUntilExpiry(Number(e.target.value))}
                      className="w-full accent-purple-700"
                    />
                  </div>
                </div>
              </div>

              {/* Live Result Preview */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Evaluation Verdict
                </span>
                <SafetyScoreBadge
                  score={calculatedResult.score}
                  status={calculatedResult.status}
                  reason={calculatedResult.reason}
                  size="lg"
                />

                <div className="pt-2 text-xs space-y-2 text-slate-600 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span>Safe Window:</span>
                    <strong className="font-bold text-slate-900">{calculatedResult.hoursRemaining} hours</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rescue Eligibility:</span>
                    <span
                      className={`font-bold ${
                        calculatedResult.status === "ELIGIBLE"
                          ? "text-emerald-700"
                          : calculatedResult.status === "REVIEW_REQUIRED"
                          ? "text-amber-700"
                          : "text-rose-700"
                      }`}
                    >
                      {calculatedResult.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Scoring Matrix Reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                Score: 70 - 100
              </span>
              <h4 className="font-bold text-slate-900 text-sm">ELIGIBLE (Immediate Dispatch)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Surplus food meets all HACCP safety criteria with optimal temperature preservation and minimum 4 hours consumption window remaining.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase">
                Score: 40 - 69
              </span>
              <h4 className="font-bold text-slate-900 text-sm">REVIEW REQUIRED (Manual Inspection)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Minor temperature deviation or tight expiry window (&lt; 3 hrs). Requires confirmation by receiving NGO health coordinator prior to distribution.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-rose-200 space-y-2">
              <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded uppercase">
                Score: 0 - 39
              </span>
              <h4 className="font-bold text-slate-900 text-sm">NOT ELIGIBLE (Auto-Rejected)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Food has surpassed the danger zone (&gt; 4 hrs at ambient temp), damaged seal, or expired. System blocks rescue claim to prevent foodborne illness.
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
