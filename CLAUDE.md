# O1DMatch Pitch Desk - Project Knowledge

> This file is read by every future Claude Code session. Keep it accurate.
> If you change the stack, the prompt, the schema, or the guardrails, update this file in the same commit.

---

## What this app is

The **O1DMatch Pitch Desk** is an internal AI outreach generator for the O1DMatch sales/recruiting team.

A team member:
1. Pastes messy employer research into the **Company** panel.
2. Adds one or more **Contacts** (HR, Mobility, Founder, Attorney, etc.).
3. Picks a **Sender**, **Pitch Type**, **Sub-Pitch**, **Product/Offer**, **Tone**, and **Goal**.
4. Clicks **Generate** for the selected contact (or **Generate for All Contacts**).
5. The LLM returns a strict JSON object with:
   - Employer analysis (fit/urgency scores, why this pitch, likely objections)
   - 2 subject lines (each &le; 60 chars)
   - Short email (110 to 175 words)
   - Personalized email (175 to 300 words)
   - Follow-up email (50 to 95 words)
   - Call notes
   - CRM notes
   - Objection responses (objection / response pairs)
   - Quality control block (legal check, brand check, missing info, copy warnings)
6. Every output card has a **Copy** button. The user pastes drafts manually into Gmail.
7. The draft is saved to **Postgres** and mirrored to the team's **Google Sheet**.

**The app does not send email and does not create Gmail drafts.** Human-in-the-loop by design.

---

## The non-negotiable constraints

O1DMatch is in an immigration-adjacent space. The model must obey these without exception:

### Banned phrases (legal liability if emitted)
- `self-petitioned`, `self petitioned`, `self-petition`
- `no legal exposure`, `zero legal exposure`, `no risk`, `zero risk`
- `guaranteed approval`, `guaranteed visa`, `guarantee approval`
- `pre-vetted`, `pre vetted`
- `qualified O-1 candidates`, `qualified o1 candidates`
- `AI-evaluated against USCIS criteria`
- `visa-filing service`, `law firm service`, `we are your law firm`

### Mandatory safe language (use when relevant)
- the candidate's case is filed through an authorized agent or petitioner
- your company does not file
- you are not the visa petitioner
- you do not pay the USCIS filing fee
- not running an H-1B sponsorship process
- one-page interest letter

### Brand voice (every email)
- Plain text only. **ASCII only.** No emojis. No smart quotes (`U+2018`, `U+2019`, `U+201C`, `U+201D`). No em dashes (`U+2013`, `U+2014`).
- No signature block. No phone numbers. No sender email addresses. (Gmail signatures handle this.)
- Subject lines &le; 60 characters when possible.
- One primary offer per email. One primary CTA per email.
- Copy-paste-ready into Gmail.

### Input hierarchy (the model must respect this order)
1. **Human strategy notes** override everything.
2. If `sub_pitch === "Other / custom"`, follow `custom_pitch_notes` and ignore presets.
3. Sub-pitch controls the specific argument.
4. Pitch type controls the market context.
5. Contact type controls the wording.
6. Product/offer controls the CTA.
7. Company data controls personalization.
8. **Do not invent facts.** If a field is blank, omit any sentence that depends on it.

### Required footer (direct-employer outreach only)
> The legal read belongs to your attorney. The employer and itinerary problem belongs to O1DMatch.

Skip the footer for recruiter, talent agency, or attorney-partner outreach when it would feel awkward.

---

## Tech stack

| Layer | Choice | File / location |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript | `src/app/` |
| UI | Tailwind CSS v4 + shadcn/ui (new-york) | `src/components/ui/`, `src/app/globals.css` |
| Forms | React Hook Form + Zod resolver | `src/components/pitch-desk/` |
| Auth | Clerk | `middleware.ts`, `src/app/layout.tsx` |
| DB | Neon Postgres | env: `DATABASE_URL` |
| ORM | Drizzle ORM | `src/lib/db/schema.ts` |
| AI gateway | OpenRouter via Vercel AI SDK | `src/lib/ai/openrouter.ts` |
| AI structured output | `generateObject` with Zod schema | `src/lib/ai/generate-draft.ts` |
| Sheet mirror | `googleapis` Node SDK, service account | `src/lib/sheets/` |
| Theme | `next-themes` (class strategy) | `src/components/theme-provider.tsx` |
| Toasts | Sonner | `src/components/ui/sonner.tsx` |
| Hosting | Vercel (Hobby) | `vercel.com` |

