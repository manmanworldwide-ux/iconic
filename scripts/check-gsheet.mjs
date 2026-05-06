/**
 * Reads all tabs, cell data, notes, and threaded comments from "ICONIC Group".
 * Run: node scripts/check-gsheet.mjs
 * Token is cached in scripts/.token.json after the first auth.
 */

import { createServer } from "http";
import { google } from "googleapis";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { URL, fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, ".token.json");
const SPREADSHEET_ID = "1pwIyspo24TnzjK7i5eTd1QQUMUA01soIT09Y7wChfBw";

// ── Load .env.local ──────────────────────────────────────────────────────────
const envFile = readFileSync(path.join(__dirname, "../.env.local"), "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
    .filter(([k]) => k)
);

const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000";

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// ── Reuse cached token or run OAuth flow ─────────────────────────────────────
if (existsSync(TOKEN_PATH)) {
  const saved = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
  oauth2Client.setCredentials(saved);
  console.log("🔑  Using cached token.\n");
} else {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
    prompt: "consent",
  });

  console.log("\n🔗  Open this URL in your browser:\n\n   " + authUrl + "\n");

  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, "http://localhost:3000");
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html" });
      if (error) {
        res.end(`<h2>❌ ${error}</h2>`);
        server.close();
        reject(new Error(error));
        return;
      }
      if (code) {
        res.end("<h2>✅ Authorized! You can close this tab.</h2>");
        server.close();
        resolve(code);
      }
    });
    server.listen(3000, () => console.log("⏳  Waiting on http://localhost:3000 …\n"));
    server.on("error", reject);
  });

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log("✅  Authenticated & token cached.\n");
}

const sheets = google.sheets({ version: "v4", auth: oauth2Client });
const drive = google.drive({ version: "v3", auth: oauth2Client });

// ── 1. List all tabs ─────────────────────────────────────────────────────────
console.log("📋  Fetching spreadsheet metadata…\n");
const { data: spreadsheet } = await sheets.spreadsheets.get({
  spreadsheetId: SPREADSHEET_ID,
  includeGridData: false,
});

const sheetList = spreadsheet.sheets ?? [];
console.log(`📂  Spreadsheet: "${spreadsheet.properties.title}"`);
console.log(`    Tabs (${sheetList.length}):\n`);
sheetList.forEach((s, i) => {
  const p = s.properties;
  console.log(
    `    ${i + 1}. "${p.title}"  [index ${p.index}]  rows=${p.gridProperties?.rowCount}  cols=${p.gridProperties?.columnCount}`
  );
});
console.log();

// ── 2. Read data + notes from every tab ──────────────────────────────────────
console.log("📊  Reading cell values and notes from all tabs…\n");

const { data: fullData } = await sheets.spreadsheets.get({
  spreadsheetId: SPREADSHEET_ID,
  includeGridData: true,
  fields:
    "sheets(properties(title),data(rowData(values(formattedValue,note,hyperlink))))",
});

for (const sheet of fullData.sheets ?? []) {
  const title = sheet.properties.title;
  const rows = sheet.data?.[0]?.rowData ?? [];

  // Collect non-empty rows
  const dataRows = rows
    .map((row, ri) =>
      (row.values ?? []).map((cell, ci) => ({
        row: ri + 1,
        col: ci + 1,
        value: cell.formattedValue ?? "",
        note: cell.note ?? "",
        link: cell.hyperlink ?? "",
      }))
    )
    .filter((cols) => cols.some((c) => c.value || c.note));

  if (dataRows.length === 0) {
    console.log(`  📄  "${title}" — (empty)`);
    continue;
  }

  console.log(`  📄  "${title}" — ${dataRows.length} rows with data:`);

  // Print first 5 rows as a preview
  const preview = dataRows.slice(0, 5);
  for (const cols of preview) {
    const cells = cols
      .filter((c) => c.value || c.note)
      .map((c) => {
        let out = `[R${c.row}C${c.col}] ${c.value}`;
        if (c.note) out += `  📝 note: "${c.note}"`;
        if (c.link) out += `  🔗 ${c.link}`;
        return out;
      })
      .join("  |  ");
    if (cells) console.log(`      ${cells}`);
  }
  if (dataRows.length > 5)
    console.log(`      … and ${dataRows.length - 5} more rows`);
  console.log();
}

// ── 3. Threaded comments via Drive API ───────────────────────────────────────
console.log("💬  Fetching threaded comments…\n");

let allComments = [];
let pageToken;
do {
  const { data } = await drive.comments.list({
    fileId: SPREADSHEET_ID,
    fields:
      "comments(id,content,author,createdTime,resolved,anchor,replies(content,author,createdTime)),nextPageToken",
    pageSize: 100,
    ...(pageToken ? { pageToken } : {}),
  });
  allComments = allComments.concat(data.comments ?? []);
  pageToken = data.nextPageToken;
} while (pageToken);

if (allComments.length === 0) {
  console.log("    No threaded comments found.\n");
} else {
  console.log(`    ${allComments.length} threaded comment(s):\n`);
  for (const c of allComments) {
    const status = c.resolved ? "✅ resolved" : "🟡 open";
    console.log(`  💬  [${status}] ${c.author?.displayName} @ ${c.createdTime}`);
    console.log(`       Location : ${c.anchor ?? "unknown"}`);
    console.log(`       Comment  : ${c.content}`);
    if (c.replies?.length) {
      for (const r of c.replies) {
        console.log(`       ↳ ${r.author?.displayName}: ${r.content}`);
      }
    }
    console.log();
  }
}

console.log("✅  Done.");
