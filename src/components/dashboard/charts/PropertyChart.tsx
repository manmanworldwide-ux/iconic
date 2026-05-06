"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

const COLORS: Record<string, string> = {
  Terrace:  "#0ea5e9",
  Suites:   "#8b5cf6",
  Studio:   "#10b981",
  Palazzo:  "#f59e0b",
  Hotel:    "#ef4444",
};

interface Props {
  data: { property: string; gross: number; net: number; bookings: number }[];
  mode?: "revenue" | "bookings";
}

export default function PropertyChart({ data, mode = "revenue" }: Props) {
  const sorted = [...data].sort((a, b) => b.gross - a.gross);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sorted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="property" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false}
          tickFormatter={(v) => mode === "revenue" ? `€${(v/1000).toFixed(0)}k` : String(v)} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(v, name) =>
            name === "bookings" ? [Number(v), "Bookings"] : [`€${Number(v).toLocaleString()}`, String(name)]
          }
        />
        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {mode === "revenue" ? (
          <>
            <Bar dataKey="gross" name="Gross" radius={[4, 4, 0, 0]}>
              {sorted.map((e) => <Cell key={e.property} fill={COLORS[e.property] ?? "#9ca3af"} opacity={0.4} />)}
            </Bar>
            <Bar dataKey="net" name="Net" radius={[4, 4, 0, 0]}>
              {sorted.map((e) => <Cell key={e.property} fill={COLORS[e.property] ?? "#9ca3af"} />)}
            </Bar>
          </>
        ) : (
          <Bar dataKey="bookings" name="Bookings" radius={[4, 4, 0, 0]}>
            {sorted.map((e) => <Cell key={e.property} fill={COLORS[e.property] ?? "#9ca3af"} />)}
          </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