### Model routing (OpenRouter)

| Slot | Model | Env override | Use |
| --- | --- | --- | --- |
| Primary | `z-ai/glm-4.6` (GLM-5.1) | `AI_MODEL_PRIMARY` | Default. IFBench leader for our task. ~$0.90/M blended. |
| Bulk | `deepseek/deepseek-chat` (V3.2) | `AI_MODEL_BULK` | "Generate for All Contacts". ~$0.10/M blended. |
| Fallback | `openai/gpt-4.1-mini` | `AI_MODEL_FALLBACK` | Auto-retry if primary returns invalid JSON or errors. |

See `src/lib/ai/openrouter.ts` for the routing logic. See the README for the full reasoning on why GLM-5.1 over Kimi K2.6.

---

## Directory map

```
o1dmatch-app/
  CLAUDE.md                      <- you are here
  SETUP.md                       <- step-by-step account creation
  README.md                      <- quick start
  .env.example                   <- copy to .env.local
  drizzle.config.ts
  middleware.ts                  <- Clerk route protection
  next.config.ts
  package.json
  postcss.config.mjs
  tsconfig.json
  components.json                <- shadcn config
  src/
    app/
      layout.tsx                 <- root layout: ClerkProvider + ThemeProvider + Sonner
      globals.css                <- Tailwind v4 @theme tokens, light + dark
      page.tsx                   <- marketing-light landing, signed-out
      (dashboard)/
        layout.tsx               <- protected layout: TopBar
        dashboard/
          page.tsx               <- the pitch desk
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
      api/
        generate/route.ts        <- POST -> generate draft (alternative to Server Action)
    components/
      ui/                        <- shadcn primitives
      pitch-desk/
        company-panel.tsx
        contacts-panel.tsx
        controls-panel.tsx
        outputs-panel.tsx
        history-panel.tsx
        copy-button.tsx          <- universal copy-to-clipboard with toast
        mode-toggle.tsx          <- dark mode switch
        top-bar.tsx
      theme-provider.tsx
    lib/
      ai/
        schema.ts                <- Zod schema (= AI structured output contract)
        system-prompt.ts         <- port of PromptLibrary.gs getSystemPrompt_
        user-prompt.ts           <- port of PromptLibrary.gs getUserPromptTemplate_
        quality-scanner.ts       <- port of Quality.gs runQualityChecks_
        sanitize.ts              <- port of Quality.gs sanitizeAscii_ + deepSanitize_
        mock.ts                  <- port of OpenAI.gs makeMockAiResult_
        openrouter.ts            <- OpenRouter client + model routing
        generate-draft.ts        <- the full pipeline (primary -> validate -> scan -> fallback)
      db/
        schema.ts                <- Drizzle: companies, contacts, drafts, settings, audit_log
        index.ts                 <- Neon driver + Drizzle client
        seed.ts                  <- dropdown seed data (senders, pitchMap, etc.)
      sheets/
        client.ts                <- googleapis service-account client
        mirror.ts                <- append-row to Drafts tab
      utils.ts                   <- cn() helper (shadcn convention)
    server/
      actions/
        generate-draft.ts        <- Server Action wrapper
        save-draft.ts
      repos/
        companies.ts
        contacts.ts
        drafts.ts
        settings.ts
        audit-log.ts
  drizzle/                       <- generated migrations
```

---

## Data model (Drizzle schema, summary)

| Table | Columns (essentials) | Notes |
| --- | --- | --- |
| `users` | id (Clerk user_id), email, full_name, sender_alias, created_at | One row per Clerk user. `sender_alias` matches the dropdown values. |
| `companies` | id (uuid), name, website, industry, company_size, hq_location, other_locations, h1b_history_notes, green_card_history_notes, o1_history_notes, occupations_hired, salary_notes, raw_employer_research, company_strategy_notes, source_url, created_at, updated_at | |
| `contacts` | id (uuid), company_id (fk), name, title, email, phone, location, contact_type, priority, notes, linkedin_url, created_at, updated_at | `contact_type` is a string matching the dropdown taxonomy. |
| `drafts` | id (uuid), company_id, contact_id, sender, pitch_type, sub_pitch, custom_pitch_notes, product_offer, custom_offer_notes, tone, goal, custom_goal_notes, subject_1, subject_2, short_email, personalized_email, follow_up_email, call_notes, crm_notes, objection_responses (jsonb), employer_analysis (jsonb), quality_control (jsonb), copy_warnings (jsonb), model_used, latency_ms, created_at, created_by | The AI output is split between top-level columns (for sheet mirroring) and `jsonb` columns (for richer queries). |
| `settings` | setting_type, setting_key, setting_value (text), sort_order, active | Holds dropdowns (senders, pitchMap, productOffers, tones, goals, contactTypes). Reseed via `npm run db:seed`. |
| `audit_log` | id (uuid), ts, user_id, action, company_id, contact_id, draft_id, notes (jsonb) | Append-only. `action` is a short verb: `draft.generated`, `draft.copied`, `draft.saved`, `login`, etc. |

