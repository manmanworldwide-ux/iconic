import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/charts/RevenueChart";
import PlatformChart from "@/components/dashboard/charts/PlatformChart";
import PropertyChart from "@/components/dashboard/charts/PropertyChart";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overview — Iconic Dashboard" };

function fmt(n: number) {
  return `€${Math.round(n).toLocaleString("en-US")}`;
}

export default async function OverviewPage() {
  const supabase = await createClient();

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const { data: all } = await supabase
    .from("bookings")
    .select("year, month_in, price_gross_stay, net_income, commission, management_fee, nights, property, platform");

  const rows = all ?? [];
  const currentYear = 2025;
  const thisYear = rows.filter((r) => r.year === currentYear);
  const lastYear  = rows.filter((r) => r.year === currentYear - 1);

  const sum = (arr: typeof rows, key: keyof typeof rows[0]) =>
    arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

  const grossYTD   = sum(thisYear, "price_gross_stay");
  const netYTD     = sum(thisYear, "net_income");
  const grossPrev  = sum(lastYear, "price_gross_stay");
  const pct = grossPrev > 0 ? ((grossYTD - grossPrev) / grossPrev * 100).toFixed(1) : null;

  const totalNights = sum(thisYear, "nights");
  const avgADR = thisYear.length > 0 ? grossYTD / (totalNights || 1) : 0;

  // ── Monthly Revenue ────────────────────────────────────────────────────────
  const monthlyMap: Record<string, { month: number; year: number; gross: number; net: number; commission: number }> = {};
  for (const r of rows) {
    const key = `${r.year}-${r.month_in}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: r.month_in, year: r.year, gross: 0, net: 0, commission: 0 };
    monthlyMap[key].gross      += Number(r.price_gross_stay) || 0;
    monthlyMap[key].net        += Number(r.net_income) || 0;
    monthlyMap[key].commission += Number(r.commission) || 0;
  }
  const monthlyData = Object.values(monthlyMap)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-18);

  // ── By Platform ───────────────────────────────────────────────────────────
  const platformMap: Record<string, number> = {};
  for (const r of thisYear) {
    const p = (r.platform || "Other").trim();
    platformMap[p] = (platformMap[p] || 0) + (Number(r.price_gross_stay) || 0);
  }
  const platformData = Object.entries(platformMap).map(([platform, total]) => ({ platform, total }));

  // ── By Property ───────────────────────────────────────────────────────────
  const propMap: Record<string, { gross: number; net: number; bookings: number }> = {};
  for (const r of thisYear) {
    const p = (r.property || "Unknown").trim();
    if (!propMap[p]) propMap[p] = { gross: 0, net: 0, bookings: 0 };
    propMap[p].gross    += Number(r.price_gross_stay) || 0;
    propMap[p].net      += Number(r.net_income) || 0;
    propMap[p].bookings += 1;
  }
  const propertyData = Object.entries(propMap).map(([property, v]) => ({ property, ...v }));

  // ── Recent Bookings ────────────────────────────────────────────────────────
  const { data: recent } = await supabase
    .from("bookings")
    .select("check_in, check_out, property, platform, price_gross_stay, net_income, guest_name")
    .order("check_in", { ascending: false })
    .limit(10);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">ICONIC Group · 2025 performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <StatCard
          label="Gross Revenue YTD"
          value={fmt(grossYTD)}
          sub={pct ? `${Number(pct) > 0 ? "+" : ""}${pct}% vs 2024` : undefined}
          trend={pct && Number(pct) > 0 ? "up" : "down"}
          icon="💰"
        />
        <StatCard
          label="Net Income YTD"
          value={fmt(netYTD)}
          sub={`${grossYTD > 0 ? ((netYTD/grossYTD)*100).toFixed(0) : 0}% net margin`}
          trend="neutral"
          icon="📈"
        />
        <StatCard
          label="Total Bookings"
          value={thisYear.length.toLocaleString()}
          sub={`${totalNights.toLocaleString()} nights`}
          icon="📅"
        />
        <StatCard
          label="Avg Daily Rate"
          value={fmt(avgADR)}
          sub="per night (gross)"
          icon="🏷️"
        />
      </div>

      {/* Revenue Trend */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (18 months)</h2>
          <RevenueChart data={monthlyData} />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Platform Mix · 2025</h2>
          <PlatformChart data={platformData} />
        </div>
      </div>

      {/* Property Breakdown + Recent Bookings */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Property · 2025</h2>
          <PropertyChart data={propertyData} />
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Guest</th>
                  <th className="pb-2 pr-4">Check-in</th>
                  <th className="pb-2 pr-4">Property</th>
                  <th className="pb-2 pr-4">Platform</th>
                  <th className="pb-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(recent ?? []).map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-800">{b.guest_name || "—"}</td>
                    <td className="py-2 pr-4 text-gray-500">{b.check_in}</td>
                    <td className="py-2 pr-4">
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {b.property}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{b.platform}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">
                      {fmt(Number(b.net_income))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
