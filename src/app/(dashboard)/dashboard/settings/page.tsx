import { listAllSettings } from "@/server/repos/settings-admin";
import { SettingsPanel } from "@/components/pitch-desk/settings-panel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const all = await listAllSettings();

  const models = {
    primary: process.env.AI_MODEL_PRIMARY ?? "z-ai/glm-4.6",
    bulk: process.env.AI_MODEL_BULK ?? "deepseek/deepseek-chat",
    fallback: process.env.AI_MODEL_FALLBACK ?? "openai/gpt-4.1-mini",
    mockMode: String(process.env.BETA_MOCK_MODE ?? "").toLowerCase() === "true",
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the dropdowns that drive the New Draft form. Changes apply immediately.
        </p>
      </div>

      <SettingsPanel data={all} models={models} />
    </div>
  );
}
