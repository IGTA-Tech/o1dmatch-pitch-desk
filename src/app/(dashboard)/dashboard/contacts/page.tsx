import {
  listContacts,
  getContactCount,
  getDistinctContactTypes,
} from "@/server/repos/contacts";
import { ContactsTable } from "@/components/pitch-desk/contacts-table";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    contact_type?: string;
  }>;
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    q: sp.q ?? "",
    contactType: sp.contact_type ?? "all",
  };

  const [rows, total, types] = await Promise.all([
    listContacts({ q: filters.q, contactType: filters.contactType }),
    getContactCount(),
    getDistinctContactTypes(),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every contact across every company. Most recent activity first.
          </p>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {total.toLocaleString()} total
        </span>
      </div>

      <ContactsTable initial={rows} initialFilters={filters} contactTypes={types} />
    </div>
  );
}
