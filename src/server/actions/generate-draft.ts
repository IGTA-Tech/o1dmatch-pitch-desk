"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { auditLog, companies, contacts, drafts } from "@/lib/db/schema";
import { generateDraft as runPipeline } from "@/lib/ai/generate-draft";
import { mirrorDraftToSheet } from "@/lib/sheets/mirror";
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

    // Upsert company
    const [insertedCompany] = await db
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

    const [insertedContact] = await db
      .insert(contacts)
      .values({
        companyId: insertedCompany.id,
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

    const [insertedDraft] = await db
      .insert(drafts)
      .values({
        companyId: insertedCompany.id,
        contactId: insertedContact.id,
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

    await db.insert(auditLog).values({
      userId: senderId,
      action: "draft.generated",
      companyId: insertedCompany.id,
      contactId: insertedContact.id,
      draftId: insertedDraft.id,
      notes: { modelUsed: meta.modelUsed, fellBack: meta.fellBack, latencyMs: meta.latencyMs },
    });

    let sheetMirror: { ok: boolean; error?: string } | undefined;
    if (input.controls.saveToSheet) {
      sheetMirror = await mirrorDraftToSheet(insertedDraft);
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
