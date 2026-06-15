# O1DMatch Pitch Desk - Progress Log

> Last updated: 2026-06-15
> Read this first when picking up a new session.

---

## Where the project lives

| Resource | Location |
|---|---|
| Local working tree | `C:\Coding Projects\O1DMatch Pitch Desk\o1dmatch-pitch-desk` |
| GitHub repo | <https://github.com/IGTA-Tech/o1dmatch-pitch-desk> |
| Live deploy (Vercel) | (the `*.vercel.app` URL Vercel assigned after first deploy) |
| Custom domain (planned, not set up yet) | `pitchdesk.o1dmatch.com` |
| Neon Postgres host | `ep-small-poetry-ajgygqx9-pooler.c-3.us-east-2.aws.neon.tech` |
| Clerk app | Test instance, claimed - app shows `pk_test_YXB0LXN0YXJmaXNoLTQwLmNsZXJrLmFjY291bnRzLmRldiQ` style key |
| Google Sheet (mirror target) | <https://docs.google.com/spreadsheets/d/19Z9DmMPmRIL4jOnLqRsSEq1leJszHCWzmKbPsJG7GLk/edit> |
| GCP project for Sheets (CURRENT) | `cold-email-o1dmatch` |
| Active service account | `sheet-reader@cold-email-o1dmatch.iam.gserviceaccount.com` |
| Old service account (deprecated) | `immigration-management-system@exhibits-480112.iam.gserviceaccount.com` - safe to leave on the sheet, no longer used |

All secrets live in `.env.local` (gitignored) on this machine and in Vercel env vars in the cloud. Nothing sensitive in the repo.

---

## What's built and working

### Auth and platform
- Clerk auth (test instance, email + Google login). Internal-team-only via the planned Clerk allowlist on `@o1dmatch.com`.
- Vercel **Pro** deploy. `maxDuration = 300` on generation routes - 60s default was too tight for occasional OpenRouter outliers.
- Next.js 15 App Router, Tailwind v4, shadcn/ui (new-york style, zinc + cool-blue accent), Geist Sans/Mono.

### Data layer
- Neon serverless Postgres (free tier, pooled connection).
- Drizzle ORM. 6 tables: users, companies, contacts, drafts, settings, audit_log.
- `npm run db:push --force` (added `--force` because the interactive prompt blocked the Bash tool).
- `npm run db:seed` populates dropdowns; reads `.env.local` via `tsx --env-file=.env.local`.
- **Dedup logic** in the generation server action: companies (by lower(name)) and contacts (by company_id + lower(name)) are merged on subsequent generations rather than duplicated. Empty fields get filled, non-empty user-typed values are preserved.

### AI pipeline
- OpenRouter wrapper, three model slots driven by env:
  - `AI_MODEL_PRIMARY=z-ai/glm-4.6` (GLM-5.1) - default for everything
  - `AI_MODEL_BULK=z-ai/glm-4.6` - same as primary (was DeepSeek, switched after user reported quality regression)
  - `AI_MODEL_FALLBACK=openai/gpt-4.1-mini` - auto-retries on invalid JSON / errors
- Vercel AI SDK `generateObject` with strict Zod schema enforcement. JSON schema strict mode = no optional properties.
- System prompt is a full port of the original `PromptLibrary.gs` plus paragraph-spacing rules added after user feedback ("packed" emails).
- Quality scanner runs post-generation: banned phrases, ASCII, length, smart-quote/em-dash, packed-paragraph detector with auto-repair.
- `BETA_MOCK_MODE=true` short-circuits with canned data - no API spend during UI dev.

### Sidebar (all 5 items live)
1. **New draft** - the main 2-column form (tabbed input + sticky output panel).
2. **Drafts** - searchable, filterable list of every past generation. Click row -> detail page reusing OutputsPanel.
3. **Companies** - list with contact + draft counts, last activity. Detail page shows contacts, draft history, notes accordion, collapsible raw research.
4. **Contacts** - flat list across all companies. Detail page links back to company.
5. **Activity** - timeline of audit_log entries with icons by action type and links to drafts / contacts / companies.
6. **Settings** - tabbed admin for Senders, Pitches (with sub-pitch editor), Offers, Tones, Goals, Contact Types, plus a read-only Models view.
- Sidebar is collapsible (icon mode), state persists to localStorage.
- Active-state matcher: exact match for `/dashboard`, prefix match for everything else (so detail pages still highlight their parent item).

