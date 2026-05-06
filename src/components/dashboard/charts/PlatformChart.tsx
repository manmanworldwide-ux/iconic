"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS: Record<string, string> = {
  Booking:      "#003580",
  "Booking.com":"#003580",
  Airbnb:       "#FF5A5F",
  agoda:        "#5392F9",
  Direct:       "#10b981",
  VRBO:         "#3D5AFE",
  Other:        "#9ca3af",
};

interface Props {
  data: { platform: string; total: number }[];
}

export default function PlatformChart({ data }: Props) {
  const cleaned = data
    .filter((d) => d.total > 0)
    .map((d) => ({ name: d.platform || "Other", value: Math.round(d.total) }))
    .sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={cleaned}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {cleaned.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#9ca3af"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(v) => [`€${Number(v).toLocaleString()}`, undefined]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
