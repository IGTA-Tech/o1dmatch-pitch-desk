"use server";

import { generateObject } from "ai";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { resolveModel } from "@/lib/ai/openrouter";
import { extractSchema, type ExtractedData } from "@/lib/ai/extract-schema";
import { deepSanitize } from "@/lib/ai/sanitize";

const SYSTEM_PROMPT = [
  "You are an employer-data extraction assistant for the O1DMatch Pitch Desk.",
  "",
  "Given a blob of messy text (pasted from myvisajobs.com, a public profile page,",
  "an internal research note, an email, a LinkedIn snapshot, or any combination),",
  "extract:",
  "  1) Company facts into the company object",
  "  2) Every distinct contact you find into the contacts array",
  "",
  "Rules:",
  "- Do not invent facts. If a field is not in the text, leave it as an empty string.",
  "  Do not guess, infer, or make up details that are not present.",
  "- For contact_type, choose exactly one of:",
  "  Global Mobility, Human Resources, People Operations, Recruiter,",
  "  Talent Acquisition, General Counsel, Founder / CEO, President,",
  "  University Relations, Technical Contact, Staffing / Agency Contact,",
  "  Attorney Contact, Generic Inbox, Unknown.",
  "- If the contact's role is unclear, use \"Unknown\".",
  "- Roles containing the words \"immigration\", \"mobility\", \"visa team\", or",
  "  groups like \"HR Immigration\" or \"Immigration Team\" map to Global Mobility.",
  "- Capture every distinct person. Do not deduplicate; output one entry per person.",
  "- Preserve original casing for names and titles.",
  "- ASCII only. No emojis. No smart quotes. No em dashes.",
  "",
  "Contact name format - slash-encoded multi-person entries (CRITICAL):",
  "Some sources (especially myvisajobs.com) encode multiple contacts in one line:",
  "  \"First1/First2/First3 Last1/Last2/Last3 - Title or Team Name\"",
  "  followed by a shared phone and a shared email.",
  "The count of first names always equals the count of last names; pair them by index.",
  "Worked example - this single line represents FOUR contacts:",
  "  \"Andreas/Robert/Enis/Randi Gerling/Herreria/Garcia/Brazinski - Amazon Immigration Team\"",
  "  ->",
  "    1. Andreas Gerling   (title: Amazon Immigration Team)",
  "    2. Robert Herreria   (title: Amazon Immigration Team)",
  "    3. Enis Garcia       (title: Amazon Immigration Team)",
  "    4. Randi Brazinski   (title: Amazon Immigration Team)",
  "Each contact in the split gets the SAME email, phone, and title that followed the line.",
  "Slashes may have surrounding spaces (\"A / B\") or be tight (\"A/B\") - both are valid.",
  "Names may include initials like \"Robert L.\" - keep the initial intact.",
  "Apply the same rule to Green Card contact blocks (\"Daniel/Chongli Van Den Handel/Wu\"",
  "= Daniel Van Den Handel + Chongli Wu).",
  "Never output a contact_name that still contains a slash.",
  "",
  "Company strategy notes:",
  "- Write a brief actionable 1-2 sentence hint ONLY if the text contains real",
  "  strategic clues (visa rank, H-1B sensitivity, location angle, hiring pain,",
  "  research vs ops mix, etc.). Otherwise leave it empty.",
  "",
  "Summary fields:",
  "- occupations_hired: comma-separated short list from the page's top H-1B/GC",
  "  occupations if present.",
  "- h1b_history_notes: LCA count, rank, FY year, H-1B Dependent flag, recent",
  "  approval/denial split if mentioned.",
  "- green_card_history_notes: LC counts, PERM details.",
  "- o1_history_notes: anything about O-1 history; empty if not mentioned.",
  "- salary_notes: prevailing wage scale, salary ranges, anything quantitative.",
  "- company_size: prefer raw employee count if given (\"46,935 employees\").",
  "- other_locations: comma-separated short list of secondary worksites.",
  "- website / source_url: bare domain or URL exactly as written; empty if absent.",
].join("\n");

export interface ExtractResult {
  ok: boolean;
  data?: ExtractedData;
  error?: string;
  latencyMs?: number;
}

/**
 * Safety net for the slash-encoded multi-contact format the AI is *supposed*
 * to split in the prompt. If anything slips through with a slash still in the
 * name field, expand here deterministically.
 *
 * Input pattern: { contact_name: "Andreas/Robert/Enis Gerling/Herreria/Garcia", ... }
 * Output: three contacts, each inheriting the parent's email/phone/title/etc.
 *
 * Rules:
 * - Both the firsts portion and lasts portion must contain the same number of
 *   slash-separated tokens. If they don't match, we leave the entry alone
 *   (the AI did something we don't recognize, no point guessing).
 * - A name with no slash is left untouched.
 * - Surrounding spaces around slashes are tolerated.
 */
