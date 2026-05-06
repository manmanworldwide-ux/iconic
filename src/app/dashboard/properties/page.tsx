import { createClient } from "@/lib/supabase/server";
import PropertyChart from "@/components/dashboard/charts/PropertyChart";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Properties" };

function fmt(n: number) { return `€${Math.round(n).toLocaleString("en-US")}`; }

const BADGE: Record<string, string> = {
  Terrace: "bg-sky-100 text-sky-700",
  Suites:  "bg-violet-100 text-violet-700",
  Studio:  "bg-emerald-100 text-emerald-700",
  Palazzo: "bg-amber-100 text-amber-700",
  Hotel:   "bg-red-100 text-red-700",
};

const BAR: Record<string, string> = {
  Terrace: "bg-sky-500",
  Suites:  "bg-violet-500",
  Studio:  "bg-emerald-500",
  Palazzo: "bg-amber-500",
  Hotel:   "bg-red-500",
};

export default async function PropertiesPage() {
  const supabase = await createClient();

  const { data: rows = [] } = await supabase
    .from("bookings")
    .select("year,month_in,property,price_gross_stay,net_income,commission,nights,platform");

  const all = rows ?? [];
  const y25 = all.filter((r) => r.year === 2025);

  const props: Record<string, { gross: number; net: number; nights: number; bookings: number }> = {};
  for (const r of y25) {
    const p = (r.property || "Unknown").trim();
    if (!props[p]) props[p] = { gross: 0, net: 0, nights: 0, bookings: 0 };
    props[p].gross    += Number(r.price_gross_stay) || 0;
    props[p].net      += Number(r.net_income) || 0;
    props[p].nights   += Number(r.nights) || 0;
    props[p].bookings += 1;
  }
  const propList = Object.entries(props)
    .map(([property, v]) => ({ property, ...v, adr: v.nights > 0 ? v.gross / v.nights : 0, margin: v.gross > 0 ? (v.net / v.gross) * 100 : 0 }))
    .sort((a, b) => b.gross - a.gross);

  const propChartData = propList.map(({ property, gross, net, bookings }) => ({ property, gross, net, bookings }));
  const totalGross = propList.reduce((a, p) => a + p.gross, 0);

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Portfolio</p>
        <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Properties</h1>
        <p className="text-xs text-gray-400">Performance by property · 2025</p>
      </div>

      {/* Property cards */}
      <div className="space-y-3 mb-5">
        {propList.map((p) => (
          <div key={p.property} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[p.property] ?? "bg-gray-100 text-gray-700"}`}>
                {p.property}
              </span>
              <span className="text-xs text-gray-400">{p.bookings} bookings · {p.nights} nights</span>
            </div>

            {/* Revenue share bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Revenue share</span>
                <span className="font-medium text-gray-700">{totalGross > 0 ? ((p.gross / totalGross) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div className={`h-1.5 rounded-full ${BAR[p.property] ?? "bg-gray-400"}`}
                  style={{ width: `${totalGross > 0 ? (p.gross / totalGross) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-bold text-gray-900">{fmt(p.gross)}</p>
                <p className="text-[10px] text-gray-400">Gross</p>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-600">{fmt(p.net)}</p>
                <p className="text-[10px] text-gray-400">Net</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">{fmt(p.adr)}</p>
                <p className="text-[10px] text-gray-400">ADR</p>
              </div>
            </div>

            {/* Net margin bar */}
            <div className="mt-3 h-1 w-full rounded-full bg-gray-100">
              <div className="h-1 rounded-full bg-brand-400" style={{ width: `${p.margin.toFixed(0)}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">{p.margin.toFixed(0)}% net margin</p>
          </div>
        ))}
      </div>

      {/* Comparison charts */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Revenue Comparison</p>
        <PropertyChart data={propChartData} mode="revenue" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bookings Count</p>
        <PropertyChart data={propChartData} mode="bookings" />
      </div>
    </div>
  );
}
