"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "./copy-button";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import type {
  CompanyContact,
  CompanyDetailRow,
  CompanyDraftSummary,
} from "@/server/repos/companies";

interface Props {
  company: CompanyDetailRow;
  contacts: CompanyContact[];
  drafts: CompanyDraftSummary[];
}

export function CompanyDetail({ company, contacts, drafts }: Props) {
  const [showResearch, setShowResearch] = useState(false);

  const hasNotes =
    company.h1bHistoryNotes ||
    company.greenCardHistoryNotes ||
    company.o1HistoryNotes ||
    company.occupationsHired ||
    company.salaryNotes;

  const hasFullResearch =
    (company.rawEmployerResearch && company.rawEmployerResearch.trim()) ||
    (company.companyStrategyNotes && company.companyStrategyNotes.trim());

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">{company.name}</h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {company.industry ? <span>{company.industry}</span> : null}
              {company.industry && company.hqLocation ? <span>-</span> : null}
              {company.hqLocation ? <span>{company.hqLocation}</span> : null}
              {company.companySize && (company.industry || company.hqLocation) ? (
                <span>-</span>
              ) : null}
              {company.companySize ? <span>{company.companySize}</span> : null}
            </p>
            {company.website ? (
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3" />
                {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            ) : null}
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard">
              <Sparkles className="size-3.5" />
              New draft
            </Link>
          </Button>
        </div>

        {/* Quick stats */}
        <Separator />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-sm md:grid-cols-4">
          <Meta label="Contacts" value={contacts.length.toLocaleString()} />
          <Meta label="Drafts" value={drafts.length.toLocaleString()} />
          <Meta
            label="Created"
            value={new Date(company.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            mono
          />
          <Meta
            label="Updated"
            value={new Date(company.updatedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            mono
          />
          {company.otherLocations ? (
            <Meta label="Other locations" value={company.otherLocations} className="md:col-span-2" />
          ) : null}
          {company.sourceUrl ? (
            <Meta label="Source URL" value={company.sourceUrl} mono className="md:col-span-2" />
          ) : null}
        </div>
      </div>

      {/* Notes section - short stuff inline */}
      {hasNotes ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-3 border-b border-border/60">
            <h2 className="text-sm font-semibold tracking-tight">Notes</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 px-5 py-4 md:grid-cols-2">
            <NoteBlock label="H-1B history" value={company.h1bHistoryNotes} />
            <NoteBlock label="Green card history" value={company.greenCardHistoryNotes} />
            <NoteBlock label="O-1 history" value={company.o1HistoryNotes} />
            <NoteBlock label="Occupations hired" value={company.occupationsHired} />
            <NoteBlock label="Salary notes" value={company.salaryNotes} className="md:col-span-2" />
          </div>
        </div>
      ) : null}

      {/* Long research blob - collapsible */}
      {hasFullResearch ? (
        <div className="rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setShowResearch((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Raw research and strategy</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The pasted blob and strategy notes the AI used.
              </p>
            </div>
            {showResearch ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>
          {showResearch ? (
            <div className="space-y-5 border-t border-border/60 px-5 py-4">
              {company.rawEmployerResearch ? (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Raw research
                    </span>
                    <CopyButton value={company.rawEmployerResearch} label="raw research" />
                  </div>
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted-foreground">
                    {company.rawEmployerResearch}
                  </pre>
                </div>
              ) : null}
              {company.companyStrategyNotes ? (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Strategy notes
                    </span>
                    <CopyButton value={company.companyStrategyNotes} label="strategy notes" />
                  </div>
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted-foreground">
                    {company.companyStrategyNotes}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Contacts */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Contacts</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {contacts.length === 0
                ? "No contacts yet."
                : `${contacts.length} contact${contacts.length === 1 ? "" : "s"} associated with this company.`}
            </p>
          </div>
        </div>
        {contacts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Contacts are created automatically the first time you draft to them.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-start gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  {c.title ? (
                    <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {c.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3" />
                        {c.email}
                      </span>
                    ) : null}
                    {c.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" />
                        {c.phone}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {c.contactType ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {c.contactType}
                    </Badge>
                  ) : null}
                  {c.priority ? (
                    <span className="text-[10px] text-muted-foreground">
                      Priority: {c.priority}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drafts */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Recent drafts</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {drafts.length === 0
                ? "No drafts generated for this company yet."
                : `Showing the latest ${drafts.length}.`}
            </p>
          </div>
          {drafts.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/drafts?q=${encodeURIComponent(company.name)}`}>
                View all
              </Link>
            </Button>
          ) : null}
        </div>
        {drafts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Click <span className="font-medium">New draft</span> above to generate one.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {drafts.map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/drafts/${d.id}`}
                className="grid grid-cols-12 items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="col-span-12 md:col-span-5 min-w-0">
                  <p className="truncate text-sm font-medium">{d.subject1 || "(no subject)"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.contactName || "(no contact)"} - {d.sender || "(no sender)"}
                  </p>
                </div>
                <div className="col-span-6 md:col-span-3 min-w-0">
                  <p className="truncate text-sm">{d.pitchType || "-"}</p>
                  {d.subPitch ? (
                    <p className="truncate text-xs text-muted-foreground">{d.subPitch}</p>
                  ) : null}
                </div>
                <div className="col-span-3 md:col-span-2">
                  {d.modelUsed ? (
                    <Badge variant="outline" className="font-mono text-[10px] normal-case">
                      {d.modelUsed}
                    </Badge>
                  ) : null}
                </div>
                <div className="col-span-3 md:col-span-2 text-right text-xs text-muted-foreground tabular-nums">
                  {new Date(d.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer: company ID */}
      <div className="flex items-center justify-between gap-3 px-5">
        <p className="text-xs text-muted-foreground">
          <Building2 className="mr-1 inline size-3 align-text-bottom" />
          Company ID <span className="font-mono">{company.id.slice(0, 8)}</span>
        </p>
        <CopyButton value={company.id} label="company ID" variant="inline" />
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className ?? ""}`}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={mono ? "truncate font-mono text-xs" : "truncate"}>{value}</span>
    </div>
  );
}

function NoteBlock({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null;
  className?: string;
}) {
  if (!value || !value.trim()) return null;
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {value}
      </p>
    </div>
  );
}
