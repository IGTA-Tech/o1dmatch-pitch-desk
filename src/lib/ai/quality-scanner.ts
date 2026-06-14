/**
 * Port of Quality.gs runQualityChecks_.
 * Runs AFTER the model returns. Pushes findings into quality_control.copy_warnings.
 */

import type { PitchDeskOutput } from "./schema";
import { uniqueArray } from "./sanitize";
import { countWords } from "@/lib/utils";

export const BANNED_PHRASES = [
  "self-petitioned",
  "self petitioned",
  "self-petition",
  "self petition",
  "no legal exposure",
  "zero legal exposure",
  "no risk",
  "zero risk",
  "guaranteed approval",
  "guaranteed visa",
  "guarantee approval",
  "pre-vetted",
  "pre vetted",
  "qualified o-1 candidates",
  "qualified o1 candidates",
  "ai-evaluated against uscis criteria",
  "ai evaluated against uscis criteria",
  "visa-filing service",
  "law firm service",
  "we are your law firm",
];

const WORD_RANGES: Record<string, { min: number; max: number }> = {
  short_email: { min: 110, max: 175 },
  personalized_email: { min: 175, max: 300 },
  follow_up_email: { min: 50, max: 95 },
};

function collectDraftText(result: PitchDeskOutput): string {
  return [
    JSON.stringify(result.employer_analysis ?? {}),
    JSON.stringify(result.drafts ?? {}),
    JSON.stringify(result.quality_control ?? {}),
  ].join("\n");
}

export function runQualityChecks(result: PitchDeskOutput): PitchDeskOutput {
  const warnings: string[] = [];
  const combined = collectDraftText(result);
  const lower = combined.toLowerCase();

  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      warnings.push(`Banned phrase found: ${phrase}`);
    }
  }

  if (/[^\x00-\x7F]/.test(combined)) {
    warnings.push("Non-ASCII characters detected. Replace smart punctuation before sending.");
  }

  if ((result.drafts?.subject_lines ?? []).some((s) => String(s ?? "").length > 60)) {
    warnings.push("At least one subject line is over 60 characters.");
  }

  for (const key of ["short_email", "personalized_email", "follow_up_email"] as const) {
    const text = String(result.drafts?.[key] ?? "");
    if (text.includes("@o1dmatch.com")) {
      warnings.push(`${key} includes an email address. Gmail signature should handle sender details.`);
    }
    if (/\b\d{3}[-.)\s]*\d{3}[-.\s]*\d{4}\b/.test(text)) {
      warnings.push(`${key} may include a phone number. Gmail signature should handle sender details.`);
    }
    const wc = countWords(text);
    const range = WORD_RANGES[key];
    if (range && (wc < range.min || wc > range.max)) {
      warnings.push(`${key} is ${wc} words; target ${range.min}-${range.max}.`);
    }
  }

  result.quality_control ??= {
    legal_language_check: "",
    brand_check: "",
    missing_information: [],
    copy_warnings: [],
  };
  result.quality_control.copy_warnings = uniqueArray([
    ...(result.quality_control.copy_warnings ?? []),
    ...warnings,
  ]);

  return result;
}
