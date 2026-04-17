import type { RestorationProject } from "../../types";

export function ProjectCard({ project }: { project: RestorationProject }) {
  const totalTreesPlanted = project.events.reduce(
    (sum, event) => sum + event.trees_planted,
    0
  );

  const statusColors: Record<string, string> = {
    planned: "bg-slate-100 text-slate-700",
    ongoing: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-slate-900">{project.name}</p>
          <p className="text-xs text-slate-500 mt-1">{project.location}</p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            statusColors[project.status] || statusColors.planned
          }`}
        >
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>

      <p className="text-sm text-slate-600 mt-3">{project.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-emerald-50 rounded p-2">
          <p className="text-xs text-slate-500">Trees Planted</p>
          <p className="text-xl font-bold text-emerald-700">{totalTreesPlanted}</p>
        </div>
        <div className="bg-blue-50 rounded p-2">
          <p className="text-xs text-slate-500">Events</p>
          <p className="text-xl font-bold text-blue-700">{project.events.length}</p>
        </div>
      </div>
    </div>
  );
}
