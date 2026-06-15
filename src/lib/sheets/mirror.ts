/**
 * Append rows to the four transactional tabs of the team Google Sheet
 * (Companies, Contacts, Drafts, Audit_Log). The fifth tab (Settings) is
 * configuration and is NOT mirrored - dropdowns live in Postgres now.
 *
 * Failures are logged but do not throw - the DB is the source of truth.
 * All callers should pass the existing inserted row from the DB so the
 * sheet row carries the same UUID as the Postgres record.
 */
import "server-only";
import { getSheetsClient, getSheetId } from "./client";
import type { Draft, Company, Contact, AuditLogEntry } from "@/lib/db/schema";

interface MirrorResult {
  ok: boolean;
  error?: string;
}

function isoOrEmpty(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

async function append(
  range: string,
  row: (string | number | null)[],
): Promise<MirrorResult> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();
  if (!sheets || !spreadsheetId) {
    return { ok: false, error: "Sheets client or sheet ID is not configured." };
  }
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sheets] append to ${range} failed:`, msg);
    return { ok: false, error: msg };
  }
}

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

export async function mirrorDraftToSheet(draft: Draft): Promise<MirrorResult> {
  return append("Drafts!A1", draftToRow(draft));
}

/* ----------------- Companies ----------------- */

const COMPANIES_HEADER_ORDER = [
  "company_id",
  "company_name",
  "website",
  "industry",
  "company_size",
  "hq_location",
  "other_locations",
  "h1b_history_notes",
  "green_card_history_notes",
  "o1_history_notes",
  "occupations_hired",
  "salary_notes",
  "raw_employer_research",
  "company_strategy_notes",
  "source_url",
  "created_at",
  "updated_at",
] as const;

function companyToRow(c: Company): (string | number | null)[] {
  const map: Record<string, unknown> = {
    company_id: c.id,
    company_name: c.name,
    website: c.website,
    industry: c.industry,
    company_size: c.companySize,
    hq_location: c.hqLocation,
    other_locations: c.otherLocations,
    h1b_history_notes: c.h1bHistoryNotes,
    green_card_history_notes: c.greenCardHistoryNotes,
    o1_history_notes: c.o1HistoryNotes,
    occupations_hired: c.occupationsHired,
    salary_notes: c.salaryNotes,
    raw_employer_research: c.rawEmployerResearch,
    company_strategy_notes: c.companyStrategyNotes,
    source_url: c.sourceUrl,
    created_at: isoOrEmpty(c.createdAt),
    updated_at: isoOrEmpty(c.updatedAt),
  };
  return COMPANIES_HEADER_ORDER.map((k) => {
    const v = map[k];
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return v;
    return String(v);
  });
}

export async function mirrorCompanyToSheet(company: Company): Promise<MirrorResult> {
  return append("Companies!A1", companyToRow(company));
}

/* ----------------- Contacts ----------------- */

const CONTACTS_HEADER_ORDER = [
  "contact_id",
  "company_id",
  "contact_name",
  "contact_title",
  "contact_email",
  "contact_phone",
  "contact_location",
  "contact_type",
  "contact_priority",
  "contact_notes",
  "linkedin_url",
  "created_at",
  "updated_at",
] as const;

function contactToRow(c: Contact): (string | number | null)[] {
  const map: Record<string, unknown> = {
    contact_id: c.id,
    company_id: c.companyId,
    contact_name: c.name,
    contact_title: c.title,
    contact_email: c.email,
    contact_phone: c.phone,
    contact_location: c.location,
    contact_type: c.contactType,
    contact_priority: c.priority,
    contact_notes: c.notes,
    linkedin_url: c.linkedinUrl,
    created_at: isoOrEmpty(c.createdAt),
    updated_at: isoOrEmpty(c.updatedAt),
  };
  return CONTACTS_HEADER_ORDER.map((k) => {
    const v = map[k];
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return v;
    return String(v);
  });
}

export async function mirrorContactToSheet(contact: Contact): Promise<MirrorResult> {
  return append("Contacts!A1", contactToRow(contact));
}

/* ----------------- Audit log ----------------- */

const AUDIT_LOG_HEADER_ORDER = [
  "timestamp",
  "user",
  "action",
  "company_id",
  "contact_id",
  "draft_id",
  "notes",
] as const;

function auditLogToRow(entry: AuditLogEntry): (string | number | null)[] {
  const map: Record<string, unknown> = {
    timestamp: isoOrEmpty(entry.ts),
    user: entry.userId,
    action: entry.action,
    company_id: entry.companyId,
    contact_id: entry.contactId,
    draft_id: entry.draftId,
    notes: entry.notes ? JSON.stringify(entry.notes) : "",
  };
  return AUDIT_LOG_HEADER_ORDER.map((k) => {
    const v = map[k];
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return v;
    return String(v);
  });
}

export async function mirrorAuditLogToSheet(entry: AuditLogEntry): Promise<MirrorResult> {
  return append("Audit_Log!A1", auditLogToRow(entry));
}
