import { Suspense } from "react";
import {
  listDrafts,
  getDistinctSenders,
  getDistinctPitchTypes,
  getDraftCount,
} from "@/server/repos/drafts";
import { DraftsTable } from "@/components/pitch-desk/drafts-table";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    sender?: string;
    pitch_type?: string;
  }>;
}

export default async function DraftsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    q: sp.q ?? "",
    sender: sp.sender ?? "all",
    pitchType: sp.pitch_type ?? "all",
  };

  const [drafts, total, senders, pitchTypes] = await Promise.all([
    listDrafts({
      q: filters.q,
      sender: filters.sender,
      pitchType: filters.pitchType,
    }),
    getDraftCount(),
    getDistinctSenders(),
    getDistinctPitchTypes(),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Drafts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every generation, newest first. Click a row to open the full output.
          </p>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {total.toLocaleString()} total
        </span>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <DraftsTable
          initial={drafts}
          initialFilters={filters}
          senders={senders}
          pitchTypes={pitchTypes}
        />
      </Suspense>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="space-y-2 p-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
