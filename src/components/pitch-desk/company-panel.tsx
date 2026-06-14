"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "./field";
import type { CompanyDraft } from "./types";
import { Eraser } from "lucide-react";

interface Props {
  value: CompanyDraft;
  onChange: (next: CompanyDraft) => void;
  onClear: () => void;
}

export function CompanyPanel({ value, onChange, onClear }: Props) {
  const set = <K extends keyof CompanyDraft>(key: K, v: CompanyDraft[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>1. Company input</CardTitle>
          <CardDescription>
            Paste messy research. The model normalizes it before drafting.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Company name" htmlFor="company_name">
            <Input
              id="company_name"
              value={value.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              placeholder="DP World Americas"
            />
          </Field>
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
              placeholder="Logistics, software, healthcare, law firm..."
            />
          </Field>
          <Field label="Company size" htmlFor="company_size">
            <Input
              id="company_size"
              value={value.company_size}
              onChange={(e) => set("company_size", e.target.value)}
              placeholder="80 employees, enterprise, small..."
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
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="H-1B notes" htmlFor="h1b_history_notes">
            <Textarea
              id="h1b_history_notes"
              rows={4}
              value={value.h1b_history_notes}
              onChange={(e) => set("h1b_history_notes", e.target.value)}
              placeholder="LCAs, I-129 history, H-1B occupations, lottery / lost candidates..."
            />
          </Field>
          <Field label="Green card notes" htmlFor="green_card_history_notes">
            <Textarea
              id="green_card_history_notes"
              rows={4}
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
              placeholder="O-1 usage, O-1-friendly roles, O-1 history..."
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
              placeholder="High-salary roles, salary range, specialized salaries..."
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

        <Field label="Raw employer research" htmlFor="raw_employer_research">
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
          hint="Human strategy notes override everything in the prompt."
        >
          <Textarea
            id="company_strategy_notes"
            rows={5}
            value={value.company_strategy_notes}
            onChange={(e) => set("company_strategy_notes", e.target.value)}
            placeholder="Local Charlotte angle; keep it soft; do not over-explain immigration; ask for feedback from mobility team."
          />
        </Field>
      </CardContent>
    </Card>
  );
}
