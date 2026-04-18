import type { AnalysisData } from "../../types";

export interface ReportCardProps {
  id: number;
  location: string;
  description: string;
  photo?: string;
  analysis?: AnalysisData | null;
  date_submitted?: string;
}

function riskClass(level?: string | null): string {
  const normalized = (level || "low").toLowerCase();
  if (normalized === "high") return "chip-high";
  if (normalized === "medium") return "chip-medium";
  return "chip-low";
}

export function ReportCard({
  location,
  description,
  photo,
  analysis,
  date_submitted,
}: ReportCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition">
      {photo && (
        <img
          src={photo}
          alt={location}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <p className="font-bold text-slate-900">{location}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>

        {analysis && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span>Health: {analysis.health_score}%</span>
            <span className={`chip ${riskClass(analysis.risk_level)}`}>
              {analysis.risk_level?.toUpperCase()}
            </span>
          </div>
        )}

        {date_submitted && (
          <p className="text-xs text-slate-400 mt-2">
            {new Date(date_submitted).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
