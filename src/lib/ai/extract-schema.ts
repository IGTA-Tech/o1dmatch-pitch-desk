import { z } from "zod";

/**
 * Schema for the "Quick Paste" extraction call. The user pastes a blob copied
 * from somewhere (myvisajobs.com, internal research, etc.) and the model
 * returns this structured shape that we use to populate the form.
 *
 * Every field is required (z.string() not z.optional) because OpenRouter's
 * json_schema strict mode does not allow optional properties. Empty string is
 * the "missing" sentinel.
 */

export const CONTACT_TYPE_OPTIONS = [
  "Global Mobility",
  "Human Resources",
  "People Operations",
  "Recruiter",
  "Talent Acquisition",
  "General Counsel",
  "Founder / CEO",
  "President",
  "University Relations",
  "Technical Contact",
  "Staffing / Agency Contact",
  "Attorney Contact",
  "Generic Inbox",
  "Unknown",
] as const;

export const extractCompanySchema = z.object({
  company_name: z.string(),
  website: z.string(),
  industry: z.string(),
  company_size: z.string(),
  hq_location: z.string(),
  other_locations: z.string(),
  h1b_history_notes: z.string(),
  green_card_history_notes: z.string(),
  o1_history_notes: z.string(),
  occupations_hired: z.string(),
  salary_notes: z.string(),
  source_url: z.string(),
  company_strategy_notes: z.string(),
});

export const extractContactSchema = z.object({
  contact_name: z.string(),
  contact_title: z.string(),
  contact_email: z.string(),
  contact_phone: z.string(),
  contact_location: z.string(),
  contact_type: z.enum(CONTACT_TYPE_OPTIONS),
  contact_notes: z.string(),
});

export const extractSchema = z.object({
  company: extractCompanySchema,
  contacts: z.array(extractContactSchema),
});

export type ExtractedCompany = z.infer<typeof extractCompanySchema>;
export type ExtractedContact = z.infer<typeof extractContactSchema>;
export type ExtractedData = z.infer<typeof extractSchema>;
