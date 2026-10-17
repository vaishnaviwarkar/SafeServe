import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import {
  UtensilsCrossed,
  Search,
  Filter,
  MapPin,
  Clock,
  Thermometer,
  Box,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { FoodDonation } from "../types";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export const NgoDonationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchAvailableDonations();
  }, []);

  const fetchAvailableDonations = async () => {
    try {
      const res = await api.get("/donations/available");
      if (res.data?.donations) {
        setDonations(res.data.donations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async (donationId: string) => {
    setClaimingId(donationId);
    setMsg(null);

    try {
      const res = await api.post("/rescues/claim", { donationId });
      if (res.data?.success) {
        setMsg({
          type: "success",
          text: "Donation successfully claimed! It has been added to your incoming rescue queue."
        });
        // Remove from available list
        setDonations((prev) => prev.filter((d) => d._id !== donationId));
      }
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to claim donation."
      });
    } finally {
      setClaimingId(null);
    }
  };

  // Distance helper (Haversine in km)
  const computeDistanceKm = (dLat: number, dLon: number) => {
    if (!user?.latitude || !user?.longitude || !dLat || !dLon) return null;
    const R = 6371;
    const dLatRad = ((dLat - user.latitude) * Math.PI) / 180;
    const dLonRad = ((dLon - user.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos((user.latitude * Math.PI) / 180) *
        Math.cos((dLat * Math.PI) / 180) *
        Math.sin(dLonRad / 2) *
        Math.sin(dLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const filtered = donations.filter((d) => {
    const matchesCategory = selectedCategory === "ALL" || d.foodCategory === selectedCategory;
    const foodName = (d.foodName || "").toLowerCase();
    const pickupAddress = (d.pickupAddress || "").toLowerCase();
    const donorName = (d.donor?.organizationName || d.donor?.fullName || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      foodName.includes(query) ||
      pickupAddress.includes(query) ||
      donorName.includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <DashboardLayout
      title="Surplus Food Market for Verified Shelters"
      subtitle="Claim certified, safe surplus meals from nearby donors based on capacity and dietary fit"
    >
      {msg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-2 mb-6 ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{msg.text}</span>
          </div>
          {msg.type === "success" && (
            <Link to="/ngo/rescues" className="font-bold underline">
              View Active Queue →
            </Link>
          )}
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish, location, or donor..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
          >
            <option value="ALL">All Categories</option>
            <option value="Cooked Meals">Cooked Meals</option>
            <option value="Dairy Products">Dairy Products</option>
            <option value="Baked Goods">Baked Goods</option>
            <option value="Fresh Produce">Fresh Produce</option>
            <option value="Packaged Food">Packaged Food</option>
            <option value="Mixed Grocery">Mixed Grocery</option>
          </select>
        </div>
      </div>

      {/* Grid of Available Batches */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Scanning local donor network for surplus batches...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No surplus batches available currently</h4>
          <p className="text-xs text-slate-500">
            Check back shortly or post an emergency food request to broadcast to local commercial donors.
          </p>
          <div className="pt-2">
            <Link
              to="/ngo/emergency"
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <span>Broadcast Emergency Need</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d) => {
            const distance = computeDistanceKm(d.latitude, d.longitude);
            return (
              <div
                key={d._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-purple-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                        {d.foodCategory}
                      </span>
                      <h3 className="font-black text-base text-slate-900 mt-0.5">{d.foodName}</h3>
                      <div className="text-xs text-slate-500 font-semibold">
                        Donor: {d.donor?.organizationName || d.donor?.fullName || "Commercial Kitchen"}
                      </div>
                    </div>

                    <SafetyScoreBadge score={d.safetyScore} status={d.safetyStatus} size="sm" />
                  </div>

                  {/* Quantity & Distance Pill */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 font-mono font-bold">
                      {d.quantity} {d.unit}
                    </span>
                    {distance && (
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-600" />
                        <span>{distance} km away</span>
                      </span>
                    )}
                  </div>

                  {/* Timestamps & Storage */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{d.storageCondition}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{d.packagingCondition}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Best before: {d.expiryDate} ({d.expiryTime})</span>
                    </div>
                  </div>

                  {d.description && (
                    <p className="text-xs text-slate-500 italic bg-white p-2 border border-slate-100 rounded-lg">
                      "{d.description}"
                    </p>
                  )}
                </div>

                {/* Claim Button */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleClaim(d._id)}
                    disabled={claimingId === d._id}
                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-200 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{claimingId === d._id ? "Claiming..." : "Claim For Shelter Facility"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};
