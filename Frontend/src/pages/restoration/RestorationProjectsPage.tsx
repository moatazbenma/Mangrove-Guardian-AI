import { useEffect, useMemo, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { RestorationEvent, RestorationProject } from "../../types";

interface ProjectFormState {
  name: string;
  description: string;
  location: string;
  lat: string;
  lng: string;
  start_date: string;
  end_date: string;
  status: "planned" | "ongoing" | "completed";
}

interface EventFormState {
  project: string;
  trees_planted: string;
  description: string;
  date: string;
}

const initialProjectForm: ProjectFormState = {
  name: "",
  description: "",
  location: "",
  lat: "",
  lng: "",
  start_date: "",
  end_date: "",
  status: "planned",
};

const initialEventForm: EventFormState = {
  project: "",
  trees_planted: "",
  description: "",
  date: "",
};

function normalizeList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

const createProjectIcon = () => {
  return L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

function ProjectMapClickHandler({
  setProjectForm,
}: {
  setProjectForm: Dispatch<SetStateAction<ProjectFormState>>;
}) {
  useMapEvents({
    click(e) {
      setProjectForm((prev) => ({
        ...prev,
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6),
      }));
    },
  });

  return null;
}

export function RestorationProjectsPage() {
  const navigate = useNavigate();
  const { role, isApproved, logout } = useAuth();

  const [projects, setProjects] = useState<RestorationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState<ProjectFormState>(initialProjectForm);
  const [eventForm, setEventForm] = useState<EventFormState>(initialEventForm);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Record<number, RestorationProject["status"]>>({});
  const [savingStatus, setSavingStatus] = useState<Record<number, boolean>>({});
  const [projectError, setProjectError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalTrees = useMemo(
    () => projects.reduce((sum, p) => sum + (p.events?.reduce((eventSum, e) => eventSum + e.trees_planted, 0) || 0), 0),
    [projects]
  );

  const totalEvents = useMemo(
    () => projects.reduce((sum, p) => sum + (p.events?.length || 0), 0),
    [projects]
  );

  const projectMapCenter: [number, number] =
    projectForm.lat && projectForm.lng
      ? [Number(projectForm.lat), Number(projectForm.lng)]
      : [-6.9175, 107.6191];

  const loadProjects = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await api.get("/projects/");
      const data = normalizeList<RestorationProject>(res.data);
      setProjects(data);
      setEditingStatus(
        data.reduce((acc, project) => {
          acc[project.id] = project.status;
          return acc;
        }, {} as Record<number, RestorationProject["status"]>)
      );

      if (!eventForm.project && data.length > 0) {
        setEventForm((prev) => ({ ...prev, project: String(data[0].id) }));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to load restoration projects.";
      setPageError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    setProjectError(null);
    setSuccessMessage(null);

    if (!projectForm.name.trim() || !projectForm.description.trim() || !projectForm.location.trim() || !projectForm.start_date) {
      setProjectError("Name, description, location, and start date are required.");
      return;
    }

    if (!projectForm.lat.trim() || !projectForm.lng.trim()) {
      setProjectError("Please click on the map to set project coordinates.");
      return;
    }

    setCreatingProject(true);
    try {
      const payload = {
        ...projectForm,
        lat: projectForm.lat.trim() ? Number(projectForm.lat) : null,
        lng: projectForm.lng.trim() ? Number(projectForm.lng) : null,
        end_date: projectForm.end_date.trim() ? projectForm.end_date : null,
      };

      await api.post("/projects/", payload);
      setProjectForm(initialProjectForm);
      setSuccessMessage("Project created successfully.");
      await loadProjects();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to create project.";
      setProjectError(msg);
    } finally {
      setCreatingProject(false);
    }
  };

  const onCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    setEventError(null);
    setSuccessMessage(null);

    if (!eventForm.project || !eventForm.trees_planted || !eventForm.date || !eventForm.description.trim()) {
      setEventError("Project, trees planted, date, and description are required.");
      return;
    }

    setCreatingEvent(true);
    try {
      const payload = {
        project: Number(eventForm.project),
        trees_planted: Number(eventForm.trees_planted),
        description: eventForm.description,
        date: eventForm.date,
      };
      await api.post("/events/", payload);
      setEventForm((prev) => ({ ...initialEventForm, project: prev.project }));
      setSuccessMessage("Restoration event added successfully.");
      await loadProjects();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to add restoration event.";
      setEventError(msg);
    } finally {
      setCreatingEvent(false);
    }
  };

  const onSaveProjectStatus = async (projectId: number) => {
    const targetStatus = editingStatus[projectId];
    if (!targetStatus) return;

    setPageError(null);
    setSuccessMessage(null);
    setSavingStatus((prev) => ({ ...prev, [projectId]: true }));

    try {
      await api.patch(`/projects/${projectId}/`, { status: targetStatus });
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId ? { ...project, status: targetStatus } : project
        )
      );
      setSuccessMessage("Project status updated successfully.");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to update project status.";
      setPageError(msg);
    } finally {
      setSavingStatus((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  if (role !== "organization") {
    return (
      <div className="app-shell min-h-screen bg-linear-to-b from-emerald-50 via-cyan-50/40 to-sky-50 flex items-center justify-center p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border-2 border-amber-300 bg-linear-to-br from-amber-50 to-orange-50 p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <span className="shrink-0 text-4xl">🔒</span>
            <div>
              <h1 className="text-3xl font-black text-amber-900">Organization Access Only</h1>
              <p className="mt-3 text-amber-800">Only organization accounts can manage restoration projects. Please upgrade your account.</p>
              <button 
                className="mt-6 rounded-xl bg-amber-600 px-6 py-3 font-bold text-white transition-all duration-300 hover:bg-amber-700 hover:shadow-lg"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="app-shell min-h-screen bg-linear-to-b from-emerald-50 via-cyan-50/40 to-sky-50 flex items-center justify-center p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border-2 border-amber-300 bg-linear-to-br from-amber-50 to-orange-50 p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <span className="shrink-0 text-4xl">⏳</span>
            <div>
              <h1 className="text-3xl font-black text-amber-900">Awaiting Approval</h1>
              <p className="mt-3 text-amber-800">Your organization account is pending admin verification. Full access will be granted once approved.</p>
              <button 
                className="mt-6 rounded-xl bg-amber-600 px-6 py-3 font-bold text-white transition-all duration-300 hover:bg-amber-700 hover:shadow-lg"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-linear-to-b from-emerald-50 via-cyan-50/40 to-sky-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-12">
        {/* Enhanced Header */}
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wide">
                Restoration Management
              </div>
              <h1 className="mt-3 text-5xl font-black text-slate-900 md:text-6xl">
                Restoration Projects
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                Create, track, and manage restoration projects and monitor their impact
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                className="rounded-xl border-2 border-slate-300 px-6 py-3 font-bold text-slate-900 transition-all duration-300 hover:bg-slate-50"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
              <button 
                className="rounded-xl border-2 border-slate-300 px-6 py-3 font-bold text-slate-900 transition-all duration-300 hover:bg-red-50 hover:border-red-300"
                onClick={() => logout()}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {successMessage && (
            <div className="flex items-start gap-4 rounded-2xl border-l-4 border-emerald-500 bg-linear-to-r from-emerald-50 to-teal-50 p-5 md:p-6 shadow-sm">
              <span className="shrink-0 text-3xl">✓</span>
              <div>
                <p className="font-bold text-emerald-900 text-lg">{successMessage}</p>
              </div>
            </div>
          )}

          {pageError && (
            <div className="flex items-start gap-4 rounded-2xl border-l-4 border-red-500 bg-linear-to-r from-red-50 to-rose-50 p-5 md:p-6 shadow-sm">
              <span className="shrink-0 text-3xl">❌</span>
              <div>
                <p className="font-bold text-red-900 text-lg">{pageError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="group rounded-2xl border-2 border-teal-200 bg-linear-to-br from-white to-teal-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="text-teal-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-teal-700">Total Projects</p>
            <p className="mt-2 text-4xl font-black text-teal-600">{projects.length}</p>
          </div>
          <div className="group rounded-2xl border-2 border-cyan-200 bg-linear-to-br from-white to-cyan-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="text-cyan-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-cyan-700">Total Events</p>
            <p className="mt-2 text-4xl font-black text-cyan-600">{totalEvents}</p>
          </div>
          <div className="group rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-white to-emerald-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="text-emerald-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-emerald-700">Trees Planted</p>
            <p className="mt-2 text-4xl font-black text-emerald-600">{totalTrees}</p>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          {/* Create Project Form */}
          <form className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg" onSubmit={onCreateProject}>
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-black text-slate-900">Create Project</h2>
              <p className="text-slate-600">Add a new restoration initiative</p>
            </div>

            {projectError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-700">
                {projectError}
              </div>
            )}

            {/* Map Container */}
            <div className="mb-5 overflow-hidden rounded-xl border-2 border-emerald-200">
              <div className="border-b-2 border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">📍 Click on map to set coordinates</p>
              </div>
              <MapContainer
                center={projectMapCenter}
                zoom={projectForm.lat && projectForm.lng ? 12 : 7}
                className="h-72 w-full z-0"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ProjectMapClickHandler setProjectForm={setProjectForm} />
                {projectForm.lat && projectForm.lng ? (
                  <Marker position={[Number(projectForm.lat), Number(projectForm.lng)]} icon={createProjectIcon()}>
                    <Popup>Project location</Popup>
                  </Marker>
                ) : null}
              </MapContainer>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Project Name</label>
                <input
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                  placeholder="e.g., Coastal Mangrove Restoration"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Description</label>
                <textarea
                  className="min-h-24 w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                  placeholder="Describe the project goals and scope..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Location Name</label>
                <input
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                  placeholder="e.g., Bay of Bengal, Indonesia"
                  value={projectForm.location}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Latitude</label>
                  <input
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    placeholder="Auto-filled from map"
                    value={projectForm.lat}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Longitude</label>
                  <input
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    placeholder="Auto-filled from map"
                    value={projectForm.lng}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Start Date</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                    value={projectForm.start_date}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                    value={projectForm.end_date}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Status</label>
                <select
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                  value={projectForm.status}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, status: e.target.value as ProjectFormState["status"] }))}
                >
                  <option value="planned">Planned</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition-all duration-300 hover:bg-emerald-700 hover:shadow-lg disabled:opacity-50" 
              disabled={creatingProject}
            >
              {creatingProject ? "Creating..." : "✨ Create Project"}
            </button>
          </form>

          {/* Add Restoration Event Form */}
          <form className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg" onSubmit={onCreateEvent}>
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-black text-slate-900">Add Event</h2>
              <p className="text-slate-600">Log a restoration activity or achievement</p>
            </div>

            {eventError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-700">
                {eventError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Select Project</label>
                <select
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                  value={eventForm.project}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, project: e.target.value }))}
                  required
                >
                  <option value="">Choose a project...</option>
                  {projects.length === 0 ? (
                    <option value="" disabled>No projects available</option>
                  ) : null}
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Trees Planted</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                  placeholder="e.g., 50"
                  value={eventForm.trees_planted}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, trees_planted: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Event Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                  value={eventForm.date}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Description</label>
                <textarea
                  className="min-h-24 w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                  placeholder="Describe the restoration activity..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="mt-6 w-full rounded-xl bg-teal-600 px-6 py-3 font-bold text-white transition-all duration-300 hover:bg-teal-700 hover:shadow-lg disabled:opacity-50" 
              disabled={creatingEvent || projects.length === 0}
            >
              {creatingEvent ? "Saving..." : "📝 Add Event"}
            </button>
          </form>
        </section>

        {/* Projects Overview Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Active Projects</h2>
          </div>
          {loading ? (
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-600 font-semibold">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-slate-600 font-semibold">No projects yet. Create your first restoration project using the form above.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const projectTrees = project.events?.reduce((sum, event) => sum + event.trees_planted, 0) || 0;
                const selectedStatus = editingStatus[project.id] || project.status;
                const isStatusChanged = selectedStatus !== project.status;
                const isSaving = !!savingStatus[project.id];
                
                const statusColor = {
                  planned: 'bg-blue-100 text-blue-700 border-blue-200',
                  ongoing: 'bg-orange-100 text-orange-700 border-orange-200',
                  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200'
                }[project.status];

                return (
                  <article key={project.id} className="group rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-teal-300">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-slate-900">{project.name}</h3>
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{project.description}</p>
                        </div>
                        <span className={`shrink-0 inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusColor}`}>
                          {project.status}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>📍</span>
                        <span>{project.location}</span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                          <p className="text-xs font-semibold text-slate-600 uppercase">Start Date</p>
                          <p className="mt-2 text-sm font-bold text-slate-900">{new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="rounded-xl bg-cyan-50 border border-cyan-200 p-3">
                          <p className="text-xs font-semibold text-cyan-700 uppercase">Events</p>
                          <p className="mt-2 text-sm font-bold text-cyan-900">{project.events?.length || 0}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                          <p className="text-xs font-semibold text-emerald-700 uppercase">Trees</p>
                          <p className="mt-2 text-sm font-bold text-emerald-900">{projectTrees}</p>
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-3">Update Status</p>
                        <div className="flex gap-2">
                          <select
                            className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                            value={selectedStatus}
                            onChange={(e) =>
                              setEditingStatus((prev) => ({
                                ...prev,
                                [project.id]: e.target.value as RestorationProject["status"],
                              }))
                            }
                            disabled={isSaving}
                          >
                            <option value="planned">Planned</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            type="button"
                            className="rounded-lg bg-teal-600 px-4 py-2 font-bold text-white transition-all duration-300 hover:bg-teal-700 hover:shadow-lg disabled:opacity-50"
                            disabled={!isStatusChanged || isSaving}
                            onClick={() => onSaveProjectStatus(project.id)}
                          >
                            {isSaving ? "..." : "✓"}
                          </button>
                        </div>
                      </div>

                      {/* Events List */}
                      {project.events && project.events.length > 0 ? (
                        <div className="border-t-2 border-slate-200 pt-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-3">Recent Events</p>
                          <div className="space-y-2">
                            {project.events.slice(0, 3).map((event: RestorationEvent) => (
                              <div key={event.id} className="rounded-lg bg-linear-to-r from-teal-50 to-cyan-50 border border-teal-200 p-3 text-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-slate-900">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  <span className="inline-block bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">🌱 +{event.trees_planted}</span>
                                </div>
                                <p className="text-slate-600 line-clamp-2">{event.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
