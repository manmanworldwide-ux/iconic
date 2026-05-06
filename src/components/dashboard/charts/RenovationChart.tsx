"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  data: { property: string; bruce: number; enol: number; oren: number; iconic: number }[];
}

export default function RenovationChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="property" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(v) => [`€${Number(v).toLocaleString()}`, undefined]}
        />
        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar dataKey="bruce"  name="Bruce"  stackId="a" fill="#0ea5e9" radius={[0,0,0,0]} />
        <Bar dataKey="enol"   name="Enol"   stackId="a" fill="#8b5cf6" />
        <Bar dataKey="oren"   name="Oren"   stackId="a" fill="#10b981" />
        <Bar dataKey="iconic" name="Iconic Group" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