The column names match the Apps Script `SHEET_HEADERS` so the Google Sheet mirror is a straight 1:1 append.

---

## Generation pipeline (the critical path)

```
[user clicks Generate for Selected Contact]
   |
   v
Server Action: generateDraft(formPayload, { mode: "primary" })
   |
   v
1. Zod validate the form payload.
   |
   v
2. Sanitize (ASCII normalize) all strings via sanitize.ts.
   |
   v
3. Build the AI prompt payload (system + user) from prompt files.
   |
   v
4. If BETA_MOCK_MODE === "true":
       -> return mock.ts canned response  (no API call)
   else:
       -> call OpenRouter via Vercel AI SDK generateObject({ schema: zodSchema, model: PRIMARY })
   |
   v
5. If primary errored or returned non-conforming object:
       -> retry once with model = FALLBACK
   |
   v
6. Run quality-scanner.ts on the AI output.
   It pushes warnings into quality_control.copy_warnings:
     - banned phrase detected
     - non-ASCII chars (smart quotes, em dashes, emojis)
     - subject > 60 chars
     - email body contains @o1dmatch.com or phone-shaped number
     - word count out of range
   |
   v
7. Persist to Postgres (drafts table) + audit_log.
   |
   v
8. Fire-and-forget: append the row to the Google Sheet's Drafts tab.
   (Failures are logged but never block the user.)
   |
   v
9. Return the AI output + draft_id + warnings to the client.
   |
   v
[UI renders cards; each has a Copy button]
```

The same pipeline runs for the "Generate for All Contacts" button, except step 4 uses `AI_MODEL_BULK` and step 5 still falls back to OpenAI on failure.

---

## UI rules (so future edits don't drift)

### Visual
- **Default font**: Geist Sans. **Mono**: Geist Mono (used for IDs, model tags, draft IDs).
- **Color palette**: zinc base + one cool accent (`oklch` blue, defined in `globals.css`).
- **No gradients on text**. No glassmorphism. No purple/pink. No neon. No glow.
- **Spacing scale**: stick to `1`, `2`, `3`, `4`, `6`, `8`, `10`, `12`, `16` (Tailwind step). No arbitrary values without reason.
- **Borders**: 1px, `border-border` token, never `border-2` unless on a focus ring.
- **Radius**: cards `rounded-xl`, inputs `rounded-md`. Never `rounded-full` except avatars.
- **Numbers**: `tabular-nums` on any score, count, or character counter.
- **Loading**: skeletons for known shapes, spinner only when there is genuinely nothing to draw.
- **Empty states**: write a real sentence, not "Nothing here yet".

