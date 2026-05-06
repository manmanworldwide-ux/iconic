import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseNum(str: string | undefined): number {
  if (!str) return 0;
  const n = parseFloat(str.replace(/[€£$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

const MONTHS: Record<string, number> = {
  Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12
};

function parseShortDate(str: string | undefined, year: number): string | null {
  if (!str) return null;
  const m = str.trim().match(/^(\d{1,2})[-\s](\w{3})/);
  if (m) {
    const mon = MONTHS[m[2]];
    if (!mon) return null;
    const fy = year < 100 ? 2000 + year : year;
    return `${fy}-${String(mon).padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {}
  return null;
}

function hash(...parts: string[]): string {
  return createHash("md5").update(parts.join("|")).digest("hex");
}

export async function POST(request: Request) {
  // ── Authenticate ────────────────────────────────────────────────────────────
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sheet: string; row: number; values: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sheet, row, values: r } = body;
  let upserted = 0;

  try {
    // ── Route by sheet name ──────────────────────────────────────────────────
    const incomeSheets = ["INCOME", "Hotel 25/26", "Terrace 25/26", "חישוב חודשי"];

    if (incomeSheets.includes(sheet)) {
      const yearRaw = parseInt(r[0]);
      if (yearRaw && r[1]) {
        const checkIn = parseShortDate(r[1], yearRaw);
        if (checkIn) {
          const { error } = await supabase.from("bookings").upsert({
            year:               yearRaw < 100 ? 2000 + yearRaw : yearRaw,
            check_in:           checkIn,
            check_out:          parseShortDate(r[3], yearRaw),
            month_in:           parseInt(r[2]) || null,
            month_out:          parseInt(r[4]) || null,
            nights:             parseInt(r[5]) || 0,
            nights_same_month:  parseInt(r[6]) || 0,
            nights_next_month:  parseInt(r[7]) || 0,
            property:           (r[8] || "").trim(),
            price_gross_stay:   parseNum(r[9]),
            commission:         parseNum(r[14]),
            net_income:         parseNum(r[15]),
            price_gross_day:    parseNum(r[16]),
            price_net_day:      parseNum(r[17]),
            management_fee:     parseNum(r[18]),
            each_partner:       parseNum(r[19]),
            platform:           (r[12] || "").trim(),
            guest_name:         (r[24] || "").trim(),
            date_of_booking:    parseShortDate(r[25], yearRaw),
            sheet_source:       sheet,
            row_hash:           hash(sheet, String(row), checkIn, r[8]||"", r[9]||""),
          }, { onConflict: "row_hash" });
          if (error) throw error;
          upserted = 1;
        }
      }
    } else if (sheet.startsWith("Rennovation") || sheet === "BUDGET HOTEL PHASE 2") {
      const total = parseNum(r[5]);
      if (r[0] || r[1]) {
        const { error } = await supabase.from("renovations").upsert({
          property:             (r[0] || "").trim(),
          service:              (r[1] || "").trim(),
          comments:             (r[2] || "").trim(),
          batch:                (r[3] || "").trim(),
          month:                (r[4] || "").trim(),
          total,
          paid_by_bruce:        parseNum(r[6]),
          paid_by_enol:         parseNum(r[7]),
          paid_by_oren:         parseNum(r[8]),
          paid_by_iconic_group: parseNum(r[9]),
          paid_to:              (r[10] || "").trim(),
          row_hash:             hash(sheet, String(row), r[0]||"", r[1]||"", r[5]||""),
        }, { onConflict: "row_hash" });
        if (error) throw error;
        upserted = 1;
      }
    } else if (sheet.includes("Payments")) {
      if (r[1] || r[5]) {
        const { error } = await supabase.from("payments").upsert({
          year:          (r[0] || "").trim(),
          month:         (r[1] || "").trim(),
          day:           (r[2] || "").trim(),
          currency:      (r[3] || "").trim(),
          total_shekels: parseNum(r[4]),
          total_euro:    parseNum(r[5]),
          paid_via:      (r[6] || "").trim(),
          oren:          parseNum(r[7]),
          enol:          parseNum(r[8]),
          comment:       (r[9] || "").trim(),
          row_hash:      hash("payments", String(row), r[1]||"", r[5]||"", r[6]||""),
        }, { onConflict: "row_hash" });
        if (error) throw error;
        upserted = 1;
      }
    }

    // Log the sync
    await supabase.from("sync_log").insert({
      sheet_name: sheet,
      rows_synced: upserted,
      trigger: "webhook",
    });

    return NextResponse.json({ ok: true, sheet, row, upserted });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
