import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import type { AnalysisData, Report, RestorationProject, RestorationEvent } from "../types";

// Re-export types for backward compatibility with existing imports
export type { RestorationProject, RestorationEvent, AnalysisData, Report };

export interface UseDashboardReturn {
  reports: Report[];
  projects: RestorationProject[];
  loading: boolean;
  error: string | null;
  exporting: boolean;
  exportReports: () => Promise<void>;
  deleteReport: (reportId: number) => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<RestorationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const normalizeList = (payload: any) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsResult, projectsResult] = await Promise.allSettled([
        api.get("/reports/"),
        api.get("/projects/"),
      ]);

      if (reportsResult.status === "fulfilled") {
        setReports(normalizeList(reportsResult.value.data));
      } else {
        console.error("Error fetching reports:", reportsResult.reason);
        const status = reportsResult.reason?.response?.status;
        const detail = reportsResult.reason?.response?.data?.detail;
        if (status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError(detail || "Failed to load reports.");
        }
      }

      if (projectsResult.status === "fulfilled") {
        setProjects(normalizeList(projectsResult.value.data));
      } else {
        // Projects are non-critical for community users; keep dashboard usable.
        console.warn("Projects endpoint failed:", projectsResult.reason);
        setProjects([]);
      }
    } catch (err) {
      console.error("Unexpected dashboard fetch error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReports = useCallback(async () => {
    setExporting(true);
    try {
      const response = await api.get("/reports/export/", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "reports.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export reports. Please try again.");
    } finally {
      setExporting(false);
    }
  }, []);

  const deleteReport = useCallback(async (reportId: number) => {
    await api.delete(`/reports/${reportId}/`);
    setReports((prev: Report[]) => prev.filter((report: Report) => report.id !== reportId));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    reports,
    projects,
    loading,
    error,
    exporting,
    exportReports,
    deleteReport,
  };
}
