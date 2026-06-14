"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, FileText, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DraftListRow } from "@/server/repos/drafts";

interface Props {
  initial: DraftListRow[];
  initialFilters: { q: string; sender: string; pitchType: string };
  senders: string[];
  pitchTypes: string[];
}

export function DraftsTable({ initial, initialFilters, senders, pitchTypes }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = React.useState(initialFilters.q);

  // Debounce search input -> URL param so the server re-fetches.
  React.useEffect(() => {
    if (q === initialFilters.q) return;
    const t = setTimeout(() => {
      updateParam("q", q);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all" || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const qs = next.toString();
    router.push(qs ? `/dashboard/drafts?${qs}` : `/dashboard/drafts`);
  }

  const hasFilters =
    q || initialFilters.sender !== "all" || initialFilters.pitchType !== "all";

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, contact, or subject"
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

        <Select
          value={initialFilters.sender}
          onValueChange={(v) => updateParam("sender", v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All senders</SelectItem>
            {senders.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={initialFilters.pitchType}
          onValueChange={(v) => updateParam("pitch_type", v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Pitch type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pitch types</SelectItem>
            {pitchTypes.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              router.push("/dashboard/drafts");
            }}
            className="text-muted-foreground"
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {/* Table */}
      {initial.length === 0 ? (
        <EmptyState hasFilters={Boolean(hasFilters)} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1100px] table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[26%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Company / Contact</th>
                <th className="px-4 py-2.5">Subject</th>
                <th className="px-4 py-2.5">Pitch</th>
                <th className="px-4 py-2.5">Sender</th>
                <th className="px-4 py-2.5">Model</th>
                <th className="px-4 py-2.5 text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initial.map((d) => (
                <DraftRow key={d.id} draft={d} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DraftRow({ draft }: { draft: DraftListRow }) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(`/dashboard/drafts/${draft.id}`)}
      className="cursor-pointer transition-colors hover:bg-muted/40"
    >
      <td className="px-4 py-3 align-top">
        <div className="flex min-w-0 flex-col gap-0.5">
          {draft.companyId ? (
            <Link
              href={`/dashboard/companies/${draft.companyId}`}
              className="block truncate text-sm font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
              title={`Open ${draft.companyName ?? "company"} profile`}
            >
              {draft.companyName ?? "(unknown company)"}
            </Link>
          ) : (
            <span className="block truncate text-sm font-medium text-muted-foreground">
              (unknown company)
            </span>
          )}
          <div className="truncate text-xs text-muted-foreground">
            <span>{draft.contactName ?? "(no contact)"}</span>
            {draft.contactType ? (
              <span className="text-muted-foreground/70"> - {draft.contactType}</span>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <p className="truncate text-sm text-muted-foreground">
          {draft.subject1 ?? "(no subject)"}
        </p>
      </td>
      <td className="px-4 py-3 align-top text-sm">
        <div className="flex min-w-0 flex-col">
          <span className="truncate">{draft.pitchType ?? "-"}</span>
          {draft.subPitch ? (
            <span className="truncate text-xs text-muted-foreground">{draft.subPitch}</span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="truncate text-sm text-muted-foreground" title={draft.sender ?? undefined}>
          {draft.sender ?? "-"}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        {draft.modelUsed ? (
          <Badge
            variant="outline"
            className={cn(
              "max-w-full truncate whitespace-nowrap font-mono text-[10px] normal-case",
              draft.modelUsed.includes("openai/gpt-4.1-mini") &&
                "border-amber-500/40 text-amber-700 dark:text-amber-300",
            )}
            title={draft.modelUsed}
          >
            {draft.modelUsed}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-xs text-muted-foreground tabular-nums">
        {formatRelative(new Date(draft.createdAt))}
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
          <FileText className="size-4 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-medium">
        {hasFilters ? "No drafts match your filters" : "No drafts yet"}
      </p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {hasFilters
          ? "Try clearing the search or pick a different sender / pitch type."
          : "Generate a draft from the New Draft page - it will appear here once saved."}
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

/**
 * Tiny relative-time formatter. No deps. Good enough for "a minute ago" /
 * "3 hours ago" / "yesterday" / "Mar 4". Falls back to the local date for
 * anything older than a week.
 */
function formatRelative(date: Date): string {
  const ms = Date.now() - date.getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3600_000) {
    const m = Math.floor(ms / 60_000);
    return `${m}m ago`;
  }
  if (ms < 86400_000) {
    const h = Math.floor(ms / 3600_000);
    return `${h}h ago`;
  }
  if (ms < 86400_000 * 7) {
    const d = Math.floor(ms / 86400_000);
    return d === 1 ? "yesterday" : `${d}d ago`;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
