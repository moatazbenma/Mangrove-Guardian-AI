import type { AnalysisData } from '../types';

interface AnalysisProgressProps {
  analysis: AnalysisData | null;
  isPolling: boolean;
}

/**
 * Component to show analysis progress
 * Displays loading spinner and status messages
 */
export function AnalysisProgress({ analysis, isPolling }: AnalysisProgressProps) {
  if (!analysis) return null;

  const getStatusMessage = () => {
    switch (analysis.status) {
      case 'pending':
        return 'Queuing analysis...';
      case 'processing':
        return 'AI is analyzing your report...';
      case 'complete':
        return 'Analysis complete!';
      case 'failed':
        return 'Analysis failed';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (analysis.status) {
      case 'pending':
        return 'text-amber-600';
      case 'processing':
        return 'text-blue-600';
      case 'complete':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="glass-card border border-blue-200 bg-blue-50/90 p-6">
      <div className="flex items-center gap-4">
        {isPolling && (
          <div className="flex-shrink-0">
            <div className="animate-spin">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
        )}

        <div className="flex-1">
          <p className={`font-semibold ${getStatusColor()}`}>{getStatusMessage()}</p>
          {analysis.status === 'pending' && <p className="subtle-text mt-1 text-sm">Waiting for worker to pick up task...</p>}
          {analysis.status === 'processing' && <p className="subtle-text mt-1 text-sm">This may take 5-30 seconds</p>}
          {analysis.result && (analysis.status === 'pending' || analysis.status === 'processing') && (
            <p className="mt-2 text-xs text-slate-600">{analysis.result}</p>
          )}
        </div>

        {analysis.status === 'complete' && (
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
        )}

        {analysis.status === 'failed' && (
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
