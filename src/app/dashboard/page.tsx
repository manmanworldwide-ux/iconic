import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/charts/RevenueChart";
import PlatformChart from "@/components/dashboard/charts/PlatformChart";
import PropertyChart from "@/components/dashboard/charts/PropertyChart";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overview" };

function fmt(n: number) {
  return `€${Math.round(n).toLocaleString("en-US")}`;
}

export default async function OverviewPage() {
  const supabase = await createClient();

  const { data: all = [] } = await supabase
    .from("bookings")
    .select("year,month_in,price_gross_stay,net_income,commission,management_fee,nights,property,platform");

  const rows = all ?? [];
  const thisYear = rows.filter((r) => r.year === 2025);
  const lastYear  = rows.filter((r) => r.year === 2024);

  const sum = (arr: typeof rows, k: keyof typeof rows[0]) =>
    arr.reduce((a, r) => a + (Number(r[k]) || 0), 0);

  const grossYTD  = sum(thisYear, "price_gross_stay");
  const netYTD    = sum(thisYear, "net_income");
  const grossPrev = sum(lastYear, "price_gross_stay");
  const pct = grossPrev > 0 ? ((grossYTD - grossPrev) / grossPrev * 100).toFixed(1) : null;
  const totalNights = sum(thisYear, "nights");
  const avgADR = totalNights > 0 ? grossYTD / totalNights : 0;

  // Monthly
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
    .slice(-12);

  // Platform
  const platformMap: Record<string, number> = {};
  for (const r of thisYear) {
    const p = (r.platform || "Other").trim();
    platformMap[p] = (platformMap[p] || 0) + (Number(r.price_gross_stay) || 0);
  }
  const platformData = Object.entries(platformMap).map(([platform, total]) => ({ platform, total }));

  // Property
  const propMap: Record<string, { gross: number; net: number; bookings: number }> = {};
  for (const r of thisYear) {
    const p = (r.property || "Unknown").trim();
    if (!propMap[p]) propMap[p] = { gross: 0, net: 0, bookings: 0 };
    propMap[p].gross    += Number(r.price_gross_stay) || 0;
    propMap[p].net      += Number(r.net_income) || 0;
    propMap[p].bookings += 1;
  }
  const propertyData = Object.entries(propMap).map(([property, v]) => ({ property, ...v }));

  // Recent bookings
  const { data: recent = [] } = await supabase
    .from("bookings")
    .select("check_in,property,platform,price_gross_stay,net_income,guest_name")
    .order("check_in", { ascending: false })
    .limit(8);

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8">

      {/* Mobile header */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">ICONIC Group</p>
        <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Overview</h1>
        <p className="text-xs text-gray-400">2025 performance</p>
      </div>

      {/* KPI grid — 2 cols mobile, 4 desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4 mb-5">
        <StatCard label="Gross YTD"    value={fmt(grossYTD)} sub={pct ? `${Number(pct)>0?"+":""}${pct}% vs 2024` : undefined} trend={pct&&Number(pct)>0?"up":"down"} icon="💰" />
        <StatCard label="Net Income"   value={fmt(netYTD)}   sub={`${grossYTD>0?((netYTD/grossYTD)*100).toFixed(0):0}% margin`} trend="up" icon="📈" />
        <StatCard label="Bookings"     value={thisYear.length.toString()} sub={`${totalNights} nights`} icon="📅" />
        <StatCard label="Avg Rate/Night" value={fmt(avgADR)} sub="gross per night" icon="🏷️" />
      </div>

      {/* Revenue chart — full width on mobile */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4 lg:hidden">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Revenue Trend</p>
        <RevenueChart data={monthlyData} />
      </div>

      {/* Desktop: revenue 2/3 + platform 1/3 */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (12 months)</p>
          <RevenueChart data={monthlyData} />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">Platform Mix · 2025</p>
          <PlatformChart data={platformData} />
        </div>
      </div>

      {/* Platform — mobile only */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4 lg:hidden">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Platform Mix</p>
        <PlatformChart data={platformData} />
      </div>

      {/* Property chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 lg:text-sm lg:font-semibold lg:text-gray-700">Revenue by Property</p>
        <PropertyChart data={propertyData} />
      </div>

      {/* Recent bookings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 lg:text-sm lg:font-semibold lg:text-gray-700">Recent Bookings</p>
        <div className="space-y-2">
          {(recent ?? []).map((b, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{b.guest_name || "Guest"}</p>
                <p className="text-xs text-gray-400">{b.check_in} · {b.platform}</p>
              </div>
              <div className="ml-3 text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">{fmt(Number(b.net_income))}</p>
                <span className="text-[10px] rounded-full bg-brand-50 px-1.5 py-0.5 text-brand-600 font-medium">
                  {b.property}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
