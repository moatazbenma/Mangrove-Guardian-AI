import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import api from "../../services/api";
import { logout } from "../../services/auth";
import { useAnalysisPoller } from "../../hooks/useAnalysisPoller";
import { AnalysisProgress } from "../../components/AnalysisProgress";
import { AnalysisResults } from "../../components/AnalysisResults";

const createCustomIcon = () => {
  return L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

function MapClickHandler({
  setLat,
  setLng,
}: {
  setLat: (value: string) => void;
  setLng: (value: string) => void;
}) {
  useMapEvents({
    click(e) {
      setLat(e.latlng.lat.toString());
      setLng(e.latlng.lng.toString());
    },
  });

  return null;
}

export function ReportForm() {
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll for analysis status updates
  const { analysis, isPolling } = useAnalysisPoller(analysisId, showAnalysis);

  // Auto-redirect when analysis completes
  useEffect(() => {
    if (analysis?.status === 'complete') {
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [analysis?.status, navigate]);

  const mapCenter: [number, number] = lat && lng ? [parseFloat(lat), parseFloat(lng)] : [-6.9175, 107.6191];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoUrl("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUrl = (url: string) => {
    setPhotoUrl(url);
    setPhotoPreview(url || null);
    setPhotoFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!location.trim() || !description.trim() || !lat || !lng) {
      setError("Please fill all fields and select a location on the map.");
      return;
    }

    if (!photoFile && !photoUrl) {
      setError("Please upload an image or provide an image URL.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("location", location);
      formData.append("description", description);
      formData.append("lat", parseFloat(lat).toString());
      formData.append("lng", parseFloat(lng).toString());

      if (photoFile) {
        formData.append("photo", photoFile);
      } else if (photoUrl) {
        formData.append("photo", photoUrl);
      }

      // Create report
      const reportRes = await api.post("/reports/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Queue analysis task
      const analysisRes = await api.post("/analysis/", { report: reportRes.data.id });

      // Start polling for analysis status
      setAnalysisId(analysisRes.data.id);
      setShowAnalysis(true);

    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.photo?.[0] ||
        "Failed to submit report. Please try again.";
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAnalysis = async () => {
    if (!analysis?.id) return;

    setRetrying(true);
    setError(null);

    try {
      await api.post(`/analysis/${analysis.id}/retry/`);

      // Restart poller cycle by toggling the tracked analysis id.
      setAnalysisId(null);
      setTimeout(() => {
        setAnalysisId(analysis.id);
      }, 0);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to retry analysis. Please try again.";
      setError(msg);
    } finally {
      setRetrying(false);
    }
  };

  // Show analysis progress/results after form submission
  if (showAnalysis) {
    return (
      <div className="app-shell md:p-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <header className="glass-card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-teal-700">Mangrove Guardian AI</p>
                <h1 className="page-title mt-1 text-3xl md:text-4xl">
                  {analysis?.status === 'complete' ? 'Analysis Complete' : 'Analyzing Report'}
                </h1>
              </div>
              <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </button>
            </div>
          </header>

          {error && <div className="glass-card border border-red-200 bg-red-50/90 p-4 text-sm text-red-700">{error}</div>}

          <AnalysisProgress analysis={analysis} isPolling={isPolling} />

          {analysis?.status === 'complete' && (
            <>
              <AnalysisResults analysis={analysis} />
              <div className="glass-card border border-green-200 bg-green-50/90 p-4 text-center">
                <p className="text-sm font-semibold text-green-700">
                  Report and analysis saved! Redirecting to dashboard in 3 seconds...
                </p>
              </div>
            </>
          )}

          {analysis?.status === 'failed' && (
            <div className="glass-card border border-red-200 bg-red-50/90 p-4">
              <p className="font-semibold text-red-700">Analysis Failed</p>
              <p className="subtle-text mt-2 text-sm">{analysis.result || 'An error occurred during analysis.'}</p>
              <button
                className="btn btn-primary mt-4"
                onClick={handleRetryAnalysis}
                disabled={retrying}
              >
                {retrying ? "Retrying..." : "Try Again"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell md:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="glass-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">Mangrove Guardian AI</p>
              <h1 className="page-title mt-1 text-3xl md:text-5xl">Create Field Report</h1>
              <p className="subtle-text mt-2">Pin the location, attach evidence, and trigger AI damage analysis.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>Back</button>
              <button className="btn btn-danger" onClick={() => logout()}>Logout</button>
            </div>
          </div>
        </header>

        {error && <div className="glass-card border border-red-200 bg-red-50/90 p-4 text-sm text-red-700">{error}</div>}

        <div className="grid gap-5 lg:grid-cols-3">
          <section className="glass-card overflow-hidden lg:col-span-2">
            <div className="border-b border-slate-200 bg-white/70 px-4 py-3">
              <h2 className="text-lg font-extrabold text-slate-900">Location Map</h2>
              <p className="subtle-text text-sm">Click on map to set exact coordinates.</p>
            </div>

            <div className="relative">
              <MapContainer
                center={mapCenter}
                zoom={lat && lng ? 12 : 7}
                className="h-105 w-full z-0"
                attributionControl
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler setLat={setLat} setLng={setLng} />
                {lat && lng && (
                  <Marker position={[parseFloat(lat), parseFloat(lng)]} icon={createCustomIcon()}>
                    <Popup>
                      <div>
                        <p className="font-semibold">{location || "Selected Location"}</p>
                        <p className="text-xs text-slate-600">
                          {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              {lat && lng && (
                <div className="absolute right-3 top-3 rounded-xl border border-teal-200 bg-white/95 px-3 py-2 text-xs font-semibold text-teal-700 shadow-sm">
                  Coordinates set
                </div>
              )}
            </div>
          </section>

          <section className="glass-card p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Location Name</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Mangrove Forest A"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none transition focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe current conditions"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none transition focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Upload Photo</label>
                <button type="button" className="btn btn-secondary w-full" onClick={() => fileInputRef.current?.click()}>
                  Choose Image
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => handlePhotoUrl(e.target.value)}
                  placeholder="or paste image URL"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-500"
                />
              </div>

              {photoPreview && (
                <img src={photoPreview} alt="Preview" className="h-28 w-full rounded-xl border border-slate-200 object-cover" />
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-100 p-2">
                  <p className="text-slate-500">Latitude</p>
                  <p className="font-semibold text-slate-700">{lat || "Not set"}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-2">
                  <p className="text-slate-500">Longitude</p>
                  <p className="font-semibold text-slate-700">{lng || "Not set"}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !lat || !lng || (!photoFile && !photoUrl)}
                className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
