import { loadSettings } from "@/server/actions/load-settings";
import { PitchDesk } from "@/components/pitch-desk/pitch-desk";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const settings = await loadSettings();
  const mockMode = String(process.env.BETA_MOCK_MODE ?? "").toLowerCase() === "true";

  return <PitchDesk settings={settings} mockMode={mockMode} />;
}
