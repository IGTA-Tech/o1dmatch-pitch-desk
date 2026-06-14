/**
 * OpenRouter client wired into the Vercel AI SDK.
 * One key, three model slots. Swap models via env without code changes.
 */
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

if (!process.env.OPENROUTER_API_KEY && process.env.BETA_MOCK_MODE !== "true") {
  // In mock mode we never call the network, so don't crash.
  console.warn("OPENROUTER_API_KEY is not set. Live generation will fail until you add it to .env.local.");
}

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "missing-key-mock-mode",
  headers: {
    "HTTP-Referer": process.env.OPENROUTER_APP_URL ?? "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_APP_NAME ?? "O1DMatch Pitch Desk",
  },
});

export const MODELS = {
  primary: process.env.AI_MODEL_PRIMARY ?? "z-ai/glm-4.6",
  bulk: process.env.AI_MODEL_BULK ?? "deepseek/deepseek-chat",
  fallback: process.env.AI_MODEL_FALLBACK ?? "openai/gpt-4.1-mini",
} as const;

export type ModelSlot = keyof typeof MODELS;

export function resolveModel(slot: ModelSlot) {
  return openrouter.chat(MODELS[slot]);
}
