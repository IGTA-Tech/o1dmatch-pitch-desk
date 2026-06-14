import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirstName(name: string | undefined | null): string {
  const clean = String(name ?? "").trim();
  if (!clean) return "there";
  return clean.split(/\s+/)[0] || "there";
}

export function countWords(text: string | undefined | null): number {
  if (!text) return 0;
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}
