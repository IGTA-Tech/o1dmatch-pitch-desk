import "server-only";
import { desc, eq, sql, ilike, or, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts, companies, drafts } from "@/lib/db/schema";

export interface ContactListRow {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  contactType: string | null;
  priority: string | null;
  companyId: string | null;
  companyName: string | null;
  draftCount: number;
  lastActivity: Date | null;
}

export interface ContactDetailRow {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  contactType: string | null;
  priority: string | null;
  notes: string | null;
  linkedinUrl: string | null;
  companyId: string | null;
  companyName: string | null;
  companyIndustry: string | null;
  companyHqLocation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactDraftSummary {
  id: string;
  createdAt: Date;
  sender: string | null;
  pitchType: string | null;
  subPitch: string | null;
  subject1: string | null;
  modelUsed: string | null;
}

export interface ContactFilters {
  q?: string;
  contactType?: string;
  limit?: number;
}

export async function listContacts(filters: ContactFilters = {}): Promise<ContactListRow[]> {
  const conditions = [];
  if (filters.contactType && filters.contactType !== "all") {
    conditions.push(eq(contacts.contactType, filters.contactType));
  }
  if (filters.q && filters.q.trim()) {
    const q = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(contacts.name, q),
        ilike(contacts.title, q),
        ilike(contacts.email, q),
        ilike(companies.name, q),
      )!,
    );
  }

  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      title: contacts.title,
      email: contacts.email,
      contactType: contacts.contactType,
      priority: contacts.priority,
      companyId: contacts.companyId,
      companyName: companies.name,
      draftCount: sql<number>`count(distinct ${drafts.id})::int`,
      lastActivity: sql<Date | null>`max(${drafts.createdAt})`,
    })
    .from(contacts)
    .leftJoin(companies, eq(companies.id, contacts.companyId))
    .leftJoin(drafts, eq(drafts.contactId, contacts.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(contacts.id, companies.name)
    .orderBy(desc(sql`max(${drafts.createdAt})`), desc(contacts.createdAt))
    .limit(filters.limit ?? 200);

  return rows;
}

export async function getContactById(id: string): Promise<ContactDetailRow | null> {
  const [row] = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      title: contacts.title,
      email: contacts.email,
      phone: contacts.phone,
      location: contacts.location,
      contactType: contacts.contactType,
      priority: contacts.priority,
      notes: contacts.notes,
      linkedinUrl: contacts.linkedinUrl,
      companyId: contacts.companyId,
      companyName: companies.name,
      companyIndustry: companies.industry,
      companyHqLocation: companies.hqLocation,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
    })
    .from(contacts)
    .leftJoin(companies, eq(companies.id, contacts.companyId))
    .where(eq(contacts.id, id))
    .limit(1);
  return row ?? null;
}

export async function getContactDraftHistory(
  contactId: string,
  limit = 20,
): Promise<ContactDraftSummary[]> {
  const rows = await db
    .select({
      id: drafts.id,
      createdAt: drafts.createdAt,
      sender: drafts.sender,
      pitchType: drafts.pitchType,
      subPitch: drafts.subPitch,
      subject1: drafts.subject1,
      modelUsed: drafts.modelUsed,
    })
    .from(drafts)
    .where(eq(drafts.contactId, contactId))
    .orderBy(desc(drafts.createdAt))
    .limit(limit);
  return rows;
}

export async function getDistinctContactTypes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ contactType: contacts.contactType })
    .from(contacts)
    .where(sql`${contacts.contactType} is not null and ${contacts.contactType} <> ''`);
  return rows
    .map((r) => r.contactType)
    .filter((t): t is string => Boolean(t))
    .sort();
}

export async function getContactCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(contacts);
  return row?.count ?? 0;
}
