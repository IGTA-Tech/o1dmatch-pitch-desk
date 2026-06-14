import { z } from "zod";

/**
 * The AI output contract. This Zod schema drives:
 *   1. Vercel AI SDK generateObject({ schema })
 *   2. Server-side validation of any AI response
 *   3. Type inference for the UI
 *
 * Keep in sync with the JSON schema in the original PromptLibrary.gs.
 */

export const employerAnalysisSchema = z.object({
  company_summary: z.string(),
  contact_summary: z.string(),
  employer_type: z.string(),
  contact_type: z.string(),
  selected_pitch_type: z.string(),
  selected_sub_pitch: z.string(),
  selected_product_offer: z.string(),
  fit_score: z.number().int().min(0).max(10),
  urgency_score: z.number().int().min(0).max(10),
  why_this_pitch: z.string(),
  likely_objections: z.array(z.string()),
});

export const objectionResponseSchema = z.object({
  objection: z.string(),
  response: z.string(),
});

export const draftsSchema = z.object({
  subject_lines: z.array(z.string()).length(2),
  short_email: z.string(),
  personalized_email: z.string(),
  follow_up_email: z.string(),
  call_notes: z.string(),
  crm_notes: z.string(),
  objection_responses: z.array(objectionResponseSchema),
});

export const qualityControlSchema = z.object({
  legal_language_check: z.string(),
  brand_check: z.string(),
  missing_information: z.array(z.string()),
  copy_warnings: z.array(z.string()),
});

export const pitchDeskOutputSchema = z.object({
  employer_analysis: employerAnalysisSchema,
  drafts: draftsSchema,
  quality_control: qualityControlSchema,
});

export type PitchDeskOutput = z.infer<typeof pitchDeskOutputSchema>;
export type EmployerAnalysis = z.infer<typeof employerAnalysisSchema>;
export type Drafts = z.infer<typeof draftsSchema>;
export type QualityControl = z.infer<typeof qualityControlSchema>;
export type ObjectionResponse = z.infer<typeof objectionResponseSchema>;

/** The user-facing form payload that the Server Action accepts. */
export const generateInputSchema = z.object({
  company: z.object({
    company_name: z.string().min(1, "Company name is required"),
    website: z.string().optional().default(""),
    industry: z.string().optional().default(""),
    company_size: z.string().optional().default(""),
    hq_location: z.string().optional().default(""),
    other_locations: z.string().optional().default(""),
    h1b_history_notes: z.string().optional().default(""),
    green_card_history_notes: z.string().optional().default(""),
    o1_history_notes: z.string().optional().default(""),
    occupations_hired: z.string().optional().default(""),
    salary_notes: z.string().optional().default(""),
    raw_employer_research: z.string().optional().default(""),
    company_strategy_notes: z.string().optional().default(""),
    source_url: z.string().optional().default(""),
  }),
  contact: z.object({
    contact_name: z.string().min(1, "Contact name is required"),
    contact_title: z.string().optional().default(""),
    contact_email: z.string().optional().default(""),
    contact_phone: z.string().optional().default(""),
    contact_location: z.string().optional().default(""),
    contact_type: z.string().optional().default("Unknown"),
    contact_priority: z.string().optional().default(""),
    contact_notes: z.string().optional().default(""),
    linkedin_url: z.string().optional().default(""),
  }),
  allContacts: z
    .array(
      z.object({
        contact_name: z.string(),
        contact_title: z.string().optional().default(""),
        contact_email: z.string().optional().default(""),
        contact_type: z.string().optional().default("Unknown"),
      }),
    )
    .default([]),
  controls: z.object({
    sender: z.string(),
    pitch_type: z.string(),
    sub_pitch: z.string(),
    custom_pitch_notes: z.string().optional().default(""),
    product_offer: z.string(),
    custom_offer_notes: z.string().optional().default(""),
    tone: z.string(),
    goal: z.string(),
    custom_goal_notes: z.string().optional().default(""),
    includeSignoff: z.boolean().default(false),
    saveToSheet: z.boolean().default(true),
  }),
  strategyNotes: z.string().optional().default(""),
  mode: z.enum(["primary", "bulk"]).default("primary"),
});

export type GenerateInput = z.infer<typeof generateInputSchema>;
