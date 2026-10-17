import React, { useState } from "react";
import { Navigation, MapPin, CheckCircle, AlertCircle } from "lucide-react";

interface GPSLocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (coords: { latitude: number; longitude: number; accuracy?: number }) => void;
  label?: string;
  required?: boolean;
}

export const GPSLocationPicker: React.FC<GPSLocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
  label = "GPS Geolocation Verification",
  required = false
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your current browser.");
      return;
    }

    setIsDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy);

        setAccuracy(acc);
        onChange({ latitude: lat, longitude: lng, accuracy: acc });
        setIsDetecting(false);
      },
      (error) => {
        setIsDetecting(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMsg("Location access denied. Please permit browser geolocation or input coordinates manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMsg("GPS position unavailable. Try moving to an open area.");
            break;
          case error.TIMEOUT:
            setErrorMsg("GPS request timed out.");
            break;
          default:
            setErrorMsg("Unable to fetch GPS coordinates.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const hasCoords = latitude !== 0 || longitude !== 0;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-purple-700" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isDetecting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isDetecting ? "animate-spin" : ""}`} />
          <span>{isDetecting ? "Acquiring GPS Fix..." : "Fetch Live GPS"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
          <input
            type="number"
            step="any"
            value={latitude || ""}
            onChange={(e) => onChange({ latitude: parseFloat(e.target.value) || 0, longitude })}
            placeholder="e.g. 28.6139"
            className="w-full mt-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
          <input
            type="number"
            step="any"
            value={longitude || ""}
            onChange={(e) => onChange({ latitude, longitude: parseFloat(e.target.value) || 0 })}
            placeholder="e.g. 77.2090"
            className="w-full mt-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />
        </div>
      </div>

      {hasCoords && (
        <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span>Coordinates calibrated: {latitude}, {longitude}</span>
          </div>
          {accuracy && <span className="font-semibold text-emerald-800">±{accuracy}m accuracy</span>}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
