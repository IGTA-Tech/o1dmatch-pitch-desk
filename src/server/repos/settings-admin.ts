import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export interface SimpleSetting {
  id: string;
  key: string;
  value: string | null;
  sortOrder: number;
  active: boolean;
}

export interface PitchSetting extends SimpleSetting {
  subPitches: string[];
}

export interface AllSettings {
  senders: SimpleSetting[];
  pitchTypes: PitchSetting[];
  productOffers: SimpleSetting[];
  tones: SimpleSetting[];
  goals: SimpleSetting[];
  contactTypes: SimpleSetting[];
}

export const SETTING_TYPES = [
  "sender",
  "pitch_type",
  "product_offer",
  "tone",
  "goal",
  "contact_type",
] as const;

export type SettingType = (typeof SETTING_TYPES)[number];

function safeParseSubPitches(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function listAllSettings(): Promise<AllSettings> {
  const rows = await db
    .select()
    .from(settings)
    .orderBy(asc(settings.settingType), asc(settings.sortOrder), asc(settings.settingKey));

  const grouped: Record<string, typeof rows> = {};
  for (const r of rows) {
    (grouped[r.settingType] ??= []).push(r);
  }

  const toSimple = (r: (typeof rows)[number]): SimpleSetting => ({
    id: r.id,
    key: r.settingKey,
    value: r.settingValue,
    sortOrder: r.sortOrder ?? 0,
    active: r.active ?? true,
  });

  return {
    senders: (grouped.sender ?? []).map(toSimple),
    pitchTypes: (grouped.pitch_type ?? []).map((r) => ({
      ...toSimple(r),
      subPitches: safeParseSubPitches(r.settingValue),
    })),
    productOffers: (grouped.product_offer ?? []).map(toSimple),
    tones: (grouped.tone ?? []).map(toSimple),
    goals: (grouped.goal ?? []).map(toSimple),
    contactTypes: (grouped.contact_type ?? []).map(toSimple),
  };
}
