/**
 * The full generation pipeline.
 *
 *   form payload
 *     -> Zod validate
 *     -> sanitize ASCII
 *     -> build AI prompt payload
 *     -> [BETA_MOCK_MODE ? mock : OpenRouter primary]
 *         -> on error or invalid JSON: retry once on OpenRouter fallback
 *     -> Zod validate the model output
 *     -> run quality scanner (banned-phrase, ASCII, lengths, etc.)
 *     -> return PitchDeskOutput + meta
 */
import { generateObject } from "ai";
import {
  generateInputSchema,
  pitchDeskOutputSchema,
  type GenerateInput,
  type PitchDeskOutput,
} from "./schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "./system-prompt";
import { deepSanitize } from "./sanitize";
import { runQualityChecks } from "./quality-scanner";
import { makeMockResult } from "./mock";
import { MODELS, resolveModel, type ModelSlot } from "./openrouter";

export interface GenerateMeta {
  modelUsed: string;
  latencyMs: number;
  mode: ModelSlot;
  fellBack: boolean;
}

export interface GenerateResult {
  output: PitchDeskOutput;
  meta: GenerateMeta;
}

function isMockMode(): boolean {
  return String(process.env.BETA_MOCK_MODE ?? "").toLowerCase() === "true";
}

function buildAiPayload(input: GenerateInput) {
  const clean = deepSanitize(input);
  return {
    task: "generate_pitch_desk_outputs",
    app: "O1DMatch Pitch Desk",
    version: "2.0.0",
    selected_company: clean.company,
    selected_contact: clean.contact,
    all_contacts_context: clean.allContacts,
    campaign_controls: clean.controls,
    human_strategy_notes: clean.strategyNotes,
    output_requirements: {
      short_email_words: "110-175",
      personalized_email_words: "175-300",
      follow_up_words: "50-95",
      subject_count: 2,
      no_signature_block: true,
      copy_paste_ready: true,
      strict_json_only: true,
    },
  };
}

async function callModel(slot: ModelSlot, userPrompt: string): Promise<PitchDeskOutput> {
  const { object } = await generateObject({
    model: resolveModel(slot),
    schema: pitchDeskOutputSchema,
    schemaName: "o1dmatch_pitch_desk_output",
    schemaDescription:
      "Structured outreach output for the O1DMatch Pitch Desk. Strict ASCII, plain text, no markdown.",
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.4,
    maxRetries: 1,
  });
  return object as PitchDeskOutput;
}

export async function generateDraft(rawInput: unknown): Promise<GenerateResult> {
  const start = Date.now();
  const input = generateInputSchema.parse(rawInput);

  // Mock fast path
  if (isMockMode()) {
    const mock = runQualityChecks(makeMockResult(input));
    return {
      output: mock,
      meta: { modelUsed: "mock", latencyMs: Date.now() - start, mode: input.mode, fellBack: false },
    };
  }

  const payload = buildAiPayload(input);
  const userPrompt = buildUserPrompt(JSON.stringify(payload, null, 2));

  const primarySlot: ModelSlot = input.mode === "bulk" ? "bulk" : "primary";
  let modelUsed = MODELS[primarySlot];
  let fellBack = false;

  let output: PitchDeskOutput;
  try {
    output = await callModel(primarySlot, userPrompt);
  } catch (err) {
    console.error(`[generateDraft] ${primarySlot} model failed, falling back:`, err);
    fellBack = true;
    modelUsed = MODELS.fallback;
    output = await callModel("fallback", userPrompt);
  }

  // Final sanitization + quality scan
  output = deepSanitize(output);
  output = runQualityChecks(output);

  return {
    output,
    meta: { modelUsed, latencyMs: Date.now() - start, mode: input.mode, fellBack },
  };
}
