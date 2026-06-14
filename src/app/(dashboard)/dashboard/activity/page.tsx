import {
  listActivity,
  getActivityCount,
  getDistinctActivityUsers,
  getDistinctActivityActions,
} from "@/server/repos/activity";
import { ActivityFeed } from "@/components/pitch-desk/activity-feed";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    user?: string;
    action?: string;
  }>;
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    user: sp.user ?? "all",
    action: sp.action ?? "all",
  };

  const [rows, total, users, actions] = await Promise.all([
    listActivity({ user: filters.user, action: filters.action }),
    getActivityCount(),
    getDistinctActivityUsers(),
    getDistinctActivityActions(),
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every recorded action, newest first. Read-only audit trail.
          </p>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {total.toLocaleString()} total
        </span>
      </div>

      <ActivityFeed initial={rows} initialFilters={filters} users={users} actions={actions} />
    </div>
  );
}
