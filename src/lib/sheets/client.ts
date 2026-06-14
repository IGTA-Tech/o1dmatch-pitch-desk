/**
 * googleapis client using a service-account JSON pasted into env.
 * Server-only - never import from a client component.
 */
import "server-only";
import { google, type sheets_v4 } from "googleapis";

let cached: sheets_v4.Sheets | null = null;

function parseServiceAccountJson(): {
  client_email: string;
  private_key: string;
} | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      client_email: parsed.client_email,
      private_key: String(parsed.private_key ?? "").replace(/\\n/g, "\n"),
    };
  } catch (err) {
    console.error("[sheets] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON:", err);
    return null;
  }
}

export function getSheetsClient(): sheets_v4.Sheets | null {
  if (cached) return cached;
  const creds = parseServiceAccountJson();
  if (!creds) return null;

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cached = google.sheets({ version: "v4", auth });
  return cached;
}

export function getSheetId(): string | null {
  return process.env.GOOGLE_SHEET_ID || null;
}
