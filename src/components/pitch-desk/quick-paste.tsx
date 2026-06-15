"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Loader2, Wand2 } from "lucide-react";
import { extractFieldsAction } from "@/server/actions/extract-fields";
import type { ExtractedData } from "@/lib/ai/extract-schema";
import type { CompanyDraft, ContactDraft } from "./types";
import { emptyContact } from "./types";

interface Props {
  /** Existing form state, used to merge with extracted fields (never overwrite
   *  values the user has already typed). */
  currentCompany: CompanyDraft;
  currentContacts: ContactDraft[];
  /** Apply the merged result back to the form state. */
  onApply: (company: CompanyDraft, contacts: ContactDraft[]) => void;
}

/**
 * Paste a blob from myvisajobs.com / LinkedIn / research notes / whatever ->
 * the AI extracts company facts and every contact into structured fields,
 * which we merge into the form. The user reviews + edits before generating.
 *
 * Merge policy: empty-on-empty. If the user already typed something into a
 * field, the extracted value does NOT overwrite. The blob itself is always
 * placed into raw_employer_research (appended if there's already content).
 */
export function QuickPaste({ currentCompany, currentContacts, onApply }: Props) {
  const [expanded, setExpanded] = React.useState(true);
  const [text, setText] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const handleExtract = () => {
    const blob = text.trim();
    if (!blob) {
      toast.error("Paste some text first.");
      return;
    }
    startTransition(async () => {
      const res = await extractFieldsAction(blob);
      if (!res.ok || !res.data) {
        toast.error(res.error ?? "Extraction failed.");
        return;
      }
      const merged = mergeExtracted(currentCompany, currentContacts, res.data, blob);
      onApply(merged.company, merged.contacts);
      const took = res.latencyMs ? `${(res.latencyMs / 1000).toFixed(1)}s` : "";
      toast.success(
        `Extracted ${res.data.contacts.length} contact${
          res.data.contacts.length === 1 ? "" : "s"
        } and company facts${took ? ` in ${took}` : ""}.`,
      );
      setText("");
    });
  };

  const charCount = text.length;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.04]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wand2 className="size-3.5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Quick paste</p>
            <p className="text-xs text-muted-foreground">
              Drop any blob - the AI extracts company facts and every contact into the form.
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-primary/20 px-4 py-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={
              "Paste anything here:\n" +
              "- myvisajobs.com employer page\n" +
              "- LinkedIn company snapshot + contact list\n" +
              "- Internal research notes with names and titles\n" +
              "- Email signatures, public bios, press releases\n\n" +
              "Empty fields you have already filled in will NOT be overwritten. The original text is appended to Raw research."
            }
            className="font-mono text-[13px]"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {charCount.toLocaleString()} chars
              {charCount > 20000 ? (
                <span className="ml-2 text-destructive">over 20,000 limit - trim down</span>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              {text ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setText("")}
                  disabled={pending}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={handleExtract}
                disabled={pending || !text.trim() || charCount > 20000}
                size="sm"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Extracting
                  </>
                ) : (
                  <>
                    <Wand2 className="size-3.5" />
                    Extract fields
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- merge helpers ---------- */

function preferExisting(existing: string, extracted: string): string {
  // Empty-on-empty merge: keep the user's value if they typed anything.
  if (existing && existing.trim().length > 0) return existing;
  return extracted ?? "";
}

function appendBlob(existingResearch: string, blob: string): string {
  const e = (existingResearch ?? "").trim();
  if (!e) return blob;
  if (e.includes(blob)) return e;
  return `${e}\n\n${blob}`;
}

function mergeExtracted(
  currentCompany: CompanyDraft,
  currentContacts: ContactDraft[],
  extracted: ExtractedData,
  originalBlob: string,
): { company: CompanyDraft; contacts: ContactDraft[] } {
  const ec = extracted.company;

  const mergedCompany: CompanyDraft = {
    company_name: preferExisting(currentCompany.company_name, ec.company_name),
    website: preferExisting(currentCompany.website, ec.website),
    industry: preferExisting(currentCompany.industry, ec.industry),
    company_size: preferExisting(currentCompany.company_size, ec.company_size),
    hq_location: preferExisting(currentCompany.hq_location, ec.hq_location),
    other_locations: preferExisting(currentCompany.other_locations, ec.other_locations),
    h1b_history_notes: preferExisting(currentCompany.h1b_history_notes, ec.h1b_history_notes),
    green_card_history_notes: preferExisting(
      currentCompany.green_card_history_notes,
      ec.green_card_history_notes,
    ),
    o1_history_notes: preferExisting(currentCompany.o1_history_notes, ec.o1_history_notes),
    occupations_hired: preferExisting(currentCompany.occupations_hired, ec.occupations_hired),
    salary_notes: preferExisting(currentCompany.salary_notes, ec.salary_notes),
    raw_employer_research: appendBlob(currentCompany.raw_employer_research, originalBlob),
    company_strategy_notes: preferExisting(
      currentCompany.company_strategy_notes,
      ec.company_strategy_notes,
    ),
    source_url: preferExisting(currentCompany.source_url, ec.source_url),
  };

  // Contacts: if the user already has a contact with the same name (case-insensitive),
  // skip that extracted contact rather than duplicating. Empty placeholder contacts
  // (no name typed) are dropped before merge so we start clean if the user has not
  // entered anyone yet.
  const userTyped = currentContacts.filter((c) => c.contact_name.trim().length > 0);
  const existingNames = new Set(userTyped.map((c) => c.contact_name.toLowerCase()));

  const newContacts: ContactDraft[] = [];
  for (const e of extracted.contacts) {
    const name = (e.contact_name ?? "").trim();
    if (!name || existingNames.has(name.toLowerCase())) continue;
    existingNames.add(name.toLowerCase());
    newContacts.push({
      ...emptyContact(),
      contact_name: name,
      contact_title: e.contact_title ?? "",
      contact_email: e.contact_email ?? "",
      contact_phone: e.contact_phone ?? "",
      contact_location: e.contact_location ?? "",
      contact_type: e.contact_type ?? "Unknown",
      contact_notes: e.contact_notes ?? "",
    });
  }

  const mergedContacts =
    userTyped.length === 0 && newContacts.length > 0
      ? newContacts
      : [...userTyped, ...newContacts];

  // Always leave the user with at least one contact row (even if empty).
  if (mergedContacts.length === 0) mergedContacts.push(emptyContact());

  return { company: mergedCompany, contacts: mergedContacts };
}
