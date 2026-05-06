/**
 * ICONIC GROUP — Google Sheets → Supabase Webhook
 * ─────────────────────────────────────────────────
 * HOW TO INSTALL:
 *  1. Open the "ICONIC Group" Google Sheet
 *  2. Extensions → Apps Script
 *  3. Delete any existing code and paste this entire file
 *  4. Update WEBHOOK_URL and WEBHOOK_SECRET below
 *  5. Click "Save" (Ctrl+S)
 *  6. Run → Run function → "installTrigger" (first time only, approves permissions)
 *  7. Done — every edit will now sync to Supabase automatically
 *
 * To remove the trigger: Run → installTrigger again (it cleans up first).
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────
var WEBHOOK_URL    = "https://YOUR_DOMAIN/api/webhooks/gsheet";  // replace after deploy
var WEBHOOK_SECRET = "iconic_webhook_2026_secret";

// Sheets that should sync to Supabase
var WATCHED_SHEETS = [
  "INCOME",
  "Hotel 25/26",
  "Terrace 25/26",
  "חישוב חודשי",
  "Rennovations ",
  "BUDGET HOTEL PHASE 2",
  "Payments - DEAL TERRRACE",
];

// ── TRIGGER INSTALLER ─────────────────────────────────────────────────────────
function installTrigger() {
  // Remove existing triggers first
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "onSheetEdit") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Install installable onEdit trigger (can make URL requests, unlike simple triggers)
  ScriptApp.newTrigger("onSheetEdit")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();

  SpreadsheetApp.getUi().alert("✅ Webhook trigger installed successfully!");
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
function onSheetEdit(e) {
  if (!e) return;

  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();

  // Only sync watched sheets
  if (WATCHED_SHEETS.indexOf(sheetName) === -1) return;

  var row = e.range.getRow();

  // Skip header row
  if (row <= 1) return;

  // Get the full row values
  var lastCol = sheet.getLastColumn();
  var rowValues = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

  // Convert all values to strings
  var values = rowValues.map(function(v) {
    if (v instanceof Date) {
      return Utilities.formatDate(v, Session.getScriptTimeZone(), "d-MMM");
    }
    return v !== null && v !== undefined ? String(v) : "";
  });

  // Send to webhook
  try {
    var payload = JSON.stringify({
      sheet: sheetName,
      row:   row,
      values: values,
      editedCell: e.range.getA1Notation(),
      editedBy:   Session.getActiveUser().getEmail(),
      timestamp:  new Date().toISOString(),
    });

    var options = {
      method:             "post",
      contentType:        "application/json",
      payload:            payload,
      headers:            { "x-webhook-secret": WEBHOOK_SECRET },
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var code     = response.getResponseCode();

    if (code !== 200) {
      console.error("Webhook returned " + code + ": " + response.getContentText());
    } else {
      console.log("Synced row " + row + " of " + sheetName);
    }
  } catch (err) {
    console.error("Webhook error: " + err.toString());
  }
}

// ── MANUAL FULL SYNC ──────────────────────────────────────────────────────────
// Run this from Apps Script to force-sync all rows of a specific sheet
function manualSync() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt("Manual Sync", "Enter sheet name to sync:", ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;

  var sheetName = result.getResponseText().trim();
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) { ui.alert("Sheet not found: " + sheetName); return; }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var synced = 0;
  for (var i = 0; i < allData.length; i++) {
    var values = allData[i].map(function(v) {
      if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "d-MMM");
      return v !== null ? String(v) : "";
    });

    if (values.every(function(v) { return v === ""; })) continue;

    var payload = JSON.stringify({ sheet: sheetName, row: i + 2, values: values });
    var options = {
      method: "post", contentType: "application/json", payload: payload,
      headers: { "x-webhook-secret": WEBHOOK_SECRET }, muteHttpExceptions: true,
    };
    UrlFetchApp.fetch(WEBHOOK_URL, options);
    synced++;
    Utilities.sleep(100); // rate limit
  }

  ui.alert("✅ Synced " + synced + " rows from " + sheetName);
}
