import { useState, useCallback } from "react";
import api from "../services/api";
import type { AnalysisData, Report } from "../types";

export interface UseReportsReturn {
  reports: Report[];
  loading: boolean;
  error: string | null;
  fetchReports: () => Promise<void>;
}

export function useReports(): UseReportsReturn {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/reports/");
      // Handle paginated responses from Django REST Framework
      const reportsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setReports(reportsData);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  }, []);

  return { reports, loading, error, fetchReports };
}
