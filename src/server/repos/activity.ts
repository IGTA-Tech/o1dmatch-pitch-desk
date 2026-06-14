import "server-only";
import { desc, eq, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, companies, contacts, drafts } from "@/lib/db/schema";

export interface ActivityRow {
  id: string;
  ts: Date;
  userId: string | null;
  action: string;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  draftId: string | null;
  draftSubject: string | null;
  notes: unknown;
}

export interface ActivityFilters {
  user?: string;
  action?: string;
  limit?: number;
}

export async function listActivity(filters: ActivityFilters = {}): Promise<ActivityRow[]> {
  const conditions = [];
  if (filters.user && filters.user !== "all") {
    conditions.push(eq(auditLog.userId, filters.user));
  }
  if (filters.action && filters.action !== "all") {
    conditions.push(eq(auditLog.action, filters.action));
  }

  const rows = await db
    .select({
      id: auditLog.id,
      ts: auditLog.ts,
      userId: auditLog.userId,
      action: auditLog.action,
      companyId: auditLog.companyId,
      companyName: companies.name,
      contactId: auditLog.contactId,
      contactName: contacts.name,
      draftId: auditLog.draftId,
      draftSubject: drafts.subject1,
      notes: auditLog.notes,
    })
    .from(auditLog)
    .leftJoin(companies, eq(companies.id, auditLog.companyId))
    .leftJoin(contacts, eq(contacts.id, auditLog.contactId))
    .leftJoin(drafts, eq(drafts.id, auditLog.draftId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.ts))
    .limit(filters.limit ?? 200);

  return rows;
}

export async function getDistinctActivityUsers(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ userId: auditLog.userId })
    .from(auditLog)
    .where(sql`${auditLog.userId} is not null and ${auditLog.userId} <> ''`);
  return rows.map((r) => r.userId).filter((u): u is string => Boolean(u)).sort();
}

export async function getDistinctActivityActions(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ action: auditLog.action })
    .from(auditLog);
  return rows.map((r) => r.action).filter(Boolean).sort();
}

export async function getActivityCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLog);
  return row?.count ?? 0;
}
