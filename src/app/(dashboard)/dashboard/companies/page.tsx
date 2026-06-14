import { listCompanies, getCompanyCount } from "@/server/repos/companies";
import { CompaniesTable } from "@/components/pitch-desk/companies-table";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q ?? "";

  const [rows, total] = await Promise.all([listCompanies({ q }), getCompanyCount()]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every company you've ever generated for. Most recent activity first.
          </p>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {total.toLocaleString()} total
        </span>
      </div>

      <CompaniesTable initial={rows} initialQuery={q} />
    </div>
  );
}
