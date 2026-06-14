"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "./copy-button";
import type { PitchDeskOutput } from "@/lib/ai/schema";
import { countWords } from "@/lib/utils";
import { AlertTriangle, FileText, MessageCircle, Phone, Target } from "lucide-react";

interface Props {
  output: PitchDeskOutput | null;
  isGenerating: boolean;
  modelUsed?: string;
  fellBack?: boolean;
}

function OutputCard({
  title,
  description,
  icon,
  copyValue,
  copyLabel,
  meta,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  copyValue: string;
  copyLabel: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="mt-0.5 flex size-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
              {icon}
            </div>
          ) : null}
          <div>
            <h4 className="text-sm font-semibold tracking-tight leading-tight">{title}</h4>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meta}
          <CopyButton value={copyValue} label={copyLabel} />
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-14 text-center">
      <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-muted">
        <FileText className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No drafts yet</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Fill in the company panel, pick a contact, and choose your campaign controls. Output cards
        will appear here with copy buttons on each.
      </p>
    </div>
  );
}

export function OutputsPanel({ output, isGenerating, modelUsed, fellBack }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Generated outputs</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every block has its own copy button. Review the QC notes before sending.
          </p>
        </div>
        {modelUsed ? (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
              {modelUsed}
            </Badge>
            {fellBack ? (
              <Badge variant="warning" className="text-[10px] uppercase">
                fallback
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="space-y-4 px-5 py-4">
        {isGenerating && !output ? <Skeleton /> : null}
        {!isGenerating && !output ? <EmptyState /> : null}

        {output ? (
          <>
            {/* Quality warnings - first so the user sees them */}
            {output.quality_control.copy_warnings?.length ? (
              <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 text-warning-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning-foreground">
                      Copy warnings ({output.quality_control.copy_warnings.length})
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs text-warning-foreground/90">
                      {output.quality_control.copy_warnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="mt-1 inline-block size-1 shrink-0 rounded-full bg-warning-foreground" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Employer analysis */}
            <OutputCard
              title="Employer analysis"
              description="Why this pitch and what to expect on the call."
              icon={<Target className="size-4" />}
              copyValue={[
                output.employer_analysis.company_summary,
                output.employer_analysis.contact_summary,
                `Why this pitch: ${output.employer_analysis.why_this_pitch}`,
              ].join("\n\n")}
              copyLabel="employer analysis"
              meta={
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
                  <span>
                    Fit <span className="font-semibold">{output.employer_analysis.fit_score}/10</span>
                  </span>
                  <span className="text-border">|</span>
                  <span>
                    Urgency{" "}
                    <span className="font-semibold">
                      {output.employer_analysis.urgency_score}/10
                    </span>
                  </span>
                </div>
              }
            >
              <div className="space-y-3 text-sm leading-relaxed">
                <p>{output.employer_analysis.company_summary}</p>
                <p className="text-muted-foreground">{output.employer_analysis.contact_summary}</p>
                <Separator />
                <p>
                  <span className="font-medium">Why this pitch: </span>
                  {output.employer_analysis.why_this_pitch}
                </p>
                {output.employer_analysis.likely_objections.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Likely objections
                    </p>
                    <ul className="mt-1.5 space-y-1 text-sm">
                      {output.employer_analysis.likely_objections.map((o, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-muted-foreground" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </OutputCard>

            {/* Subject lines */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {output.drafts.subject_lines.map((subject, i) => (
                <OutputCard
                  key={i}
                  title={`Subject ${i + 1}`}
                  copyValue={subject}
                  copyLabel={`subject ${i + 1}`}
                  meta={
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {subject.length}/60
                    </span>
                  }
                >
                  <p className="text-sm">{subject}</p>
                </OutputCard>
              ))}
            </div>

            {/* Short / Personalized / Follow-up */}
            <OutputCard
              title="Short email"
              description="Tight first-touch send."
              copyValue={output.drafts.short_email}
              copyLabel="short email"
              meta={
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {countWords(output.drafts.short_email)} words
                </span>
              }
            >
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                {output.drafts.short_email}
              </pre>
            </OutputCard>

            <OutputCard
              title="Personalized email"
              description="Longer variant for warm or researched contacts."
              copyValue={output.drafts.personalized_email}
              copyLabel="personalized email"
              meta={
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {countWords(output.drafts.personalized_email)} words
                </span>
              }
            >
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                {output.drafts.personalized_email}
              </pre>
            </OutputCard>

            <OutputCard
              title="Follow-up email"
              description="Use after 4-7 days of silence."
              copyValue={output.drafts.follow_up_email}
              copyLabel="follow-up email"
              meta={
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {countWords(output.drafts.follow_up_email)} words
                </span>
              }
            >
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                {output.drafts.follow_up_email}
              </pre>
            </OutputCard>

            {/* Call + CRM */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <OutputCard
                title="Call notes"
                description="What to open with on a live call."
                icon={<Phone className="size-4" />}
                copyValue={output.drafts.call_notes}
                copyLabel="call notes"
              >
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                  {output.drafts.call_notes}
                </pre>
              </OutputCard>
              <OutputCard
                title="CRM notes"
                description="Drop into your pipeline tool."
                icon={<MessageCircle className="size-4" />}
                copyValue={output.drafts.crm_notes}
                copyLabel="CRM notes"
              >
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                  {output.drafts.crm_notes}
                </pre>
              </OutputCard>
            </div>

            {/* Objections */}
            {output.drafts.objection_responses.length > 0 ? (
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3 border-b border-border/60">
                  <div>
                    <h4 className="text-sm font-semibold tracking-tight">Objection responses</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Common pushback and how to handle it on the call.
                    </p>
                  </div>
                  <CopyButton
                    value={output.drafts.objection_responses
                      .map((o) => `${o.objection}\n${o.response}`)
                      .join("\n\n")}
                    label="all objections"
                  />
                </div>
                <div className="divide-y divide-border/60">
                  {output.drafts.objection_responses.map((or, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 px-5 py-3">
                      <div className="text-sm">
                        <p className="font-medium">"{or.objection}"</p>
                        <p className="mt-1 text-muted-foreground">{or.response}</p>
                      </div>
                      <CopyButton value={or.response} label="response" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
