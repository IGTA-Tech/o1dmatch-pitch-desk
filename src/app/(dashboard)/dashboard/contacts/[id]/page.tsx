import Link from "next/link";
import { notFound } from "next/navigation";
import { getContactById, getContactDraftHistory } from "@/server/repos/contacts";
import { ContactDetail } from "@/components/pitch-desk/contact-detail";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();

  const draftHistory = await getContactDraftHistory(id, 20);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
      <Link
        href="/dashboard/contacts"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to contacts
      </Link>

      <ContactDetail contact={contact} drafts={draftHistory} />
    </div>
  );
}
