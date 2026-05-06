import { createClient } from "@/lib/supabase/server";
import MonthlyBarChart from "@/components/dashboard/charts/MonthlyBarChart";
import PlatformChart from "@/components/dashboard/charts/PlatformChart";
import StatCard from "@/components/dashboard/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Income — Iconic Dashboard" };

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n: number) { return `€${Math.round(n).toLocaleString("en-US")}`; }

export default async function IncomePage() {
  const supabase = await createClient();

  const { data: rows = [] } = await supabase
    .from("bookings")
    .select("year, month_in, price_gross_stay, net_income, commission, management_fee, nights, property, platform, guest_name, check_in, check_out, each_partner")
    .order("check_in", { ascending: false });

  const all = rows ?? [];
  const y25 = all.filter((r) => r.year === 2025);

  // ── Monthly aggregation ───────────────────────────────────────────────────
  const monthly: Record<string, { month: number; year: number; gross: number; net: number; commission: number; mgmt: number }> = {};
  for (const r of all) {
    const key = `${r.year}-${r.month_in}`;
    if (!monthly[key]) monthly[key] = { month: r.month_in, year: r.year, gross: 0, net: 0, commission: 0, mgmt: 0 };
    monthly[key].gross      += Number(r.price_gross_stay) || 0;
    monthly[key].net        += Number(r.net_income) || 0;
    monthly[key].commission += Number(r.commission) || 0;
    monthly[key].mgmt       += Number(r.management_fee) || 0;
  }
  const monthlyArr = Object.values(monthly)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-18);

  // ── Platform aggregation ──────────────────────────────────────────────────
  const platformMap: Record<string, number> = {};
  for (const r of y25) {
    const p = (r.platform || "Other").trim();
    platformMap[p] = (platformMap[p] || 0) + (Number(r.price_gross_stay) || 0);
  }
  const platformData = Object.entries(platformMap).map(([platform, total]) => ({ platform, total }));

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const sum = (arr: typeof all, k: keyof typeof all[0]) => arr.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const grossTotal    = sum(y25, "price_gross_stay");
  const netTotal      = sum(y25, "net_income");
  const commTotal     = sum(y25, "commission");
  const partnerTotal  = sum(y25, "each_partner");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Income Analysis</h1>
        <p className="text-sm text-gray-500">All bookings across all properties · 2025</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Gross Revenue" value={fmt(grossTotal)} icon="💶" />
        <StatCard label="Net Income"    value={fmt(netTotal)}   icon="✅" trend="up" sub={`${grossTotal > 0 ? ((netTotal/grossTotal)*100).toFixed(0) : 0}% margin`} />
        <StatCard label="Commissions"   value={fmt(commTotal)}  icon="🏷️" trend="down" sub={`${grossTotal > 0 ? ((commTotal/grossTotal)*100).toFixed(0) : 0}% of gross`} />
        <StatCard label="Per Partner"   value={fmt(partnerTotal)} icon="👥" sub="each partner's share" />
      </div>

      {/* Monthly + Platform */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Monthly Revenue Breakdown</h2>
          <p className="text-xs text-gray-400 mb-4">Stacked: Net Income + Mgmt Fee + Commission = Gross</p>
          <MonthlyBarChart data={monthlyArr} />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Platform Distribution · 2025</h2>
          <PlatformChart data={platformData} />
        </div>
      </div>

      {/* Full bookings table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">All Bookings ({all.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                <th className="pb-2 pr-3">Guest</th>
                <th className="pb-2 pr-3">Check-in</th>
                <th className="pb-2 pr-3">Check-out</th>
                <th className="pb-2 pr-3">Nights</th>
                <th className="pb-2 pr-3">Property</th>
                <th className="pb-2 pr-3">Platform</th>
                <th className="pb-2 pr-3 text-right">Gross</th>
                <th className="pb-2 pr-3 text-right">Commission</th>
                <th className="pb-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {all.slice(0, 50).map((b, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 pr-3 font-medium text-gray-800">{b.guest_name || "—"}</td>
                  <td className="py-2 pr-3 text-gray-500 tabular-nums">{b.check_in}</td>
                  <td className="py-2 pr-3 text-gray-500 tabular-nums">{b.check_out}</td>
                  <td className="py-2 pr-3 text-gray-500 tabular-nums text-center">{b.nights}</td>
                  <td className="py-2 pr-3">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {b.property}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-gray-500">{b.platform}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-gray-700">{fmt(Number(b.price_gross_stay))}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-amber-600">{fmt(Number(b.commission))}</td>
                  <td className="py-2 text-right tabular-nums font-semibold text-gray-900">{fmt(Number(b.net_income))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {all.length > 50 && (
            <p className="mt-3 text-center text-xs text-gray-400">Showing 50 of {all.length} bookings</p>
          )}
        </div>
      </div>
    </div>
  );
}
