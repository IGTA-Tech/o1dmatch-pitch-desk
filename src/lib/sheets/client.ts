/**
 * googleapis client - service account credentials read from env.
 * Server-only - never import from a client component.
 *
 * Three env-var layouts supported, tried in order:
 *
 *   Path A (RECOMMENDED for cloud - bulletproof against paste corruption):
 *     GOOGLE_SERVICE_ACCOUNT_EMAIL=sheet-reader@...iam.gserviceaccount.com
 *     GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64=<base64 of the full PEM key>
 *   Base64 is alphanumeric + a few punctuation marks - no escapes, no
 *   newlines, no characters any env-var UI can possibly mangle.
 *
 *   Path B (split, escape-encoded - works if paste behaves):
 *     GOOGLE_SERVICE_ACCOUNT_EMAIL=...
 *     GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
 *
 *   Path C (legacy - whole service-account JSON in one var):
 *     GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account", ...}
 *
 * Path C has a built-in repair pass that re-escapes real newlines inside
 * the JSON string, because some env-var UIs convert `\n` escape sequences
 * into actual newlines on paste - which breaks JSON.parse.
 */
import "server-only";
import { google, type sheets_v4 } from "googleapis";

let cached: sheets_v4.Sheets | null = null;

function normalizePrivateKey(raw: string): string {
  // Service-account private keys frequently arrive with `\n` as two literal
  // characters that need to become real newlines for the JWT signer.
  // Already-newlined keys are left untouched.
  return raw.replace(/\\n/g, "\n");
}

function parseFromBase64Env(): { client_email: string; private_key: string } | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64;
  if (!email || !b64) return null;
  try {
    const decoded = Buffer.from(b64.trim(), "base64").toString("utf-8");
    // Defensive: if someone base64-encoded a value that already had literal \n
    // escapes, normalize them too.
    return {
      client_email: email.trim(),
      private_key: normalizePrivateKey(decoded),
    };
  } catch (err) {
    console.error("[sheets] GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64 is not valid base64:", err);
    return null;
  }
}

function parseFromSplitEnv(): { client_email: string; private_key: string } | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !key) return null;
  return {
    client_email: email.trim(),
    private_key: normalizePrivateKey(key.trim()),
  };
}

function parseFromJsonEnv(): { client_email: string; private_key: string } | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  // First attempt: parse as-is. Works when the value is clean one-line JSON.
  try {
    const parsed = JSON.parse(raw);
    return {
      client_email: parsed.client_email,
      private_key: normalizePrivateKey(String(parsed.private_key ?? "")),
    };
  } catch (firstErr) {
    // Repair attempt: when Vercel (or any paste target) expands literal `\n`
    // escape sequences into real newline characters, JSON.parse fails with
    // "Bad control character in string literal". Re-escape every real
    // newline and re-parse. This is safe for one-line minified JSON which
    // is the form Google generates.
    try {
      const repaired = raw.replace(/\r?\n/g, "\\n");
      const parsed = JSON.parse(repaired);
      console.warn(
        "[sheets] GOOGLE_SERVICE_ACCOUNT_JSON had real newlines inside the string - auto-repaired.",
      );
      return {
        client_email: parsed.client_email,
        private_key: normalizePrivateKey(String(parsed.private_key ?? "")),
      };
    } catch (secondErr) {
      console.error(
        "[sheets] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON and auto-repair failed.",
        { firstErr: String(firstErr), secondErr: String(secondErr) },
      );
      return null;
    }
  }
}

function parseServiceAccount(): { client_email: string; private_key: string } | null {
  // Tried in order: base64 (paste-bulletproof) -> split escape -> legacy JSON.
  return parseFromBase64Env() ?? parseFromSplitEnv() ?? parseFromJsonEnv();
}

export function getSheetsClient(): sheets_v4.Sheets | null {
  if (cached) return cached;
  const creds = parseServiceAccount();
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
