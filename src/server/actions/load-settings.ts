"use server";

import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

export interface PitchDeskSettings {
  senders: string[];
  pitchMap: Record<string, string[]>;
  productOffers: string[];
  tones: string[];
  goals: string[];
  contactTypes: string[];
}

export async function loadSettings(): Promise<PitchDeskSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.active, true))
    .orderBy(asc(settings.sortOrder));

  const grouped: Record<string, typeof rows> = {};
  for (const row of rows) {
    (grouped[row.settingType] ??= []).push(row);
  }

  const senders = (grouped.sender ?? []).map((r) => r.settingKey);

  const pitchMap: Record<string, string[]> = {};
  for (const row of grouped.pitch_type ?? []) {
    try {
      pitchMap[row.settingKey] = JSON.parse(row.settingValue ?? "[]");
    } catch {
      pitchMap[row.settingKey] = [];
    }
  }

  const productOffers = (grouped.product_offer ?? []).map((r) => r.settingKey);
  const tones = (grouped.tone ?? []).map((r) => r.settingKey);
  const goals = (grouped.goal ?? []).map((r) => r.settingKey);
  const contactTypes = (grouped.contact_type ?? []).map((r) => r.settingKey);

  return { senders, pitchMap, productOffers, tones, goals, contactTypes };
}
