export interface ContactDraft {
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  contact_location: string;
  contact_type: string;
  contact_priority: string;
  contact_notes: string;
  linkedin_url: string;
}

export interface CompanyDraft {
  company_name: string;
  website: string;
  industry: string;
  company_size: string;
  hq_location: string;
  other_locations: string;
  h1b_history_notes: string;
  green_card_history_notes: string;
  o1_history_notes: string;
  occupations_hired: string;
  salary_notes: string;
  raw_employer_research: string;
  company_strategy_notes: string;
  source_url: string;
}

export interface ControlsDraft {
  sender: string;
  pitch_type: string;
  sub_pitch: string;
  custom_pitch_notes: string;
  product_offer: string;
  custom_offer_notes: string;
  tone: string;
  goal: string;
  custom_goal_notes: string;
  includeSignoff: boolean;
  saveToSheet: boolean;
}

export const emptyContact = (): ContactDraft => ({
  contact_name: "",
  contact_title: "",
  contact_email: "",
  contact_phone: "",
  contact_location: "",
  contact_type: "Unknown",
  contact_priority: "",
  contact_notes: "",
  linkedin_url: "",
});

export const emptyCompany = (): CompanyDraft => ({
  company_name: "",
  website: "",
  industry: "",
  company_size: "",
  hq_location: "",
  other_locations: "",
  h1b_history_notes: "",
  green_card_history_notes: "",
  o1_history_notes: "",
  occupations_hired: "",
  salary_notes: "",
  raw_employer_research: "",
  company_strategy_notes: "",
  source_url: "",
});

export const emptyControls = (): ControlsDraft => ({
  sender: "",
  pitch_type: "",
  sub_pitch: "",
  custom_pitch_notes: "",
  product_offer: "",
  custom_offer_notes: "",
  tone: "",
  goal: "",
  custom_goal_notes: "",
  includeSignoff: false,
  saveToSheet: true,
});
