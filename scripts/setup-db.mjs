/**
 * Creates all Supabase tables for the Iconic dashboard.
 * Run: node scripts/setup-db.mjs
 */
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(path.join(__dirname, "../.env.local"), "utf8");
const env = Object.fromEntries(
  envFile.split("\n").filter((l) => l && !l.startsWith("#")).map((l) => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  }).filter(([k]) => k)
);

const PROJECT_REF = "elndvmalfrfkajhjfina";
const TOKEN = env.SUPABASE_ACCESS_TOKEN;

async function sql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

console.log("🗄️  Setting up Supabase schema…\n");

// ── bookings ──────────────────────────────────────────────────────────────────
await sql(`
  CREATE TABLE IF NOT EXISTS bookings (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    year          int,
    check_in      date,
    check_out     date,
    month_in      int,
    month_out     int,
    nights        int,
    nights_same_month   int DEFAULT 0,
    nights_next_month   int DEFAULT 0,
    property      text,
    platform      text,
    price_gross_stay    numeric DEFAULT 0,
    commission          numeric DEFAULT 0,
    net_income          numeric DEFAULT 0,
    management_fee      numeric DEFAULT 0,
    each_partner        numeric DEFAULT 0,
    price_gross_day     numeric DEFAULT 0,
    price_net_day       numeric DEFAULT 0,
    guest_name    text,
    date_of_booking date,
    sheet_source  text DEFAULT 'INCOME',
    row_hash      text UNIQUE,
    created_at    timestamptz DEFAULT now()
  );
`);
console.log("✅  bookings");

// ── renovations ───────────────────────────────────────────────────────────────
await sql(`
  CREATE TABLE IF NOT EXISTS renovations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property            text,
    service             text,
    comments            text,
    batch               text,
    month               text,
    total               numeric DEFAULT 0,
    paid_by_bruce       numeric DEFAULT 0,
    paid_by_enol        numeric DEFAULT 0,
    paid_by_oren        numeric DEFAULT 0,
    paid_by_iconic_group numeric DEFAULT 0,
    paid_to             text,
    row_hash            text UNIQUE,
    created_at          timestamptz DEFAULT now()
  );
`);
console.log("✅  renovations");

// ── payments ──────────────────────────────────────────────────────────────────
await sql(`
  CREATE TABLE IF NOT EXISTS payments (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    year          text,
    month         text,
    day           text,
    currency      text,
    total_euro    numeric DEFAULT 0,
    total_shekels numeric DEFAULT 0,
    paid_via      text,
    oren          numeric DEFAULT 0,
    enol          numeric DEFAULT 0,
    comment       text,
    row_hash      text UNIQUE,
    created_at    timestamptz DEFAULT now()
  );
`);
console.log("✅  payments");

// ── sync_log ──────────────────────────────────────────────────────────────────
await sql(`
  CREATE TABLE IF NOT EXISTS sync_log (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    synced_at   timestamptz DEFAULT now(),
    sheet_name  text,
    rows_synced int,
    trigger     text DEFAULT 'manual'
  );
`);
console.log("✅  sync_log\n");
console.log("🎉  Schema ready.");
