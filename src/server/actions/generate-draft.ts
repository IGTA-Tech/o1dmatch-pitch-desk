"use server";

import { and, eq, sql } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { auditLog, companies, contacts, drafts } from "@/lib/db/schema";
import { generateDraft as runPipeline } from "@/lib/ai/generate-draft";
import {
  mirrorDraftToSheet,
  mirrorCompanyToSheet,
  mirrorContactToSheet,
  mirrorAuditLogToSheet,
} from "@/lib/sheets/mirror";
import type { GenerateInput } from "@/lib/ai/schema";

export interface GenerateActionResult {
  ok: boolean;
  draftId?: string;
  output?: Awaited<ReturnType<typeof runPipeline>>["output"];
  meta?: Awaited<ReturnType<typeof runPipeline>>["meta"];
  sheetMirror?: { ok: boolean; error?: string };
  error?: string;
}

export async function generateDraftAction(input: GenerateInput): Promise<GenerateActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in." };

  let user;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  const senderId = user?.primaryEmailAddress?.emailAddress ?? userId;

  try {
    const { output, meta } = await runPipeline(input);

    // Company dedup: find by case-insensitive name. Otherwise insert.
    // Keeps the Companies page from filling up with duplicates each time the
    // same employer is generated against.
    const [existingCompany] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(sql`lower(${companies.name}) = lower(${input.company.company_name})`)
      .limit(1);

    let companyId: string;
    let newCompanyRow: typeof companies.$inferSelect | undefined;
    if (existingCompany) {
      companyId = existingCompany.id;
      // Merge: only overwrite fields that were previously empty so the user's
      // manual edits stay. updated_at always bumps.
      await db
        .update(companies)
        .set({
          website: sql`coalesce(nullif(${companies.website}, ''), ${input.company.website})`,
          industry: sql`coalesce(nullif(${companies.industry}, ''), ${input.company.industry})`,
          companySize: sql`coalesce(nullif(${companies.companySize}, ''), ${input.company.company_size})`,
          hqLocation: sql`coalesce(nullif(${companies.hqLocation}, ''), ${input.company.hq_location})`,
          otherLocations: sql`coalesce(nullif(${companies.otherLocations}, ''), ${input.company.other_locations})`,
          h1bHistoryNotes: sql`coalesce(nullif(${companies.h1bHistoryNotes}, ''), ${input.company.h1b_history_notes})`,
          greenCardHistoryNotes: sql`coalesce(nullif(${companies.greenCardHistoryNotes}, ''), ${input.company.green_card_history_notes})`,
          o1HistoryNotes: sql`coalesce(nullif(${companies.o1HistoryNotes}, ''), ${input.company.o1_history_notes})`,
          occupationsHired: sql`coalesce(nullif(${companies.occupationsHired}, ''), ${input.company.occupations_hired})`,
          salaryNotes: sql`coalesce(nullif(${companies.salaryNotes}, ''), ${input.company.salary_notes})`,
          rawEmployerResearch: sql`coalesce(nullif(${companies.rawEmployerResearch}, ''), ${input.company.raw_employer_research})`,
          companyStrategyNotes: sql`coalesce(nullif(${companies.companyStrategyNotes}, ''), ${input.company.company_strategy_notes})`,
          sourceUrl: sql`coalesce(nullif(${companies.sourceUrl}, ''), ${input.company.source_url})`,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId));
    } else {
      const [inserted] = await db
        .insert(companies)
        .values({
          name: input.company.company_name,
          website: input.company.website,
          industry: input.company.industry,
          companySize: input.company.company_size,
          hqLocation: input.company.hq_location,
          otherLocations: input.company.other_locations,
          h1bHistoryNotes: input.company.h1b_history_notes,
          greenCardHistoryNotes: input.company.green_card_history_notes,
          o1HistoryNotes: input.company.o1_history_notes,
          occupationsHired: input.company.occupations_hired,
          salaryNotes: input.company.salary_notes,
          rawEmployerResearch: input.company.raw_employer_research,
          companyStrategyNotes: input.company.company_strategy_notes,
          sourceUrl: input.company.source_url,
        })
        .returning();
      newCompanyRow = inserted;
      companyId = inserted.id;
    }

    // Contact dedup: same name within the same company.
    const [existingContact] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          eq(contacts.companyId, companyId),
          sql`lower(${contacts.name}) = lower(${input.contact.contact_name})`,
        ),
      )
      .limit(1);

    let contactId: string;
    let newContactRow: typeof contacts.$inferSelect | undefined;
    if (existingContact) {
      contactId = existingContact.id;
      await db
        .update(contacts)
        .set({
          title: sql`coalesce(nullif(${contacts.title}, ''), ${input.contact.contact_title})`,
          email: sql`coalesce(nullif(${contacts.email}, ''), ${input.contact.contact_email})`,
          phone: sql`coalesce(nullif(${contacts.phone}, ''), ${input.contact.contact_phone})`,
          location: sql`coalesce(nullif(${contacts.location}, ''), ${input.contact.contact_location})`,
          contactType: sql`coalesce(nullif(${contacts.contactType}, ''), ${input.contact.contact_type})`,
          priority: sql`coalesce(nullif(${contacts.priority}, ''), ${input.contact.contact_priority})`,
          notes: sql`coalesce(nullif(${contacts.notes}, ''), ${input.contact.contact_notes})`,
          linkedinUrl: sql`coalesce(nullif(${contacts.linkedinUrl}, ''), ${input.contact.linkedin_url})`,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, contactId));
    } else {
      const [inserted] = await db
        .insert(contacts)
        .values({
          companyId,
          name: input.contact.contact_name,
          title: input.contact.contact_title,
          email: input.contact.contact_email,
          phone: input.contact.contact_phone,
          location: input.contact.contact_location,
          contactType: input.contact.contact_type,
          priority: input.contact.contact_priority,
          notes: input.contact.contact_notes,
          linkedinUrl: input.contact.linkedin_url,
        })
        .returning();
      newContactRow = inserted;
      contactId = inserted.id;
    }

    const [insertedDraft] = await db
      .insert(drafts)
      .values({
        companyId,
        contactId,
        sender: input.controls.sender,
        pitchType: input.controls.pitch_type,
        subPitch: input.controls.sub_pitch,
        customPitchNotes: input.controls.custom_pitch_notes,
        productOffer: input.controls.product_offer,
        customOfferNotes: input.controls.custom_offer_notes,
        tone: input.controls.tone,
        goal: input.controls.goal,
        customGoalNotes: input.controls.custom_goal_notes,
        subject1: output.drafts.subject_lines[0] ?? "",
        subject2: output.drafts.subject_lines[1] ?? "",
        shortEmail: output.drafts.short_email,
        personalizedEmail: output.drafts.personalized_email,
        followUpEmail: output.drafts.follow_up_email,
        callNotes: output.drafts.call_notes,
        crmNotes: output.drafts.crm_notes,
        objectionResponses: output.drafts.objection_responses,
        employerAnalysis: output.employer_analysis,
        qualityControl: output.quality_control,
        copyWarnings: output.quality_control.copy_warnings,
        modelUsed: meta.modelUsed,
        latencyMs: meta.latencyMs,
        mode: meta.mode,
        createdBy: senderId,
      })
      .returning();

    const [insertedAuditEntry] = await db
      .insert(auditLog)
      .values({
        userId: senderId,
        action: "draft.generated",
        companyId,
        contactId,
        draftId: insertedDraft.id,
        notes: { modelUsed: meta.modelUsed, fellBack: meta.fellBack, latencyMs: meta.latencyMs },
      })
      .returning();

    let sheetMirror: { ok: boolean; error?: string } | undefined;
    if (input.controls.saveToSheet) {
      // Fire all four mirrors in parallel. The Drafts result is what surfaces
      // in the UI (it's the user-facing one). Companies and Contacts are only
      // mirrored on the FIRST insert (dedup hit means the sheet already has
      // that row from when the company/contact was originally created). Audit
      // log is appended every time so the sheet has the same activity trail
      // as the Activity tab.
      const [draftResult] = await Promise.all([
        mirrorDraftToSheet(insertedDraft),
        newCompanyRow ? mirrorCompanyToSheet(newCompanyRow) : Promise.resolve({ ok: true }),
        newContactRow ? mirrorContactToSheet(newContactRow) : Promise.resolve({ ok: true }),
        mirrorAuditLogToSheet(insertedAuditEntry),
      ]);
      sheetMirror = draftResult;
    }

    return {
      ok: true,
      draftId: insertedDraft.id,
      output,
      meta,
      sheetMirror,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generateDraftAction] failed:", err);
    return { ok: false, error: msg };
  }
}
