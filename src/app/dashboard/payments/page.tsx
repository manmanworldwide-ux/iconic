import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments — Iconic Dashboard" };

function fmt(n: number) { return `€${Math.round(n).toLocaleString("en-US")}`; }

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: rows = [] } = await supabase
    .from("payments")
    .select("*")
    .order("year", { ascending: false });

  const all = rows ?? [];
  const totalEuro   = all.reduce((a, r) => a + (Number(r.total_euro) || 0), 0);
  const orenTotal   = all.reduce((a, r) => a + (Number(r.oren) || 0), 0);
  const enolTotal   = all.reduce((a, r) => a + (Number(r.enol) || 0), 0);

  // Payment method breakdown
  const methods: Record<string, number> = {};
  for (const r of all) {
    const m = (r.paid_via || "Unknown").trim();
    methods[m] = (methods[m] || 0) + (Number(r.total_euro) || 0);
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500">Deal payments log — Terrace</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Payments"   value={fmt(totalEuro)}  icon="💶" />
        <StatCard label="To Oren"          value={fmt(orenTotal)}  icon="👤" sub={`${totalEuro > 0 ? ((orenTotal/totalEuro)*100).toFixed(0) : 0}%`} />
        <StatCard label="To Enol"          value={fmt(enolTotal)}  icon="👤" sub={`${totalEuro > 0 ? ((enolTotal/totalEuro)*100).toFixed(0) : 0}%`} />
        <StatCard label="Transactions"     value={String(all.length)} icon="🧾" />
      </div>

      {/* Payment method summary */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">By Payment Method</h2>
          <div className="space-y-3">
            {Object.entries(methods).sort(([,a],[,b]) => b - a).map(([method, amount]) => (
              <div key={method}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{method}</span>
                  <span className="font-semibold text-gray-900">{fmt(amount)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-brand-500"
                    style={{ width: `${totalEuro > 0 ? (amount / totalEuro) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner balance */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Partner Distribution</h2>
          <div className="space-y-4">
            {[
              { name: "Oren",  amount: orenTotal,  color: "bg-emerald-500" },
              { name: "Enol",  amount: enolTotal,  color: "bg-violet-500"  },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{p.name}</span>
                  <span className="font-bold text-gray-900">{fmt(p.amount)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${p.color}`}
                    style={{ width: `${totalEuro > 0 ? (p.amount / totalEuro) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {totalEuro > 0 ? ((p.amount / totalEuro) * 100).toFixed(1) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder for additional analysis */}
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 flex items-center justify-center">
          <p className="text-sm text-gray-400 text-center">More payment analysis coming soon</p>
        </div>
      </div>

      {/* Full payment log */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Payment Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                <th className="pb-2 pr-4">Year</th>
                <th className="pb-2 pr-4">Month</th>
                <th className="pb-2 pr-4">Day</th>
                <th className="pb-2 pr-4">Currency</th>
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2 pr-4 text-right">Total €</th>
                <th className="pb-2 pr-4 text-right">Oren</th>
                <th className="pb-2 pr-4 text-right">Enol</th>
                <th className="pb-2">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {all.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 pr-4 text-gray-600">{r.year}</td>
                  <td className="py-2 pr-4 text-gray-600">{r.month}</td>
                  <td className="py-2 pr-4 text-gray-600">{r.day}</td>
                  <td className="py-2 pr-4 text-gray-600">{r.currency}</td>
                  <td className="py-2 pr-4">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {r.paid_via || "—"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right font-semibold text-gray-900">{Number(r.total_euro) > 0 ? fmt(Number(r.total_euro)) : "—"}</td>
                  <td className="py-2 pr-4 text-right text-emerald-700">{Number(r.oren) > 0 ? fmt(Number(r.oren)) : "—"}</td>
                  <td className="py-2 pr-4 text-right text-violet-700">{Number(r.enol) > 0 ? fmt(Number(r.enol)) : "—"}</td>
                  <td className="py-2 text-gray-500 text-xs">{r.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
