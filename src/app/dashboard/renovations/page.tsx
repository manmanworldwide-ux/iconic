import { createClient } from "@/lib/supabase/server";
import RenovationChart from "@/components/dashboard/charts/RenovationChart";
import StatCard from "@/components/dashboard/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Renovations" };

function fmt(n: number) { return `€${Math.round(n).toLocaleString("en-US")}`; }

export default async function RenovationsPage() {
  const supabase = await createClient();

  const { data: rows = [] } = await supabase
    .from("renovations")
    .select("property,service,total,paid_by_bruce,paid_by_enol,paid_by_oren,paid_by_iconic_group,month");

  const all = rows ?? [];
  const sum = (k: keyof typeof all[0]) => all.reduce((a, r) => a + (Number(r[k]) || 0), 0);

  const totalSpend = sum("total");
  const bruceTotal = sum("paid_by_bruce");
  const enolTotal  = sum("paid_by_enol");
  const orenTotal  = sum("paid_by_oren");
  const iconicTotal= sum("paid_by_iconic_group");

  const propMap: Record<string, { total: number; bruce: number; enol: number; oren: number; iconic: number }> = {};
  for (const r of all) {
    const p = (r.property || "General").trim() || "General";
    if (!propMap[p]) propMap[p] = { total: 0, bruce: 0, enol: 0, oren: 0, iconic: 0 };
    propMap[p].total  += Number(r.total) || 0;
    propMap[p].bruce  += Number(r.paid_by_bruce) || 0;
    propMap[p].enol   += Number(r.paid_by_enol) || 0;
    propMap[p].oren   += Number(r.paid_by_oren) || 0;
    propMap[p].iconic += Number(r.paid_by_iconic_group) || 0;
  }
  const chartData = Object.entries(propMap)
    .map(([property, v]) => ({ property, ...v }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);

  const partners = [
    { name: "Bruce",  amount: bruceTotal,  pct: totalSpend > 0 ? (bruceTotal/totalSpend)*100 : 0, color: "bg-sky-500" },
    { name: "Enol",   amount: enolTotal,   pct: totalSpend > 0 ? (enolTotal/totalSpend)*100  : 0, color: "bg-violet-500" },
    { name: "Oren",   amount: orenTotal,   pct: totalSpend > 0 ? (orenTotal/totalSpend)*100  : 0, color: "bg-emerald-500" },
    { name: "Iconic", amount: iconicTotal, pct: totalSpend > 0 ? (iconicTotal/totalSpend)*100: 0, color: "bg-amber-500" },
  ];

  const topItems = [...all]
    .filter((r) => Number(r.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 20);

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Expenses</p>
        <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Renovations</h1>
        <p className="text-xs text-gray-400">All renovation spend across properties</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4 mb-5">
        <StatCard label="Total Spend" value={fmt(totalSpend)} icon="🏗️" />
        <StatCard label="Bruce"       value={fmt(bruceTotal)} sub={`${bruceTotal>0?((bruceTotal/totalSpend)*100).toFixed(0):0}%`} icon="👤" />
        <StatCard label="Enol"        value={fmt(enolTotal)}  sub={`${enolTotal>0?((enolTotal/totalSpend)*100).toFixed(0):0}%`} icon="👤" />
        <StatCard label="Oren"        value={fmt(orenTotal)}  sub={`${orenTotal>0?((orenTotal/totalSpend)*100).toFixed(0):0}%`} icon="👤" />
      </div>

      {/* Partner bars */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Partner Contributions</p>
        <div className="space-y-3">
          {partners.map((p) => (
            <div key={p.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{p.name}</span>
                <span className="font-bold text-gray-900">{fmt(p.amount)} <span className="text-xs font-normal text-gray-400">({p.pct.toFixed(0)}%)</span></span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div className={`h-2 rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Spend by Property</p>
        <p className="text-[11px] text-gray-400 mb-3">Stacked by partner</p>
        <RenovationChart data={chartData} />
      </div>

      {/* Top expenses — card list */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Expenses</p>
        <div className="space-y-2">
          {topItems.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{r.service || "—"}</p>
                <p className="text-xs text-gray-400">{r.property || "—"} · {r.month || "—"}</p>
              </div>
              <p className="ml-3 shrink-0 text-sm font-bold text-gray-900">{fmt(Number(r.total))}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
