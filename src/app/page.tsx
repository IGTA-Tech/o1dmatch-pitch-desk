import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-6 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-xs font-bold tracking-tight">O1</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">O1DMatch Pitch Desk</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Internal tool for the O1DMatch team. Paste employer research, pick a sender and pitch,
          generate copy-ready outreach. Drafts are mirrored to the team Google Sheet.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/sign-in">
              Sign in <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-up">Request access</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
