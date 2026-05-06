import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments" };

function fmt(n: number) { return `€${Math.round(n).toLocaleString("en-US")}`; }

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: rows = [] } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  const all = rows ?? [];
  const totalEuro = all.reduce((a, r) => a + (Number(r.total_euro) || 0), 0);
  const orenTotal = all.reduce((a, r) => a + (Number(r.oren) || 0), 0);
  const enolTotal = all.reduce((a, r) => a + (Number(r.enol) || 0), 0);

  const methods: Record<string, number> = {};
  for (const r of all) {
    const m = (r.paid_via || "Unknown").trim();
    methods[m] = (methods[m] || 0) + (Number(r.total_euro) || 0);
  }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Finance</p>
        <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Payments</h1>
        <p className="text-xs text-gray-400">Deal payment log — Terrace</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4 mb-5">
        <StatCard label="Total"        value={fmt(totalEuro)} icon="💶" />
        <StatCard label="To Oren"      value={fmt(orenTotal)} sub={`${totalEuro>0?((orenTotal/totalEuro)*100).toFixed(0):0}%`} icon="👤" />
        <StatCard label="To Enol"      value={fmt(enolTotal)} sub={`${totalEuro>0?((enolTotal/totalEuro)*100).toFixed(0):0}%`} icon="👤" />
        <StatCard label="Transactions" value={String(all.length)} icon="🧾" />
      </div>

      {/* Payment method bars */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">By Method</p>
        <div className="space-y-3">
          {Object.entries(methods).sort(([,a],[,b]) => b-a).map(([method, amount]) => (
            <div key={method}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 font-medium">{method}</span>
                <span className="font-bold text-gray-900">{fmt(amount)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-brand-500"
                  style={{ width: `${totalEuro > 0 ? (amount/totalEuro)*100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner split */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Partner Split</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Oren", amount: orenTotal, color: "bg-emerald-500", text: "text-emerald-600" },
            { name: "Enol", amount: enolTotal, color: "bg-violet-500",  text: "text-violet-600"  },
          ].map((p) => (
            <div key={p.name} className="rounded-xl bg-gray-50 p-3 text-center">
              <p className={`text-2xl font-black ${p.text}`}>{fmt(p.amount)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{p.name}</p>
              <p className="text-[10px] text-gray-400">{totalEuro>0?((p.amount/totalEuro)*100).toFixed(1):0}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                <div className={`h-1.5 rounded-full ${p.color}`}
                  style={{ width: `${totalEuro>0?(p.amount/totalEuro)*100:0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Transactions</p>
        <div className="space-y-2">
          {all.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {r.month} {r.day}, {r.year}
                </p>
                <p className="text-xs text-gray-400">
                  {r.paid_via} · {r.currency}
                  {r.comment ? ` · ${r.comment}` : ""}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900 ml-3 shrink-0">{fmt(Number(r.total_euro))}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
