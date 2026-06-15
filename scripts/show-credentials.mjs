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

console.log("");
console.log("===== COPY THIS AS  GOOGLE_SERVICE_ACCOUNT_EMAIL =====");
console.log(json.client_email);
console.log("===== END EMAIL =====");
console.log("");
console.log("===== COPY THIS AS  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY =====");
console.log(escaped);
console.log("===== END PRIVATE KEY =====");
console.log("");
console.log("Tips:");
console.log("- Select EXACTLY the lines between the delimiters - no surrounding blanks.");
console.log("- Paste into Vercel Settings > Environment Variables.");
console.log("- After pasting, verify the private key value still contains literal `\\n` text (two chars).");
console.log("- Apply to Production + Preview.");
console.log("- Delete any old GOOGLE_SERVICE_ACCOUNT_JSON variable to avoid confusion.");
console.log("");
