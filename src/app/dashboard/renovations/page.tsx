import { createClient } from "@/lib/supabase/server";
import RenovationChart from "@/components/dashboard/charts/RenovationChart";
import StatCard from "@/components/dashboard/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Renovations — Iconic Dashboard" };

function fmt(n: number) { return `€${Math.round(n).toLocaleString("en-US")}`; }

export default async function RenovationsPage() {
  const supabase = await createClient();

  const { data: rows = [] } = await supabase
    .from("renovations")
    .select("property, service, total, paid_by_bruce, paid_by_enol, paid_by_oren, paid_by_iconic_group, month, comments")
    .order("created_at", { ascending: true });

  const all = rows ?? [];

  const sum = (key: keyof typeof all[0]) => all.reduce((a, r) => a + (Number(r[key]) || 0), 0);

  const totalSpend = sum("total");
  const bruceTotal = sum("paid_by_bruce");
  const enolTotal  = sum("paid_by_enol");
  const orenTotal  = sum("paid_by_oren");
  const iconicTotal= sum("paid_by_iconic_group");

  // ── Per-property breakdown ────────────────────────────────────────────────
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

  // ── Top expense lines ─────────────────────────────────────────────────────
  const topItems = [...all]
    .filter((r) => Number(r.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 30);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Renovations</h1>
        <p className="text-sm text-gray-500">All renovation expenses across properties</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Spend"    value={fmt(totalSpend)} icon="🏗️" />
        <StatCard label="Bruce's Share"  value={fmt(bruceTotal)} sub={`${totalSpend > 0 ? ((bruceTotal/totalSpend)*100).toFixed(0) : 0}%`} icon="👤" />
        <StatCard label="Enol's Share"   value={fmt(enolTotal)}  sub={`${totalSpend > 0 ? ((enolTotal/totalSpend)*100).toFixed(0) : 0}%`} icon="👤" />
        <StatCard label="Oren's Share"   value={fmt(orenTotal)}  sub={`${totalSpend > 0 ? ((orenTotal/totalSpend)*100).toFixed(0) : 0}%`} icon="👤" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Spend by Property</h2>
          <p className="text-xs text-gray-400 mb-4">Stacked by partner contribution</p>
          <RenovationChart data={chartData} />
        </div>

        {/* Partner summary */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Partner Contribution Summary</h2>
          <div className="space-y-4">
            {[
              { name: "Bruce",       amount: bruceTotal, color: "bg-sky-500" },
              { name: "Enol",        amount: enolTotal,  color: "bg-violet-500" },
              { name: "Oren",        amount: orenTotal,  color: "bg-emerald-500" },
              { name: "Iconic Group",amount: iconicTotal,color: "bg-amber-500" },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{p.name}</span>
                  <span className="font-semibold text-gray-900">{fmt(p.amount)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${p.color}`}
                    style={{ width: `${totalSpend > 0 ? (p.amount / totalSpend) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {totalSpend > 0 ? ((p.amount / totalSpend) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-700">Total Renovation Spend</span>
              <span className="text-gray-900">{fmt(totalSpend)}</span>
            </div>
            {iconicTotal > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                + {fmt(iconicTotal)} from Iconic Group account
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top expense lines */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Expense Lines ({topItems.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                <th className="pb-2 pr-4">Property</th>
                <th className="pb-2 pr-4">Service</th>
                <th className="pb-2 pr-4">Month</th>
                <th className="pb-2 pr-4 text-right">Total</th>
                <th className="pb-2 pr-4 text-right">Bruce</th>
                <th className="pb-2 pr-4 text-right">Enol</th>
                <th className="pb-2 text-right">Oren</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topItems.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 pr-4">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {r.property || "—"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{r.service || "—"}</td>
                  <td className="py-2 pr-4 text-gray-500 text-xs">{r.month || "—"}</td>
                  <td className="py-2 pr-4 text-right font-semibold text-gray-900">{fmt(Number(r.total))}</td>
                  <td className="py-2 pr-4 text-right text-sky-700">{Number(r.paid_by_bruce) > 0 ? fmt(Number(r.paid_by_bruce)) : "—"}</td>
                  <td className="py-2 pr-4 text-right text-violet-700">{Number(r.paid_by_enol) > 0 ? fmt(Number(r.paid_by_enol)) : "—"}</td>
                  <td className="py-2 text-right text-emerald-700">{Number(r.paid_by_oren) > 0 ? fmt(Number(r.paid_by_oren)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
