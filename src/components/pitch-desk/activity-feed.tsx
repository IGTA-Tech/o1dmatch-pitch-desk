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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity as ActivityIcon,
  Building2,
  FileText,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import type { ActivityRow } from "@/server/repos/activity";

interface Props {
  initial: ActivityRow[];
  initialFilters: { user: string; action: string };
  users: string[];
  actions: string[];
}

export function ActivityFeed({ initial, initialFilters, users, actions }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `/dashboard/activity?${qs}` : `/dashboard/activity`);
  }

  const hasFilters = initialFilters.user !== "all" || initialFilters.action !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={initialFilters.user} onValueChange={(v) => updateParam("user", v)}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={initialFilters.action} onValueChange={(v) => updateParam("action", v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/activity")}
            className="text-muted-foreground"
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {initial.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {initial.map((row) => (
              <ActivityItem key={row.id} row={row} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ row }: { row: ActivityRow }) {
  const notes = (row.notes as ActivityNotes) ?? null;
  const meta = describeAction(row.action);

  return (
    <li className="flex items-start gap-3 px-5 py-4">
      {/* Icon tile */}
      <div
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md ${meta.iconBg}`}
        title={row.action}
      >
        {meta.icon}
      </div>

      <div className="min-w-0 flex-1">
        {/* Headline */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          <span className="font-medium">{shortUser(row.userId)}</span>
          <span className="text-muted-foreground">{meta.verb}</span>
          {row.draftId ? (
            <Link
              href={`/dashboard/drafts/${row.draftId}`}
              className="font-medium hover:underline"
            >
              draft
            </Link>
          ) : (
            <span className="font-medium">draft</span>
          )}
          {row.contactName ? (
            <>
              <span className="text-muted-foreground">to</span>
              {row.contactId ? (
                <Link
                  href={`/dashboard/contacts/${row.contactId}`}
                  className="font-medium hover:underline"
                >
                  {row.contactName}
                </Link>
              ) : (
                <span className="font-medium">{row.contactName}</span>
              )}
            </>
          ) : null}
          {row.companyName ? (
            <>
              <span className="text-muted-foreground">at</span>
              {row.companyId ? (
                <Link
                  href={`/dashboard/companies/${row.companyId}`}
                  className="font-medium hover:underline"
                >
                  {row.companyName}
                </Link>
              ) : (
                <span className="font-medium">{row.companyName}</span>
              )}
            </>
          ) : null}
        </div>

        {/* Subject preview */}
        {row.draftSubject ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Subject: <span className="italic">{row.draftSubject}</span>
          </p>
        ) : null}

        {/* Notes - model / latency / fellBack */}
        {notes ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {notes.modelUsed ? (
              <Badge variant="outline" className="font-mono text-[10px] normal-case">
                {notes.modelUsed}
              </Badge>
            ) : null}
            {typeof notes.latencyMs === "number" ? (
              <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
                {(notes.latencyMs / 1000).toFixed(1)}s
              </Badge>
            ) : null}
            {notes.fellBack ? (
              <Badge variant="warning" className="text-[10px] uppercase">
                fallback
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <p
          className="text-xs text-muted-foreground tabular-nums"
          title={new Date(row.ts).toLocaleString()}
        >
          {formatRelative(new Date(row.ts))}
        </p>
      </div>
    </li>
  );
}

interface ActivityNotes {
  modelUsed?: string;
  latencyMs?: number;
  fellBack?: boolean;
}

function describeAction(action: string): { verb: string; icon: React.ReactNode; iconBg: string } {
  switch (action) {
    case "draft.generated":
      return {
        verb: "generated a",
        icon: <Sparkles className="size-4 text-primary" />,
        iconBg: "bg-primary/10",
      };
    case "draft.copied":
      return {
        verb: "copied",
        icon: <FileText className="size-4 text-muted-foreground" />,
        iconBg: "bg-muted",
      };
    case "draft.saved":
      return {
        verb: "saved",
        icon: <FileText className="size-4 text-muted-foreground" />,
        iconBg: "bg-muted",
      };
    case "company.created":
      return {
        verb: "created company",
        icon: <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" />,
        iconBg: "bg-emerald-500/10",
      };
    case "contact.created":
      return {
        verb: "created contact",
        icon: <UserCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />,
        iconBg: "bg-emerald-500/10",
      };
    default:
      return {
        verb: action,
        icon: <ActivityIcon className="size-4 text-muted-foreground" />,
        iconBg: "bg-muted",
      };
  }
}

function shortUser(userId: string | null): string {
  if (!userId) return "Someone";
  // Emails: keep the local part for brevity, full string in tooltip on hover.
  if (userId.includes("@")) {
    const local = userId.split("@")[0];
    return local.length > 0 ? local : userId;
  }
  return userId;
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
      <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-muted">
        <ActivityIcon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">
        {hasFilters ? "No matching activity" : "No activity yet"}
      </p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {hasFilters
          ? "Try removing one of the filters."
          : "Every generation is logged here. Generate your first draft and it will show up."}
      </p>
      {hasFilters ? null : (
        <Button asChild size="sm" className="mt-4">
          <Link href="/dashboard">
            <Sparkles className="size-3.5" />
            New draft
          </Link>
        </Button>
      )}
    </div>
  );
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