function expandSlashEncodedContacts(
  contacts: ExtractedData["contacts"],
): ExtractedData["contacts"] {
  const out: ExtractedData["contacts"] = [];
  for (const c of contacts) {
    const name = (c.contact_name ?? "").trim();
    if (!name.includes("/")) {
      out.push(c);
      continue;
    }

    // Try to split: everything up to the last "group" of tokens is "firsts",
    // the trailing tokens are "lasts". The naive split is: find the space that
    // separates the last "firsts" token from the first "lasts" token.
    // Pattern observed: "First1/First2/First3 Last1/Last2/Last3" - one space
    // between the firsts cluster and the lasts cluster.
    // We split on the first whitespace that has a "/" both before AND after it.
    const match = name.match(/^([^\s]+(?:\s*\/\s*[^\s]+)+)\s+([^\s]+(?:\s*\/\s*[^\s]+)+)$/);
    if (!match) {
      out.push(c);
      continue;
    }

    const firsts = match[1].split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
    const lasts = match[2].split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
    if (firsts.length !== lasts.length || firsts.length === 0) {
      out.push(c);
      continue;
    }

    for (let i = 0; i < firsts.length; i++) {
      out.push({
        ...c,
        contact_name: `${firsts[i]} ${lasts[i]}`,
      });
    }
  }
  return out;
}

export async function extractFieldsAction(rawText: string): Promise<ExtractResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const cleaned = String(rawText ?? "").trim();
  if (!cleaned) return { ok: false, error: "No text to extract from." };
  if (cleaned.length > 20000) {
    return { ok: false, error: "Text is over 20,000 characters. Trim it down first." };
  }

  let senderId = userId;
  try {
    const user = await currentUser();
    if (user?.primaryEmailAddress?.emailAddress) senderId = user.primaryEmailAddress.emailAddress;
  } catch {}

  const started = Date.now();

  // Honour mock mode so devs can wire up the UI without burning tokens.
  if (String(process.env.BETA_MOCK_MODE ?? "").toLowerCase() === "true") {
    return {
      ok: true,
      latencyMs: Date.now() - started,
      data: deepSanitize({
        company: {
          company_name: "Mock Extracted Co",
          website: "https://example.com",
          industry: "Software",
          company_size: "200-500 employees",
          hq_location: "Austin, TX",
          other_locations: "Remote",
          h1b_history_notes: "Mock h1b notes from extraction.",
          green_card_history_notes: "",
          o1_history_notes: "",
          occupations_hired: "Software Engineer, Product Manager",
          salary_notes: "",
          source_url: "",
          company_strategy_notes: "Mock strategy hint.",
        },
        contacts: [
          {
            contact_name: "Mock Person",
            contact_title: "Director of People",
            contact_email: "mock@example.com",
            contact_phone: "",
            contact_location: "Austin, TX",
            contact_type: "Human Resources" as const,
            contact_notes: "Mock contact extracted from text.",
          },
        ],
      }),
    };
  }

  try {
    const { object } = await generateObject({
      model: resolveModel("primary"),
      schema: extractSchema,
      schemaName: "o1dmatch_employer_extract",
      schemaDescription:
        "Structured extraction of company facts and every contact identified from messy text.",
      system: SYSTEM_PROMPT,
      prompt: `Extract structured employer data from this text.\n\nTEXT:\n${cleaned}`,
      temperature: 0.1,
      maxRetries: 1,
    });

    const rawData = deepSanitize(object) as ExtractedData;
    // Safety net: expand any slash-encoded contact names the AI did not split
    // itself. Determinstic, so we always end up with clean rows.
    const data: ExtractedData = {
      ...rawData,
      contacts: expandSlashEncodedContacts(rawData.contacts ?? []),
    };

    await db.insert(auditLog).values({
      userId: senderId,
      action: "data.extracted",
      notes: {
        chars: cleaned.length,
        companyName: data.company.company_name,
        contactCount: data.contacts.length,
        rawContactCount: rawData.contacts?.length ?? 0,
      },
    });

    return { ok: true, data, latencyMs: Date.now() - started };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[extractFieldsAction] failed:", err);
    return { ok: false, error: msg, latencyMs: Date.now() - started };
  }
}
