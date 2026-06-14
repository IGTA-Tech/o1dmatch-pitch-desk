"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { settings, auditLog } from "@/lib/db/schema";
import { SETTING_TYPES, type SettingType } from "@/server/repos/settings-admin";

interface BaseResult {
  ok: boolean;
  error?: string;
}

interface AddResult extends BaseResult {
  id?: string;
}

async function getUserIdForAudit(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    const user = await currentUser();
    return user?.primaryEmailAddress?.emailAddress ?? userId;
  } catch {
    return userId;
  }
}

function isValidType(t: string): t is SettingType {
  return (SETTING_TYPES as readonly string[]).includes(t);
}

/**
 * Add a new setting entry. For pitch_type, pass `subPitches` as a string array.
 * For everything else, just the key (no value needed).
 */
export async function addSetting(input: {
  type: string;
  key: string;
  subPitches?: string[];
}): Promise<AddResult> {
  const userId = await getUserIdForAudit();
  if (!userId) return { ok: false, error: "Not signed in" };
  if (!isValidType(input.type)) return { ok: false, error: `Unknown setting type: ${input.type}` };

  const key = input.key.trim();
  if (!key) return { ok: false, error: "Name is required" };

  // Reject duplicate keys (case-insensitive)
  const [existing] = await db
    .select({ id: settings.id })
    .from(settings)
    .where(sql`${settings.settingType} = ${input.type} and lower(${settings.settingKey}) = lower(${key})`)
    .limit(1);
  if (existing) {
    return { ok: false, error: "An entry with that name already exists." };
  }

  // Calculate next sort order
  const [maxRow] = await db
    .select({ max: sql<number>`coalesce(max(${settings.sortOrder}), -1)::int` })
    .from(settings)
    .where(eq(settings.settingType, input.type));
  const nextSortOrder = (maxRow?.max ?? -1) + 1;

  // For pitch_type, settingValue is the JSON array of sub-pitches.
  // For everything else, settingValue mirrors settingKey for legacy compatibility.
  let value: string;
  if (input.type === "pitch_type") {
    const subs = (input.subPitches ?? [])
      .map((s) => s.trim())
      .filter(Boolean);
    if (subs.length === 0) {
      return { ok: false, error: "A pitch type needs at least one sub-pitch." };
    }
    if (!subs.includes("Other / custom")) subs.push("Other / custom");
    value = JSON.stringify(subs);
  } else {
    value = key;
  }

  const [inserted] = await db
    .insert(settings)
    .values({
      settingType: input.type,
      settingKey: key,
      settingValue: value,
      sortOrder: nextSortOrder,
      active: true,
    })
    .returning({ id: settings.id });

  await db.insert(auditLog).values({
    userId,
    action: "setting.created",
    notes: { type: input.type, key, subPitches: input.subPitches ?? null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return { ok: true, id: inserted.id };
}

export async function toggleSettingActive(id: string): Promise<BaseResult> {
  const userId = await getUserIdForAudit();
  if (!userId) return { ok: false, error: "Not signed in" };

  const [row] = await db.select().from(settings).where(eq(settings.id, id)).limit(1);
  if (!row) return { ok: false, error: "Setting not found" };

  const nextActive = !(row.active ?? true);
  await db.update(settings).set({ active: nextActive }).where(eq(settings.id, id));

  await db.insert(auditLog).values({
    userId,
    action: nextActive ? "setting.enabled" : "setting.disabled",
    notes: { type: row.settingType, key: row.settingKey, settingId: id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return { ok: true };
}

export async function updatePitchSubPitches(input: {
  id: string;
  subPitches: string[];
}): Promise<BaseResult> {
  const userId = await getUserIdForAudit();
  if (!userId) return { ok: false, error: "Not signed in" };

  const [row] = await db.select().from(settings).where(eq(settings.id, input.id)).limit(1);
  if (!row) return { ok: false, error: "Setting not found" };
  if (row.settingType !== "pitch_type") {
    return { ok: false, error: "Sub-pitches only apply to pitch_type entries." };
  }

  const cleaned = input.subPitches.map((s) => s.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return { ok: false, error: "A pitch type needs at least one sub-pitch." };
  }
  // Always keep "Other / custom" available so the UI's custom-notes escape hatch still works.
  if (!cleaned.includes("Other / custom")) cleaned.push("Other / custom");

  await db
    .update(settings)
    .set({ settingValue: JSON.stringify(cleaned) })
    .where(eq(settings.id, input.id));

  await db.insert(auditLog).values({
    userId,
    action: "setting.sub_pitches_updated",
    notes: { settingId: input.id, key: row.settingKey, count: cleaned.length },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return { ok: true };
}
