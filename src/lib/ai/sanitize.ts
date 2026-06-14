/**
 * Port of Quality.gs sanitizeAscii_ and deepSanitize_.
 * Normalizes smart quotes, em/en dashes, non-breaking spaces, and strips other non-ASCII.
 */

export function sanitizeAscii(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x00-\x7F]/g, "");
}

export function deepSanitize<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => deepSanitize(item)) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepSanitize(v);
    }
    return out as T;
  }
  if (typeof value === "string") {
    return sanitizeAscii(value) as unknown as T;
  }
  return value;
}

export function uniqueArray<T>(arr: T[] | undefined | null): T[] {
  const seen = new Set<string>();
  return (arr ?? []).filter((item) => {
    const key = String(item ?? "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
