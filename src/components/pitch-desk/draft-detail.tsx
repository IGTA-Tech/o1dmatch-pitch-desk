"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OutputsPanel } from "./outputs-panel";
import { CopyButton } from "./copy-button";
import type { DraftDetailRow } from "@/server/repos/drafts";
import type { PitchDeskOutput } from "@/lib/ai/schema";

interface Props {
  draft: DraftDetailRow;
}

/**
 * Reconstructs the PitchDeskOutput shape from the flat draft row so we can
 * reuse the same OutputsPanel that renders live generation.
 */
function buildOutput(d: DraftDetailRow): PitchDeskOutput {
  return {
    employer_analysis: (d.employerAnalysis as PitchDeskOutput["employer_analysis"]) ?? {
      company_summary: "",
      contact_summary: "",
      employer_type: d.pitchType ?? "",
      contact_type: d.contactType ?? "",
      selected_pitch_type: d.pitchType ?? "",
      selected_sub_pitch: d.subPitch ?? "",
      selected_product_offer: d.productOffer ?? "",
      fit_score: 0,
      urgency_score: 0,
      why_this_pitch: "",
      likely_objections: [],
    },
    drafts: {
      subject_lines: [d.subject1 ?? "", d.subject2 ?? ""],
      short_email: d.shortEmail ?? "",
      personalized_email: d.personalizedEmail ?? "",
      follow_up_email: d.followUpEmail ?? "",
      call_notes: d.callNotes ?? "",
      crm_notes: d.crmNotes ?? "",
      objection_responses:
        (d.objectionResponses as PitchDeskOutput["drafts"]["objection_responses"]) ?? [],
    },
    quality_control: (d.qualityControl as PitchDeskOutput["quality_control"]) ?? {
      legal_language_check: "",
      brand_check: "",
      missing_information: [],
      copy_warnings: Array.isArray(d.copyWarnings) ? (d.copyWarnings as string[]) : [],
    },
  };
}

export function DraftDetail({ draft }: Props) {
  const output = buildOutput(draft);
  const createdAt = new Date(draft.createdAt);

  return (
    <div className="space-y-6">
      {/* Header card with key facts */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {draft.companyName ?? "(unknown company)"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {draft.contactName ?? "(no contact)"}
              {draft.contactType ? (
                <span className="text-muted-foreground/70"> - {draft.contactType}</span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {draft.modelUsed ? (
              <Badge variant="outline" className="whitespace-nowrap font-mono text-[10px] normal-case">
                {draft.modelUsed}
              </Badge>
            ) : null}
            {draft.mode ? (
              <Badge variant="secondary" className="text-[10px] uppercase">
                {draft.mode}
              </Badge>
            ) : null}
            {typeof draft.latencyMs === "number" ? (
              <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
                {(draft.latencyMs / 1000).toFixed(1)}s
              </Badge>
            ) : null}
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-sm md:grid-cols-4">
          <Meta label="Sender" value={draft.sender} />
          <Meta label="Pitch type" value={draft.pitchType} />
          <Meta label="Sub-pitch" value={draft.subPitch} />
          <Meta label="Product / offer" value={draft.productOffer} />
          <Meta label="Tone" value={draft.tone} />
          <Meta label="Goal" value={draft.goal} />
          <Meta
            label="Created"
            value={createdAt.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            mono
          />
          <Meta label="Created by" value={draft.createdBy} mono />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Draft ID <span className="font-mono">{draft.id.slice(0, 8)}</span>
          </p>
          <CopyButton value={draft.id} label="draft ID" variant="inline" />
        </div>
      </div>

      {/* Reuse the live-generation output panel */}
      <OutputsPanel
        output={output}
        isGenerating={false}
        modelUsed={draft.modelUsed ?? undefined}
      />
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={mono ? "truncate font-mono text-xs" : "truncate"}>
        {value || <span className="text-muted-foreground">-</span>}
      </span>
    </div>
  );
}
