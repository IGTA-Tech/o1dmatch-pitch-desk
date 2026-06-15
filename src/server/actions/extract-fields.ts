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
  "- If the contact's role is unclear from the text, use \"Unknown\".",
  "- Capture every distinct person. Do not deduplicate; output one entry per person.",
  "- Preserve original casing for names and titles.",
  "- For company_strategy_notes, write a brief actionable 1-2 sentence hint",
  "  ONLY if the text contains strategic clues (location angle, pain point,",
  "  H-1B sensitivity, etc.). Otherwise leave it empty.",
  "- ASCII only. No emojis. No smart quotes. No em dashes.",
  "- For occupations_hired, salary_notes, h1b_history_notes, etc., summarize",
  "  succinctly from what the text says. Empty if not mentioned.",
  "- For website, return only the bare domain or full URL exactly as written.",
  "- For source_url, copy any explicit URL the text references.",
].join("\n");

export interface ExtractResult {
  ok: boolean;
  data?: ExtractedData;
  error?: string;
  latencyMs?: number;
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

    const data = deepSanitize(object) as ExtractedData;

    await db.insert(auditLog).values({
      userId: senderId,
      action: "data.extracted",
      notes: {
        chars: cleaned.length,
        companyName: data.company.company_name,
        contactCount: data.contacts.length,
      },
    });

    return { ok: true, data, latencyMs: Date.now() - started };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[extractFieldsAction] failed:", err);
    return { ok: false, error: msg, latencyMs: Date.now() - started };
  }
}
