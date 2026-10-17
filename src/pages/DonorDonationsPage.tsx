import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { SafetyScoreBadge } from "../components/SafetyScoreBadge";
import { QRViewerModal } from "../components/QRViewerModal";
import {
  UtensilsCrossed,
  PlusCircle,
  Eye,
  QrCode,
  KeyRound,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  Calendar,
  Clock
} from "lucide-react";
import { FoodDonation, RescueRequest } from "../types";
import api from "../services/api";

export const DonorDonationsPage: React.FC = () => {
  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [rescues, setRescues] = useState<{ [donationId: string]: RescueRequest }>({});
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // QR Modal
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    token: string;
    image?: string;
    title: string;
  }>({
    open: false,
    token: "",
    title: ""
  });

  // OTP Display Modal
  const [otpModal, setOtpModal] = useState<{
    open: boolean;
    otp?: string;
    donationTitle: string;
  }>({
    open: false,
    donationTitle: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/donations/my");
      if (res.data?.donations) {
        setDonations(res.data.donations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenQR = async (donation: FoodDonation) => {
    try {
      const res = await api.get(`/donations/${donation._id}`);
      const rescue = res.data?.rescue;
      if (rescue) {
        setQrModal({
          open: true,
          token: rescue.verificationToken || "SAFESERVE-PASS",
          image: rescue.qrCodeImage,
          title: donation.foodName
        });
      } else {
        alert("Verification QR code will be active once assigned to an approved courier.");
      }
    } catch {
      alert("Unable to fetch rescue verification QR.");
    }
  };

  const handleShowOTP = async (donation: FoodDonation) => {
    try {
      const res = await api.get(`/donations/${donation._id}`);
      const rescue = res.data?.rescue;
      if (rescue && rescue.pickupOtp) {
        setOtpModal({
          open: true,
          otp: rescue.pickupOtp,
          donationTitle: donation.foodName
        });
      } else {
        alert("Pickup OTP will be generated once courier schedules arrival.");
      }
    } catch {
      alert("Unable to fetch pickup OTP.");
    }
  };

  const filtered = donations.filter((d) => {
    const matchesStatus = filterStatus === "ALL" || d.status === filterStatus;
    const foodName = (d.foodName || "").toLowerCase();
    const foodCategory = (d.foodCategory || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = foodName.includes(query) || foodCategory.includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout
      title="My Food Donations & Operations"
      subtitle="Track safety verification, rescue logistics, and delivery handoffs"
      actions={
        <Link
          to="/donor/create-donation"
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-purple-200"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Donation</span>
        </Link>
      }
    >
      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food items or categories..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_SAFETY_REVIEW">Pending Safety Review</option>
            <option value="APPROVED">Approved (Awaiting NGO)</option>
            <option value="NGO_ASSIGNED">NGO Assigned</option>
            <option value="VOLUNTEER_ASSIGNED">Volunteer Dispatched</option>
            <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered & Verified</option>
            <option value="DISTRIBUTION_COMPLETED">Distribution Completed</option>
            <option value="REJECTED">Rejected by Safety</option>
          </select>
        </div>
      </div>

      {/* Donations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading donation records...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No matching donations found</h4>
            <p className="text-xs text-slate-500">Try adjusting your filter or search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((d) => (
              <div
                key={d._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-purple-200 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                      {d.foodCategory}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-0.5">{d.foodName}</h3>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">
                        {d.quantity} {d.unit}
                      </span>
                      <span>•</span>
                      <span>{d.storageCondition}</span>
                    </div>
                  </div>

                  <SafetyScoreBadge score={d.safetyScore} status={d.safetyStatus} size="sm" />
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-black text-purple-800">{d.status.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Prepared:</span>
                    <span>{d.preparationDate} at {d.preparationTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Expiry Window:</span>
                    <span>{d.expiryDate} at {d.expiryTime}</span>
                  </div>
                </div>

                {/* Card action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Link
                    to={`/donor/track/${d._id}`}
                    className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Track Lifecycle</span>
                  </Link>

                  <button
                    onClick={() => handleShowOTP(d)}
                    className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    title="View 6-Digit Pickup OTP"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    <span>Pickup OTP</span>
                  </button>

                  <button
                    onClick={() => handleOpenQR(d)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    title="View Verification QR Pass"
                  >
                    <QrCode className="w-3.5 h-3.5 text-slate-700" />
                    <span>QR Pass</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Viewer */}
      <QRViewerModal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, token: "", title: "" })}
        verificationToken={qrModal.token}
        qrCodeImage={qrModal.image}
        rescueTitle={qrModal.title}
        stepType="PICKUP"
      />

      {/* OTP Display Modal */}
      {otpModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Secure Pickup OTP</h3>
            <p className="text-xs text-slate-500">
              Provide this 6-digit code to the verified courier upon arrival at your pickup address.
            </p>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-3xl font-black font-mono tracking-widest text-amber-900">
                {otpModal.otp || "938210"}
              </span>
              <span className="text-[10px] text-amber-700 block mt-1 font-semibold">
                Expiring security token • Valid for single verification
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOtpModal({ open: false, donationTitle: "" })}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
