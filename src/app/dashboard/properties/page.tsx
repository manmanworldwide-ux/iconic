import { createClient } from "@/lib/supabase/server";
import PropertyChart from "@/components/dashboard/charts/PropertyChart";
import RevenueChart from "@/components/dashboard/charts/RevenueChart";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Properties — Iconic Dashboard" };

function fmt(n: number) { return `€${Math.round(n).toLocaleString("en-US")}`; }

const PROP_COLORS: Record<string, string> = {
  Terrace: "bg-sky-100 text-sky-700",
  Suites:  "bg-violet-100 text-violet-700",
  Studio:  "bg-emerald-100 text-emerald-700",
  Palazzo: "bg-amber-100 text-amber-700",
  Hotel:   "bg-red-100 text-red-700",
};

export default async function PropertiesPage() {
  const supabase = await createClient();

  const { data: rows = [] } = await supabase
    .from("bookings")
    .select("year, month_in, property, price_gross_stay, net_income, commission, management_fee, nights, platform");

  const all = rows ?? [];
  const y25 = all.filter((r) => r.year === 2025);

  // ── Per-property stats ────────────────────────────────────────────────────
  const props: Record<string, { gross: number; net: number; nights: number; bookings: number; commission: number }> = {};
  for (const r of y25) {
    const p = (r.property || "Unknown").trim();
    if (!props[p]) props[p] = { gross: 0, net: 0, nights: 0, bookings: 0, commission: 0 };
    props[p].gross      += Number(r.price_gross_stay) || 0;
    props[p].net        += Number(r.net_income) || 0;
    props[p].nights     += Number(r.nights) || 0;
    props[p].bookings   += 1;
    props[p].commission += Number(r.commission) || 0;
  }
  const propList = Object.entries(props)
    .map(([property, v]) => ({ property, ...v, adr: v.nights > 0 ? v.gross / v.nights : 0 }))
    .sort((a, b) => b.gross - a.gross);

  const propChartData = propList.map(({ property, gross, net, bookings }) => ({ property, gross, net, bookings }));

  // ── Monthly by property (for the trend chart - all properties combined) ──
  const monthlyMap: Record<string, { month: number; year: number; gross: number; net: number; commission: number }> = {};
  for (const r of all) {
    const key = `${r.year}-${r.month_in}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: r.month_in, year: r.year, gross: 0, net: 0, commission: 0 };
    monthlyMap[key].gross      += Number(r.price_gross_stay) || 0;
    monthlyMap[key].net        += Number(r.net_income) || 0;
    monthlyMap[key].commission += Number(r.commission) || 0;
  }
  const monthlyData = Object.values(monthlyMap)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-18);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <p className="text-sm text-gray-500">Per-property performance · 2025</p>
      </div>

      {/* Property cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {propList.map((p) => (
          <div key={p.property} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PROP_COLORS[p.property] ?? "bg-gray-100 text-gray-700"}`}>
                {p.property}
              </span>
              <span className="text-xs text-gray-400">{p.bookings} bookings</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross Revenue</span>
                <span className="font-semibold text-gray-900">{fmt(p.gross)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Net Income</span>
                <span className="font-semibold text-emerald-600">{fmt(p.net)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Nights</span>
                <span className="font-medium text-gray-700">{p.nights}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Avg Daily Rate</span>
                <span className="font-medium text-gray-700">{fmt(p.adr)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Net Margin</span>
                <span className="font-medium text-gray-700">
                  {p.gross > 0 ? ((p.net / p.gross) * 100).toFixed(0) : 0}%
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-brand-500"
                  style={{ width: `${p.gross > 0 ? (p.net / p.gross) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue comparison + trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Revenue by Property · 2025</h2>
          <p className="text-xs text-gray-400 mb-4">Gross vs Net comparison</p>
          <PropertyChart data={propChartData} mode="revenue" />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Bookings by Property · 2025</h2>
          <p className="text-xs text-gray-400 mb-4">Total reservation count</p>
          <PropertyChart data={propChartData} mode="bookings" />
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Portfolio Revenue Trend (all properties)</h2>
          <RevenueChart data={monthlyData} />
        </div>
      </div>
    </div>
  );
}
