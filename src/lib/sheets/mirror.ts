/**
 * Append a Draft row to the existing Google Sheet.
 * Order matches o1dmatch_pitch_desk_handoff_v2/schema/sheet_headers.json.
 *
 * Failures are logged but do not throw - the DB is the source of truth.
 */
import "server-only";
import { getSheetsClient, getSheetId } from "./client";
import type { Draft } from "@/lib/db/schema";

// MUST match the header order produced by scripts/setup-sheet.gs.
const DRAFTS_HEADER_ORDER = [
  "draft_id",
  "company_id",
  "contact_id",
  "sender",
  "pitch_type",
  "sub_pitch",
  "custom_pitch_notes",
  "product_offer",
  "custom_offer_notes",
  "tone",
  "goal",
  "custom_goal_notes",
  "subject_1",
  "subject_2",
  "short_email",
  "personalized_email",
  "follow_up_email",
  "call_notes",
  "crm_notes",
  "objection_responses",
  "employer_analysis",
  "ai_reasoning_summary",
  "copy_warnings",
  "created_at",
  "created_by",
  "model_used",
  "latency_ms",
  "mode",
] as const;

function draftToRow(draft: Draft): (string | number | null)[] {
  const get = (key: string): unknown => {
    switch (key) {
      case "draft_id":
        return draft.id;
      case "company_id":
        return draft.companyId;
      case "contact_id":
        return draft.contactId;
      case "sender":
        return draft.sender;
      case "pitch_type":
        return draft.pitchType;
      case "sub_pitch":
        return draft.subPitch;
      case "custom_pitch_notes":
        return draft.customPitchNotes;
      case "product_offer":
        return draft.productOffer;
      case "custom_offer_notes":
        return draft.customOfferNotes;
      case "tone":
        return draft.tone;
      case "goal":
        return draft.goal;
      case "custom_goal_notes":
        return draft.customGoalNotes;
      case "subject_1":
        return draft.subject1;
      case "subject_2":
        return draft.subject2;
      case "short_email":
        return draft.shortEmail;
      case "personalized_email":
        return draft.personalizedEmail;
      case "follow_up_email":
        return draft.followUpEmail;
      case "call_notes":
        return draft.callNotes;
      case "crm_notes":
        return draft.crmNotes;
      case "objection_responses":
        return JSON.stringify(draft.objectionResponses ?? []);
      case "employer_analysis":
        return JSON.stringify(draft.employerAnalysis ?? {});
      case "ai_reasoning_summary":
        return draft.modelUsed ?? "";
      case "copy_warnings":
        return JSON.stringify(draft.copyWarnings ?? []);
      case "created_at":
        return draft.createdAt instanceof Date ? draft.createdAt.toISOString() : String(draft.createdAt ?? "");
      case "created_by":
        return draft.createdBy;
      case "model_used":
        return draft.modelUsed;
      case "latency_ms":
        return draft.latencyMs;
      case "mode":
        return draft.mode;
      default:
        return "";
    }
  };

  return DRAFTS_HEADER_ORDER.map((key) => {
    const value = get(key);
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return value;
    return String(value);
  });
}

export async function mirrorDraftToSheet(draft: Draft): Promise<{ ok: boolean; error?: string }> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();
  if (!sheets || !spreadsheetId) {
    return { ok: false, error: "Sheets client or sheet ID is not configured." };
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Drafts!A1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [draftToRow(draft)] },
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sheets] append failed:", msg);
    return { ok: false, error: msg };
  }
}
