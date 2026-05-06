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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className={`mt-1 text-xs font-medium ${trendColor}`}>{sub}</p>}
    </div>
  );
}
