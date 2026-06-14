import { loadSettings } from "@/server/actions/load-settings";
import { PitchDesk } from "@/components/pitch-desk/pitch-desk";

export const dynamic = "force-dynamic";
// 300s headroom for OpenRouter calls (worst case GLM-5.1 outlier seen so
// far was ~47s). Within Vercel Pro's 800s ceiling.
export const maxDuration = 300;

export default async function DashboardPage() {
  const settings = await loadSettings();
  const mockMode = String(process.env.BETA_MOCK_MODE ?? "").toLowerCase() === "true";

  return <PitchDesk settings={settings} mockMode={mockMode} />;
}
