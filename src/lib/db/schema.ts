import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  senderAlias: text("sender_alias"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    website: text("website"),
    industry: text("industry"),
    companySize: text("company_size"),
    hqLocation: text("hq_location"),
    otherLocations: text("other_locations"),
    h1bHistoryNotes: text("h1b_history_notes"),
    greenCardHistoryNotes: text("green_card_history_notes"),
    o1HistoryNotes: text("o1_history_notes"),
    occupationsHired: text("occupations_hired"),
    salaryNotes: text("salary_notes"),
    rawEmployerResearch: text("raw_employer_research"),
    companyStrategyNotes: text("company_strategy_notes"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("companies_name_idx").on(table.name)],
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    location: text("location"),
    contactType: text("contact_type"),
    priority: text("priority"),
    notes: text("notes"),
    linkedinUrl: text("linkedin_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("contacts_company_idx").on(table.companyId)],
);

export const drafts = pgTable(
  "drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),

    // Campaign controls
    sender: text("sender"),
    pitchType: text("pitch_type"),
    subPitch: text("sub_pitch"),
    customPitchNotes: text("custom_pitch_notes"),
    productOffer: text("product_offer"),
    customOfferNotes: text("custom_offer_notes"),
    tone: text("tone"),
    goal: text("goal"),
    customGoalNotes: text("custom_goal_notes"),

    // Generated content (top-level for sheet mirror)
    subject1: text("subject_1"),
    subject2: text("subject_2"),
    shortEmail: text("short_email"),
    personalizedEmail: text("personalized_email"),
    followUpEmail: text("follow_up_email"),
    callNotes: text("call_notes"),
    crmNotes: text("crm_notes"),

    // Richer structured fields
    objectionResponses: jsonb("objection_responses"),
    employerAnalysis: jsonb("employer_analysis"),
    qualityControl: jsonb("quality_control"),
    copyWarnings: jsonb("copy_warnings"),

    // Run metadata
    modelUsed: text("model_used"),
    latencyMs: integer("latency_ms"),
    mode: text("mode"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by"),
  },
  (table) => [
    index("drafts_company_idx").on(table.companyId),
    index("drafts_contact_idx").on(table.contactId),
    index("drafts_created_idx").on(table.createdAt),
  ],
);

export const settings = pgTable(
  "settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    settingType: text("setting_type").notNull(),
    settingKey: text("setting_key").notNull(),
    settingValue: text("setting_value"),
    sortOrder: integer("sort_order").default(0),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("settings_type_idx").on(table.settingType)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ts: timestamp("ts", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    userId: text("user_id"),
    action: text("action").notNull(),
    companyId: uuid("company_id"),
    contactId: uuid("contact_id"),
    draftId: uuid("draft_id"),
    notes: jsonb("notes"),
  },
  (table) => [
    index("audit_log_ts_idx").on(table.ts),
    index("audit_log_user_idx").on(table.userId),
  ],
);

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;

export type NewCompany = typeof companies.$inferInsert;
export type NewContact = typeof contacts.$inferInsert;
export type NewDraft = typeof drafts.$inferInsert;
