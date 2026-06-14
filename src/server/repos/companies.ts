import "server-only";
import { desc, eq, sql, ilike, or, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, contacts, drafts } from "@/lib/db/schema";

export interface CompanyListRow {
  id: string;
  name: string;
  industry: string | null;
  hqLocation: string | null;
  website: string | null;
  createdAt: Date;
  contactCount: number;
  draftCount: number;
  lastActivity: Date | null;
}

export interface CompanyDetailRow {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  hqLocation: string | null;
  otherLocations: string | null;
  h1bHistoryNotes: string | null;
  greenCardHistoryNotes: string | null;
  o1HistoryNotes: string | null;
  occupationsHired: string | null;
  salaryNotes: string | null;
  rawEmployerResearch: string | null;
  companyStrategyNotes: string | null;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyContact {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  contactType: string | null;
  priority: string | null;
  linkedinUrl: string | null;
  createdAt: Date;
}

export interface CompanyDraftSummary {
  id: string;
  createdAt: Date;
  sender: string | null;
  pitchType: string | null;
  subPitch: string | null;
  subject1: string | null;
  modelUsed: string | null;
  contactName: string | null;
}

export interface CompanyFilters {
  q?: string;
  limit?: number;
}

export async function listCompanies(filters: CompanyFilters = {}): Promise<CompanyListRow[]> {
  const conditions = [];
  if (filters.q && filters.q.trim()) {
    const q = `%${filters.q.trim()}%`;
    conditions.push(
      or(ilike(companies.name, q), ilike(companies.industry, q), ilike(companies.hqLocation, q))!,
    );
  }

  const rows = await db
    .select({
      id: companies.id,
      name: companies.name,
      industry: companies.industry,
      hqLocation: companies.hqLocation,
      website: companies.website,
      createdAt: companies.createdAt,
      contactCount: sql<number>`count(distinct ${contacts.id})::int`,
      draftCount: sql<number>`count(distinct ${drafts.id})::int`,
      lastActivity: sql<Date | null>`max(${drafts.createdAt})`,
    })
    .from(companies)
    .leftJoin(contacts, eq(contacts.companyId, companies.id))
    .leftJoin(drafts, eq(drafts.companyId, companies.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(companies.id)
    .orderBy(
      desc(sql`max(${drafts.createdAt})`),
      desc(companies.createdAt),
    )
    .limit(filters.limit ?? 200);

  return rows;
}

export async function getCompanyById(id: string): Promise<CompanyDetailRow | null> {
  const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return (row as CompanyDetailRow | undefined) ?? null;
}

export async function getCompanyContacts(companyId: string): Promise<CompanyContact[]> {
  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      title: contacts.title,
      email: contacts.email,
      phone: contacts.phone,
      contactType: contacts.contactType,
      priority: contacts.priority,
      linkedinUrl: contacts.linkedinUrl,
      createdAt: contacts.createdAt,
    })
    .from(contacts)
    .where(eq(contacts.companyId, companyId))
    .orderBy(desc(contacts.createdAt));
  return rows;
}

export async function getCompanyDraftHistory(
  companyId: string,
  limit = 20,
): Promise<CompanyDraftSummary[]> {
  const rows = await db
    .select({
      id: drafts.id,
      createdAt: drafts.createdAt,
      sender: drafts.sender,
      pitchType: drafts.pitchType,
      subPitch: drafts.subPitch,
      subject1: drafts.subject1,
      modelUsed: drafts.modelUsed,
      contactName: contacts.name,
    })
    .from(drafts)
    .leftJoin(contacts, eq(contacts.id, drafts.contactId))
    .where(eq(drafts.companyId, companyId))
    .orderBy(desc(drafts.createdAt))
    .limit(limit);
  return rows;
}

export async function getCompanyCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(companies);
  return row?.count ?? 0;
}
