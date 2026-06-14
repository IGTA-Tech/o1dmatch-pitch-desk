"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "./copy-button";
import {
  Building2,
  ExternalLink,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import type { ContactDetailRow, ContactDraftSummary } from "@/server/repos/contacts";

interface Props {
  contact: ContactDetailRow;
  drafts: ContactDraftSummary[];
}

export function ContactDetail({ contact, drafts }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <UserCircle2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold tracking-tight">{contact.name}</h1>
              {contact.title ? (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{contact.title}</p>
              ) : null}
              {contact.companyId ? (
                <Link
                  href={`/dashboard/companies/${contact.companyId}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  <Building2 className="size-3" />
                  {contact.companyName ?? "(unknown company)"}
                </Link>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {contact.contactType ? (
              <Badge variant="secondary" className="text-[10px]">
                {contact.contactType}
              </Badge>
            ) : null}
            {contact.priority ? (
              <Badge variant="outline" className="text-[10px]">
                {contact.priority}
              </Badge>
            ) : null}
            <Button asChild size="sm">
              <Link href="/dashboard">
                <Sparkles className="size-3.5" />
                New draft
              </Link>
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2">
          <ContactLine
            icon={<Mail className="size-3.5" />}
            label="Email"
            value={contact.email}
            href={contact.email ? `mailto:${contact.email}` : undefined}
            copyable
          />
          <ContactLine
            icon={<Phone className="size-3.5" />}
            label="Phone"
            value={contact.phone}
            href={contact.phone ? `tel:${contact.phone}` : undefined}
            copyable
          />
          <ContactLine
            icon={<MapPin className="size-3.5" />}
            label="Location"
            value={contact.location}
          />
          <ContactLine
            icon={<Linkedin className="size-3.5" />}
            label="LinkedIn"
            value={contact.linkedinUrl}
            href={
              contact.linkedinUrl
                ? contact.linkedinUrl.startsWith("http")
                  ? contact.linkedinUrl
                  : `https://${contact.linkedinUrl}`
                : undefined
            }
            external
          />
        </div>

        {contact.companyId && (contact.companyIndustry || contact.companyHqLocation) ? (
          <>
            <Separator />
            <div className="px-5 py-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Company context
              </span>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {[contact.companyIndustry, contact.companyHqLocation]
                  .filter(Boolean)
                  .join(" - ")}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* Notes */}
      {contact.notes ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
            <h2 className="text-sm font-semibold tracking-tight">Notes</h2>
            <CopyButton value={contact.notes} label="notes" />
          </div>
          <div className="px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {contact.notes}
            </p>
          </div>
        </div>
      ) : null}

      {/* Drafts */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Drafts to this contact</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {drafts.length === 0
                ? "No drafts addressed to this contact yet."
                : `Showing the latest ${drafts.length}.`}
            </p>
          </div>
          {drafts.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/drafts?q=${encodeURIComponent(contact.name)}`}>
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
                    {d.sender || "(no sender)"}
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

      {/* Footer: contact ID */}
      <div className="flex items-center justify-between gap-3 px-5">
        <p className="text-xs text-muted-foreground">
          <UserCircle2 className="mr-1 inline size-3 align-text-bottom" />
          Contact ID <span className="font-mono">{contact.id.slice(0, 8)}</span>
        </p>
        <CopyButton value={contact.id} label="contact ID" variant="inline" />
      </div>
    </div>
  );
}

function ContactLine({
  icon,
  label,
  value,
  href,
  external,
  copyable,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  href?: string;
  external?: boolean;
  copyable?: boolean;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <span className="text-muted-foreground/60">{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
        <span className="text-xs">-</span>
      </div>
    );
  }

  const content = (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="truncate text-sm" title={value}>
          {value}
        </span>
      </span>
      {external ? <ExternalLink className="size-3 shrink-0 text-muted-foreground" /> : null}
    </span>
  );

  return (
    <div className="flex min-w-0 items-center gap-2">
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 hover:text-foreground"
        >
          {content}
        </a>
      ) : (
        content
      )}
      {copyable ? <CopyButton value={value} label={label.toLowerCase()} /> : null}
    </div>
  );
}
