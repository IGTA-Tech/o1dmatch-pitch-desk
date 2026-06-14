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
import { Search, Users, X } from "lucide-react";
import type { ContactListRow } from "@/server/repos/contacts";

interface Props {
  initial: ContactListRow[];
  initialFilters: { q: string; contactType: string };
  contactTypes: string[];
}

export function ContactsTable({ initial, initialFilters, contactTypes }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = React.useState(initialFilters.q);

  React.useEffect(() => {
    if (q === initialFilters.q) return;
    const t = setTimeout(() => updateParam("q", q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all" || value === "") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `/dashboard/contacts?${qs}` : `/dashboard/contacts`);
  }

  const hasFilters = q || initialFilters.contactType !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, title, email, or company"
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
          value={initialFilters.contactType}
          onValueChange={(v) => updateParam("contact_type", v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Contact type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {contactTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
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
              router.push("/dashboard/contacts");
            }}
            className="text-muted-foreground"
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {initial.length === 0 ? (
        <EmptyState hasFilters={Boolean(hasFilters)} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1000px] table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[20%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Name / Title</th>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Drafts</th>
                <th className="px-4 py-2.5 text-right">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initial.map((c) => (
                <ContactRow key={c.id} contact={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ContactRow({ contact }: { contact: ContactListRow }) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
      className="cursor-pointer transition-colors hover:bg-muted/40"
    >
      <td className="px-4 py-3 align-top">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/dashboard/contacts/${contact.id}`}
            className="block truncate text-sm font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
            title={contact.name}
          >
            {contact.name}
          </Link>
          {contact.title ? (
            <span className="truncate text-xs text-muted-foreground" title={contact.title}>
              {contact.title}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        {contact.companyId ? (
          <Link
            href={`/dashboard/companies/${contact.companyId}`}
            className="block truncate text-sm hover:underline"
            onClick={(e) => e.stopPropagation()}
            title={contact.companyName ?? undefined}
          >
            {contact.companyName ?? "-"}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="block truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
            onClick={(e) => e.stopPropagation()}
            title={contact.email}
          >
            {contact.email}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {contact.contactType ? (
          <Badge variant="secondary" className="truncate text-[10px]">
            {contact.contactType}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 align-top text-right tabular-nums text-sm">
        {contact.draftCount > 0 ? (
          <Badge variant="default" className="tabular-nums">
            {contact.draftCount}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 align-top text-right text-xs text-muted-foreground tabular-nums">
        {contact.lastActivity ? formatRelative(new Date(contact.lastActivity)) : "never"}
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
          <Users className="size-4 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-medium">
        {hasFilters ? "No contacts match your filters" : "No contacts yet"}
      </p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {hasFilters
          ? "Try a different name, type, or company."
          : "Contacts are created automatically the first time you draft to them."}
      </p>
      {hasFilters ? null : (
        <Button asChild size="sm" className="mt-4">
          <Link href="/dashboard">
            <Users className="size-3.5" />
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
