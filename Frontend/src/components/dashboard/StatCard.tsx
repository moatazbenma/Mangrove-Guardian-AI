interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatCard({ label, value, color = "slate" }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    slate: "text-slate-900",
    rose: "text-rose-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    teal: "text-teal-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm hover:shadow-md transition">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
