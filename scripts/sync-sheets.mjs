/**
 * Syncs all data from ICONIC Group Google Sheet → Supabase.
 * Run: node scripts/sync-sheets.mjs
 * Uses cached OAuth token from scripts/.token.json
 */
import { readFileSync, existsSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load env ─────────────────────────────────────────────────────────────────
const envFile = readFileSync(path.join(__dirname, "../.env.local"), "utf8");
const env = Object.fromEntries(
  envFile.split("\n").filter((l) => l && !l.startsWith("#")).map((l) => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  }).filter(([k]) => k)
);

const SPREADSHEET_ID = "1pwIyspo24TnzjK7i5eTd1QQUMUA01soIT09Y7wChfBw";
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Google Auth ───────────────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000"
);
const token = JSON.parse(readFileSync(path.join(__dirname, ".token.json"), "utf8"));
oauth2Client.setCredentials(token);
const sheets = google.sheets({ version: "v4", auth: oauth2Client });

// ── Helpers ───────────────────────────────────────────────────────────────────
function hash(...parts) {
  return createHash("md5").update(parts.join("|")).digest("hex");
}

function parseNum(str) {
  if (!str) return 0;
  const n = parseFloat(str.toString().replace(/[€£$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

const MONTHS = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };

function parseShortDate(str, year) {
  if (!str) return null;
  str = str.toString().trim();
  // "3-Jan" or "3 Jan"
  const m = str.match(/^(\d{1,2})[-\s](\w{3})/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const mon = MONTHS[m[2]];
    if (!mon) return null;
    const fullYear = year < 100 ? 2000 + year : year;
    return `${fullYear}-${String(mon).padStart(2,"0")}-${day}`;
  }
  // "December 28, 2025"
  try {
    const d = new Date(str);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  } catch {}
  return null;
}

async function getRows(sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
  return res.data.values || [];
}

async function upsertBatch(table, rows, conflict = "row_hash") {
  if (!rows.length) return 0;
  const { error } = await supabase.from(table).upsert(rows, {
    onConflict: conflict,
    ignoreDuplicates: false,
  });
  if (error) console.error(`  ⚠️  upsert error on ${table}:`, error.message);
  return rows.length;
}

async function logSync(sheetName, rowsSynced, trigger = "manual") {
  await supabase.from("sync_log").insert({ sheet_name: sheetName, rows_synced: rowsSynced, trigger });
}

// ── Sync INCOME-style sheets ──────────────────────────────────────────────────
async function syncIncomeSheet(sheetName) {
  console.log(`\n📥  Syncing "${sheetName}"…`);
  const rows = await getRows(sheetName);
  if (rows.length < 2) { console.log("    (empty)"); return; }

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const yearRaw = parseInt(r[0]);
    if (!yearRaw || !r[1]) continue; // skip empty rows

    const checkIn  = parseShortDate(r[1], yearRaw);
    const checkOut = parseShortDate(r[3], yearRaw);
    if (!checkIn) continue;

    const rec = {
      year:               yearRaw < 100 ? 2000 + yearRaw : yearRaw,
      check_in:           checkIn,
      check_out:          checkOut,
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
      sheet_source:       sheetName,
      row_hash:           hash(sheetName, i, checkIn, r[8] || "", r[9] || ""),
    };
    records.push(rec);
  }

  const count = await upsertBatch("bookings", records);
  await logSync(sheetName, count);
  console.log(`    ✅  ${count} rows`);
}

// ── Sync Renovations ──────────────────────────────────────────────────────────
async function syncRenovations(sheetName) {
  console.log(`\n📥  Syncing "${sheetName}"…`);
  const rows = await getRows(sheetName);
  if (rows.length < 2) { console.log("    (empty)"); return; }

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0] && !r[1]) continue;
    const total = parseNum(r[5]);
    if (total === 0 && !r[1]) continue;

    records.push({
      property:            (r[0] || "").trim(),
      service:             (r[1] || "").trim(),
      comments:            (r[2] || "").trim(),
      batch:               (r[3] || "").trim(),
      month:               (r[4] || "").trim(),
      total,
      paid_by_bruce:       parseNum(r[6]),
      paid_by_enol:        parseNum(r[7]),
      paid_by_oren:        parseNum(r[8]),
      paid_by_iconic_group:parseNum(r[9]),
      paid_to:             (r[10] || "").trim(),
      row_hash:            hash(sheetName, i, r[0]||"", r[1]||"", r[5]||""),
    });
  }

  const count = await upsertBatch("renovations", records);
  await logSync(sheetName, count);
  console.log(`    ✅  ${count} rows`);
}

// ── Sync Payments ─────────────────────────────────────────────────────────────
async function syncPayments() {
  const sheetName = "Payments - DEAL TERRRACE";
  console.log(`\n📥  Syncing "${sheetName}"…`);
  const rows = await getRows(sheetName);
  if (rows.length < 2) { console.log("    (empty)"); return; }

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[1] && !r[5]) continue;
    records.push({
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
      row_hash:      hash("payments", i, r[1]||"", r[5]||"", r[6]||""),
    });
  }

  const count = await upsertBatch("payments", records);
  await logSync(sheetName, count);
  console.log(`    ✅  ${count} rows`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("🔄  Starting full sync from ICONIC Group → Supabase\n");

await syncIncomeSheet("INCOME");
await syncIncomeSheet("Hotel 25/26");
await syncIncomeSheet("Terrace 25/26");
await syncIncomeSheet("חישוב חודשי");
await syncRenovations("Rennovations ");
await syncRenovations("BUDGET HOTEL PHASE 2");
await syncPayments();

console.log("\n✅  Sync complete.");
