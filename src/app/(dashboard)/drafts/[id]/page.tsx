import Link from "next/link";
import { notFound } from "next/navigation";
import { getDraftById } from "@/server/repos/drafts";
import { DraftDetail } from "@/components/pitch-desk/draft-detail";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DraftDetailPage({ params }: PageProps) {
  const { id } = await params;
  const draft = await getDraftById(id);
  if (!draft) notFound();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
      <Link
        href="/dashboard/drafts"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to drafts
      </Link>

      <DraftDetail draft={draft} />
    </div>
  );
}
