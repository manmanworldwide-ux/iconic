"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface Props {
  data: { month: number; year: number; gross: number; net: number; commission: number; mgmt: number }[];
}

export default function MonthlyBarChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: `${MONTHS[d.month - 1]} '${String(d.year).slice(2)}`,
    "Net Income":     Math.round(d.net),
    "Mgmt Fee":       Math.round(d.mgmt),
    "Commission":     Math.round(d.commission),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(v) => [`€${Number(v).toLocaleString()}`, undefined]}
        />
        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar dataKey="Net Income" stackId="a" fill="#10b981" />
        <Bar dataKey="Mgmt Fee"   stackId="a" fill="#0ea5e9" />
        <Bar dataKey="Commission" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
