# SETUP - O1DMatch Pitch Desk

You already have **OpenRouter** and **Vercel** accounts. This file walks you through the other three you still need:

1. **Neon** (free Postgres)
2. **Clerk** (auth for the internal team)
3. **Google Cloud service account** (to mirror drafts into the existing Google Sheet)

Then you'll wire all five into a single `.env.local` file and run the app.

Total time: about 25 minutes of clicking + paste.

---

## 0. Install Node + pnpm/npm and pull the project

```bash
node --version    # need >= 20.11
npm install
```

If you do not have Node 20+, install from <https://nodejs.org>.

---

## 1. Neon (Postgres) - 5 minutes

1. Go to <https://console.neon.tech/signup> and sign in with GitHub or Google.
2. Click **Create a project**.
3. Name it `o1dmatch-pitch-desk`. Region: `US East (N. Virginia)` (or whichever is closest to Vercel's `iad1`).
4. Postgres version: keep the default (latest).
5. Once the project is created, click **Dashboard** -> **Connection Details**.
6. Under **Connection string**, toggle **Pooled connection** ON. Copy the string. It looks like:
   ```
   postgresql://neondb_owner:abc123@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
7. Paste it into `.env.local` as `DATABASE_URL`.

That is it. You do not need to create the schema manually - `npm run db:push` does that.

---

## 2. Clerk (auth) - 5 minutes

1. Go to <https://dashboard.clerk.com/sign-up>.
2. Create an application. Name: `O1DMatch Pitch Desk`.
3. Auth methods: enable **Email + Password** and **Google**. Leave everything else off for now.
4. After the app is created you land on the **API Keys** screen.
5. Copy:
   - `Publishable key` -> paste as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` -> paste as `CLERK_SECRET_KEY`
6. Optional but recommended: in Clerk **Configure -> Restrictions**, set **Allowlist** to your team's email domains (`o1dmatch.com`) so randoms can not sign up.

---

## 3. Google Cloud service account (Sheets mirror) - 10 minutes

You will create a robot identity that can append rows to the existing `O1DMatch Pitch Desk Database` Google Sheet under `lanita@o1dmatch.com`.

### 3a. Create a Google Cloud project

1. Go to <https://console.cloud.google.com>. Sign in with any Google account (does not have to be `lanita@o1dmatch.com`).
2. Top bar -> project picker -> **New project**. Name: `o1dmatch-pitch-desk`. Create.
3. Wait 10 seconds, then select that project from the picker.

### 3b. Enable the Sheets API

1. Top search bar: type `Google Sheets API`. Click the result.
2. Click **Enable**.

### 3c. Create a service account

1. Left nav -> **IAM and Admin** -> **Service Accounts**.
2. Click **+ Create service account** at the top.
3. Name: `pitch-desk-writer`. ID auto-fills. Click **Create and continue**.
4. **Grant roles**: skip (no project-level role needed). Click **Continue**.
5. **Grant users access**: skip. Click **Done**.

### 3d. Create a JSON key

1. You should now see the service account in the list. Click it.
2. Top tabs -> **Keys** -> **Add key** -> **Create new key** -> **JSON** -> **Create**.
3. A `.json` file downloads. Open it in a text editor. **Keep this file out of git.**

### 3e. Get the service-account email

In the JSON file, find `"client_email"`. It looks like:
```
pitch-desk-writer@o1dmatch-pitch-desk.iam.gserviceaccount.com
```
Copy that email. You'll share the sheet with it in step 3g.

### 3f. Convert the JSON to an env var

The whole JSON file becomes one env var. Paste the **entire JSON** (yes, the whole thing) as the value of `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env.local`, wrapped in **single quotes** so the embedded double quotes survive:

```
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"pitch-desk-writer@...","..."}'
```

Tip: on Windows PowerShell, paste into VS Code as a single line. The `\n` sequences in `private_key` should stay as literal `\n`, not real newlines.

### 3g. Share the existing Google Sheet with the service account

1. Open `O1DMatch Pitch Desk Database` (under `lanita@o1dmatch.com`).
2. **Share** -> paste the service-account email from step 3e -> role **Editor** -> uncheck "Notify people" -> **Share**.
3. Copy the sheet ID from the URL. In `https://docs.google.com/spreadsheets/d/1AbCdEf.../edit`, the sheet ID is `1AbCdEf...`.
4. Paste as `GOOGLE_SHEET_ID` in `.env.local`.

### 3h. Make sure the sheet has the right tabs

The existing sheet should already have these five tabs from the original Apps Script install. If it does not, create them:

- `Companies`
- `Contacts`
- `Drafts`
- `Settings`
- `Audit_Log`

The app does not write headers - it assumes they are already present. The header order is in `src/lib/sheets/mirror.ts` and matches `o1dmatch_pitch_desk_handoff_v2/schema/sheet_headers.json`.

---

## 4. OpenRouter (you already have this)

1. Go to <https://openrouter.ai/keys> -> **Create key**.
2. Set a credit limit (~$10 is plenty for a month of internal use).
3. Paste the key as `OPENROUTER_API_KEY` in `.env.local`.

The three models we use:

| Slot | OpenRouter model ID | Cost (blended) |
| --- | --- | --- |
| Primary | `z-ai/glm-4.6` | ~$0.90/M |
| Bulk | `deepseek/deepseek-chat` | ~$0.10/M |
| Fallback | `openai/gpt-4.1-mini` | ~$0.75/M |

You do not need an OpenAI account - OpenRouter handles that.

---

## 5. Run the app locally

```bash
# 1. Copy env template
cp .env.example .env.local
# (now fill in the real values from steps 1-4)

# 2. Install deps
npm install

# 3. Push the schema to Neon
npm run db:push

# 4. Seed dropdowns + senders
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000>. Sign in with Clerk. You land on `/dashboard`.

### Quick smoke test

`BETA_MOCK_MODE` is `true` by default. With mock mode on:
- The form works.
- The dropdowns load from Postgres.
- Generation returns canned output (no OpenRouter call).
- The draft saves to Postgres and mirrors to the sheet.
- Copy buttons work.

Once you've verified all of that, set `BETA_MOCK_MODE="false"` in `.env.local` and try a real generation using `o1dmatch_pitch_desk_handoff_v2/tests/test_payload_dpworld.json` as a guide for what to type into the form.

---

## 6. Deploy to Vercel

1. Push the repo to GitHub.
2. <https://vercel.com/new> -> import the repo.
3. **Environment Variables**: paste every variable from `.env.local`. Yes, including `GOOGLE_SERVICE_ACCOUNT_JSON` (Vercel handles multi-line values fine, but if you have problems, paste it as a single line with literal `\n` in the private key).
4. **Build command**: `npm run build` (default).
5. **Deploy**.

After deploy, in **Settings -> Domains**, add a domain like `pitch-desk.o1dmatch.com` if you have DNS access.

In Clerk's dashboard, under **Configure -> Domains**, add the production URL so Clerk allows the redirect.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `ECONNREFUSED` on db push | `DATABASE_URL` missing `?sslmode=require` |
| Clerk redirect loop | The `NEXT_PUBLIC_CLERK_*` URLs do not match the Clerk dashboard settings |
| `The caller does not have permission` from Sheets | Service account is not shared on the sheet, or wrong `GOOGLE_SHEET_ID` |
| OpenRouter 401 | Wrong key, or key has no credit |
| OpenRouter 404 model | The model ID changed - check <https://openrouter.ai/models> and update `AI_MODEL_PRIMARY` |
| Mock data even after `BETA_MOCK_MODE="false"` | You need to restart the dev server after editing `.env.local` |
| Sheet append silently fails | Look in the Vercel function logs - the app never blocks the user on a sheet failure, only logs it |

If something is still wrong, open `src/lib/ai/generate-draft.ts` and add a `console.log` at each pipeline step. Then watch `npm run dev` output.
