import type { AnalysisData } from '../types';

interface AnalysisResultsProps {
  analysis: AnalysisData | null;
}

/**
 * Component to display analysis results
 * Shows health score, damage detection, risk level, and detailed report
 */
export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  if (!analysis || analysis.status !== 'complete') return null;

  const isProvisional = (analysis.result || '').toLowerCase().includes('provisional estimate');
  const riskLevelLabel = analysis.risk_level
    ? `${analysis.risk_level.charAt(0).toUpperCase()}${analysis.risk_level.slice(1).toLowerCase()}`
    : 'Unknown';

  const getRiskColor = (risk: string | null | undefined) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getRiskBadgeColor = (risk: string | null | undefined) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className={`glass-card border p-6 ${getRiskColor(analysis.risk_level)}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold">Analysis Results</h3>
            <p className="subtle-text mt-1 text-sm">AI-powered infrastructure damage assessment</p>
            {isProvisional && (
              <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Provisional Estimate
              </p>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getRiskBadgeColor(analysis.risk_level)}`}>
            {analysis.risk_level?.toUpperCase() || 'UNKNOWN'} RISK
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Health Score */}
        <div className="glass-card border border-slate-200 p-5">
          <p className="subtle-text text-sm font-semibold">Health Score</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-bold text-teal-700">{analysis.health_score ?? '-'}</span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-green-500"
              style={{ width: `${Math.min(100, analysis.health_score ?? 0)}%` }}
            />
          </div>
        </div>

        {/* Damage Detection */}
        <div className="glass-card border border-slate-200 p-5">
          <p className="subtle-text text-sm font-semibold">Damage Detected</p>
          <div className="mt-4 flex items-center gap-3">
            {analysis.damage_detected ? (
              <>
                <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="font-semibold text-red-700">Yes</span>
              </>
            ) : (
              <>
                <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
                <span className="font-semibold text-green-700">No</span>
              </>
            )}
          </div>
        </div>

        {/* Risk Level */}
        <div className="glass-card border border-slate-200 p-5">
          <p className="subtle-text text-sm font-semibold">Risk Assessment</p>
          <div className="mt-4">
            <span
              className={`inline-block rounded-lg px-4 py-2 font-bold ${getRiskBadgeColor(analysis.risk_level)}`}
            >
              {riskLevelLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Result */}
      {analysis.result && (
        <div className="glass-card border border-slate-200 p-5">
          <h4 className="font-bold text-slate-900">Detailed Assessment</h4>
          <p className="subtle-text mt-3 whitespace-pre-wrap text-sm">{analysis.result}</p>
        </div>
      )}
    </div>
  );
}