### Quick Paste extraction (the killer feature)
- Card at the top of the dashboard - paste any blob from myvisajobs.com / LinkedIn / research notes - AI extracts company + contacts into the form.
- Server action with low temperature (0.1) for consistency.
- **Slash-encoded contact handler**: knows the myvisajobs format (`First1/First2/First3 Last1/Last2/Last3 - Team`) and splits deterministically as a server-side post-process safety net even if the model lazily returns the unsplit name.
- Empty-on-empty merge - never overwrites a field the user already typed.
- Original blob is appended to `raw_employer_research` so the generation step has full context.

### Generation status indicator
- Animated CSS progress bar at the top of the OutputsPanel during generation.
- Cycling status messages: Reading your input -> Calling the model -> Generating drafts -> Running quality checks -> Almost done -> Still working on it.
- Elapsed seconds counter.
- For bulk runs: `Generating for <Contact Name> (X of Y)`.

### Sheet mirror UX
- "Mirror to Google Sheet" checkbox defaults ON; turning it OFF triggers a `window.confirm()` with a real warning.
- Persistent red banner in the output panel when the most recent generation's sheet append failed, including the raw error message.
- Two credential paths supported: split env vars (`GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`) preferred, legacy `GOOGLE_SERVICE_ACCOUNT_JSON` with auto-repair as fallback.

### Helper scripts
- `scripts/setup-sheet.gs` - paste into Apps Script to create the 5 tabs with the right headers. Run `printSheetId` after to grab the sheet ID.
- `scripts/show-credentials.mjs` - reads a service account JSON, prints email + private_key (with `\n` as literal escapes) between loud delimiters so the user can paste into Vercel without corruption.

---

## Key decisions made (why things are the way they are)

| Decision | Why |
|---|---|
| GLM-5.1 over Kimi K2.6 for primary | Kimi wins on raw IQ (Intelligence Index 54 vs 51) but GLM-5.1 leads IFBench (instruction following) - our task is 95% rule-obedience (banned phrases, contact-type voice) and 5% reasoning. Also MIT vs Modified MIT license. |
| GLM-5.1 for bulk too (not DeepSeek) | User reported DeepSeek output quality regression on real generations. Cost difference at internal volume is < $5/mo, not worth the quality hit. |
| Two-layer Google credentials | Vercel's env-var paste UI repeatedly corrupted the JSON private_key (`\n` -> real newlines -> JSON.parse failure). Split env vars sidestep JSON entirely. |
| Slash-name post-process safety net | The prompt teaches the model the format, but the post-process is the deterministic catch-all so we never lose contacts to model laziness. |
| Empty-on-empty merge for Quick Paste | User feedback - their workflow involves iterating: paste -> edit some fields -> paste again. Overwriting their edits was unacceptable. |
| Sheet mirror failures shown as persistent banner | Earlier version was a toast. Toasts vanish, sheet data went missing silently for several drafts. Banner stays visible until the next generation. |
| `revalidatePath('/dashboard')` after every Settings mutation | The New Draft page dropdowns are cached as a Server Component; without revalidation, adding a new sender wouldn't appear until full reload. |
| MaxDuration 300s | Vercel Pro allows up to 800s. 300s is plenty of headroom for the ~47s outlier we saw and well within the cap. |

---

## In-flight (where to pick up next)

### #1 - Verify the Google Sheet mirror works on Vercel (CURRENT)
- User just switched to a fresh service account in a different GCP project (`cold-email-o1dmatch`).
- New service account email: `sheet-reader@cold-email-o1dmatch.iam.gserviceaccount.com`
- They need to:
  1. Enable Sheets API in the `cold-email-o1dmatch` project at <https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=cold-email-o1dmatch>
  2. Share the sheet with the new email as Editor
  3. Update `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` env vars on Vercel using the values from `node scripts/show-credentials.mjs "C:\Users\hp\Downloads\cold-email-o1dmatch-8454a942f183.json"`
  4. Delete the old broken `GOOGLE_SERVICE_ACCOUNT_JSON` env var
  5. Redeploy with cache disabled
  6. Generate a test draft on the live URL
  7. Confirm: no red banner in output panel, no `[sheets]` errors in Vercel logs, new row in the sheet's Drafts tab.

