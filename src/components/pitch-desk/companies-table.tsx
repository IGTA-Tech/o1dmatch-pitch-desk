"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink, Search, X } from "lucide-react";
import type { CompanyListRow } from "@/server/repos/companies";

interface Props {
  initial: CompanyListRow[];
  initialQuery: string;
}

export function CompaniesTable({ initial, initialQuery }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = React.useState(initialQuery);

  React.useEffect(() => {
    if (q === initialQuery) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q.trim()) next.set("q", q);
      else next.delete("q");
      const qs = next.toString();
      router.push(qs ? `/dashboard/companies?${qs}` : `/dashboard/companies`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = Boolean(q);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, industry, or HQ"
            className="pl-9"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {initial.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1000px] table-fixed">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[20%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Industry</th>
                <th className="px-4 py-2.5">HQ</th>
                <th className="px-4 py-2.5 text-right">Contacts</th>
                <th className="px-4 py-2.5 text-right">Drafts</th>
                <th className="px-4 py-2.5 text-right">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initial.map((c) => (
                <CompanyRow key={c.id} company={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompanyRow({ company }: { company: CompanyListRow }) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(`/dashboard/companies/${company.id}`)}
      className="cursor-pointer transition-colors hover:bg-muted/40"
    >
      <td className="px-4 py-3 align-top">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/dashboard/companies/${company.id}`}
            className="block truncate text-sm font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {company.name}
          </Link>
          {company.website ? (
            <a
              href={
                company.website.startsWith("http") ? company.website : `https://${company.website}`
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
              title={company.website}
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">{stripProtocol(company.website)}</span>
            </a>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <span className="truncate text-sm text-muted-foreground" title={company.industry ?? undefined}>
          {company.industry || "-"}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        <span className="truncate text-sm text-muted-foreground" title={company.hqLocation ?? undefined}>
          {company.hqLocation || "-"}
        </span>
      </td>
      <td className="px-4 py-3 align-top text-right tabular-nums text-sm">
        {company.contactCount > 0 ? (
          <Badge variant="secondary" className="tabular-nums">
            {company.contactCount}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 align-top text-right tabular-nums text-sm">
        {company.draftCount > 0 ? (
          <Badge variant="default" className="tabular-nums">
            {company.draftCount}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 align-top text-right text-xs text-muted-foreground tabular-nums">
        {company.lastActivity ? formatRelative(new Date(company.lastActivity)) : "never"}
      </td>
    </tr>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
      <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-muted">
        {hasFilters ? (
          <Search className="size-4 text-muted-foreground" />
        ) : (
          <Building2 className="size-4 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-medium">
        {hasFilters ? "No companies match your search" : "No companies yet"}
      </p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {hasFilters
          ? "Try a different name, industry, or location."
          : "Companies are created automatically the first time you generate a draft for them."}
      </p>
      {hasFilters ? null : (
        <Button asChild size="sm" className="mt-4">
          <Link href="/dashboard">
            <Building2 className="size-3.5" />
            New draft
          </Link>
        </Button>
      )}
    </div>
  );
}

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function formatRelative(date: Date): string {
  const ms = Date.now() - date.getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86400_000) return `${Math.floor(ms / 3600_000)}h ago`;
  if (ms < 86400_000 * 7) {
    const d = Math.floor(ms / 86400_000);
    return d === 1 ? "yesterday" : `${d}d ago`;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
