import { createClient } from "@/lib/supabase/server";
import MonthlyBarChart from "@/components/dashboard/charts/MonthlyBarChart";
import PlatformChart from "@/components/dashboard/charts/PlatformChart";
import StatCard from "@/components/dashboard/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Income" };

function fmt(n: number) { return `€${Math.round(n).toLocaleString("en-US")}`; }

export default async function IncomePage() {
  const supabase = await createClient();

  const { data: all = [] } = await supabase
    .from("bookings")
    .select("year,month_in,price_gross_stay,net_income,commission,management_fee,nights,property,platform,guest_name,check_in,check_out,each_partner")
    .order("check_in", { ascending: false });

  const rows = all ?? [];
  const y25 = rows.filter((r) => r.year === 2025);

  const monthly: Record<string, { month: number; year: number; gross: number; net: number; commission: number; mgmt: number }> = {};
  for (const r of rows) {
    const key = `${r.year}-${r.month_in}`;
    if (!monthly[key]) monthly[key] = { month: r.month_in, year: r.year, gross: 0, net: 0, commission: 0, mgmt: 0 };
    monthly[key].gross      += Number(r.price_gross_stay) || 0;
    monthly[key].net        += Number(r.net_income) || 0;
    monthly[key].commission += Number(r.commission) || 0;
    monthly[key].mgmt       += Number(r.management_fee) || 0;
  }
  const monthlyArr = Object.values(monthly)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-12);

  const platformMap: Record<string, number> = {};
  for (const r of y25) {
    const p = (r.platform || "Other").trim();
    platformMap[p] = (platformMap[p] || 0) + (Number(r.price_gross_stay) || 0);
  }
  const platformData = Object.entries(platformMap).map(([platform, total]) => ({ platform, total }));

  const sum = (arr: typeof rows, k: keyof typeof rows[0]) => arr.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const grossTotal   = sum(y25, "price_gross_stay");
  const netTotal     = sum(y25, "net_income");
  const commTotal    = sum(y25, "commission");
  const partnerTotal = sum(y25, "each_partner");

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Analytics</p>
        <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Income</h1>
        <p className="text-xs text-gray-400">All bookings · 2025</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4 mb-5">
        <StatCard label="Gross"       value={fmt(grossTotal)}   icon="💶" />
        <StatCard label="Net Income"  value={fmt(netTotal)}     icon="✅" trend="up" sub={`${grossTotal>0?((netTotal/grossTotal)*100).toFixed(0):0}% margin`} />
        <StatCard label="Commission"  value={fmt(commTotal)}    icon="🏷️" trend="down" />
        <StatCard label="Per Partner" value={fmt(partnerTotal)} icon="👥" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Monthly Breakdown</p>
        <p className="text-[11px] text-gray-400 mb-3">Net + Mgmt Fee + Commission stacked</p>
        <MonthlyBarChart data={monthlyArr} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Platform Mix</p>
        <PlatformChart data={platformData} />
      </div>

      {/* Bookings list — card style on mobile */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          All Bookings ({rows.length})
        </p>

        {/* Mobile: card list */}
        <div className="space-y-2 lg:hidden">
          {rows.slice(0, 30).map((b, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{b.guest_name || "—"}</p>
                <p className="text-xs text-gray-400">{b.check_in} · <span className="text-brand-600">{b.property}</span> · {b.platform}</p>
              </div>
              <div className="ml-3 shrink-0 text-right">
                <p className="text-sm font-bold text-gray-900">{fmt(Number(b.net_income))}</p>
                <p className="text-[10px] text-gray-400">{b.nights}n</p>
              </div>
            </div>
          ))}
          {rows.length > 30 && <p className="text-center text-xs text-gray-400 pt-2">+{rows.length - 30} more</p>}
        </div>

        {/* Desktop: table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                <th className="pb-2 pr-3">Guest</th>
                <th className="pb-2 pr-3">Check-in</th>
                <th className="pb-2 pr-3">Nights</th>
                <th className="pb-2 pr-3">Property</th>
                <th className="pb-2 pr-3">Platform</th>
                <th className="pb-2 pr-3 text-right">Gross</th>
                <th className="pb-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.slice(0, 50).map((b, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 pr-3 font-medium text-gray-800">{b.guest_name || "—"}</td>
                  <td className="py-2 pr-3 text-gray-500 tabular-nums">{b.check_in}</td>
                  <td className="py-2 pr-3 text-center tabular-nums text-gray-500">{b.nights}</td>
                  <td className="py-2 pr-3">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{b.property}</span>
                  </td>
                  <td className="py-2 pr-3 text-gray-500">{b.platform}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-gray-700">{fmt(Number(b.price_gross_stay))}</td>
                  <td className="py-2 text-right tabular-nums font-semibold text-gray-900">{fmt(Number(b.net_income))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
