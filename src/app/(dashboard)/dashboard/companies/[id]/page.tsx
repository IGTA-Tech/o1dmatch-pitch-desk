import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompanyById,
  getCompanyContacts,
  getCompanyDraftHistory,
} from "@/server/repos/companies";
import { CompanyDetail } from "@/components/pitch-desk/company-detail";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const [companyContacts, draftHistory] = await Promise.all([
    getCompanyContacts(id),
    getCompanyDraftHistory(id, 20),
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
      <Link
        href="/dashboard/companies"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to companies
      </Link>

      <CompanyDetail company={company} contacts={companyContacts} drafts={draftHistory} />
    </div>
  );
}
