import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import type { Report, RestorationProject } from "../../types";

interface Props {
  reports: Report[];
  projects?: RestorationProject[];
}

type RiskLevel = "high" | "medium" | "low";

function normalizeRiskLevel(level?: string | null): RiskLevel {
  const normalized = (level || "low").toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function markerTone(level: RiskLevel): { ring: string; dot: string } {
  if (level === "high") return { ring: "#ef4444", dot: "#b91c1c" };
  if (level === "medium") return { ring: "#f59e0b", dot: "#b45309" };
  return { ring: "#22c55e", dot: "#15803d" };
}

function createRiskMarker(level: RiskLevel): L.DivIcon {
  const tone = markerTone(level);

  return L.divIcon({
    className: "report-risk-marker",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
    html: `
      <span class="report-risk-marker__outer" style="border-color:${tone.ring}; box-shadow: 0 0 0 4px ${tone.ring}33;">
        <span class="report-risk-marker__inner" style="background:${tone.dot};"></span>
      </span>
    `,
  });
}

function riskBadgeClasses(level: RiskLevel): string {
  if (level === "high") return "bg-red-100 text-red-800";
  if (level === "medium") return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

function createProjectMarker(status: "planned" | "ongoing" | "completed"): L.DivIcon {
  const colors = {
    planned: { ring: "#8b5cf6", dot: "#6d28d9" },
    ongoing: { ring: "#3b82f6", dot: "#1e40af" },
    completed: { ring: "#10b981", dot: "#065f46" },
  };
  const color = colors[status];

  return L.divIcon({
    className: "project-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
    html: `
      <span class="project-marker__outer" style="border-color:${color.ring}; box-shadow: 0 0 0 4px ${color.ring}33;">
        <span class="project-marker__inner" style="background:${color.dot};">🌱</span>
      </span>
    `,
  });
}

export function ReportMap({ reports, projects = [] }: Props) {
  // Filter reports with valid coordinates
  const validReports = reports.filter(
    (r) =>
      typeof r.lat === "number" &&
      typeof r.lng === "number" &&
      !isNaN(r.lat) &&
      !isNaN(r.lng)
  );

  // Filter projects with valid coordinates
  const validProjects = projects.filter(
    (p) =>
      typeof p.lat === "number" &&
      typeof p.lng === "number" &&
      !isNaN(p.lat) &&
      !isNaN(p.lng)
  );

  // Calculate center based on all valid items
  const allItems = [...validReports, ...validProjects];
  const center: [number, number] =
    allItems.length > 0
      ? [
          allItems.reduce((sum, item) => sum + (item.lat || 0), 0) / allItems.length,
          allItems.reduce((sum, item) => sum + (item.lng || 0), 0) / allItems.length,
        ]
      : [-6.9175, 107.6191];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
      <MapContainer
        center={center}
        zoom={allItems.length > 0 ? 8 : 5}
        className="h-96 md:h-125 w-full z-0"
        attributionControl={true}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="topright" />
        
        {/* Render Reports */}
        {validReports.map((r) => {
          const risk = normalizeRiskLevel(r.analysis?.risk_level);

          return (
            <Marker key={`report-${r.id}`} position={[r.lat, r.lng]} icon={createRiskMarker(risk)}>
              <Popup>
                <article className="report-popup text-sm">
                  {r.photo ? (
                    <img src={r.photo} alt={r.location} className="report-popup__image" />
                  ) : (
                    <div className="report-popup__image report-popup__image-placeholder">No image provided</div>
                  )}

                  <div className="report-popup__body">
                    <div className="report-popup__header">
                      <h4 className="report-popup__title">{r.location}</h4>
                      <span className={`report-popup__risk ${riskBadgeClasses(risk)}`}>{risk}</span>
                    </div>

                    <p className="report-popup__description">{r.description}</p>

                    <div className="report-popup__meta">
                      <span>{r.user ? `By ${r.user}` : "Community report"}</span>
                      <span>{r.date_submitted ? new Date(r.date_submitted).toLocaleDateString() : "Date unavailable"}</span>
                    </div>

                    <div className="report-popup__coords">
                      {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                    </div>

                    {r.analysis ? (
                      <section className="report-popup__analysis">
                        <p className="report-popup__analysis-title">AI Analysis</p>

                        <div className="report-popup__analysis-grid">
                          <div className="report-popup__stat">
                            <p className="report-popup__stat-label">Health</p>
                            <p className="report-popup__stat-value">{r.analysis.health_score ?? "N/A"}/100</p>
                          </div>
                          <div className="report-popup__stat">
                            <p className="report-popup__stat-label">Damage</p>
                            <p className="report-popup__stat-value">{r.analysis.damage_detected ? "Detected" : "None"}</p>
                          </div>
                        </div>

                        {r.analysis.result && <p className="report-popup__summary">{r.analysis.result}</p>}
                      </section>
                    ) : (
                      <p className="report-popup__no-analysis">No AI analysis available yet.</p>
                    )}
                  </div>
                </article>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Projects */}
        {validProjects.map((p) => {
          const totalTrees = p.events?.reduce((sum, e) => sum + e.trees_planted, 0) || 0;

          return (
            <Marker key={`project-${p.id}`} position={[p.lat, p.lng]} icon={createProjectMarker(p.status)}>
              <Popup>
                <article className="report-popup text-sm">
                  <div className="report-popup__body">
                    <div className="report-popup__header">
                      <h4 className="report-popup__title">{p.name}</h4>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        p.status === "ongoing" ? "bg-blue-100 text-blue-800" :
                        p.status === "completed" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </div>

                    <p className="report-popup__description">{p.description}</p>
                    <span>By {p.created_by}</span>

                    <div className="report-popup__meta">
                      <span>📍 {p.location}</span>
                      <span>🌱 {totalTrees} trees planted</span>
                    </div>

                    <div className="report-popup__coords">
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </div>

                    <section className="report-popup__analysis" style={{ marginTop: "8px" }}>
                      <p className="report-popup__analysis-title">Project Details</p>
                      <div className="report-popup__analysis-grid">
                        <div className="report-popup__stat">
                          <p className="report-popup__stat-label">Started</p>
                          <p className="report-popup__stat-value">{new Date(p.start_date).toLocaleDateString()}</p>
                        </div>
                        <div className="report-popup__stat">
                          <p className="report-popup__stat-label">Events</p>
                          <p className="report-popup__stat-value">{p.events?.length || 0}</p>
                        </div>
                      </div>
                    </section>
                  </div>
                </article>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      {allItems.length > 0 && (
        <div className="pointer-events-none absolute left-3 top-3 z-500 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Legend</p>
          <div className="mt-1 space-y-1 text-xs text-slate-700">
            {validReports.length > 0 && (
              <>
                <p className="font-semibold text-slate-600 mt-1">Reports</p>
                <div className="flex items-center gap-2">
                  <span className="report-risk-dot report-risk-dot-high" />
                  High Risk
                </div>
                <div className="flex items-center gap-2">
                  <span className="report-risk-dot report-risk-dot-medium" />
                  Medium Risk
                </div>
                <div className="flex items-center gap-2">
                  <span className="report-risk-dot report-risk-dot-low" />
                  Low Risk
                </div>
              </>
            )}
            {validProjects.length > 0 && (
              <>
                <p className="font-semibold text-slate-600 mt-1">Projects</p>
                <div className="flex items-center gap-2">
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#8b5cf6" }} />
                  Planned
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6" }} />
                  Ongoing
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                  Completed
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty States */}
      {allItems.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
          <p className="text-lg font-semibold text-slate-500">No reports or projects to display on the map</p>
        </div>
      )}
      {allItems.length > 0 && validReports.length === 0 && validProjects.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
          <p className="text-lg font-semibold text-slate-500">Items have invalid coordinates</p>
        </div>
      )}
    </div>
  );
}