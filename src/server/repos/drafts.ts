import "server-only";
import { desc, eq, sql, and, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { drafts, companies, contacts } from "@/lib/db/schema";

export interface DraftListRow {
  id: string;
  createdAt: Date;
  createdBy: string | null;
  sender: string | null;
  pitchType: string | null;
  subPitch: string | null;
  subject1: string | null;
  modelUsed: string | null;
  latencyMs: number | null;
  mode: string | null;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  contactType: string | null;
}

export interface DraftDetailRow extends DraftListRow {
  customPitchNotes: string | null;
  productOffer: string | null;
  customOfferNotes: string | null;
  tone: string | null;
  goal: string | null;
  customGoalNotes: string | null;
  subject2: string | null;
  shortEmail: string | null;
  personalizedEmail: string | null;
  followUpEmail: string | null;
  callNotes: string | null;
  crmNotes: string | null;
  objectionResponses: unknown;
  employerAnalysis: unknown;
  qualityControl: unknown;
  copyWarnings: unknown;
}

export interface DraftFilters {
  q?: string;
  sender?: string;
  pitchType?: string;
  limit?: number;
}

const LIST_COLUMNS = {
  id: drafts.id,
  createdAt: drafts.createdAt,
  createdBy: drafts.createdBy,
  sender: drafts.sender,
  pitchType: drafts.pitchType,
  subPitch: drafts.subPitch,
  subject1: drafts.subject1,
  modelUsed: drafts.modelUsed,
  latencyMs: drafts.latencyMs,
  mode: drafts.mode,
  companyId: drafts.companyId,
  companyName: companies.name,
  contactId: drafts.contactId,
  contactName: contacts.name,
  contactType: contacts.contactType,
};

export async function listDrafts(filters: DraftFilters = {}): Promise<DraftListRow[]> {
  const conditions = [];
  if (filters.sender && filters.sender !== "all") {
    conditions.push(eq(drafts.sender, filters.sender));
  }
  if (filters.pitchType && filters.pitchType !== "all") {
    conditions.push(eq(drafts.pitchType, filters.pitchType));
  }
  if (filters.q && filters.q.trim()) {
    const q = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(companies.name, q),
        ilike(contacts.name, q),
        ilike(drafts.subject1, q),
        ilike(drafts.subject2, q),
      )!,
    );
  }

  const rows = await db
    .select(LIST_COLUMNS)
    .from(drafts)
    .leftJoin(companies, eq(companies.id, drafts.companyId))
    .leftJoin(contacts, eq(contacts.id, drafts.contactId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(drafts.createdAt))
    .limit(filters.limit ?? 100);

  return rows;
}

export async function getDraftById(id: string): Promise<DraftDetailRow | null> {
  const [row] = await db
    .select({
      ...LIST_COLUMNS,
      customPitchNotes: drafts.customPitchNotes,
      productOffer: drafts.productOffer,
      customOfferNotes: drafts.customOfferNotes,
      tone: drafts.tone,
      goal: drafts.goal,
      customGoalNotes: drafts.customGoalNotes,
      subject2: drafts.subject2,
      shortEmail: drafts.shortEmail,
      personalizedEmail: drafts.personalizedEmail,
      followUpEmail: drafts.followUpEmail,
      callNotes: drafts.callNotes,
      crmNotes: drafts.crmNotes,
      objectionResponses: drafts.objectionResponses,
      employerAnalysis: drafts.employerAnalysis,
      qualityControl: drafts.qualityControl,
      copyWarnings: drafts.copyWarnings,
    })
    .from(drafts)
    .leftJoin(companies, eq(companies.id, drafts.companyId))
    .leftJoin(contacts, eq(contacts.id, drafts.contactId))
    .where(eq(drafts.id, id))
    .limit(1);

  return row ?? null;
}

export async function getDistinctSenders(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ sender: drafts.sender })
    .from(drafts)
    .where(sql`${drafts.sender} is not null and ${drafts.sender} <> ''`);
  return rows.map((r) => r.sender).filter((s): s is string => Boolean(s)).sort();
}

export async function getDistinctPitchTypes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ pitchType: drafts.pitchType })
    .from(drafts)
    .where(sql`${drafts.pitchType} is not null and ${drafts.pitchType} <> ''`);
  return rows.map((r) => r.pitchType).filter((p): p is string => Boolean(p)).sort();
}

export async function getDraftCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(drafts);
  return row?.count ?? 0;
}
