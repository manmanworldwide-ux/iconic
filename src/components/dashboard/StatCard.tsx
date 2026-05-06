interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

export default function StatCard({ label, value, sub, trend, icon }: StatCardProps) {
  const trendColor =
    trend === "up" ? "text-emerald-600" :
    trend === "down" ? "text-red-500" : "text-gray-400";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        {icon && <span className="text-lg leading-none">{icon}</span>}
      </div>
      <p className="text-xl font-black text-gray-900 lg:text-2xl">{value}</p>
      {sub && <p className={`mt-0.5 text-[11px] font-medium ${trendColor}`}>{sub}</p>}
    </div>
  );
}
