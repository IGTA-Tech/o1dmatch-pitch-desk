#!/usr/bin/env node
/**
 * Prints the two values you need for the GOOGLE_SERVICE_ACCOUNT_EMAIL and
 * GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars in a paste-safe format, with
 * loud delimiters around each so you can't grab whitespace.
 *
 * Usage:
 *   node scripts/show-credentials.mjs <path-to-key.json>
 *
 * Example (Windows):
 *   node scripts/show-credentials.mjs "C:\\Users\\hp\\Downloads\\my-new-key.json"
 *
 * Then in Vercel:
 *   1. Add GOOGLE_SERVICE_ACCOUNT_EMAIL    -> paste the email block content
 *   2. Add GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY -> paste the key block content
 *      (the \n sequences are intentional - the runtime converts them to real
 *       newlines for the JWT signer; you should see literal `\n` text in the
 *       Vercel value field after paste)
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/show-credentials.mjs <path-to-key.json>");
  process.exit(1);
}

let json;
try {
  const text = await readFile(resolve(path), "utf-8");
  json = JSON.parse(text);
} catch (err) {
  console.error("Could not read or parse the JSON file:", err.message);
  process.exit(1);
}

if (!json.client_email || !json.private_key) {
  console.error("The JSON file is missing client_email or private_key. Are you sure this is a Google service account key?");
  process.exit(1);
}

const escaped = json.private_key.replace(/\n/g, "\\n");
const base64 = Buffer.from(json.private_key, "utf-8").toString("base64");

console.log("");
console.log("===== COPY THIS AS  GOOGLE_SERVICE_ACCOUNT_EMAIL =====");
console.log(json.client_email);
console.log("===== END EMAIL =====");
console.log("");
console.log("=== RECOMMENDED: base64 path - paste-bulletproof ===");
console.log("Set Vercel env var GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64 to:");
console.log("");
console.log("===== COPY THIS AS  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64 =====");
console.log(base64);
console.log("===== END BASE64 KEY =====");
console.log("");
console.log("Then DELETE these old env vars on Vercel if they exist:");
console.log("  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
console.log("  GOOGLE_SERVICE_ACCOUNT_JSON");
console.log("");
console.log("---------------------------------------------------");
console.log("");
console.log("=== LEGACY: \\n-escaped path (only if base64 is awkward) ===");
console.log("");
console.log("===== COPY THIS AS  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY =====");
console.log(escaped);
console.log("===== END PRIVATE KEY =====");
console.log("");
console.log("Tips:");
console.log("- The base64 string is alphanumeric + +/= - it cannot be corrupted by any paste.");
console.log("- After pasting into Vercel, re-open the env var to confirm the value is intact.");
console.log("- Apply env vars to Production + Preview.");
console.log("- Resolution order in code: B64 > split escape > legacy JSON.");
console.log("");