If still failing, paste the new Vercel log line. Probable causes ranked:
- Sheet not actually shared with the new email
- Sheets API not enabled in the new project
- Key value still got corrupted during paste

### #2 - Custom subdomain `pitchdesk.o1dmatch.com`
- Not done yet.
- Vercel -> Settings -> Domains -> Add `pitchdesk.o1dmatch.com` -> get the CNAME record -> add to o1dmatch.com DNS -> wait for cert.
- After live, update `OPENROUTER_APP_URL` env var to the new subdomain and redeploy.

### #3 - Smoke test the Quick Paste with the Amazon myvisajobs sample
- User pasted a sample earlier. The slash-name parser and prompt updates landed in commit `fd1e1f5`. After the sheet fix, paste it again and confirm ~12 distinct contacts extract correctly with shared emails/phones propagated.

---

## Deferred / optional

| Item | Notes |
|---|---|
| Production Clerk migration | Test keys work fine for an 8-person internal team. Switch to prod keys later only if branding / Google OAuth consent screen / email verification matters. Requires DNS records on `o1dmatch.com`. |
| OpenRouter $5 credit cap on the key | Recommended to prevent runaway spend if the key ever leaks. Settable at <https://openrouter.ai/keys>. |
| CSV export buttons on Drafts / Companies / Contacts pages | Not built. Would be a 50-line addition per page. |
| Edit / delete UI for companies and contacts | Currently can only add via the New Draft flow (with dedup). No edit form. Add when team requests it. |
| Onboarding / first-run experience | First-time users see a working dashboard but nothing tells them where to start. A "paste your first lead" hint could improve discoverability. |
| Add new pitch types to the system prompt | When users add a new pitch type via Settings, it works in the dropdown but the AI doesn't have detailed guidance for it. Yellow warning banner already tells the user this. |

---

## Cost picture

At current model routing (GLM-5.1 primary + bulk, gpt-4.1-mini fallback):
- ~$0.005 per draft (single contact)
- ~$0.001 per draft when fallback runs
- Internal team estimate of 100 drafts/day = ~$15/month on OpenRouter
- Neon, Clerk (test), Vercel Pro and Google Sheets API are either free or already paid.

---

## Important commits (recent first)

| SHA | Summary |
|---|---|
| `0398ed7` | Helper script `scripts/show-credentials.mjs` for paste-safe credential extraction |
| `fd1e1f5` | Quick Paste handles myvisajobs.com slash-encoded contact names |
| `143741f` | Sheets credential parsing tolerates Vercel paste corruption (split-env + auto-repair) |
| `f8288d5` | Quick Paste extraction + paragraph spacing + sheet error banner |
| `39a2292` | GLM-5.1 for bulk + live generation status indicator |
| `1975adb` | Settings page (sidebar item 5 of 5) |
| `3016fcc` | Activity feed page |
| `e7ca817` | Contacts list + detail pages |
| `5967fff` | Companies list + detail pages + dedup logic |
| `8d7eba7` | Drafts table column overflow fix |
| `56b2ac6` | Drafts list + detail pages |
| `334ff2b` | Output panel scroll containment |
| `7f3a728` | Dark-mode warning text contrast fix |
| `6d862eb` | UX restructure: collapsible sidebar + tabs + progressive disclosure |
| `7bb1410` | Dev workflow fixes (--force, --env-file) |

Full log: `git log --oneline -30`.

---

## How to resume in a fresh session

1. Open this file first.
2. Skim the "In-flight" section at the top.
3. `git pull` to sync the local tree with anything you might have pushed from elsewhere.
4. If Vercel build is broken, check the build log first, then `vercel logs --since 1h`.
5. The README + CLAUDE.md cover the code-level details; PROGRESS.md (this file) is the session-state ledger.
