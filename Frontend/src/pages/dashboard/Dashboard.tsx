import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ReportMap } from "../../components/shared/ReportMap";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import type { RestorationEvent } from "../../types";

export function Dashboard() {
  const navigate = useNavigate();
  const { role, isApproved, logout } = useAuth();
  const {
    reports,
    projects,
    loading,
    error,
    exporting,
    exportReports,
    deleteReport,
  } = useDashboard();
  const [deletingReportId, setDeletingReportId] = React.useState<number | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState<"all" | "high" | "medium" | "low">("all");

  // Calculate risk statistics
  const highRisk = reports.filter((r) => (r.analysis?.risk_level || "").toLowerCase() === "high").length;
  const mediumRisk = reports.filter((r) => (r.analysis?.risk_level || "").toLowerCase() === "medium").length;
  const lowRisk = reports.filter((r) => (r.analysis?.risk_level || "").toLowerCase() === "low").length;

  // Filter reports based on search and risk level
  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return reports.filter((report) => {
      const reportRisk = (report.analysis?.risk_level || "low").toLowerCase();
      const matchesRisk = riskFilter === "all" || reportRisk === riskFilter;
      const matchesText =
        term.length === 0 ||
        report.location.toLowerCase().includes(term) ||
        report.description.toLowerCase().includes(term) ||
        (report.user || "").toLowerCase().includes(term);
      return matchesRisk && matchesText;
    });
  }, [reports, riskFilter, searchTerm]);

  // Get latest submission date
  const latestSubmission = useMemo(() => {
    const validDates = reports
      .map((r) => r.date_submitted)
      .filter((d): d is string => Boolean(d))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return validDates[0] ? new Date(validDates[0]).toLocaleDateString() : "No submissions";
  }, [reports]);

  const handleDeleteReport = async (reportId: number) => {
    const confirmed = window.confirm("Delete this report? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingReportId(reportId);
    try {
      await deleteReport(reportId);
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert("Failed to delete report. Please try again.");
    } finally {
      setDeletingReportId(null);
    }
  };

  // Check authentication AFTER all hooks
  if (!role) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="glass-card w-full max-w-lg p-8 text-center">
          <h2 className="page-title mb-2 text-3xl">Access Required</h2>
          <p className="subtle-text mb-6">Please sign in to view your dashboard.</p>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-linear-to-b from-emerald-50 via-cyan-50/40 to-sky-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-12">
        {/* Enhanced Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-2">
              {role === "community" ? (
                <>
                  <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                    Community Mode
                  </div>
                  <h1 className="mt-3 text-5xl font-black text-slate-900 md:text-6xl">
                    My Dashboard
                  </h1>
                  <p className="mt-2 text-lg text-slate-600">
                    Track your reports and contribute to mangrove restoration
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wide">
                    Organization Mode
                  </div>
                  <h1 className="mt-3 text-5xl font-black text-slate-900 md:text-6xl">
                    Operations Center
                  </h1>
                  <p className="mt-2 text-lg text-slate-600">
                    Manage submissions and track restoration impact
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {role === "community" ? (
                <>
                  <button
                    className="group relative overflow-hidden rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 px-6 py-3 font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/50"
                    onClick={() => navigate("/report")}
                  >
                    ➕ New Report
                  </button>
                  <button 
                    className="rounded-xl border-2 border-slate-300 px-6 py-3 font-bold text-slate-900 transition-all duration-300 hover:bg-red-50 hover:border-red-300"
                    onClick={() => logout()}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="group relative overflow-hidden rounded-xl bg-linear-to-r from-teal-600 to-teal-500 px-6 py-3 font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/50"
                    onClick={() => navigate("/restoration/projects")}
                  >
                    Manage Restoration
                  </button>
                  <button
                    className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition-all duration-300 hover:shadow-lg hover:bg-emerald-700"
                    onClick={exportReports}
                    disabled={exporting}
                  >
                    {exporting ? "Exporting..." : "Export Reports"}
                  </button>
                  <button 
                    className="rounded-xl border-2 border-slate-300 px-6 py-3 font-bold text-slate-900 transition-all duration-300 hover:bg-red-50 hover:border-red-300"
                    onClick={() => logout()}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Status Banners */}
          {role === "organization" && !isApproved && (
            <div className="flex items-start gap-4 rounded-2xl border-l-4 border-amber-500 bg-linear-to-r from-amber-50 to-orange-50 p-5 md:p-6 shadow-sm">
              <span className="shrink-0 text-3xl">⏳</span>
              <div>
                <p className="font-bold text-amber-900 text-lg">Pending Approval</p>
                <p className="mt-2 text-amber-800">Your organization is awaiting admin approval. Full features will unlock once verified.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-4 rounded-2xl border-l-4 border-red-500 bg-linear-to-r from-red-50 to-rose-50 p-5 md:p-6 shadow-sm">
              <span className="shrink-0 text-3xl">❌</span>
              <div>
                <p className="font-bold text-red-900 text-lg">Error Loading Data</p>
                <p className="mt-2 text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {role === "community" ? (
            <>
              <div className="group rounded-2xl border-2 border-teal-200 bg-linear-to-br from-white to-teal-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="text-teal-600">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-teal-700">My Reports</p>
                <p className="mt-2 text-4xl font-black text-teal-600">{reports.length}</p>
              </div>
              <div className="group rounded-2xl border-2 border-rose-200 bg-linear-to-br from-white to-rose-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="text-rose-600">🔴</div>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-rose-700">High Risk</p>
                <p className="mt-2 text-4xl font-black text-rose-600">{highRisk}</p>
              </div>
              <div className="group rounded-2xl border-2 border-amber-200 bg-linear-to-br from-white to-amber-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="text-amber-600">🟡</div>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-amber-700">Medium Risk</p>
                <p className="mt-2 text-4xl font-black text-amber-600">{mediumRisk}</p>
              </div>
              <div className="group rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-white to-emerald-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="text-emerald-600">🟢</div>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-emerald-700">Low Risk</p>
                <p className="mt-2 text-4xl font-black text-emerald-600">{lowRisk}</p>
              </div>
            </>
          ) : (
            <>
              <div className="group rounded-2xl border-2 border-cyan-200 bg-linear-to-br from-white to-cyan-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="text-cyan-600">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-cyan-700">Total Reports</p>
                <p className="mt-2 text-4xl font-black text-cyan-600">{reports.length}</p>
              </div>
              <div className="group rounded-2xl border-2 border-rose-200 bg-linear-to-br from-white to-rose-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="text-rose-600">🔴</div>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-rose-700">High Risk</p>
                <p className="mt-2 text-4xl font-black text-rose-600">{highRisk}</p>
              </div>
              <div className="group rounded-2xl border-2 border-amber-200 bg-linear-to-br from-white to-amber-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="text-amber-600">🟡</div>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-amber-700">Medium Risk</p>
                <p className="mt-2 text-4xl font-black text-amber-600">{mediumRisk}</p>
              </div>
              <div className="group rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-white to-emerald-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="text-emerald-600">🟢</div>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-emerald-700">Low Risk</p>
                <p className="mt-2 text-4xl font-black text-emerald-600">{lowRisk}</p>
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        {role === "community" ? (
          <div className="space-y-8">
            {/* Community Dashboard */}
            <section className="space-y-4">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">🗺️ Your Reports Map</h2>
                  <p className="mt-1 text-slate-600">Track your restoration activity and location insights</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/report")}
                >
                  ➕ New Report
                </button>
              </div>
              {loading ? (
                <EmptyState title="Loading Map" description="Gathering your report data..." />
              ) : reports.length === 0 ? (
                <EmptyState
                  title="No Reports Yet"
                  description="Create your first report to begin tracking restoration activity"
                  action={<button className="btn btn-primary" onClick={() => navigate("/report")}>Create Report</button>}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden">
                  <ReportMap reports={reports} />
                </div>
              )}
            </section>

            {/* Community Reports Section */}
            {reports.length > 0 && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">My Reports</h2>
                  <p className="mt-1 text-slate-600">{reports.length} reports submitted</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-5">
                    {reports.map((report) => {
                      const riskLevel = (report.analysis?.risk_level || "low").toLowerCase() as "high" | "medium" | "low";
                      const riskColors: Record<"high" | "medium" | "low", string> = {
                        high: "border-rose-300 hover:border-rose-400",
                        medium: "border-amber-300 hover:border-amber-400",
                        low: "border-emerald-300 hover:border-emerald-400"
                      };

                      return (
                        <article
                          key={report.id}
                          className={`group rounded-2xl border-2 ${riskColors[riskLevel]} bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
                        >
                          <div className="flex flex-col gap-5 md:flex-row md:gap-6">
                            {report.photo && (
                              <div className="relative h-40 w-full shrink-0 md:w-48 rounded-xl overflow-hidden">
                                <img
                                  src={report.photo}
                                  alt={report.location}
                                  className="h-full w-full object-cover group-hover:scale-110 transition duration-300"
                                />
                                {report.analysis && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300">
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full text-white ${
                                      riskLevel === 'high' ? 'bg-rose-500' :
                                      riskLevel === 'medium' ? 'bg-amber-500' :
                                      'bg-emerald-500'
                                    }`}>
                                      {riskLevel.toUpperCase()} RISK
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex-1">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className="text-xl font-black text-slate-900">{report.location}</h3>
                                {report.date_submitted && (
                                  <span className="shrink-0 whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                                    {new Date(report.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-sm text-slate-700 line-clamp-2 mb-4">{report.description}</p>

                              {/* Analysis Data */}
                              {report.analysis ? (
                                <div className="space-y-4">
                                  {/* Main Metrics */}
                                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                                    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3">
                                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Health</p>
                                      <p className="mt-2 text-2xl font-black text-blue-900">{report.analysis.health_score ?? "N/A"}<span className="text-sm">%</span></p>
                                    </div>
                                    <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-3">
                                      <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Damage</p>
                                      <p className="mt-2 text-lg font-black text-purple-900">{report.analysis.damage_detected ? "✓ Yes" : "✗ No"}</p>
                                    </div>
                                    <div className={`rounded-xl border-2 p-3 ${
                                      riskLevel === 'high' ? 'border-rose-300 bg-rose-50' :
                                      riskLevel === 'medium' ? 'border-amber-300 bg-amber-50' :
                                      'border-emerald-300 bg-emerald-50'
                                    }`}>
                                      <p className={`text-xs font-bold uppercase tracking-wide ${
                                        riskLevel === 'high' ? 'text-rose-700' :
                                        riskLevel === 'medium' ? 'text-amber-700' :
                                        'text-emerald-700'
                                      }`}>Risk</p>
                                      <p className={`mt-2 text-lg font-black ${
                                        riskLevel === 'high' ? 'text-rose-900' :
                                        riskLevel === 'medium' ? 'text-amber-900' :
                                        'text-emerald-900'
                                      }`}>{(report.analysis.risk_level || "UNKNOWN").toUpperCase()}</p>
                                    </div>
                                    <div className="rounded-xl border-2 border-cyan-200 bg-cyan-50 p-3">
                                      <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Status</p>
                                      <p className="mt-2 text-sm font-black text-cyan-900">Analyzed ✓</p>
                                    </div>
                                  </div>

                                  {/* AI Analysis */}
                                  {report.analysis.result && (
                                    <div className="rounded-xl border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50 to-blue-50 p-4">
                                      <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 mb-2">🤖 AI Insights</p>
                                      <p className="text-sm text-indigo-900 leading-relaxed">{report.analysis.result}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                                  <span className="text-2xl">⏳</span>
                                  <div>
                                    <p className="text-sm font-bold text-amber-900">AI Analysis Pending</p>
                                    <p className="text-xs text-amber-800">Analysis will be available shortly</p>
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 border-t border-slate-200 pt-3">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReport(report.id)}
                                  disabled={deletingReportId === report.id}
                                  className="w-full rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingReportId === report.id ? "Deleting report..." : "Delete This Report"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Modern Sidebar Stats */}
                  <div className="space-y-5">
                    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg sticky top-8">
                      <div className="space-y-2 mb-4">
                        <h3 className="text-xl font-black text-slate-900">Your Stats</h3>
                        <p className="text-xs text-slate-600">Personal report overview</p>
                      </div>

                      <div className="space-y-3">
                        <div className="group rounded-xl border-2 border-teal-200 bg-linear-to-br from-white to-teal-50 p-4 transition-all hover:shadow-lg hover:scale-105">
                          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Total Reports</p>
                          <p className="mt-2 text-3xl font-black text-teal-600">{reports.length}</p>
                          <div className="mt-2 h-1.5 w-full bg-teal-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{width: `${reports.length ? 100 : 0}%`}}></div>
                          </div>
                        </div>

                        <div className="group rounded-xl border-2 border-rose-200 bg-linear-to-br from-white to-rose-50 p-4 transition-all hover:shadow-lg hover:scale-105">
                          <p className="text-xs font-bold uppercase tracking-wide text-rose-700">High Risk</p>
                          <p className="mt-2 text-3xl font-black text-rose-600">{highRisk}</p>
                          <div className="mt-2 h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{width: `${highRisk ? 100 : 0}%`}}></div>
                          </div>
                        </div>

                        <div className="group rounded-xl border-2 border-amber-200 bg-linear-to-br from-white to-amber-50 p-4 transition-all hover:shadow-lg hover:scale-105">
                          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Medium Risk</p>
                          <p className="mt-2 text-3xl font-black text-amber-600">{mediumRisk}</p>
                          <div className="mt-2 h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{width: `${mediumRisk ? 100 : 0}%`}}></div>
                          </div>
                        </div>

                        <div className="group rounded-xl border-2 border-emerald-200 bg-linear-to-br from-white to-emerald-50 p-4 transition-all hover:shadow-lg hover:scale-105">
                          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Low Risk</p>
                          <p className="mt-2 text-3xl font-black text-emerald-600">{lowRisk}</p>
                          <div className="mt-2 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width: `${lowRisk ? 100 : 0}%`}}></div>
                          </div>
                        </div>

                        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 mt-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Latest Submission</p>
                          <p className="mt-2 text-lg font-black text-slate-900">{latestSubmission}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : role === "organization" && isApproved ? (
          <div className="space-y-8">
            {/* Map Section */}
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Reports Map</h2>
                <p className="mt-1 text-slate-600">Visual overview of all submissions across locations</p>
              </div>
              {loading ? (
                <EmptyState title="Loading Map" description="Gathering report data..." />
              ) : reports.length === 0 ? (
                <EmptyState title="No Reports Yet" description="Reports will appear here as they're submitted" />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden">
                  <ReportMap reports={reports} projects={projects} />
                </div>
              )}
            </section>

            {/* Reports Section */}
            <section className="space-y-4">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">All Reports</h2>
                  <p className="mt-1 text-slate-600">{filteredReports.length} of {reports.length} reports</p>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-linear-to-r from-white to-slate-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Search Reports</label>
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Location, description, or reporter..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Filter by Risk</label>
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value as "all" | "high" | "medium" | "low")}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="all">All Risk Levels</option>
                      <option value="high">🔴 High Risk</option>
                      <option value="medium">🟡 Medium Risk</option>
                      <option value="low">🟢 Low Risk</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setRiskFilter("all");
                    }}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>

              {/* Reports List */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500"></div>
                    <p className="mt-4 text-slate-600">Loading reports...</p>
                  </div>
                </div>
              ) : reports.length === 0 ? (
                <EmptyState
                  title="No Reports Available"
                  description="Reports submitted by community members will appear here"
                />
              ) : filteredReports.length === 0 ? (
                <EmptyState
                  title="No Matching Reports"
                  description="Try adjusting your search or filter criteria"
                />
              ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-5">
                    {filteredReports.map((report) => {
                      const riskLevel = (report.analysis?.risk_level || "low").toLowerCase() as "high" | "medium" | "low";
                      const riskColors: Record<"high" | "medium" | "low", string> = {
                        high: "border-rose-300 hover:border-rose-400",
                        medium: "border-amber-300 hover:border-amber-400",
                        low: "border-emerald-300 hover:border-emerald-400"
                      };

                      return (
                        <article
                          key={report.id}
                          className={`group rounded-2xl border-2 ${riskColors[riskLevel]} bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
                        >
                          <div className="flex flex-col gap-5 md:flex-row md:gap-6">
                            {report.photo && (
                              <div className="relative h-40 w-full shrink-0 md:w-48 rounded-xl overflow-hidden">
                                <img
                                  src={report.photo}
                                  alt={report.location}
                                  className="h-full w-full object-cover group-hover:scale-110 transition duration-300"
                                />
                                {report.analysis && (
                                  <div className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300`}>
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full text-white ${
                                      riskLevel === 'high' ? 'bg-rose-500' :
                                      riskLevel === 'medium' ? 'bg-amber-500' :
                                      'bg-emerald-500'
                                    }`}>
                                      {riskLevel.toUpperCase()} RISK
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex-1">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                  <h3 className="text-xl font-black text-slate-900">{report.location}</h3>
                                  {report.user && (
                                    <p className="mt-1 text-sm text-slate-500">by <span className="font-semibold text-slate-700">{report.user}</span></p>
                                  )}
                                </div>
                                {report.date_submitted && (
                                  <span className="shrink-0 whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                                    {new Date(report.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-sm text-slate-700 line-clamp-2 mb-4">{report.description}</p>

                              {/* Analysis Data */}
                              {report.analysis ? (
                                <div className="space-y-4">
                                  {/* Main Metrics */}
                                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                                    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3">
                                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Health</p>
                                      <p className="mt-2 text-2xl font-black text-blue-900">{report.analysis.health_score ?? "N/A"}<span className="text-sm">%</span></p>
                                    </div>
                                    <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-3">
                                      <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Damage</p>
                                      <p className="mt-2 text-lg font-black text-purple-900">{report.analysis.damage_detected ? "✓ Yes" : "✗ No"}</p>
                                    </div>
                                    <div className={`rounded-xl border-2 p-3 ${
                                      riskLevel === 'high' ? 'border-rose-300 bg-rose-50' :
                                      riskLevel === 'medium' ? 'border-amber-300 bg-amber-50' :
                                      'border-emerald-300 bg-emerald-50'
                                    }`}>
                                      <p className={`text-xs font-bold uppercase tracking-wide ${
                                        riskLevel === 'high' ? 'text-rose-700' :
                                        riskLevel === 'medium' ? 'text-amber-700' :
                                        'text-emerald-700'
                                      }`}>Risk</p>
                                      <p className={`mt-2 text-lg font-black ${
                                        riskLevel === 'high' ? 'text-rose-900' :
                                        riskLevel === 'medium' ? 'text-amber-900' :
                                        'text-emerald-900'
                                      }`}>{(report.analysis.risk_level || "UNKNOWN").toUpperCase()}</p>
                                    </div>
                                    <div className="rounded-xl border-2 border-cyan-200 bg-cyan-50 p-3">
                                      <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Status</p>
                                      <p className="mt-2 text-sm font-black text-cyan-900">Analyzed ✓</p>
                                    </div>
                                  </div>

                                  {/* AI Analysis */}
                                  {report.analysis.result && (
                                    <div className="rounded-xl border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50 to-blue-50 p-4">
                                      <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 mb-2">🤖 AI Insights</p>
                                      <p className="text-sm text-indigo-900 leading-relaxed">{report.analysis.result}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                                  <span className="text-2xl">⏳</span>
                                  <div>
                                    <p className="text-sm font-bold text-amber-900">AI Analysis Pending</p>
                                    <p className="text-xs text-amber-800">Analysis will be available shortly</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Modern Sidebar Stats */}
                  <div className="space-y-5">
                    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg sticky top-8">
                      <div className="space-y-2 mb-4">
                        <h3 className="text-xl font-black text-slate-900">Report Stats</h3>
                        <p className="text-xs text-slate-600">Current filter overview</p>
                      </div>

                      <div className="space-y-3">
                        <div className="group rounded-xl border-2 border-rose-200 bg-linear-to-br from-white to-rose-50 p-4 transition-all hover:shadow-lg hover:scale-105">
                          <p className="text-xs font-bold uppercase tracking-wide text-rose-700">High Risk</p>
                          <p className="mt-2 text-3xl font-black text-rose-600">{highRisk}</p>
                          <div className="mt-2 h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{width: `${highRisk ? 100 : 0}%`}}></div>
                          </div>
                        </div>

                        <div className="group rounded-xl border-2 border-amber-200 bg-linear-to-br from-white to-amber-50 p-4 transition-all hover:shadow-lg hover:scale-105">
                          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Medium Risk</p>
                          <p className="mt-2 text-3xl font-black text-amber-600">{mediumRisk}</p>
                          <div className="mt-2 h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{width: `${mediumRisk ? 100 : 0}%`}}></div>
                          </div>
                        </div>

                        <div className="group rounded-xl border-2 border-emerald-200 bg-linear-to-br from-white to-emerald-50 p-4 transition-all hover:shadow-lg hover:scale-105">
                          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Low Risk</p>
                          <p className="mt-2 text-3xl font-black text-emerald-600">{lowRisk}</p>
                          <div className="mt-2 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width: `${lowRisk ? 100 : 0}%`}}></div>
                          </div>
                        </div>

                        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 mt-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Latest Submission</p>
                          <p className="mt-2 text-lg font-black text-slate-900">{latestSubmission}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Projects Section */}
            {projects.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Restoration Projects</h2>
                  <p className="mt-1 text-slate-600">{projects.length} active projects</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => {
                    const totalTrees = project.events?.reduce((sum: number, e: RestorationEvent) => sum + e.trees_planted, 0) || 0;
                    const statusColor: Record<string, string> = {
                      ongoing: "bg-blue-100 text-blue-800 border-blue-300",
                      completed: "bg-green-100 text-green-800 border-green-300",
                      planned: "bg-slate-100 text-slate-800 border-slate-300",
                    };

                    return (
                      <article
                        key={project.id}
                        className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-lg transition"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColor[project.status] || statusColor.planned}`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-700 line-clamp-2 mb-3">{project.description}</p>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="rounded-lg bg-slate-100 p-2">
                            <p className="text-xs text-slate-600">Location</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{project.location}</p>
                          </div>
                          <div className="rounded-lg bg-slate-100 p-2">
                            <p className="text-xs text-slate-600">Started</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(project.start_date).toLocaleDateString()}</p>
                          </div>
                          <div className="rounded-lg bg-slate-100 p-2">
                            <p className="text-xs text-slate-600">Events</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{project.events?.length || 0}</p>
                          </div>
                          <div className="rounded-lg bg-green-100 p-2">
                            <p className="text-xs text-green-700 font-semibold">Trees 🌳</p>
                            <p className="mt-1 text-sm font-bold text-green-800">{totalTrees}</p>
                          </div>
                        </div>

                        {project.events && project.events.length > 0 && (
                          <div className="border-t border-slate-200 pt-3">
                            <p className="text-xs font-semibold text-slate-600 mb-2">Recent Activity</p>
                            <div className="space-y-1">
                              {project.events.slice(0, 2).map((event: RestorationEvent) => (
                                <div key={event.id} className="flex justify-between text-xs bg-slate-100 p-2 rounded">
                                  <span className="text-slate-700">{new Date(event.date).toLocaleDateString()}</span>
                                  <span className="font-semibold text-green-700">+{event.trees_planted}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : role === "organization" && !isApproved ? (
          <EmptyState
            title="⏳ Awaiting Approval"
            description="Your organization account is under review. Once approved by an administrator, you'll have access to the full dashboard."
          />
        ) : null}
      </div>
    </div>
  );
}

