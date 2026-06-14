/**
 * O1DMatch Pitch Desk - Google Sheet bootstrapper.
 *
 * HOW TO USE
 *   1. Open the Google Sheet you want to use (or create a blank one named
 *      "O1DMatch Pitch Desk Database").
 *   2. Extensions > Apps Script.
 *   3. Delete the default Code.gs contents and paste this whole file in.
 *   4. Save. Then in the function dropdown at the top, pick `setupSheet`
 *      and click Run. Authorize when prompted.
 *   5. Back in the Sheet, you will see five tabs created with the exact
 *      headers the app expects:
 *        Companies, Contacts, Drafts, Settings, Audit_Log
 *   6. Share the Sheet with the service-account email:
 *        immigration-management-system@exhibits-480112.iam.gserviceaccount.com
 *      Role: Editor. Uncheck "Notify people".
 *   7. Copy the Sheet ID from the URL (the long string between /d/ and /edit)
 *      and paste it into the app's .env.local as GOOGLE_SHEET_ID.
 *
 * SCHEMA VERSION
 *   v2 - matches the original handoff and adds three run-metadata columns
 *        on the Drafts tab (model_used, latency_ms, mode) so the Sheet stays
 *        in sync with the Postgres `drafts` table in the new Next.js app.
 *
 * IDEMPOTENT
 *   Running this more than once is safe. Missing tabs are created. Existing
 *   tabs that are missing a header column have it appended at the right end
 *   without clobbering existing data.
 */

const SHEET_HEADERS = {
  Companies: [
    'company_id',
    'company_name',
    'website',
    'industry',
    'company_size',
    'hq_location',
    'other_locations',
    'h1b_history_notes',
    'green_card_history_notes',
    'o1_history_notes',
    'occupations_hired',
    'salary_notes',
    'raw_employer_research',
    'company_strategy_notes',
    'source_url',
    'created_at',
    'updated_at'
  ],
  Contacts: [
    'contact_id',
    'company_id',
    'contact_name',
    'contact_title',
    'contact_email',
    'contact_phone',
    'contact_location',
    'contact_type',
    'contact_priority',
    'contact_notes',
    'linkedin_url',
    'created_at',
    'updated_at'
  ],
  Drafts: [
    // Original 25 columns from the handoff
    'draft_id',
    'company_id',
    'contact_id',
    'sender',
    'pitch_type',
    'sub_pitch',
    'custom_pitch_notes',
    'product_offer',
    'custom_offer_notes',
    'tone',
    'goal',
    'custom_goal_notes',
    'subject_1',
    'subject_2',
    'short_email',
    'personalized_email',
    'follow_up_email',
    'call_notes',
    'crm_notes',
    'objection_responses',
    'employer_analysis',
    'ai_reasoning_summary',
    'copy_warnings',
    'created_at',
    'created_by',
    // New run-metadata columns added for the Next.js app
    'model_used',
    'latency_ms',
    'mode'
  ],
  Settings: [
    'setting_type',
    'setting_key',
    'setting_value',
    'sort_order',
    'active'
  ],
  Audit_Log: [
    'timestamp',
    'user',
    'action',
    'company_id',
    'contact_id',
    'draft_id',
    'notes'
  ]
};

const TAB_ORDER = ['Companies', 'Contacts', 'Drafts', 'Settings', 'Audit_Log'];

/**
 * Main entry point. Run this once. Re-run any time the schema changes.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No active spreadsheet. Open this script from inside a Google Sheet (Extensions > Apps Script).');
  }

  TAB_ORDER.forEach(function (tabName, position) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName, position);
    }
    ensureHeaderRow_(sheet, SHEET_HEADERS[tabName]);
    styleHeader_(sheet, SHEET_HEADERS[tabName].length);
    setColumnWidths_(sheet, tabName);
  });

  removeDefaultBlankSheetIfEmpty_(ss);
  reorderTabs_(ss);

  var msg = 'Setup complete. Tabs ready: ' + TAB_ORDER.join(', ') +
    '\n\nNext step: share this Sheet with the service account as Editor:\n' +
    '  immigration-management-system@exhibits-480112.iam.gserviceaccount.com';
  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    // No UI when running headlessly. The Logger output is enough.
  }
}

/**
 * Re-runnable header repair. Appends any missing columns at the right edge
 * without touching existing data. If the header row is empty, writes the
 * full set in order.
 */
function ensureHeaderRow_(sheet, expectedHeaders) {
  var lastColumn = sheet.getLastColumn();
  var existing = [];
  if (lastColumn > 0) {
    existing = sheet
      .getRange(1, 1, 1, Math.max(lastColumn, expectedHeaders.length))
      .getValues()[0];
  }

  var existingClean = existing.map(function (v) { return String(v || '').trim(); });
  var emptyRow = existingClean.every(function (v) { return v === ''; });

  if (emptyRow) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.setFrozenRows(1);
    return;
  }

  // Append any headers that are missing. Preserves existing column order.
  var present = {};
  existingClean.forEach(function (h) { if (h) present[h] = true; });

  var toAppend = expectedHeaders.filter(function (h) { return !present[h]; });
  if (toAppend.length === 0) return;

  var nextCol = existingClean.filter(function (v) { return v !== ''; }).length + 1;
  sheet.getRange(1, nextCol, 1, toAppend.length).setValues([toAppend]);
  sheet.setFrozenRows(1);
}

function styleHeader_(sheet, numCols) {
  if (numCols < 1) return;
  var range = sheet.getRange(1, 1, 1, numCols);
  range.setFontWeight('bold');
  range.setBackground('#f1f5f9');
  range.setFontColor('#0f172a');
  range.setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
}

function setColumnWidths_(sheet, tabName) {
  // Reasonable defaults so long bodies wrap nicely without dragging columns.
  var widths = {
    Companies: { id: 110, name: 240, website: 200, industry: 180, raw: 320, strategy: 320, default: 160 },
    Contacts:  { id: 110, name: 200, title: 200, email: 220, notes: 280, default: 160 },
    Drafts:    { id: 110, subject: 260, email: 360, notes: 240, jsonblob: 280, default: 160 },
    Settings:  { default: 200 },
    Audit_Log: { default: 200 }
  };
  // Keep it light — Apps Script setColumnWidth one at a time is slow. We only
  // resize the first 8 columns; the rest stay default.
  var n = Math.min(8, sheet.getLastColumn());
  for (var c = 1; c <= n; c++) {
    sheet.setColumnWidth(c, widths[tabName] ? widths[tabName].default : 160);
  }
}

function reorderTabs_(ss) {
  TAB_ORDER.forEach(function (name, idx) {
    var sheet = ss.getSheetByName(name);
    if (sheet) ss.setActiveSheet(sheet) && sheet.activate() && ss.moveActiveSheet(idx + 1);
  });
}

function removeDefaultBlankSheetIfEmpty_(ss) {
  var sheet1 = ss.getSheetByName('Sheet1');
  if (!sheet1) return;
  if (ss.getSheets().length <= 1) return;
  var hasContent = sheet1.getLastRow() > 0 || sheet1.getLastColumn() > 1;
  if (!hasContent) {
    ss.deleteSheet(sheet1);
  }
}

/**
 * Optional convenience: print the Sheet ID into the log so you can copy it
 * into .env.local as GOOGLE_SHEET_ID without leaving Apps Script.
 */
function printSheetId() {
  var id = SpreadsheetApp.getActiveSpreadsheet().getId();
  Logger.log('GOOGLE_SHEET_ID=' + id);
  try {
    SpreadsheetApp.getUi().alert('Sheet ID:\n' + id);
  } catch (e) {}
}
