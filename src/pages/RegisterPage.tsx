import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Shield,
  Building2,
  HeartHandshake,
  Bike,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { GPSLocationPicker } from "../components/GPSLocationPicker";
import { UserRole } from "../types";

export const RegisterPage: React.FC = () => {
  const { role: urlRole } = useParams<{ role?: string }>();
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>("DONOR");

  useEffect(() => {
    if (urlRole) {
      const upper = urlRole.toUpperCase();
      if (upper === "DONOR" || upper === "NGO" || upper === "VOLUNTEER") {
        setSelectedRole(upper as UserRole);
      }
    }
  }, [urlRole]);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [state, setState] = useState("Delhi");
  const [pincode, setPincode] = useState("110001");
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.2090);

  // Role specific
  const [organizationName, setOrganizationName] = useState("");
  const [foodCapacity, setFoodCapacity] = useState<number>(100);
  const [transportation, setTransportation] = useState("Two-Wheeler (Motorcycle/Scooter)");
  const [availability, setAvailability] = useState("Flexible Evenings & Weekends");
  
  // Mandatory Aadhaar & KYC for NGO & Volunteer
  const [aadharNumber, setAadharNumber] = useState("");
  const [verificationDocFile, setVerificationDocFile] = useState<File | null>(null);
  const [verificationDocPreview, setVerificationDocPreview] = useState<string | null>(null);
  const [verificationDocBase64, setVerificationDocBase64] = useState<string>("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVerificationDocFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setVerificationDocBase64(result);
        setVerificationDocPreview(file.type.startsWith("image/") ? result : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !email || !password || !phone || !address) {
      setErrorMsg("Please complete all required fields.");
      return;
    }

    // Compulsory Aadhaar & Document check for NGO and Volunteer
    if (selectedRole === "NGO" || selectedRole === "VOLUNTEER") {
      const cleanAadhaar = aadharNumber.replace(/\s+/g, "");
      if (!cleanAadhaar || cleanAadhaar.length !== 12 || !/^\d+$/.test(cleanAadhaar)) {
        setErrorMsg("Please enter a valid 12-digit Aadhaar number (numeric only).");
        return;
      }
      if (!verificationDocBase64) {
        setErrorMsg("Uploading Aadhaar / Official Government KYC document is mandatory for NGO and Volunteer registration.");
        return;
      }
    }

    setIsLoading(true);

    const payload = {
      fullName,
      email,
      password,
      phone,
      role: selectedRole,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      organizationName: selectedRole !== "VOLUNTEER" ? (organizationName || fullName) : undefined,
      foodCapacity: selectedRole === "NGO" ? foodCapacity : undefined,
      transportation: selectedRole === "VOLUNTEER" ? transportation : undefined,
      availability: selectedRole === "VOLUNTEER" ? availability : undefined,
      aadharNumber: (selectedRole === "NGO" || selectedRole === "VOLUNTEER") ? aadharNumber.replace(/\s+/g, "") : undefined,
      verificationDocument: (selectedRole === "NGO" || selectedRole === "VOLUNTEER") ? verificationDocBase64 : undefined
    };

    const res = await registerUser(payload);
    setIsLoading(false);

    if (res.success) {
      if (selectedRole === "DONOR") navigate("/donor/dashboard");
      else if (selectedRole === "NGO") navigate("/ngo/dashboard");
      else if (selectedRole === "VOLUNTEER") navigate("/volunteer/dashboard");
      else navigate("/");
    } else {
      setErrorMsg(res.message || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center mx-auto shadow-md shadow-purple-200">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Join The SafeServe Rescue Network
            </h1>
            <p className="text-xs text-slate-500">
              Select your role and complete verified registration
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole("DONOR")}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                selectedRole === "DONOR"
                  ? "bg-purple-50 border-purple-600 text-purple-900 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Building2 className={`w-5 h-5 ${selectedRole === "DONOR" ? "text-purple-700" : "text-slate-400"}`} />
              <span className="text-xs font-bold">Food Donor</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">Commercial / Hotel</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("NGO")}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                selectedRole === "NGO"
                  ? "bg-purple-50 border-purple-600 text-purple-900 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <HeartHandshake className={`w-5 h-5 ${selectedRole === "NGO" ? "text-purple-700" : "text-slate-400"}`} />
              <span className="text-xs font-bold">NGO Facility</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">Shelter / Kitchen</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("VOLUNTEER")}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                selectedRole === "VOLUNTEER"
                  ? "bg-purple-50 border-purple-600 text-purple-900 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Bike className={`w-5 h-5 ${selectedRole === "VOLUNTEER" ? "text-purple-700" : "text-slate-400"}`} />
              <span className="text-xs font-bold">Volunteer</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">Transit Courier</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name / Contact Lead *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {selectedRole === "VOLUNTEER" ? "Display Nickname / Name" : "Organization / Brand Name *"}
                </label>
                <input
                  type="text"
                  required={selectedRole !== "VOLUNTEER"}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={selectedRole === "DONOR" ? "e.g. Grand Palace Hotel" : "e.g. Hope Foundation Kitchen"}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@domain.org"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Official Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {selectedRole === "NGO" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Daily Meal Capacity (Servings)</label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={foodCapacity}
                    onChange={(e) => setFoodCapacity(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              )}

              {selectedRole === "VOLUNTEER" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mode of Transit</label>
                    <select
                      value={transportation}
                      onChange={(e) => setTransportation(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    >
                      <option value="Two-Wheeler (Motorcycle/Scooter)">Two-Wheeler (Motorcycle/Scooter)</option>
                      <option value="Four-Wheeler / Car">Four-Wheeler / Car</option>
                      <option value="Electric Cargo Van">Electric Cargo Van</option>
                      <option value="Bicycle / Walking">Bicycle / Walking</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Availability Window</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    >
                      <option value="Flexible Evenings & Weekends">Flexible Evenings &amp; Weekends</option>
                      <option value="Full Time Day Shift">Full Time Day Shift</option>
                      <option value="Emergency On-Call Only">Emergency On-Call Only</option>
                    </select>
                  </div>
                </>
              )}

              {/* Mandatory Aadhaar Verification Section for NGO & Volunteer */}
              {(selectedRole === "NGO" || selectedRole === "VOLUNTEER") && (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-black text-[10px] uppercase">
                      Compulsory Verification
                    </span>
                    <span className="text-xs font-bold text-amber-950">
                      Government KYC &amp; Aadhaar Identity Verification
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    By regulatory safety protocols, all {selectedRole === "NGO" ? "NGO Charity Kitchens" : "Volunteer Responders"} must provide a valid 12-digit Aadhaar number and upload a verifiable identity document.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Aadhaar Number (12 Digits) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={14}
                        value={aadharNumber}
                        onChange={(e) => {
                          // Allow numbers and auto-format XXXX XXXX XXXX
                          const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                          const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
                          setAadharNumber(formatted);
                        }}
                        placeholder="e.g. 5421 8904 1234"
                        className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-xl font-mono tracking-wider focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Upload Aadhaar / Govt ID (PDF/Image) *
                      </label>
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        onChange={handleDocFileChange}
                        className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-amber-200 file:text-amber-900 hover:file:bg-amber-300 cursor-pointer"
                      />
                      {verificationDocFile && (
                        <p className="text-[10px] text-emerald-700 font-medium mt-1">
                          ✓ Selected: {verificationDocFile.name} ({(verificationDocFile.size / 1024).toFixed(0)} KB)
                        </p>
                      )}
                    </div>
                  </div>

                  {verificationDocPreview && (
                    <div className="w-32 h-20 rounded-xl border border-amber-300 overflow-hidden shadow-sm mt-2">
                      <img src={verificationDocPreview} alt="Aadhaar Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Operating Street Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot No. 42, Sector 18, Commercial Belt"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
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
                <label className="text-xs font-bold text-slate-700 block mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Geolocation verification */}
              <div className="sm:col-span-2">
                <GPSLocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  onChange={(c) => {
                    setLatitude(c.latitude);
                    setLongitude(c.longitude);
                  }}
                  label="Registered Hub Geolocation (Used for Smart Distance Matching)"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              <span>{isLoading ? "Submitting Registration..." : `Register as ${selectedRole}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
            Already registered on SafeServe?{" "}
            <Link to="/login" className="font-bold text-purple-700 hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
