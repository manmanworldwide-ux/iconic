"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface Props {
  data: { month: number; year: number; gross: number; net: number; commission: number }[];
}

export default function RevenueChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: `${MONTHS[d.month - 1]} ${String(d.year).slice(2)}`,
    "Gross Revenue": Math.round(d.gross),
    "Net Income":    Math.round(d.net),
    "Commission":    Math.round(d.commission),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}    />
          </linearGradient>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(v) => [`€${Number(v).toLocaleString()}`, undefined]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area type="monotone" dataKey="Gross Revenue" stroke="#0ea5e9" strokeWidth={2} fill="url(#grossGrad)" />
        <Area type="monotone" dataKey="Net Income"    stroke="#10b981" strokeWidth={2} fill="url(#netGrad)" />
        <Area type="monotone" dataKey="Commission"    stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
