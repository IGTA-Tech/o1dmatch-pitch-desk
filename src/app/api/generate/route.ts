/**
 * Alternative REST entry point for the generation pipeline.
 * Useful for scripts, Postman, or external testing tools.
 * The UI uses the Server Action instead.
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateDraftAction } from "@/server/actions/generate-draft";
import { generateInputSchema } from "@/lib/ai/schema";

export const runtime = "nodejs";
// 300s headroom for OpenRouter outliers; well within Vercel Pro's 800s cap.
export const maxDuration = 300;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = generateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await generateDraftAction(parsed.data);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
