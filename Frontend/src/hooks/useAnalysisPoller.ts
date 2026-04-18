import { useEffect, useState } from 'react';
import api from '../services/api';
import type { AnalysisData } from '../types';

/**
 * Hook to poll analysis status until completion
 * Polls every 2 seconds until status is 'complete' or 'failed'
 */
export function useAnalysisPoller(analysisId: number | null, enabled: boolean = true) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId || !enabled) {
      setIsPolling(false);
      return;
    }

    let isMounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchAnalysis = async () => {
      try {
        const response = await api.get(`/analysis/${analysisId}/`);
        
        if (!isMounted) return;
        
        setAnalysis(response.data);
        setError(null);

        // Stop polling if analysis is complete or failed
        if (response.data?.status === 'complete' || response.data?.status === 'failed') {
          setIsPolling(false);
          if (interval) clearInterval(interval);
        }

        return response.data;
      } catch (err: any) {
        if (!isMounted) return;
        
        const message = err.response?.data?.detail || 'Failed to fetch analysis';
        setError(message);
        console.error('Analysis fetch error:', err);
        return null;
      }
    };

    // Initial fetch
    setIsPolling(true);
    fetchAnalysis().then((data) => {
      // If already complete/failed after initial fetch, don't set up interval
      if (data?.status === 'complete' || data?.status === 'failed') {
        return;
      }

      // Set up polling interval
      interval = setInterval(fetchAnalysis, 2000);
    });

    // Cleanup
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [analysisId, enabled]);

  return {
    analysis,
    isPolling,
    error,
  };
}
