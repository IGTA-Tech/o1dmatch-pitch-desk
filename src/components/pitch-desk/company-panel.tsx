"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "./field";
import type { CompanyDraft } from "./types";
import { ChevronDown, ChevronUp, Eraser } from "lucide-react";

interface Props {
  value: CompanyDraft;
  onChange: (next: CompanyDraft) => void;
  onClear: () => void;
}

/**
 * Two-tier disclosure. By default we show only the three fields that drive
 * 95% of the model output: name, raw research, strategy notes. Everything
 * else lives behind "Show more" so the form does not look like a tax return
 * on first open.
 */
export function CompanyPanel({ value, onChange, onClear }: Props) {
  const [showMore, setShowMore] = useState(false);

  const set = <K extends keyof CompanyDraft>(key: K, v: CompanyDraft[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Company</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Paste messy research. The model normalizes it before drafting.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </div>

      <Field label="Company name" htmlFor="company_name">
        <Input
          id="company_name"
          value={value.company_name}
          onChange={(e) => set("company_name", e.target.value)}
          placeholder="DP World Americas"
        />
      </Field>

      <Field
        label="Raw employer research"
        htmlFor="raw_employer_research"
        hint="The single most important field. Paste anything here - the model pulls out what it needs."
      >
        <Textarea
          id="raw_employer_research"
          rows={8}
          value={value.raw_employer_research}
          onChange={(e) => set("raw_employer_research", e.target.value)}
          placeholder="Paste the messy employer research here. Include overview, visa history, occupations, contacts, notes, and anything else."
        />
      </Field>

      <Field
        label="Company strategy notes"
        htmlFor="company_strategy_notes"
        hint="Human notes override the prompt. Use this to steer angle, tone, or what to avoid."
      >
        <Textarea
          id="company_strategy_notes"
          rows={4}
          value={value.company_strategy_notes}
          onChange={(e) => set("company_strategy_notes", e.target.value)}
          placeholder="Local Charlotte angle; keep it soft; do not over-explain immigration; ask for feedback from mobility team."
        />
      </Field>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowMore((v) => !v)}
        className="w-full justify-center text-muted-foreground hover:text-foreground"
      >
        {showMore ? (
          <>
            <ChevronUp className="size-3.5" />
            Hide structured fields
          </>
        ) : (
          <>
            <ChevronDown className="size-3.5" />
            Show structured fields (optional)
          </>
        )}
      </Button>

      {showMore ? (
        <div className="space-y-5 rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Website" htmlFor="website">
              <Input
                id="website"
                value={value.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://example.com"
              />
            </Field>
            <Field label="Industry" htmlFor="industry">
              <Input
                id="industry"
                value={value.industry}
                onChange={(e) => set("industry", e.target.value)}
                placeholder="Logistics, software, healthcare..."
              />
            </Field>
            <Field label="Company size" htmlFor="company_size">
              <Input
                id="company_size"
                value={value.company_size}
                onChange={(e) => set("company_size", e.target.value)}
                placeholder="80 employees, enterprise..."
              />
            </Field>
            <Field label="HQ location" htmlFor="hq_location">
              <Input
                id="hq_location"
                value={value.hq_location}
                onChange={(e) => set("hq_location", e.target.value)}
                placeholder="Charlotte, NC"
              />
            </Field>
            <Field label="Other locations" htmlFor="other_locations">
              <Input
                id="other_locations"
                value={value.other_locations}
                onChange={(e) => set("other_locations", e.target.value)}
                placeholder="Miami, NYC, San Francisco..."
              />
            </Field>
            <Field label="Source URL" htmlFor="source_url">
              <Input
                id="source_url"
                value={value.source_url}
                onChange={(e) => set("source_url", e.target.value)}
                placeholder="Source page or internal research URL"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="H-1B notes" htmlFor="h1b_history_notes">
              <Textarea
                id="h1b_history_notes"
                rows={3}
                value={value.h1b_history_notes}
                onChange={(e) => set("h1b_history_notes", e.target.value)}
                placeholder="LCAs, I-129 history, lottery / lost candidates..."
              />
            </Field>
            <Field label="Green card notes" htmlFor="green_card_history_notes">
              <Textarea
                id="green_card_history_notes"
                rows={3}
                value={value.green_card_history_notes}
                onChange={(e) => set("green_card_history_notes", e.target.value)}
                placeholder="PERM / LC history, green card contacts..."
              />
            </Field>
            <Field label="O-1 notes" htmlFor="o1_history_notes">
              <Textarea
                id="o1_history_notes"
                rows={3}
                value={value.o1_history_notes}
                onChange={(e) => set("o1_history_notes", e.target.value)}
                placeholder="O-1 usage, O-1-friendly roles..."
              />
            </Field>
            <Field label="Occupations hired" htmlFor="occupations_hired">
              <Textarea
                id="occupations_hired"
                rows={3}
                value={value.occupations_hired}
                onChange={(e) => set("occupations_hired", e.target.value)}
                placeholder="Software Developers, Data Scientists, Designers..."
              />
            </Field>
            <Field label="Salary notes" htmlFor="salary_notes">
              <Textarea
                id="salary_notes"
                rows={3}
                value={value.salary_notes}
                onChange={(e) => set("salary_notes", e.target.value)}
                placeholder="High-salary roles, salary range..."
              />
            </Field>
          </div>
        </div>
      ) : null}
    </div>
  );
}