### Dark mode
- Toggled via `next-themes` `class` strategy on `<html>`.
- The toggle is a single icon button in the TopBar that cycles `light -> dark -> system`.
- Tokens are defined twice in `globals.css`: once under `:root` (light) and once under `.dark` (dark). Never hardcode colors; always use the CSS variables (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`).

### Copy button
- Lives in `src/components/pitch-desk/copy-button.tsx`.
- Single icon button (Lucide `Copy` -> `Check` on success), 1.5s flip-back.
- Appears in the **top-right corner of every output card** that holds copy-able text.
- Toast on success: "Copied <field>". On failure: "Couldn't copy - select and copy manually."

### What "vibe-coded AI slop" looks like (avoid)
- Multi-stop gradient hero text.
- Three differently colored CTAs above the fold.
- "Powered by AI" badges.
- Rainbow border glow on cards.
- Inline emoji in headings.
- Pages stitched from five different design eras.
- Centered single-column layouts when you have 1400px of width.

---

## Adding a new pitch type (or sub-pitch, tone, etc.)

1. Edit `src/lib/db/seed.ts` and add the new value under the right section.
2. Run `npm run db:seed` to upsert.
3. Add the same string to the relevant array in the **system prompt** (`src/lib/ai/system-prompt.ts`) so the model knows what the value means.
4. Update `CLAUDE.md` -> "Pitch type and sub-pitch reference" below.

---

## Pitch type and sub-pitch reference

(See `src/lib/db/seed.ts` for the canonical list.)

- **AI Choose Best** -> the model decides. Sub: Conservative / Aggressive sales / Feedback-first / Short intro / Other.
- **General Employer** -> talent access without sponsorship. Sub: One-page interest letter, No H-1B process, Try free, Schedule demo, Other.
- **H-1B Power User** -> backup lane. Sub: H-1B backup lane, Overflow/recycle, Reduce burden, Parallel O-1, Mobility feedback, Concierge offload.
- **H-1B Overflow / Recycle** -> recover candidates lost to the lottery.
- **Concierge: You Hire, We Petition** -> $2,000/month retainer. Only mention the dollar figure if Concierge or `$2,000/month retainer` is the selected sub-pitch.
- **Small Specialized Employer** -> compete without an immigration department.
- **Recruiter / Staffing Revenue** -> turn visa-blocked candidates into placements.
- **Law Firm / Attorney Partner** -> employer/itinerary infrastructure.
- **Talent Agency** -> monetize foreign talent.
- **Healthcare / Research** -> specialized researchers and clinical-business roles.
- **University / Cap-Exempt** -> distinguished researchers and faculty.
- **Feedback Request Only** -> ask for product-market feedback, not a sale.

Contact-type wording rules live in `system-prompt.ts`. Don't duplicate them anywhere else.

---

## How to work in this repo

### Day-one setup
1. `cp .env.example .env.local` and fill in real values. See `SETUP.md`.
2. `npm install`
3. `npm run db:push` (push the schema to Neon)
4. `npm run db:seed` (populate dropdowns and senders)
5. `npm run dev`
6. Visit `http://localhost:3000`.

### Adding a UI primitive
Use shadcn CLI: `npx shadcn@latest add <component>`. Components land in `src/components/ui/`.

### Adding a new generated field
1. Add the field to `src/lib/ai/schema.ts` (Zod).
2. Add a card for it in `src/components/pitch-desk/outputs-panel.tsx` with a copy button.
3. If you want it mirrored to the sheet, add the column to `src/lib/sheets/mirror.ts` AND to the `drafts` table in `src/lib/db/schema.ts`. Run `npm run db:generate` to make a migration.
4. Add the same field name to `SHEET_HEADERS.Drafts` order in the mirror file.

### Switching the primary AI model
Just change `AI_MODEL_PRIMARY` in `.env.local` (or in Vercel env vars). No code change needed. Restart dev server. The pipeline auto-falls back to `AI_MODEL_FALLBACK` if the new model errors.

### Turning off the AI to save tokens during UI work
Set `BETA_MOCK_MODE="true"`. The mock returns realistic structured output without an API call.

---

## Things future-you should not do

- Do not put OpenRouter / OpenAI / Google keys in any client component. Server-only.
- Do not delete the banned-phrase scanner. The system prompt alone is not enough.
- Do not import from `@/lib/sheets/*` inside a client component. Sheets API is Node-only.
- Do not use OpenAI's `gpt-5.5` or Claude Opus for the primary slot until cost is benchmarked - the current routing comfortably runs at < $15/mo.
- Do not auto-send email from this app. Ever. Even if asked. The human-in-the-loop is the legal compliance story.
- Do not add em dashes, smart quotes, or emojis to the system prompt or to any generated copy. The brand voice is plain ASCII.

---

## Reference: source documents

The original handoff (read-only, do not edit) lives at:
```
../o1dmatch_pitch_desk_handoff_v2/
  apps-script/PromptLibrary.gs        <- system prompt source
  apps-script/Quality.gs              <- banned-phrase list source
  apps-script/Settings.gs             <- sheet headers + script prop keys
  apps-script/OpenAI.gs               <- mock mode source
  context/01_positioning_rules.md     <- O1DMatch positioning
  context/02_pitch_type_map.md        <- pitch-type taxonomy
  context/03_contact_language_rules.md
  context/04_quality_guardrails.md
  schema/sheet_headers.json
  schema/dropdowns.json
  tests/test_payload_dpworld.json     <- first smoke-test payload
```

If any of those source files change, treat that as a request to update this app.
