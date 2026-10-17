import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { GPSLocationPicker } from "../components/GPSLocationPicker";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import {
  UtensilsCrossed,
  Clock,
  Thermometer,
  Box,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { FoodCategory, StorageCondition, PackagingCondition, SafetyStatus } from "../types";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export const DonorCreateDonationPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [foodName, setFoodName] = useState("");
  const [foodCategory, setFoodCategory] = useState<FoodCategory>("Cooked Meals");
  const [quantity, setQuantity] = useState<number>(30);
  const [unit, setUnit] = useState("Meals");
  const [peopleServed, setPeopleServed] = useState<number>(30);

  const todayStr = new Date().toISOString().split("T")[0];
  const currentTimeStr = new Date().toTimeString().slice(0, 5);

  const tomorrow = new Date(Date.now() + 12 * 3600000);
  const expDateStr = tomorrow.toISOString().split("T")[0];
  const expTimeStr = tomorrow.toTimeString().slice(0, 5);

  const [preparationDate, setPreparationDate] = useState(todayStr);
  const [preparationTime, setPreparationTime] = useState(currentTimeStr);
  const [expiryDate, setExpiryDate] = useState(expDateStr);
  const [expiryTime, setExpiryTime] = useState(expTimeStr);

  const [storageCondition, setStorageCondition] = useState<StorageCondition>("Refrigerated (0-4°C)");
  const [packagingCondition, setPackagingCondition] = useState<PackagingCondition>("Food Grade Airtight Containers");
  const [description, setDescription] = useState("");

  const [pickupAddress, setPickupAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "New Delhi");
  const [state, setState] = useState(user?.state || "Delhi");
  const [latitude, setLatitude] = useState<number>(user?.latitude || 28.6139);
  const [longitude, setLongitude] = useState<number>(user?.longitude || 77.2090);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Safety Assessment Simulator State
  const [liveScore, setLiveScore] = useState<number>(85);
  const [liveStatus, setLiveStatus] = useState<SafetyStatus>("ELIGIBLE");
  const [liveReason, setLiveReason] = useState<string>("Complies with standard FSSAI storage criteria.");
  const [hoursSincePrep, setHoursSincePrep] = useState<number>(2);
  const [hoursUntilExpiry, setHoursUntilExpiry] = useState<number>(10);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Instant Assessment Result Modal
  const [assessmentResult, setAssessmentResult] = useState<{
    score: number;
    status: SafetyStatus;
    reason: string;
    donationId: string;
  } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-time live safety evaluation synced with algorithm
  const evaluateLiveSafety = async () => {
    setIsEvaluating(true);
    const now = new Date();
    const prep = new Date(`${preparationDate}T${preparationTime}:00`);
    const exp = new Date(`${expiryDate}T${expiryTime}:00`);

    const elapsed = Math.max(0, Math.round(((now.getTime() - prep.getTime()) / 3600000) * 10) / 10);
    const remaining = Math.max(0, Math.round(((exp.getTime() - now.getTime()) / 3600000) * 10) / 10);

    setHoursSincePrep(isNaN(elapsed) ? 2 : elapsed);
    setHoursUntilExpiry(isNaN(remaining) ? 10 : remaining);

    try {
      const res = await api.post("/safety/assess", {
        foodCategory,
        storageCondition,
        packagingCondition,
        preparationDate,
        preparationTime,
        expiryDate,
        expiryTime
      });

      if (res.data?.assessment) {
        setLiveScore(res.data.assessment.score);
        setLiveStatus(res.data.assessment.status);
        setLiveReason(res.data.assessment.reason);
      }
    } catch {
      // Local aligned formula
      let score = 100;
      const reasons: string[] = [];

      if (remaining <= 0) {
        setLiveScore(15);
        setLiveStatus("NOT_ELIGIBLE");
        setLiveReason("Food item has passed its declared expiry timestamp.");
        setIsEvaluating(false);
        return;
      }

      if (remaining < 2) {
        score -= 35;
        reasons.push("Critical shelf life: less than 2 hours remaining.");
      } else if (remaining < 4) {
        score -= 20;
        reasons.push("Urgent window: between 2 to 4 hours remaining.");
      } else if (remaining < 8) {
        score -= 8;
        reasons.push("Moderate shelf life window (under 8 hours).");
      }

      if (foodCategory === "Cooked Meals") {
        if (storageCondition === "Room Temperature") {
          score -= 25;
          reasons.push("Cooked meals stored at ambient temperature carry elevated bacterial risk.");
        }
      } else if (foodCategory === "Dairy Products") {
        if (!storageCondition.includes("Refrigerated") && !storageCondition.includes("Frozen")) {
          score -= 35;
          reasons.push("Dairy products require refrigeration to prevent rapid spoilage.");
        }
      }

      if (packagingCondition === "Partially Damaged / Opened") {
        score -= 40;
        reasons.push("Damaged packaging risks contamination.");
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

      setLiveScore(score);
      setLiveStatus(status);
      setLiveReason(reasons.length > 0 ? reasons.join("; ") : "Food meets all cold-chain and packaging integrity criteria.");
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    evaluateLiveSafety();
  }, [foodCategory, storageCondition, packagingCondition, preparationDate, preparationTime, expiryDate, expiryTime]);

  const handleInstantVerify = async () => {
    try {
      await api.patch("/users/self/verify-demo");
      if (refreshProfile) await refreshProfile();
      setErrorMsg(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!foodName || !quantity || !pickupAddress) {
      setErrorMsg("Please fill in the food name, quantity, and pickup address.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("foodName", foodName);
      formData.append("foodCategory", foodCategory);
      formData.append("quantity", String(quantity));
      formData.append("peopleServed", String(peopleServed || quantity));
      formData.append("unit", unit);
      formData.append("preparationDate", preparationDate);
      formData.append("preparationTime", preparationTime);
      formData.append("expiryDate", expiryDate);
      formData.append("expiryTime", expiryTime);
      formData.append("storageCondition", storageCondition);
      formData.append("packagingCondition", packagingCondition);
      formData.append("description", description);
      formData.append("pickupAddress", pickupAddress);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));

      if (imageFile) {
        formData.append("foodImage", imageFile);
        formData.append("image", imageFile);
      } else {
        formData.append("imageUrl", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80");
      }

      const res = await api.post("/donations", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        const d = res.data.donation;
        setAssessmentResult({
          score: d.safetyScore,
          status: d.safetyStatus,
          reason: d.safetyReason || "Evaluated by SafeServe Safety Engine",
          donationId: d._id
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to publish donation.";
      setErrorMsg(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Create Surplus Food Donation"
      subtitle="Enter surplus food specifications for automated safety analysis & rescue dispatch"
    >
      <div className="max-w-4xl mx-auto">
        {user?.status === "PENDING" && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Donor Account Verification Pending Approval</p>
                <p className="text-slate-600">Your KYC documents are in review. In demo mode, click Instant Verify to unlock immediate publishing.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstantVerify}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold whitespace-nowrap shadow-sm transition"
            >
              Instant Verify (Demo Mode)
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
          {/* Section 1: Food Details */}
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <UtensilsCrossed className="w-5 h-5 text-purple-700" />
              <h3 className="font-bold text-sm text-slate-900">1. Food Specifications & Quantity</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Food Item Name / Dish *</label>
                <input
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Steamed Rice, Dal Makhani & Mixed Veg"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Food Category *</label>
                <select
                  value={foodCategory}
                  onChange={(e) => setFoodCategory(e.target.value as FoodCategory)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
                >
                  <option value="Cooked Meals">Cooked Meals (Prepared dishes)</option>
                  <option value="Dairy Products">Dairy Products (Milk, Paneer, Curd)</option>
                  <option value="Baked Goods">Baked Goods (Bread, Pastries)</option>
                  <option value="Fresh Produce">Fresh Produce (Fruits & Vegetables)</option>
                  <option value="Packaged Food">Packaged Food (Sealed staples)</option>
                  <option value="Beverages">Beverages & Juices</option>
                  <option value="Mixed Grocery">Mixed Grocery</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Portion Unit *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="Meals">Meals / Servings</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="Boxes">Standard Boxes</option>
                    <option value="Packets">Sealed Packets</option>
                    <option value="Liters">Liters</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">People Served *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={peopleServed}
                    onChange={(e) => setPeopleServed(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Allergen Advisories</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Vegetarian only. No peanuts. Prepared at 4 PM in commercial kitchen."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Preparation & Temperature */}
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Thermometer className="w-5 h-5 text-purple-700" />
              <h3 className="font-bold text-sm text-slate-900">2. Safety Timestamps & Preservation Environment</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Preparation Date & Time *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    value={preparationDate}
                    onChange={(e) => setPreparationDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <input
                    type="time"
                    required
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Safe Expiry / Best Before *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <input
                    type="time"
                    required
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Storage Condition *</label>
                <select
                  value={storageCondition}
                  onChange={(e) => setStorageCondition(e.target.value as StorageCondition)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
                >
                  <option value="Refrigerated (0-4°C)">Refrigerated (0-4°C)</option>
                  <option value="Frozen (< -18°C)">Frozen (&lt; -18°C)</option>
                  <option value="Hot Held (> 60°C)">Hot Held (&gt; 60°C)</option>
                  <option value="Room Temperature">Room Temperature</option>
                  <option value="Dry & Cool">Dry &amp; Cool</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Packaging Integrity *</label>
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
            </div>
          </div>

          {/* Embedded Interactive Safety Assessment Simulator */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h4 className="font-black text-base tracking-tight">Interactive Safety Assessment Simulator</h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Test real parameters against the SafeServe safety algorithm in real time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => evaluateLiveSafety()}
                disabled={isEvaluating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEvaluating ? "Evaluating..." : "Evaluate Safety Score"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 text-[11px] block">Food Category</span>
                    <span className="font-bold text-white text-xs">{foodCategory}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 text-[11px] block">Storage Condition</span>
                    <span className="font-bold text-white text-xs">{storageCondition}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 text-[11px] block">Packaging Integrity</span>
                    <span className="font-bold text-white text-xs">{packagingCondition}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 text-[11px] block">Elapsed Time Since Preparation</span>
                    <span className="font-bold text-white text-xs">{hoursSincePrep} Hours</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 text-[11px]">Safe Consumption Window Remaining</span>
                    <span className="font-mono font-bold text-purple-400">{hoursUntilExpiry} Hours</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hoursUntilExpiry < 2 ? "bg-rose-500" : hoursUntilExpiry < 6 ? "bg-amber-400" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, (hoursUntilExpiry / 24) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Score Display */}
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 text-center space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">Safety Score</span>
                <div className="text-4xl font-black text-purple-400 tracking-tight">
                  {liveScore}<span className="text-lg text-slate-500 font-normal">/100</span>
                </div>
                <div className="pt-1">
                  {liveStatus === "ELIGIBLE" && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800">
                      ELIGIBLE FOR RESCUE
                    </span>
                  )}
                  {liveStatus === "REVIEW_REQUIRED" && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800">
                      REVIEW REQUIRED
                    </span>
                  )}
                  {liveStatus === "NOT_ELIGIBLE" && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800">
                      NOT ELIGIBLE
                    </span>
                  )}
                  {liveStatus === "EXPIRED" && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800">
                      EXPIRED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 text-left line-clamp-2 mt-1">
                  {liveReason}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Photo Verification */}
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ImageIcon className="w-5 h-5 text-purple-700" />
              <h3 className="font-bold text-sm text-slate-900">3. Food Quality Photo (Mandatory / Recommended)</h3>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload crisp image of food containers for safety review.
                </p>
              </div>

              {imagePreview && (
                <div className="w-32 h-24 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Geolocation & Address */}
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-purple-700" />
              <h3 className="font-bold text-sm text-slate-900">4. Pickup Location & Geofence Coordinates</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Pickup Street Address *</label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. Banquet Loading Dock, Rear Entrance, Hotel Taj"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <GPSLocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  onChange={(c) => {
                    setLatitude(c.latitude);
                    setLongitude(c.longitude);
                  }}
                  label="Pickup Geofence Coordinates (Checked during Volunteer OTP Verification)"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? "Evaluating Safety & Publishing..." : "Publish Food Donation"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Assessment Success Modal */}
      {assessmentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-purple-700" />
            </div>

            <h3 className="text-lg font-black text-slate-900">Donation Successfully Logged!</h3>
            <p className="text-xs text-slate-500">
              SafeServe Algorithmic Safety Engine assessed this batch in real time.
            </p>

            <div className="py-2">
              <SafetyScoreBadge
                score={assessmentResult.score}
                status={assessmentResult.status}
                reason={assessmentResult.reason}
                size="lg"
              />
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/donor/donations")}
                className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition"
              >
                Go to My Donations
              </button>
              <button
                type="button"
                onClick={() => navigate(`/donor/track/${assessmentResult.donationId}`)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                View Live Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
